#!/bin/bash
# Regression test for autopilot-gate.py.
#
# Written 2026-07-30, after the 2026-07-29 session found the gate had never been
# observed firing at all, and separately deadlocked against itself: the deny
# message demands a Class 0 row in .claude/AUTOPILOT-QUEUE.md, and the gate then
# blocked the write of that very row because the row quoted "vercel deploy".
#
# Two things this pins down:
#   1. The FILE_WRITE_TOOLS exemption works — Write/Edit of a queue row quoting
#      a Class 0 command passes. This is the deadlock fix; do not regress it.
#   2. The exemption did NOT open a bypass. Real commands still deny, including
#      a queue write chained to a live deploy and a redirect into another file.
#
# "pass" below means the hook emitted no decision (normal permission flow).
# The hook never emits "allow"; passthrough is silence. Expecting "allow"
# anywhere here would be a test bug, not a hook bug.
#
# Run: bash ~/.claude/skills/autopilot/hooks/test-gate.sh
HOOK="$(dirname "$(realpath "$0")")/autopilot-gate.py"
ROOT=$(mktemp -d)
mkdir -p "$ROOT/.claude"
touch "$ROOT/.claude/.autopilot-active"   # arm the gate
FAILED=0

run() {
  local label="$1" payload="$2" expect="$3"
  local out dec
  out=$(printf '%s' "$payload" | python3 "$HOOK" 2>&1)
  dec=$(printf '%s' "$out" | python3 -c "
import sys, json
raw = sys.stdin.read().strip()
if not raw:
    print('pass'); raise SystemExit
try:
    d = json.loads(raw)
    print(d.get('hookSpecificOutput', {}).get('permissionDecision', 'pass'))
except Exception:
    print('unparseable')
")
  if [ "$dec" = "$expect" ]; then
    printf '  OK   %-58s -> %s\n' "$label" "$dec"
  else
    printf '  FAIL %-58s -> %s (expected %s)\n' "$label" "$dec" "$expect"
    FAILED=$((FAILED + 1))
  fi
}

echo "--- the deadlock cases: writing the queue row the hook itself demands ---"
run "Write queue row quoting 'vercel deploy'" \
  '{"cwd":"'"$ROOT"'","tool_name":"Write","tool_input":{"file_path":".claude/AUTOPILOT-QUEUE.md","content":"HARD STOP: was about to run vercel deploy --prod"}}' pass
run "Write queue row quoting 'stripe'" \
  '{"cwd":"'"$ROOT"'","tool_name":"Write","tool_input":{"file_path":".claude/AUTOPILOT-QUEUE.md","content":"HARD STOP: stripe live billing keys"}}' pass
run "Edit queue row quoting both" \
  '{"cwd":"'"$ROOT"'","tool_name":"Edit","tool_input":{"file_path":".claude/AUTOPILOT-QUEUE.md","old_string":"_none yet_","new_string":"stripe + vercel deploy --prod"}}' pass

echo "--- shell writes are NOT exempt (by design; use Write/Edit for the row) ---"
run "Bash heredoc appending the same queue row" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"cat >> .claude/AUTOPILOT-QUEUE.md <<EOF\nHARD STOP: stripe live keys\nEOF"}}' deny

echo "--- true positives: these MUST still deny ---"
run "real: vercel deploy --prod" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"vercel deploy --prod"}}' deny
run "real: stripe subscriptions create" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"stripe subscriptions create --customer cus_1"}}' deny
run "real: git push" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"git push origin main"}}' deny
run "real: supabase db push" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"supabase db push"}}' deny
run "smuggling: queue write chained to a live deploy" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"cat >> .claude/AUTOPILOT-QUEUE.md <<EOF\nrow\nEOF\nvercel deploy --prod"}}' deny
run "smuggling: redirect into a DIFFERENT file" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"cat >> src/deploy.sh <<EOF\nstripe pay\nEOF"}}' deny
run "class0 tool: browser computer" \
  '{"cwd":"'"$ROOT"'","tool_name":"mcp__claude-in-chrome__computer","tool_input":{"action":"click"}}' deny

echo "--- reversible work must not be blocked ---"
run "ordinary build" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"npm run build"}}' pass
run "rm -rf on build output inside the project" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"rm -rf .next"}}' pass
run "rm -rf on something real" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"rm -rf src"}}' deny

echo "--- no-op when not armed ---"
rm -f "$ROOT/.claude/.autopilot-active"
run "disarmed: vercel deploy passes through" \
  '{"cwd":"'"$ROOT"'","tool_name":"Bash","tool_input":{"command":"vercel deploy --prod"}}' pass

rm -rf "$ROOT"
echo
if [ "$FAILED" -eq 0 ]; then echo "all gate tests passed"; else echo "$FAILED gate test(s) FAILED"; exit 1; fi
