---
name: handoff
description: >-
  Writes a session handoff file so the next Claude Code session in this
  directory can pick up with full context instead of starting cold. Captures
  goal, current status, files touched (from real git output, not memory),
  changes made, what's verified vs. only assumed to work, failed attempts,
  open assumptions, and next steps. Invoke manually when a session is ending
  or work is being paused — triggers: "/handoff", "handoff", "wrap up this
  session", "write a handoff", "save context for next session", "log where we
  left off", "hand this off". Do NOT invoke automatically or infer from casual
  use of the word "finished" in conversation — this only fires on an explicit
  request to end/pause the session and record state.
---

# Handoff

Writes `.claude/HANDOFF.md` **inside the specific project directory you're
working in**: a snapshot of this session's goal, state, and unfinished
business, so a future Claude Code session in this same directory can read it
and continue without re-deriving everything from scratch or re-attempting
things that already failed.

Everything this skill writes — the handoff file AND its discovery pointer —
stays scoped to that one project folder. It must never write into a general,
home, or user-level CLAUDE.md (`~/CLAUDE.md`, `~/.claude/CLAUDE.md`), because
those load in every session everywhere and one project's handoff pointer does
not belong there.

This is a fork-and-simplify of the pattern used by several existing
session-handoff tools (claude-handoff, session-handoff, Claude-Handover).
It intentionally does not try to out-engineer them — it's a personal,
minimal version scoped to one schema and one file.

## When this fires

Only on an explicit request to end, pause, or hand off the session — the
user types `/handoff`, or says things like "wrap up", "write a handoff",
"save context for next session", "log where we left off". Do NOT trigger
on someone saying they're "finished" with a specific function or task
mid-conversation — that's normal conversational language, not a session-end
signal. When in doubt, ask before overwriting the existing handoff file.

## Step 1: Gather real evidence, not recollection

Before writing anything, shell out and capture the actual state. Do not
reconstruct "files touched" from memory — paste real command output.

```bash
git status --short 2>/dev/null
git diff --stat 2>/dev/null
git log -5 --oneline 2>/dev/null
```

If this directory is not a git repo, skip these and note "not a git repo"
in the file instead of fabricating file/commit info.

## Step 2: Ask where to save it

**Always ask the user where the handoff should be saved before writing it.**
Don't silently pick a location — even when the working directory seems
obvious, confirm it, because a wrong guess writes a `HANDOFF.md` into the
wrong project (or worse, the home root that loads everywhere).

First work out your **best-guess directory** so you can offer it as the
default: it's the project the session's work actually lives in — normally the
current working directory, but if the work is in a subproject (a repo checked
out under it, the folder the edited files are in), use that folder's root. If
the working directory is the home root (`/Users/maazshaikh`) but the work
clearly belongs to a specific project, guess that project instead.

Then ask the user (use the `AskUserQuestion` tool), presenting your best
guess as the recommended option plus a way to enter a different path. Phrase
it as "Where should I save this handoff?" and show the concrete path
(`<dir>/.claude/HANDOFF.md`). Accept whatever they choose — the confirmed
directory is the target for the rest of these steps, including the Step 4
continuity pointer.

Guard: never write the handoff at the home directory root
(`/Users/maazshaikh`) or another non-project location. If your best guess
comes out to home, surface that in the question rather than defaulting to it.

## Step 3: Write `.claude/HANDOFF.md` in the chosen directory

Use the directory the user confirmed in Step 2.

