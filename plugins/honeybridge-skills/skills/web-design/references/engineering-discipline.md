# Engineering discipline — the fourth gate

_Derived from `~/Documents/DeepResearch/engineering-discipline-for-vibe-coded-web-apps.md`
(2026-08-05, two-pass community + primary-source research). Every claim below traces to that
brief. Audited against the Honey Bridge repos 2026-08-06._

A page can be beautiful, on-brand, accessible, and still be a liability: untested, unenforced,
leaking keys, impossible to roll back. The three existing gates measure the artefact. **This one
measures whether the artefact can survive contact with production and with the next person who
edits it.**

---

## THE HARD STOP

**A build is not done until every row below is either implemented or explicitly waived in the
closing report, with a reason.** Silence is not a waiver. "It's only a marketing site" is not a
waiver either — it is a claim about risk, and it must be written down as one so it can be wrong
out loud.

Run the checklist at **Phase 10**, alongside `prove.js`. Report it at **Phase 12**.

Concretely, at Phase 12 every row is one of:

- **`done`** — implemented, with the command or file that proves it
- **`waived: <reason>`** — deliberately skipped, reason stated
- **`blocked: <what is needed>`** — cannot be done from the repo (needs a dashboard, a paid
  plan, a credential)

There is no fourth state. A row you did not consider is a failed gate, not a blank.

---

## Tier 1 — foundational. Waiving one of these needs a real reason.

| # | Practice | What it is, plainly | What breaks without it | Check |
|---|---|---|---|---|
| 1 | Unit tests | Small automatic checks on one piece of logic | Every change is a guess; regressions surface at the client | `find . -name '*.test.*' -not -path './node_modules/*'` |
| 2 | **Tests run in CI** | The suite executes on every PR | Tests exist but cannot fail a merge. Decorative. | `grep -n 'npm test' .github/workflows/*.yml` |
| 3 | Typecheck script | `tsc --noEmit` as an npm script | Type errors reach runtime | `package.json` scripts |
| 4 | Typecheck in CI | That script runs on every PR | `strict: true` becomes decorative | workflow file |
| 5 | `strict: true` | TypeScript's 8-flag strict family | Whole bug classes stay invisible | `grep strict tsconfig.json` |
| 6 | Linting | Consistent, error-catching static rules | Style drift; real bugs hide in noise | eslint/biome config present |
| 7 | Lint in CI | Enforced, not advisory | Same as #4 | workflow file |
| 8 | Build in CI | A clean build proves it deploys | Broken builds discovered at deploy time | workflow file |
| 9 | Lockfile committed | Exact dependency versions pinned | Two machines build different software | `ls package-lock.json` |
| 10 | Secret scanning | Scans full history for committed keys | A leaked-then-deleted key is still leaked | gitleaks step in CI |
| 11 | `NEXT_PUBLIC_` allowlist | Every public env var explicitly approved | Service keys ship to the browser. **This is the single most common catastrophic leak.** | allowlist file + CI gate |
| 12 | Migrations versioned | Schema changes as reviewable files | Schema history is unreproducible; dashboard edits vanish | `ls supabase/migrations` |

**Reference implementation for #10 and #11:** `~/app-gohoneybridge/.github/workflows/ci.yml`.
Copy it rather than reinventing it.

---

## Tier 2 — expected on anything client-facing

| # | Practice | Plainly | Breaks without it | 2026 tool |
|---|---|---|---|---|
| 13 | Integration tests | Test the wiring: API routes, data access | Units pass, the app is broken | Vitest |
| 14 | E2E on money paths | Drive a real browser through signup/checkout/login | The revenue path breaks silently | **Playwright** (Apache-2.0) |
| 15 | Coverage measured | Which lines ran | You cannot see untested areas | `vitest --coverage` |
| 16 | Error tracking | Know about the 500 before the client calls | Failures are invisible | Sentry (free = **1 seat**) or PostHog (unlimited seats) |
| 17 | Error boundaries | `error.tsx` / `global-error.tsx` | A render error blanks the page | Next.js built-in |
| 18 | `instrumentation.ts` | `onRequestError`, the **only** server error hook | Server errors never reach the tracker — `error.tsx` cannot report them | Next.js built-in |
| 19 | RLS advisors in CI | Flags tables shipped with RLS off | Public database. This is the Lovable failure. | `supabase db advisors --linked --type security --level error --fail-on error` |
| 20 | RLS policy tests | Prove a user cannot read another's rows | Policies are assumed, never tested | `supabase test db` + pgTAP |
| 21 | Dependency audit | Flags known-vulnerable packages | Known CVEs ship | `npm audit --audit-level=high` |
| 22 | Automated dep updates | Bot opens upgrade PRs | Dependencies rot until forced | Dependabot |
| 23 | Deployment gating | A failing check blocks production | Broken code promotes | **Vercel Deployment Checks — works on every plan** |
| 24 | Review rules | Someone other than the author looks | AI output merges unreviewed | CODEOWNERS |

---

## Tier 3 — real value, once the above is habitual

Contract tests · snapshot tests · property-based testing (`fast-check`) · mutation testing ·
fuzzing · load testing · accessibility testing (`@axe-core/playwright` — **Deque, MPL-2.0, not
Playwright, not MIT**) · performance budgets (Lighthouse CI — **`@lhci/cli` is stale, ~13 months
without a release; use `lighthouse` directly**) · feature flags · SBOM · ADRs · rollback runbook ·
idempotency + retry semantics on payment paths.

---

## Deliberately NOT on this list

**Coverage percentage as a gate.** Coverage measures which lines ran, not whether behaviour is
correct. A 90% number on assertion-free AI-written tests is *worse* than no number, because it
manufactures confidence. Measure it (#15). Never gate on it.

---

## Facts that change what you build — verified, do not re-litigate

- **GitHub Free cannot enforce a required status check on a private repo.** Branch protection
  and rulesets are both public-repo-only on Free. Confirmed against our own account: the API
  returns `403 Upgrade to GitHub Pro or make this repository public`. So on our private repos,
  **CI cannot block a merge** — use Vercel Deployment Checks (#23) instead, which can block
  production promotion on every plan.
- **Vercel Instant Rollback restores stale secrets.** It re-points at an old build artefact
  rather than rebuilding, so build-time values (including every `NEXT_PUBLIC_*`) revert to what
  they were at that build. Rotate a key, roll back, and you are running the dead credential.
- **Vercel's own docs contradict each other on whether cron jobs revert on rollback.** Test it;
  do not cite either page.
- **Supabase: tables created via SQL editor, raw migrations, or an AI tool do not get RLS.**
  Only the Table Editor UI enables it.
- **Supabase Data API grants change force-applies to existing projects on 2026-10-30.** New
  public-schema tables stop being reachable by default. Existing tables keep their grants.
- **`npm install --ignore-scripts` does not stop code execution.** The tarball still runs on
  first import; `npm run`/`npx` are not blocked; `.bin` shims execute.
- **`npm audit` only knows published advisories.** A fresh compromise is invisible until an
  advisory exists.
- **AI-written tests fail in a specific way:** hard-coded waits, brittle selectors, and
  **missing assertions** — a test that runs the code, checks nothing, and passes forever. Every
  AI-written test needs a human to confirm it can actually fail.
- **The "45% of AI code has OWASP Top-10 vulns" statistic is not usable.** It is 45% *of 80
  tasks deliberately rigged* so both a secure and insecure answer satisfy the prompt, scored by
  the vendor's own scanner. Never put it in a client deck.
