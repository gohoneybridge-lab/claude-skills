---
name: autopilot
description: >-
  Runs every part of a task that is automatable and reversible without stopping
  to ask, parks anything that genuinely needs the operator into one short batched queue
  delivered at the end, and hard-stops mid-run only for irreversible actions
  (live client property writes, client sends, money, prod deploys). Use when the
  user wants work driven to completion unattended — triggers: "/autopilot",
  "autopilot", "do everything you can and leave the rest to me", "run this
  without me", "batch the questions for the end", "don't stop and ask", "go as
  far as you can on your own". Use "/autopilot resume" after answering a queue.
  Do NOT use when the user is sitting at the keyboard working interactively —
  batching versus asking is a false choice when they are right there.
---

# Autopilot

Does everything that can be automated. Stops for you only when it must, and
batches everything else into one queue at the end.

**The promise, stated precisely: never blocks on anything reversible.** Not
"never blocks" — that would be a marketing line rather than a safety property.
Irreversible actions stop the run dead, because that is the one interruption
worth your time and the one case where guessing is unrecoverable.

This is a **decision compressor**, not a throughput maximizer. Agent wall-clock
is free; the operator's attention and his clients' trust are the scarce things. Judge
every choice by attention-minutes per unit of shipped work, never by how much
the agent did.

Full spec and the council decision trail: `~/Documents/Finalize/autopilot/`.

## When this fires

On an explicit request to work unattended: `/autopilot`, "do everything you can
and leave the rest to me", "run this without stopping to ask", "batch the
questions". **Do not fire when the operator is actively working alongside you** — if he
is right there, just ask him. Batching only earns its cost when he is away.

## Step 1: Start the run

1. Confirm the working directory (the project this run belongs to). If the work
   spans several projects, pick the one the queue should live in and say which.
2. Create the marker that arms the enforcement hook:
   ```bash
   mkdir -p .claude && touch .claude/.autopilot-active
   ```
   **This is not bookkeeping — it is what turns the Class 0 hard stop on.**
   Without it, `autopilot-gate.py` is a deliberate no-op and nothing is enforced.
3. Create `.claude/AUTOPILOT-QUEUE.md` if absent, using the schema in
   `reference/queue-schema.md`.
4. State in one line what you are about to attempt and that you will report back
   with a queue.

## Step 2: Work, gating just-in-time

Do the work. **Do not draw up a task graph and classify it in advance** — you
will produce a plausible plan and diverge from it on contact. Classify at the
moment you are about to act, because that is the only moment you actually know
what the action is.

At each action, ask: **what does it cost to undo this?**

- **Reversible and machine-decidable** → just do it. No prompt, no queue row.
- **Gated (Class 1-4 below)** → do not attempt it. Append a queue row, park that
  line of work, and move to something unrelated.
- **Irreversible (Class 0)** → stop the run (Step 4).

Two rules settle every ambiguous case:

1. **Highest class wins.** A client-facing email is money-adjacent *and* taste
   *and* strategy — it is whichever class is most severe.
2. **Ambiguous → human.** If you are genuinely unsure, it gates. Under-classifying
   costs a client relationship; over-classifying costs a queue row.

### The gate classes

**Class 0 — irreversible. HARD STOP, mid-run.** Cannot be undone by the operator in
under five minutes: writes to a client's live Google property (GBP post, GSC
submission), publishing to a live client site, client-facing sends, money
movement, production deploys, destructive deletes, package publishes.
**Class 0 never goes in the batched queue.** It gets its own moment.

This class is enforced by `hooks/autopilot-gate.py`, which will deny the tool
call outright. If you get that denial: **do not retry, do not reword the command,
do not route around it with a different tool.** That is the gate working.

**Class 1 — owned but consequential.** Billed API calls, client account reads,
staging deploys, anything on `/prove-it`'s no-touch list that is *not*
irreversible. → park + batch.

**Class 2 — credentials and access.** Logins, 2FA, API keys, anything needing
the operator to authenticate as himself. → park + batch.

**Class 3 — taste and voice.** Detect the concrete thing, not the category: any
user-visible copy, any client-facing tone choice, any visual or brand direction.
→ park + batch.

**Class 4 — strategy and scope.** Any pick between two defensible architectures,
any scope expansion beyond what was asked, any prioritization call. → park + batch.

Classes 0-2 are enforced at the permission layer. Classes 3-4 are yours to
notice — no hook can detect a taste call, which is exactly why they are the
residual risk of this design. Be strict with yourself.

### Parking a branch

