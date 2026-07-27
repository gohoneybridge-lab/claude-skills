# Prove-It — self-audit scorecard (v1.5, 2026-07-24)

Harden-style scoring of the skill against a production-quality rubric. Scored
honestly (this is a prove-it artifact — laundering its own score would be
self-refuting). Scale: 1 (absent) – 5 (production-grade).

| # | Dimension | Score | Notes |
|---|---|---|---|
| 1 | Core logic correctness | 5 | 3-bin triage + four recipes do exactly what the spec says; demonstrated live (app-gohoneybridge attach/remove). |
| 2 | Safety / guardrails | 5 | No-touch list, human-gates, never auto-fires, never spends/posts without green light. Held under a real billed run. |
| 3 | Anti-laundering / honesty | 5 | Orthogonal-signal rule, forbidden-verified-on-bin-3, asymmetric write. Proven: refused to stamp responsive + refused to launder DataForSEO latency. |
| 4 | Independence of verification | 4 | V1.5 referee gates every "verified" from a fresh context and already caught a real over-claim. Residual: still same model family (see gaps). |
| 5 | Evidence integrity | 5 | Every verdict stamped UTC + git SHA + evidence path; originals preserved on rewrite. |
| 6 | Robustness / decay | 4 | Ledger + `recheck_after` re-surface stale items; anti-stacking on preserved blocks. Residual: staleness only surfaces on re-run (no scheduled reminder). |
| 7 | Usability / discoverability | 5 | Clear triggers, README, worked example, loose `/handoff` seam (offer). |
| 8 | Scope discipline | 5 | No platform creep (ledger kept per-repo); general-purpose, not domain-locked. |
| 9 | Testability / dogfood | 4 | `example/` fixture locks the triage as a regression check. Residual: full live dogfood needs a real app (bin-1 checks can't run against a fixture). |
| 10 | Documentation | 5 | SKILL.md, recipes.md, referee.md, README, CHANGELOG, spec + decision-notes, memory. |

**Aggregate: 47 / 50.** Production-grade for a personal-now-packageable-later skill.

## Residual gaps (deliberately open, with rationale)

1. **Referee is the same model family.** Two independent *contexts* agreeing beats
   one optimistic context, and it already caught a real over-claim — but it is not
   a different model. Escape hatch (documented): re-run `/prove-it` from a
   brand-new session for the highest-stakes results. Fully closing this would mean
   invoking a genuinely different model as referee; out of scope for v1.5.
2. **Staleness is pull, not push.** `recheck_after` + the ledger flag stale
   verifieds, but only when you next run prove-it. A scheduled reminder (via the
   `/schedule` skill or a launchd job reading `prove-it-ledger.jsonl`) would make
   decay *push* to you. Left as a future add — it is a scheduling concern, not a
   verification one.
3. **Full self-dogfood needs a live app.** The `example/` fixture locks the *bin
   assignment* (the part that can drift), but the bin-1 *verdicts* can only be
   exercised against a running app. That is inherent — a verifier cannot verify
   against a fixture that has no real oracle.

None of these are laundering risks or safety holes; they are honest edges of what
a single-session, single-model, pull-based verifier can do. They are the right
things to leave open at v1.5 rather than fake-close.
