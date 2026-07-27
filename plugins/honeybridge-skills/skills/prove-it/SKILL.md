---
name: prove-it
description: >-
  Takes a session's HANDOFF.md and forces every "assumed (not yet verified)"
  item to prove it actually works, instead of trusting the AI's "done". For
  each assumed item it triages into one of three bins: machine-decidable now
  (runs the real check against a surface you OWN and captures evidence),
  human-gated (stops and emits a numbered manual test script for anything
  touching money, client identity, client accounts, billed APIs, or a client's
  live Google property), or undecidable-within-horizon (records "can't tell yet"
  and is FORBIDDEN to write "verified"). Then it rewrites the HANDOFF's
  Verified-vs-assumed section under an asymmetric write rule: free to downgrade,
  upgrade to verified ONLY with attached proof. Invoke manually - triggers:
  "/prove-it", "prove it", "verify the handoff", "check the assumed items",
  "close the loop", "verify what we built", "did that actually work". Do NOT
  auto-fire or infer from casual talk; this only runs on an explicit request to
  verify a handoff's assumed items.
---

# Prove-It

_Version 1.5. V1 = 3-bin triage, four recipes, orthogonal-signal rule,
asymmetric write, evidence + ledger. V1.5 = fresh-context referee._

Reads a `.claude/HANDOFF.md`, finds everything in its **"Assumed (not yet
verified)"** list, and makes each item earn a verdict with real evidence. It
does not trust the model's prose "done". It either proves the thing against a
surface you own, hands you a checklist for the risky parts, or says honestly
that it cannot be known yet.

**The one rule that makes this trustworthy:** the skill may freely mark an item
as still-unverified, but it may only mark an item **verified** when it has
attached, viewable proof. It is never allowed to stamp "verified" on the
strength of its own say-so, and it is forbidden from stamping "verified" on an
item it could not actually decide. A laundered "verified" is worse than an
honest "assumed", because it looks adjudicated.

This is the counterpart to `/handoff`. Handoff records what is assumed; Prove-It
discharges it. It extends the existing `.claude/HANDOFF.md` convention - it does
not replace it.

## When this fires

Only on an explicit request to verify a handoff's assumed work: the user types
`/prove-it`, or says "prove it", "verify the handoff", "check the assumed
items", "close the loop", "did that actually work". Do NOT trigger on casual use
of "done" or "finished" mid-session. When no HANDOFF exists yet, say so and
offer to run `/handoff` first - there is nothing to verify without one.

## Step 0: Locate the HANDOFF

Find the `.claude/HANDOFF.md` for the project the user means. Normally the
current working directory; if the work lives in a subproject, use that folder.
If it is ambiguous, ask which project (use `AskUserQuestion`) rather than
guessing. If the file has no **"Assumed (not yet verified)"** entries, tell the
user the assumed list is already empty and stop - there is nothing to prove.

## Step 1: Capture real state first

Shell out for actual state, do not reconstruct from memory:

```bash
git -C <project> rev-parse --short HEAD 2>/dev/null || echo "not-a-git-repo"
git -C <project> status --short 2>/dev/null
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Record the git SHA (or `not-a-git-repo`) and the UTC timestamp. Every piece of
evidence you capture is stamped with these, so a verdict is always tied to the
exact state it was true against.

## Step 2: Parse the assumed items

Read the HANDOFF's `## Verified vs. assumed` section. Extract each bullet under
**"Assumed (not yet verified):"** as a separate item. Keep the original wording
verbatim - you will need it to rewrite the file later. List the items back to
the user before triaging so they can see the worklist.

## Step 3: Triage every item into one of three bins

For each assumed item, ask one question: **"What single check would prove this
false, and do I own the thing that would answer it?"** That answer sorts it:

- **Bin 1 - machine-decidable now.** A surface you OWN can answer it: your own
  Supabase DB, your own Vercel/localhost deploy, your own filesystem, a CLI you
  run. It reduces cleanly to one of the four recipes in `recipes.md`
  (`command`, `http`, `db_row`, or `browser + orthogonal signal`).
- **Bin 2 - human-gated.** Verifying it would cross a hard boundary (see the
  no-touch list below). You never do these. Emit a manual test script.
- **Bin 3 - undecidable within horizon.** There is no owned read-path to confirm
  the real state, OR the only available signal is genuinely ambiguous right now
  (the classic case: a Google review reply where an empty composer looks
  identical whether the submit failed or moderation removed it). You are
  forbidden to write "verified" for these.

**If an item does not reduce cleanly to one of the four recipes, it is NOT
bin 1.** Do not force-fit it. Push it to bin 2 (if it is boundary-crossing) or
bin 3 (if it is simply not checkable by you right now). Forcing an
undecidable item into a weak proxy check is exactly the laundering this skill
exists to prevent.

