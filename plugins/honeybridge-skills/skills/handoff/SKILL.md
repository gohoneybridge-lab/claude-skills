---
name: handoff
description: >-
  Writes a session handoff file so the next Claude Code session in this
  directory can pick up with full context instead of starting cold, then
  closes the loop on it: it runs /prove-it against the handoff's assumed
  items, fixes what prove-it proved broken, re-verifies those fixes, and
  rewrites the handoff with a loop record of what the first handoff claimed,
  what prove-it found, and what got fixed. Captures goal, current status,
  files touched (from real git output, not memory), changes made, what's
  verified vs. only assumed to work, failed attempts, open assumptions, and
  next steps. Invoke manually when a session is ending or work is being
  paused — triggers: "/handoff", "handoff", "wrap up this session", "write a
  handoff", "save context for next session", "log where we left off", "hand
  this off". Use "/handoff quick" for the old single-pass behaviour (write the
  file, no verification loop). Do NOT invoke automatically or infer from
  casual use of the word "finished" in conversation — this only fires on an
  explicit request to end/pause the session and record state.
---

# Handoff

Writes `.claude/HANDOFF.md` **inside the specific project directory you're
working in**: a snapshot of this session's goal, state, and unfinished
business, so a future Claude Code session in this same directory can read it
and continue without re-deriving everything from scratch or re-attempting
things that already failed.

**Handoff is a loop, not a single write.** The default run is:

1. Write the handoff (pass 1) — Steps 1-4.
2. Run `/prove-it` against its Assumed list — Step 5.
3. Fix what prove-it proved broken — Step 6.
4. Re-verify only those fixes — Step 7.
5. Rewrite the handoff with a **Loop record** of what pass 1 claimed, what
   prove-it found, and what the fixes changed — Step 8.

The loop runs **exactly once**. It never re-enters itself: one prove-it pass,
one fix round, one re-verify pass, one final handoff. Anything still broken
after that is written down as open, not chased in another lap.

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

## Modes

- **`/handoff` (default) — full loop.** Steps 1 through 9. This is what runs
  unless the user says otherwise.
- **`/handoff quick` — pass 1 only.** Steps 1 through 4, then confirm and
  stop. Use this when the user says "quick", "just write it", "no
  verification", "don't run prove-it", or is out of time. Say plainly in the
  confirm line that the loop was skipped and the Assumed list is undischarged.

Don't ask which mode. Read it off the request and say which one you ran.

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

## Step 3: Write `.claude/HANDOFF.md` in the chosen directory (pass 1)

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

## Step 5: Run `/prove-it` against the Assumed list

Say one line to the user that pass 1 is written (path) and you're now running
the verification loop. Then invoke the `prove-it` skill on the same project
directory and let it run its own procedure end to end. **Do not reimplement any
of it here** — handoff never triages, never runs recipes, never referees, never
drives browsers or billed APIs itself. It calls prove-it and reads the results.

Exit conditions, checked in this order:

- **Assumed list is empty** → skip Steps 5-8 entirely. There is nothing to
  discharge, so there is nothing to fix and no second pass to write. Go to
  Step 9 and say so.
- **Mode is `quick`** → skip Steps 5-8. Go to Step 9.
- **prove-it already ran this session** (there is a `.claude/evidence/<date>/`
  for today and the Verified/Assumed lists already carry its verdicts) → do
  not re-run it. Use those existing results as the input to Step 6.

prove-it's no-touch list still governs everything downstream: chaining it to
handoff does not grant it permission to create client accounts, post to a
client's live Google property, spend money, or deploy on its own authority.
Those items come back as human scripts and they stay human scripts.

When prove-it finishes, read what it actually wrote — the rewritten
`## Verified vs. assumed` section, `.claude/evidence/<date>/`,
`.claude/prove-it-scripts.md`, and `.claude/prove-it-ledger.jsonl`. Work from
those files, not from your memory of the run.

## Step 6: Fix what prove-it proved broken

Sort prove-it's output into fixable and not-fixable. **Only these two are
fixable by you:**

- **Failed** — a bin-1 check ran and the thing does not work. The
  counter-evidence tells you what broke.
- **Referee-downgraded** — the check passed but the fresh-context referee
  returned REFUTED or INSUFFICIENT. Two different repairs live here: if the
  referee refuted the claim, the code is wrong — fix the code. If it said the
  evidence was insufficient, the *check* was weak — capture better evidence,
  and do not touch working code to make a bad check happy.

**Never "fix" these:**

- **Bin-2 (human-gated)** — the fix would cross the same boundary the
  verification wasn't allowed to cross. Leave the human script alone.
- **Bin-3 (undecidable)** — you don't know it's broken. Editing code against
  an unknown state is guessing, and it destroys the honest "can't tell yet"
  record.

