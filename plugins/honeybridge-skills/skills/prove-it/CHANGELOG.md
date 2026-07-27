# Prove-It changelog

## v1.5.2 — 2026-07-24
- **Leak guard** (SKILL Step 4): before writing evidence, ensure
  `.claude/evidence/` and `.claude/prove-it-ledger.jsonl` are gitignored in the
  target repo (they can contain captured DB rows / API internals / client context);
  warn if already tracked or no `.gitignore`. Human scripts + HANDOFF stay
  trackable. Prompted by finding these artifacts git-trackable in a real repo.

## v1.5.1 — 2026-07-24
- **Outbound-effect claim class** added to `recipes.md`: claims about a side effect
  your server had on a third party (billed API call, email send, webhook) are
  bin-3 undecidable UNLESS an owned observability signal (log / metric / artifact /
  provider usage delta) records the outbound call — a 200 from your own route never
  proves it. If no signal exists, the honest output is "undecidable — add
  instrumentation", not a guess from local latency. Generalizes the exact miss the
  V1.5 referee caught on the DataForSEO run.

## v1.5 — 2026-07-24
- **Fresh-context referee** (`referee.md`, SKILL Step 4b): every upgrade-to-verified
  is now gated by an independent skeptic subagent that sees only the claim + raw
  evidence and tries to refute it (CONFIRMED / REFUTED / INSUFFICIENT; ties →
  skepticism). Single referee default; panel-of-3 for money/security/prod/
  credentials/auth. Closes the grader-is-also-builder trap.
- Write rule tightened: "verified" now requires an evidence path **and** a
  CONFIRMED referee verdict.
- **Local ledger** (`.claude/prove-it-ledger.jsonl`, SKILL Step 7b): one JSON line
  per item per run; powers decay detection in Step 8 as a lookup, not a prose scan.
  Kept per-repo (no platform creep).
- Preserved-original blocks no longer stack on repeat runs (git already holds
  history).
- Packaging: `README.md`, `example/` (sample HANDOFF + expected triage),
  `SCORECARD.md`, this changelog.
- First live proof (app-gohoneybridge): verified keyword attach/remove
  persistence; the referee correctly downgraded an over-claimed "live DataForSEO
  data" verdict back to assumed.

## v1.0 — 2026-07-24
- Initial build. 3-bin triage (machine-decidable / human-gated / undecidable),
  four recipes (`command`, `http`, `db_row`, `browser + orthogonal signal`),
  orthogonal-signal rule, asymmetric write rule, evidence capture with UTC + git
  SHA, HANDOFF rewrite with preserved original, coverage-honesty footer,
  `recheck_after` decay.
- Council-hardened via `/finalize` + `/llm-council`. Loosely seamed into
  `/handoff` (offer, never auto-run).