Create the target `.claude/` directory if it doesn't exist. **Overwrite** the
file each time — this is a snapshot of the latest state, not an append-only
log. (If the user wants history later, `git log -p .claude/HANDOFF.md`
already gives it to them for free — don't build a log format.)

Use this exact structure:

```markdown
# Session Handoff

_Last updated: {date}_

## Goal
{What this session set out to do, in one or two sentences.}

## Current status
{Where things stand right now. Be concrete: "working", "broken", "half-done",
not vague reassurance.}

## Files touched
{Paste the real `git status --short` / `git diff --stat` output verbatim.
If not a git repo, list the files you actually edited this session.}

## Changes made
{What was actually built/changed, in plain language — the "what", not the "why".}

## Verified vs. assumed
{This is the field most handoff tools skip, and it's the one that matters most.
Split explicitly into two lists:}
- **Verified (tested/confirmed):** {things you actually ran, checked, or observed working}
- **Assumed (not yet verified):** {things you believe should work but have not confirmed —
  be honest here even if the list is short. An empty "assumed" list is a claim in itself.}

## Failed attempts
{What was tried and didn't work, and briefly why — so the next session doesn't
re-attempt the same dead end.}

## Open assumptions / unknowns
{Anything the current session treated as given without confirming it — a constraint,
a design decision, an unverified claim about how something else in the system behaves.
This is distinct from "assumed" above: that section is about THIS session's unverified
work; this section is about background assumptions the work rests on.}

## Next steps
{The concrete next action(s). Not a wishlist — the actual next thing to do.}
```

Keep every section terse. This file is meant to be read in under a minute,
not to be a full session transcript.

## Step 4: Make sure the next session actually reads it

Claude Code auto-loads `CLAUDE.md` at the start of every session in a
directory — use that instead of inventing a separate discovery mechanism.

The pointer goes in the **project-local `CLAUDE.md`** — the one at the root
of the same project folder you wrote `.claude/HANDOFF.md` into (create it
there if none exists). It must live right next to the handoff it points at.

**Never write this pointer into a general/home/user-level CLAUDE.md** —
specifically not `~/CLAUDE.md` (`/Users/maazshaikh/CLAUDE.md`) or
`~/.claude/CLAUDE.md`. Those load in every session across every directory, so
a handoff pointer there is noise for every unrelated project. If the project
directory *is* your home directory, revisit Step 2's guard instead of writing
the pointer globally. Before appending, confirm the CLAUDE.md you're about to
edit sits inside the project folder, not at a home/user path.

Check whether that project-local `CLAUDE.md` already contains a handoff
pointer. If not, append this section:

```markdown
## Session continuity
Before starting work, read `.claude/HANDOFF.md` if it exists — it has
context from the previous session (goal, state, what's verified vs.
assumed, next steps). Read it before asking the user what to work on.
```

Do this idempotently — check for the "Session continuity" heading first so
repeated `/handoff` invocations don't duplicate the pointer.

## Step 5: Confirm

Tell the user, briefly: the file was written (path), and a one-line summary
of the next-steps section. Don't re-print the whole file back to them.

## Step 6: Offer to close the loop (the /prove-it seam)

Handoff WRITES the "Assumed (not yet verified)" list; the `/prove-it` skill
DISCHARGES it. This step is a loose seam between them - handoff points at
prove-it, it never runs verification itself. Do NOT duplicate any of prove-it's
logic here, and do NOT drive browsers, run billed APIs, or exercise flows from
inside handoff.

After confirming, look at the Assumed list you just wrote:

- **If it is empty**, skip this step silently. Nothing to offer.
- **If prove-it already ran this session** (there is a `.claude/evidence/<date>/`
  directory and the Verified/Assumed lists already carry prove-it verdicts),
  do not re-offer - the loop is already as closed as it is going to get. Just
  note in your confirm line how many items remain `needs-human` / `undecidable`.
- **Otherwise**, make a single plain offer (one line, no modal needed):
  "N items are still assumed. Want me to run `/prove-it` to discharge them - it
  verifies what it can against surfaces you own and writes human test scripts
  for anything billed or human-gated?" Then STOP and wait.

Only if the user says yes, invoke the `prove-it` skill. Never auto-run it - both
skills are deliberately manual-trigger, and prove-it can spend money or drive
live properties, so it requires an explicit green light every time.

## Notes

- This is deliberately v1-minimal: manual trigger only, one overwritten file,
  no automatic session-end hook. Add automation later only if invoking this
  manually turns out to be something you forget to do.
- Don't fabricate verification status. If nothing was actually tested this
  session, the "Verified" list should be empty or near-empty — that's useful
  signal, not a failure to fill out the template.