Work the fixable list in severity order and keep each fix scoped to the failure
prove-it documented. If a fix turns out to need a redesign, a decision only the
user can make, or a change well outside this session's work, **stop and record
it as open** rather than expanding the session — say so in the Loop record and
in your Step 9 confirm.

Track for each item: the root cause, what you changed, and the files touched.
You need all three for the Loop record.

## Step 7: Re-verify only the fixes

A fix you just made is a fresh unverified claim — writing it into the final
handoff as working would recreate exactly the problem this loop exists to
solve.

Run prove-it **once more, scoped to the items you fixed in Step 6** (and to
those items only — do not re-run the whole assumed list). Its asymmetric write
rule and referee gate apply unchanged: a fix is verified only with attached
evidence and a CONFIRMED referee verdict.

This is the last verification pass. If a fix still fails, it stays failed — do
not fix-and-recheck again. Record it as still broken and move on. Fixes that
can't be machine-checked at all (bin 2 or bin 3 by their own nature) go into
the final handoff's Assumed list, not Verified.

## Step 8: Rewrite the handoff (pass 2) with the Loop record

Update the same `.claude/HANDOFF.md`. Two hard rules about what you carry
forward:

- **Do not regenerate `## Verified vs. assumed` from memory.** prove-it already
  rewrote that section with `verified_at` / `git_sha` / `evidence:` /
  `referee:` / `recheck_after` stamps. Carry those entries forward verbatim and
  only *add* to them: fixes that Step 7 verified (with their own stamps), fixes
  that are still broken (into `## Failed attempts`), fixes that couldn't be
  checked (into Assumed).
- **Leave prove-it's own artifacts intact** — the single
  `## Verified vs. assumed (before prove-it <timestamp>)` snapshot, the
  coverage-honesty footer, the scripts file, the ledger. Don't stack a second
  snapshot and don't delete the one that's there.

Refresh `## Current status`, `## Files touched` (re-run `git status --short`
and `git diff --stat` — the Step 6 fixes changed it), `## Changes made`, and
`## Next steps` so they describe the state *after* the fixes.

Then insert this section, directly under `## Current status`:

```markdown
## Loop record: handoff → prove-it → fix → handoff
_Pass 1 written {time} · prove-it run {time} · {n} fixes · pass 2 written {time}_

### What pass 1 claimed
{N} items were listed as assumed: {short list, verbatim wording from pass 1}.

### What prove-it found
- Verified with evidence: {n}
- **Failed** (pass 1 claimed it worked, it did not): {n}
  - {item} — {what the counter-evidence actually showed}
- Referee-downgraded: {n} — {item: refuted or insufficient, and why}
- Sent to a human script: {n} — {items}
- Undecidable for now: {n} — {items}

### What was fixed in this loop
- {item} — root cause: {cause} → fix: {what changed, which files} →
  re-check: {verified, evidence path | still failing | not machine-checkable}

### What is still open
- {items that could not be fixed or verified, each with a one-line reason}
```

If prove-it found nothing failed and nothing needed fixing, still write the
Loop record — a clean pass is a real result and the next session should see it.
Skip only the "What was fixed" subsection in that case.

Be honest in this section above all others. Pass 1 saying something worked and
prove-it showing it didn't is the single most useful thing in the file: it tells
the next session exactly where this session's self-report was unreliable. Do not
soften it, and do not quietly drop a pass-1 claim that turned out to be wrong —
if it's gone, say it failed and got fixed.

## Step 9: Confirm

Tell the user, briefly:

- Which mode ran (full loop or quick), and the file path.
- The loop line: `{n} assumed → {n} verified, {n} failed, {n} fixed, {n} still
  open`.
- The single most important thing still needing them — usually the oldest
  `needs human walkthrough` item or a fix that's still failing.

Don't re-print the file. If the loop was skipped (quick mode, or an empty
Assumed list), say which, so nobody reads an undischarged handoff as a verified
one.

## Notes

- The loop is bounded on purpose: one prove-it pass, one fix round, one
  re-verify, one final write. Verify-fix-verify with no cap is how a session
  burns an hour chasing its own tail — anything still broken after one lap is
  written down as open and handed to the next session.
- `/handoff quick` still exists for the old single-pass behaviour. The full
  loop only calls prove-it; prove-it's no-touch list, referee gate, and
  asymmetric write rule are unchanged and still the only things that can stamp
  "verified".
- Fixes made in Step 6 are unverified until Step 7 says otherwise. Never write
  a just-made fix into Verified on the strength of having made it.
- Don't fabricate verification status. If nothing was actually tested this
  session, the "Verified" list should be empty or near-empty — that's useful
  signal, not a failure to fill out the template.