Show the user the three-bin split with a one-line reason per item before you
run anything.

### The no-touch list (always bin 2, never automate)

Anything that would:
- create a client account, set or change a password
- send a client-facing email or message
- post, edit, or delete on a client's live Google property (GBP / GSC) or any
  account you do not own
- run a billed / paid API call without a green light
- merge to production or deploy to a client's live site on your own authority
- move money or touch payment/billing state

For all of these, Prove-It stops and writes a script for the human. It does not
act.

## Step 4: Run the bin-1 checks and capture evidence

For each bin-1 item, apply the matching recipe from `recipes.md`. Create
`.claude/evidence/<YYYY-MM-DD>/` in the project and save the raw evidence there
(command output, curl output, query result, screenshot + the orthogonal
signal). Name files after the item.

**Leak guard (do this before writing any evidence).** Evidence artifacts and the
ledger can contain captured DB rows, API internals, and client context - they must
not be committed by accident. If the target repo is a git repo and has a
`.gitignore`, ensure `.claude/evidence/` and `.claude/prove-it-ledger.jsonl` are
ignored; add them if they are not (`git check-ignore` to test). If they are already
tracked or there is no `.gitignore`, tell the user rather than silently proceeding.
The human scripts and the HANDOFF stay trackable (they hold instructions, not
captured state).

Hard rules while running:
- **Orthogonal-signal rule.** A screenshot is NEVER sufficient evidence on its
  own. It counts only when paired with a second, independent signal: an HTTP
  status, a DOM assertion, or a DB row. Pixels alone can show a page that
  loaded but is functionally broken (or an empty box that means two opposite
  things). Read the real signal, not just the picture.
- **No silent retry-to-pass.** If a check fails, record it as **failed** with
  the counter-evidence. Do not re-run it until it happens to pass and then call
  it verified. A failure is a real result.
- **RLS honesty (Supabase).** For a `db_row` check, state which client/role ran
  the query. A row that "exists" under the service-role client may be invisible
  to a real user under RLS. Default to the least-privileged path that models the
  actual user flow, and note the role used in the evidence.

Classify each bin-1 result as: **verified** (check passed, evidence attached),
**failed** (check ran, item does not work - attach the counter-evidence), or
**inconclusive** (the check could not run cleanly - treat as bin 3, do not
guess).

## Step 4b: Independent referee on every would-be "verified" (V1.5)

Before any item can be UPGRADED to "verified", an independent referee must confirm
it from a fresh context. This closes the grader-is-also-builder trap: the session
that ran the check shares its own blind spots, so its "verified" is not trusted
until a skeptic that sees only the claim and the raw evidence agrees.

Follow `referee.md` exactly. In short: for each bin-1 item currently classified
**verified**, spawn a referee subagent (the Agent tool) whose prompt contains ONLY
the claim, the recipe type, and the RAW evidence artifact from
`.claude/evidence/` - never the builder's reasoning, never this session's
narrative, never the word "verified". Instruct it to assume the claim is guilty
until the evidence proves it and to try to refute it. It returns CONFIRMED,
REFUTED, or INSUFFICIENT (ties go to skepticism → INSUFFICIENT). Use a single
referee by default; a panel of 3 (majority rules) for high-stakes items
(money-adjacent, security, prod, credentials, auth).

Apply the verdict:
- **CONFIRMED** → the item stays **verified**; append `referee: confirmed
  (fresh-context)` beside its evidence path in Step 7.
- **REFUTED / INSUFFICIENT** → the item is NOT verified. Downgrade it to
  needs-human (or undecidable) and record the referee's one-line reason. Downgrading
  is always allowed under the asymmetric write rule.

The referee AUDITS the captured evidence; it does not re-run the check. Never let a
referee re-execute anything that spends money or touches a client property.
Independent re-execution is an explicit user opt-in, and only for owned-oracle,
non-billed, non-gated checks.

## Step 5: Write the human scripts for bin-2 items

For each bin-2 item, write a short numbered manual test script. It must be
copy-runnable: the exact URL or screen, the numbered clicks, and the precise
success signal to look for. Example success signal, from the GBP workload: "the
reply renders under '(owner)' with Edit / Delete controls - that, not the click,
is proof." Apply the house voice: no em dashes, no exclamation points, no
hedging.

## Step 6: Record bin-3 items honestly

For each bin-3 item, write one line stating that it is undecidable right now, the
reason, what a human would need to observe to decide it, and when that
observation is possible (for example: "T+72h on 2026-07-25"). Do NOT write
"verified". Do NOT invent a proxy check to make it look resolved.

