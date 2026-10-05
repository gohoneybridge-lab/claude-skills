# AUTOPILOT-QUEUE.md — row schema

Lives at `.claude/AUTOPILOT-QUEUE.md` in the project the run belongs to.
**Append-only, written at the moment of parking.** Never assembled in context
and emitted at the end — a run that dies mid-flight must not lose parked rows.

## File shape

```markdown
# Autopilot Queue

_Run started 2026-07-29T14:02Z · project: app-gohoneybridge · 3 open_

## HARD STOPS (Class 0 — answered in person, never batched)

### H1 · Publish the July GBP post for Client C
- **What I was about to do:** POST the drafted post to the live Client C GBP
- **Blast radius:** publicly visible on the client's Google listing, immediately
- **Why it stopped:** irreversible on a client property you do not own the undo for
- **Ready for you:** draft is at `drafts/client-c-2026-07.md`, reviewed and spellchecked
- **context_at:** 9ef8bbc · 2026-07-29T14:20Z

---

## QUEUE (grouped by property, sorted by blast radius)

### client-c.example

**Q1 · Class 3 · Pick the H1 for the catering page**
- **I need from you:** pick A or B (not a yes/no)
  - A: "Halal Catering for Boston Events"
  - B: "Catering, Done Right — Downtown and Greater Boston"
- **Why it gated:** user-visible copy, client-facing tone choice
- **Payload:** the exact H1 string, dropped into `pages/catering.html:14`
- **Blast radius:** live page copy once deployed; reversible in one commit
- **Rollback:** `git revert <sha>`
- **Resume point:** page is built and staged, H1 is the only placeholder left
- **blocked_by:** —
- **context_at:** 9ef8bbc · 2026-07-29T14:22Z
- **YOUR ANSWER:**

**Q2 · Class 2 · GSC credential for the sitemap submission**
- **I need from you:** paste the property's verification value
- **Why it gated:** requires you to authenticate as yourself
- **Payload:** submits `sitemap.xml` to the live GSC property
- **Blast radius:** none until submitted; submission itself is reversible
- **Rollback:** remove the sitemap in GSC
- **Resume point:** sitemap generated and validated at `public/sitemap.xml`
- **blocked_by:** —
- **context_at:** 9ef8bbc · 2026-07-29T14:31Z
- **YOUR ANSWER:**
```

## Required fields

| Field | Why it exists |
|---|---|
| `id` | `Q1`, `H1` — stable handle for `blocked_by` |
| `class` | 0-4. Class 0 rows go under HARD STOPS, never in the queue |
| **I need from you** | The actual decision, phrased so "yes" cannot clear it |
| **Why it gated** | Which detector fired. Makes misclassification auditable |
| **Payload** | The exact diff, string, or request. **An artifact, not a promise** |
| **Blast radius** | What breaks, on whose property, and whether it is undoable |
| **Rollback** | The literal command or click that undoes it |
| **Resume point** | Exact state the work was left in. Without this, parking is abandoning |
| `blocked_by` | One field, one id. Not a dependency graph |
| `context_at` | git SHA + UTC. If the world moved, the row is stale — re-derive |
| **YOUR ANSWER** | the operator writes here. `/autopilot resume` reads the file, not the chat |

## Rules

- **Cap: 7 open rows.** Hitting it ends the run and is reported as a scope alarm.
- **Vary the ask.** Pick A/B, write the sentence, paste the value, name the
  number. A queue clearable by seven yeses is a rubber stamp.
- **Collapse near-duplicates.** Six identical decisions are one row with six
  instances, not six rows.
- **Sort by blast radius**, largest first, grouped by client/property/repo.
- **Single writer.** Subagents report gates up to the parent; the parent appends.