When you park, **append the row immediately** — never hold queue items in
context to write at the end. A run that dies with unwritten rows has lost the
work, and the whole point is that the run can end at any time.

Then drop that line of work entirely. Do not guess the answer and build on it;
the user chose zero-rework over maximum progress. Move to unrelated work.

If later work depends on a parked row, record `blocked_by: Q3` on the dependent
row. That is one field, not a dependency graph — there is no graph to traverse.

## Step 3: The cap

**Stop the run at 7 open queue rows.** Hitting the cap is not a success with a
long queue — it is the run telling you **the task was mis-scoped**. Report it
that way.

Above roughly seven decisions, review stops being real and becomes reflex. A
queue the operator cannot finish attentively is the bug, not the feature.

## Step 4: Class 0 hard stop

When you hit an irreversible action:

1. Stop working. Do not continue with other tasks — a Class 0 usually means the
   run has reached the edge of what should happen unattended.
2. Append a Class 0 row to the queue, marked clearly as a hard stop.
3. Tell the operator immediately: what you were about to do, to which property, what
   would happen, and why it cannot be batched.

## Step 5: Deliver the queue

Group by **client / property / repo** — the only grouping applied consistently.
Sort by blast radius, largest first. Collapse near-duplicates: if six rows are
the same decision, present them as one decision with six instances.

Every row must be a **reviewable artifact, not a promise.** the operator approves a
thing, never an intention. That means the exact payload or diff, the blast
radius, and the rollback command — not "I'll update the meta description."

**Vary the response verbs.** If every row can be cleared with "yes", the reflex
wins and the queue is theater. Ask for the actual decision: pick A or B, write
the sentence, paste the credential, name the number.

Then report honestly:
- What was completed, with evidence — hand this to `/prove-it`. Self-verified
  "done" is not accepted, because agents confidently report work they did not do.
- What is parked and why.
- **Whether this was a bad run.** More parked than completed is a failure
  headline, not a long queue. Say so plainly.

## Step 6: `/autopilot resume`

1. Read the answers the operator wrote inline in `.claude/AUTOPILOT-QUEUE.md`. **Read
   the file, not the chat** — the file is the interface.
2. For each answered row, check `context_at` against current state (git SHA,
   file mtime, live page). **If the world moved, mark the row
   `stale — re-derive` and redo the work rather than executing an answer against
   a changed world.** An approval given yesterday applies to yesterday's repo.
3. Execute the unblocked work, then anything that was `blocked_by` it.
4. The resume pass **is an autopilot run** and obeys every rule here, including
   Class 0 and the cap.
5. Clear completed rows; keep unanswered ones.

## Step 7: End the run

Remove the marker so the hook returns to being a no-op:

```bash
rm -f .claude/.autopilot-active
```

Do this whenever the run ends — completed, capped, or hard-stopped. Leaving it
armed makes later normal sessions behave strangely.

## Is this working, or is it theater?

`.claude/autopilot-classifications.jsonl` logs every gate decision. The metric
that matters: **your approve-all rate.** If the operator approves ~everything for two
weeks, the queue is not oversight — it is a rubber stamp with extra steps, and
this skill should be cut rather than tuned. Surface that number when it looks bad.

## Notes

- **The hook is the enforcement; this file is only guidance.** A Markdown skill
  cannot stop anything — the model writing the guard is the model deciding to
  proceed. That is why Classes 0-2 live in `settings.json` and
  `hooks/autopilot-gate.py`, and only 3-4 live in prose.
- **Subagents do not write queue rows.** The queue is single-writer. A subagent
  that hits a gate reports it up; the parent appends. Concurrent appends
  interleave and blow the cap.
- **"Zero rework" is not literally true.** Parked branches go stale against
  moving repos and live properties, so some rework relocates to resume time.
  That is an accepted cost of the park-the-branch choice, not a flaw to hide.
- Per-project Class 0 overrides go in `.claude/autopilot-gates.json` (same shape
  as `reference/gate-patterns.json`, replaces it wholesale).
- **Leak guard.** `.claude/autopilot-classifications.jsonl` and
  `.claude/AUTOPILOT-QUEUE.md` capture client context and payloads. In a client
  repo, confirm both are gitignored before the first run (`git check-ignore`);
  if there is no `.gitignore` or they are already tracked, tell the operator rather than
  silently proceeding. Same rule `/prove-it` uses for its evidence directory.
- Do not cite the widely-repeated "Anthropic hook-recursion post-mortem" for any
  design decision here. It does not exist; it was checked.
