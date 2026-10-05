#!/usr/bin/env python3
"""
autopilot-gate — PreToolUse hook enforcing Class 0 (irreversible) gates.

This is the enforcement layer for /autopilot. It exists because a Markdown skill
cannot stop anything: the model that writes the guard is the model deciding to
proceed. This hook can actually deny the call.

CONTRACT
  - NO-OP unless an autopilot run is active. Active == a `.claude/.autopilot-active`
    marker file exists in the project (searched from cwd upward). Outside an
    autopilot run this exits 0 immediately and changes nothing about normal
    sessions.
  - When active: any Class 0 (irreversible) action is DENIED, with a reason fed
    back to the model telling it to park the action as a Class 0 hard stop.
  - FAILS TO "ask", NEVER TO "allow". If this script errors, it emits `ask` so a
    human is prompted. A silently-disabled gate is the exact failure this design
    exists to prevent (cf. a park-the-branch queue that auto-promoted its own
    blocked tasks and bypassed the human gate).

Reads the PreToolUse hook JSON on stdin, writes a decision to stdout, exit 0.
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PATTERNS = os.path.join(SKILL_DIR, "reference", "gate-patterns.json")
MARKER = os.path.join(".claude", ".autopilot-active")


def emit(decision, reason):
    """Emit a PreToolUse decision and exit. Schema per Claude Code hooks docs."""
    json.dump({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            "permissionDecisionReason": reason,
        }
    }, sys.stdout)
    sys.stdout.write("\n")
    sys.exit(0)


def passthrough():
    """No decision: normal permission flow applies."""
    sys.exit(0)


def find_project_root(start):
    """Walk up from `start` looking for a .claude/ directory. Returns dir or None."""
    cur = os.path.abspath(start or os.getcwd())
    while True:
        if os.path.isdir(os.path.join(cur, ".claude")):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            return None
        cur = parent


def load_patterns(root):
    """Project override wins wholesale; otherwise the skill default."""
    if root:
        override = os.path.join(root, ".claude", "autopilot-gates.json")
        if os.path.isfile(override):
            with open(override) as fh:
                return json.load(fh)
    with open(DEFAULT_PATTERNS) as fh:
        return json.load(fh)


def collect_text(tool_input):
    """Flatten the tool input into one searchable string."""
    if isinstance(tool_input, str):
        return tool_input
    parts = []

    def walk(v):
        if isinstance(v, str):
            parts.append(v)
        elif isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)

    walk(tool_input)
    return "\n".join(parts)


# Tools that only write bytes into a file. `class0_bash_patterns` are SHELL
# COMMAND patterns, so matching them against file CONTENT is a category error: a
# Markdown file containing the words "vercel deploy" deploys nothing.
#
# This bit for real. On 2026-07-29 a run was denied while writing
# AUTOPILOT-QUEUE.md because a hard-stop row in it quoted "vercel deploy". That
# deadlocked the skill against itself -- Step 4 requires a Class 0 row in that
# exact file, and the gate blocked the write, so no queue was ever produced.
# These tools stay fully subject to `class0_tools`; they are exempt only from
# command-pattern matching.
FILE_WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}

# Build output and scratch: produced by a command, never hand-authored. `rm -rf`
# on one of these is not the unrecoverable delete Class 0 exists to catch.
EPHEMERAL_RM_SEGMENTS = {
    "node_modules", ".next", ".turbo", ".cache", "dist", "build", "out",
    "coverage", "tmp", "temp", "_candidates", "_cc0", "scratch", "__pycache__",
}


def is_rm_rule(entry):
    """Identify the recursive-delete rule without requiring a gate-patterns edit."""
    return entry.get("id") == "rm_rf" or r"rm\s" in entry.get("re", "")


def rm_targets(command):
    """Best-effort list of the paths an `rm` invocation would delete."""
    targets = []
    # Split on shell separators so `cd x && rm -rf y` yields only y.
    for chunk in re.split(r"(?:&&|\|\||;|\||\n)", command):
        m = re.match(r"^\s*(?:sudo\s+)?rm\s+(.*)$", chunk)
        if not m:
            continue
        for tok in m.group(1).split():
            if tok.startswith("-"):
                continue
            targets.append(tok.strip("'\""))
    return targets


def rm_is_ephemeral_only(command, root):
    """
    True only when EVERY rm target sits inside `root` and has an ephemeral segment
    in its path. Absolute paths outside the project, `~`, env expansion, globs,
    the project root itself, and anything reaching outward all stay Class 0.
    """
    targets = rm_targets(command)
    if not targets or not root:
        return False
    root_abs = os.path.abspath(root)
    for t in targets:
        # Unresolvable without running a shell -> never exempt.
        if t.startswith("~") or "$" in t or any(c in t for c in "*?["):
            return False
        abs_t = os.path.abspath(t if os.path.isabs(t) else os.path.join(root_abs, t))
        rel = os.path.relpath(abs_t, root_abs)
        # Must be strictly inside the project, and must not BE the project.
        if abs_t == root_abs or rel == os.curdir or rel.startswith(os.pardir):
            return False
        if not any(seg in EPHEMERAL_RM_SEGMENTS for seg in rel.split(os.sep)):
            return False
    return True


def log(root, record):
    """Append a classification record. Never fatal."""
    if not root:
        return
    try:
        path = os.path.join(root, ".claude", "autopilot-classifications.jsonl")
        with open(path, "a") as fh:
            fh.write(json.dumps(record) + "\n")
    except Exception:
        pass


def main():
    raw = sys.stdin.read()
    try:
        event = json.loads(raw) if raw.strip() else {}
    except Exception:
        # Malformed input: do not silently allow.
        emit("ask", "autopilot-gate could not parse the hook payload. "
                    "Falling back to a human decision rather than allowing silently.")

    cwd = event.get("cwd") or os.getcwd()
    tool_name = event.get("tool_name", "")
    tool_input = event.get("tool_input", {})

    root = find_project_root(cwd)

    # --- The no-op path: not an autopilot run, stay out of the way. ---
    if not root or not os.path.isfile(os.path.join(root, MARKER)):
        passthrough()

    patterns = load_patterns(root)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Tool-level Class 0.
    for entry in patterns.get("class0_tools", []):
        if tool_name == entry.get("tool"):
            log(root, {"at": now, "tool": tool_name, "class": 0,
                       "rule": entry["tool"], "verdict": "deny"})
            emit("deny",
                 "CLASS 0 (irreversible) - autopilot must not run this unattended: "
                 f"{entry['why']}. Do NOT retry and do NOT route around this. Stop the "
                 "run now, append a Class 0 row to .claude/AUTOPILOT-QUEUE.md describing "
                 "exactly what you were about to do, and surface it to the operator as a hard stop. "
                 "Class 0 items never go in the batched queue.")

    # 2. Command-level Class 0. Scoped to tools that actually EXECUTE something;
    #    file writers are exempt because their payload is inert text.
    text = "" if tool_name in FILE_WRITE_TOOLS else collect_text(tool_input)
    if text:
        for entry in patterns.get("class0_bash_patterns", []):
            try:
                if re.search(entry["re"], text, re.IGNORECASE):
                    # Deleting build output / scratch the run itself created is
                    # reversible by re-running a command, so it is not Class 0.
                    if is_rm_rule(entry) and rm_is_ephemeral_only(text, root):
                        log(root, {"at": now, "tool": tool_name, "class": None,
                                   "rule": entry["re"], "verdict": "pass",
                                   "note": "rm target is ephemeral scratch inside the project"})
                        continue
                    log(root, {"at": now, "tool": tool_name, "class": 0,
                               "rule": entry["re"], "verdict": "deny"})
                    emit("deny",
                         "CLASS 0 (irreversible) - autopilot must not run this unattended: "
                         f"{entry['why']}. Do NOT retry, do NOT reword the command, and do "
                         "NOT route around this via another tool. Stop the run now, append a "
                         "Class 0 row to .claude/AUTOPILOT-QUEUE.md describing exactly what "
                         "you were about to do, and surface it to the operator as a hard stop. "
                         "Class 0 items never go in the batched queue. "
                         "Write that row with the Write or Edit tool, NOT a shell "
                         "redirect: file writers are exempt from command matching, "
                         "but `cat >> ...` is a Bash call and this gate will block it "
                         "too — which is how a previous run deadlocked against itself.")
            except re.error:
                continue

    log(root, {"at": now, "tool": tool_name, "class": None, "verdict": "pass"})
    passthrough()


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:  # fail to "ask", never to "allow"
        emit("ask", f"autopilot-gate failed internally ({type(exc).__name__}). "
                    "Falling back to a human decision rather than allowing silently.")