## Step 7: Rewrite the HANDOFF (asymmetric write rule)

Update the `## Verified vs. assumed` section of the HANDOFF. Before writing,
**preserve the original section**: copy the current `## Verified vs. assumed`
block verbatim into a `## Verified vs. assumed (before prove-it <timestamp>)`
block appended lower in the file, so a wrong call is always recoverable. **Do not
stack these**: if a `(before prove-it ...)` block already exists from a prior run,
replace it rather than adding a second (in a git repo the older originals are
already in `git log`, so keep only the single most recent pre-run snapshot). Then
rewrite the live section:

- Move **verified** bin-1 items into the **Verified** list. Each MUST carry:
  `verified_at: <UTC>`, `git_sha: <sha>`, `evidence: <path>`,
  `referee: confirmed (fresh-context)` (from Step 4b - an item with no CONFIRMED
  referee verdict may NOT be written verified), and `recheck_after: <date>`
  (default +7 days for anything live or external, +30 days for pure
  code/filesystem checks).
- **Failed** items stay OUT of Verified. Move them to a `## Failed attempts`
  note (the item does not work and the next session must not assume it does).
- **Bin-2** items become, under Assumed: `needs human walkthrough - see script`
  and drop the script into the HANDOFF (or `.claude/prove-it-scripts.md`).
- **Bin-3** items stay under Assumed, reworded to: `undecidable until <when> -
  human must observe <what>`.

Asymmetric write rule, restated so it cannot be missed: you may always
**downgrade** (assumed stays assumed, or moves to needs-human / undecidable /
failed) with no proof required. You may only **upgrade** to Verified with both an
`evidence:` path attached AND a CONFIRMED referee verdict (Step 4b). Never upgrade
on say-so. Never upgrade a bin-3 item. Never upgrade an item the referee refused.

## Step 7b: Append to the ledger

Append one JSON line per processed item to `.claude/prove-it-ledger.jsonl` (create
it if absent). This is a local, machine-readable trail that powers decay detection
in Step 8 - it is NOT a cross-project platform (that was deliberately cut; keep it
per-repo and simple). One object per item, one line each:

```json
{"run_at":"<UTC>","git_sha":"<sha>","item":"<short claim>","bin":1,"verdict":"verified|failed|needs-human|undecidable","referee":"confirmed|refuted|insufficient|n/a","evidence":"<path or null>","recheck_after":"<date or null>"}
```

Never write secrets into the ledger. `item` is a short label, not a dump of state.

## Step 8: Re-surface decay and rot

Read `.claude/prove-it-ledger.jsonl` (if present) plus the existing **Verified**
list, and flag two problems - do not silently trust either:
- Any verified item whose `recheck_after` date has passed -> mark
  `stale - re-verify` and offer to re-run it. The ledger makes this a lookup
  (find rows where `verdict=="verified"` and `recheck_after < today`), not a
  prose scan.
- Any `needs human walkthrough` item that has appeared across multiple runs in
  the ledger without ever reaching `verified` -> surface its age so it does not
  rot forever.

## Step 9: Coverage-honesty footer + confirm

Append a one-line honesty note to the HANDOFF: Prove-It only checked what the
HANDOFF listed as assumed; anything the previous session never wrote down was
not verified and is not covered. This skill closes stated loops, not
unknown-unknowns.

Then tell the user, briefly: how many items were verified (with evidence),
failed, sent to a human script, or left undecidable - and the single most
important thing still needing them. Do not reprint the whole file.

## Notes

- Manual trigger, four recipes by convention (not a claim-type DSL), owned-oracle
  checks only. Google-property automation is out of scope - it always becomes a
  human script.
- **Companion files:** `recipes.md` (the four evidence recipes), `referee.md` (the
  V1.5 referee contract), `README.md` (what/when/how), `example/` (a sample
  HANDOFF + expected triage, the regression fixture), `SCORECARD.md` (self-audit),
  `CHANGELOG.md`. Per-run this skill writes `.claude/evidence/<date>/`,
  `.claude/prove-it-scripts.md`, and `.claude/prove-it-ledger.jsonl` into the
  target repo.
- **Grader-is-also-builder (addressed in V1.5).** The session that runs a check
  shares its own blind spots, so every upgrade-to-verified is now gated by an
  independent fresh-context referee (Step 4b, `referee.md`) that sees only the
  claim and the raw evidence and tries to refute it. This does not make
  verification infallible, but a "verified" stamp now requires two independent
  contexts to agree, not one optimistic one. For the very highest-stakes results,
  running `/prove-it` again from a brand-new session is still the strongest check.
- Full spec and the council decision trail:
  `~/Documents/Finalize/close-the-loop-verification/`.
