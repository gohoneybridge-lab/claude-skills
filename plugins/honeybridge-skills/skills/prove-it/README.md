# Prove-It

**A verification skill for Claude Code. It takes a session's `HANDOFF.md` and
forces every "assumed to work" item to prove it — or to admit it can't be proven
yet — instead of trusting the AI's "done".**

Version 1.5 · global (user-level) skill · pairs with `/handoff`.

---

## The problem it solves

Almost every AI-built work session ends with things that were *built* but never
*exercised* — flows that "should work" and sit in the assumed column. That gap is
the single most common way broken work ships. (Empirically: an analysis of 20,574
real agent sessions found progress-reporting misalignment among the top recurring
failure modes, with ~91% of resolutions still needing a human to correct the
agent.) A green build is not proof the feature works.

Prove-It closes that gap without pretending. It never rubber-stamps.

## What it does

For each item in a HANDOFF's **"Assumed (not yet verified)"** list, it sorts into
one of three bins:

1. **Machine-decidable now** — a surface you *own* can answer it (your DB, your
   deploy, your CLI, your files). It runs the real check and captures evidence.
2. **Human-gated** — verifying it would cross a hard line (money, client identity,
   client accounts, billed APIs, a client's live Google property). It never acts;
   it writes you a numbered manual test script.
3. **Undecidable within horizon** — no owned read-path, or the only signal is
   genuinely ambiguous right now. It records "can't tell yet" and is **forbidden**
   to write "verified".

Then it rewrites the HANDOFF's Verified-vs-assumed section under an **asymmetric
write rule**: free to downgrade anything, but it may only upgrade to "verified"
with (a) an attached evidence file and (b) a passing **independent referee**.

## The rules that make it trustworthy

- **Orthogonal-signal rule.** A screenshot is never enough on its own — it must be
  paired with an HTTP status, a DOM assertion, or a DB row. Pixels can show a page
  that loaded but is broken.
- **Asymmetric write.** Downgrade freely; upgrade to "verified" only with proof.
  A laundered "verified" is worse than an honest "assumed" — it looks adjudicated.
- **Fresh-context referee (V1.5).** Before any "verified" is written, an
  independent skeptic subagent that sees *only* the claim and the raw evidence —
  never the builder's reasoning — tries to refute it. Only CONFIRMED survives.
  This closes the grader-is-also-builder trap.
- **Evidence decays.** Every verified item carries a `recheck_after`; stale ones
  are re-surfaced, not trusted forever.

## How to use it

Run it in a project that has a `.claude/HANDOFF.md`:

```
/prove-it
```

or say "verify the handoff" / "close the loop" / "did that actually work". It is
manual-trigger only — it never auto-fires, and it never spends money or drives a
live client property without an explicit green light.

**Pipeline with `/handoff`:** handoff *writes* the assumed list; prove-it
*discharges* it. `/handoff` will offer to run prove-it when the assumed list is
non-empty. Typical loop: do work → `/handoff` → accept the prove-it offer (or run
`/prove-it` directly).

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | The skill contract (the steps Claude follows). |
| `recipes.md` | The four evidence recipes: `command`, `http`, `db_row`, `browser + orthogonal signal`. |
| `referee.md` | The V1.5 independent-referee contract. |
| `example/` | A worked sample HANDOFF + the triage it should produce. |

## What it writes into a project

- `.claude/evidence/<date>/` — raw evidence artifacts (command output, HTTP
  responses, DB reads, screenshots + orthogonal signals).
- `.claude/prove-it-scripts.md` — the numbered human test scripts for bin-2 items.
- `.claude/prove-it-ledger.jsonl` — a local, machine-readable trail (one line per
  item per run) that powers decay detection. Per-repo, not a platform.
- The `## Verified vs. assumed` section of `HANDOFF.md`, rewritten (original
  preserved).

## Scope and honest limits

- **General-purpose, not SEO-specific.** It works on any repo's HANDOFF. It is
  strongest on web/app repos where you own oracles (DB, deploy, CLI); on non-web
  repos the `http`/`db_row` recipes rarely apply but the triage, human-gates, and
  honest-downgrade logic still hold.
- **The referee is not infallible.** It requires two independent contexts to
  agree, which is far better than one optimistic one — but for the highest-stakes
  results, re-running `/prove-it` from a brand-new session is still the strongest
  check.
- **It only checks what the HANDOFF wrote down.** Unknown-unknowns the previous
  session never listed are not covered. It closes *stated* loops.

## Provenance

Cherry-picked from gstack's `/ship` (no-stale-evidence, stop-gates), `/qa`
(browse-real-app + screenshot evidence + verified/best-effort/reverted), and
`/canary` (alert-on-change). Council-hardened via `/finalize` + `/llm-council`.
Full spec and decision trail: `~/Documents/Finalize/close-the-loop-verification/`.
