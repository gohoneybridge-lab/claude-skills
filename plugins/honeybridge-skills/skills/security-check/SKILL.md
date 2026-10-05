---
name: security-check
description: >-
  Security audit for web projects, tuned for vibe-coded / AI-generated sites.
  Maps the project's REAL attack surface, researches the worst and most common
  current breaches, scores each breach class as Applies / Not applicable with
  evidence from the code, then produces a prioritized remediation list and
  applies the fixes. Use when the user says "security check", "security audit",
  "is my site secure", "check my site security", "harden my site", "did I leak
  anything", "vibe coded security", or asks what breaches could hit their site.
---

# Security Check

A grounded security audit for web apps. It does NOT run a generic checklist and
declare victory. It does three things in order: (1) measure the project's actual
attack surface from the code, (2) research what is actually breaching sites like
this one right now, (3) score each breach class against the real surface and fix
what genuinely applies. The core principle: **most breach classes do not apply to
most sites. Naming what does NOT apply is as valuable as fixing what does.** Do not
add auth/validation/rate-limit theater to a site that has no auth, no database, and
no user input.

## The research prompt (the improved version)

When the audit benefits from current threat data, run the `last30days` skill (if
installed) OR a web search with this prompt. This is the canonical, improved prompt
for this skill — keep all four aspects:

> What are the most severe and the most common security breaches affecting
> vibe-coded / AI-generated websites right now? Cover: (1) the worst real-world
> incidents in the last 12 months — what leaked, the root cause, and the blast
> radius; (2) the most common recurring vulnerability classes, ranked by how often
> they occur; (3) which classes map to which app architectures (a static marketing
> site vs a SaaS with auth and a database vs an e-commerce app); and (4) the
> concrete, specific fix for each class. Ground every claim in current data and real
> incidents, not generic advice.

If `last30days` is available, prefer it (it adds practitioner/community signal).
Pass the prompt above as the topic. Otherwise run 2-3 web searches covering recent
incidents, common-vulnerability stats, and framework-specific guidance.

## Step 1 — Measure the real attack surface (read the repo first)

Never audit from assumptions. Read the project and answer each question with file
evidence. Run these in parallel:

- **Framework & host:** package.json / config — Next.js? Vite? Astro? Vercel/Netlify/self-hosted?
- **Auth?** Is there a login, session, or token system? (grep for `auth`, `session`, `jwt`, `cookie`, `next-auth`, `clerk`, `supabase.auth`)
- **Database?** Any DB client or ORM? (grep for `prisma`, `drizzle`, `supabase`, `mongoose`, `pg`, `mysql`, `firebase`)
- **User-writable input?** Any route/form that WRITES or stores data, vs read-only? List every API route and what it does.
- **Secrets:** grep `process.env.*`. Which are server-only vs `NEXT_PUBLIC_` / client-exposed? Are any real secrets hardcoded? (grep for `sk-`, `AKIA`, `-----BEGIN`, `api_key`, `secret`, long base64/hex literals)
- **Client-exposed keys:** any key that ships to the browser by design (Maps, analytics, Stripe publishable). These are not "leaks" but MUST be restricted at the provider.
- **Security headers:** is there a CSP? HSTS? X-Frame-Options? X-Content-Type-Options? (check next.config, middleware, vercel.json, _headers)
- **Dependencies:** run `npm audit` (or pnpm/yarn). Flag unused deps (installed but never imported) — supply-chain surface for zero benefit. Watch for hallucinated/typo-squat package names.
- **Untrusted content rendering:** does it render user/3rd-party HTML/MDX/markdown? `dangerouslySetInnerHTML`? Is the content author-controlled or user-submitted?

## Step 2 — Score the breach classes against the surface

For each class, output a verdict: **APPLIES** (with the evidence + fix) or **N/A**
(with the structural reason it cannot happen here). The common classes:

| # | Class | Applies when | If N/A, because |
|---|-------|--------------|-----------------|
| 1 | Exposed secrets / API keys in client code or repo | Any project with keys | — (almost always worth checking) |
| 2 | Broken authorization (BOLA / IDOR), missing row-level security | There is auth + a database | No auth or no DB |
| 3 | No input validation / injection (SQLi, XSS, command) | User input reaches a query/shell/DOM | No user-writable input |
| 4 | No rate limiting / abuse controls | Mutating or expensive endpoints | Only read-only endpoints; platform DDoS covers it |
| 5 | Missing security headers / CSP | Any site | — (almost always applies) |
| 6 | Outdated / vulnerable / hallucinated dependencies | Any project | — (almost always applies) |
| 7 | Untrusted content → XSS via render | Renders user-submitted HTML/MD/MDX | Content is author-controlled only |
| 8 | Insecure direct provider config | Uses a 3rd-party key (Maps, Stripe, Supabase) | No such keys |

Be honest in both directions. A static, no-auth, no-DB marketing site that ships a
client Maps key typically has only classes 1/5/6/8 live — and class 8's real risk is
**billing/quota theft**, not data loss. A SaaS with auth + a DB has all of them.

## Step 3 — Prioritized remediation, then apply

Produce one list ordered by effort-vs-payoff. Separate **code fixes** (you apply
them) from **owner/console tasks** (the human must do — provider dashboards, DNS,
billing caps, secret rotation). Then apply the code fixes the user approves.

Canonical fixes:
- **Unused deps:** `npm uninstall <pkg>` then `npm audit`. Never run `audit fix --force` blindly — it can downgrade a major framework. Read the suggested change first.
- **Missing CSP:** add a Content-Security-Policy header. Gate it to production if dev tooling (HMR/Turbopack) needs `unsafe-eval`/websockets. Allow only the third-party origins the site actually loads (fonts, maps, analytics). `'unsafe-inline'` for style/script is an honest tradeoff on sites with inline-style libraries; say so rather than pretending it's locked down. Test on a preview deploy with the console open before promoting.
- **Client-exposed provider key (class 1/8):** the key is public by design; the control is at the provider. Restrict by HTTP referrer **and** by API/scope, **and** set a billing cap / budget alert so a stolen key can't run up a bill. This is an owner/console task.
- **Hardcoded server secret:** move to env var, rotate the exposed value (assume burned), add to `.gitignore`, scrub git history if committed.
- **Accessibility-statement-style overclaims** are a sibling liability: never *assert* conformance you haven't audited; "we aim to conform to <standard>" is the safe posture.

## Output shape

1. **Attack surface** — 4-6 bullets describing what this site actually is.
2. **Breach-class scorecard** — the table above, each row marked APPLIES/N/A with one line of evidence.
3. **Prioritized fixes** — code fixes (applied) + owner tasks (listed for the human).
4. **Layman summary** — 3-5 plain sentences a non-engineer founder understands.

Scale the depth to the surface. A brochure site gets a tight pass that mostly says
"these five risks can't happen to you, here are the two that can." A SaaS gets the
full treatment. Either way: evidence over vibes, and name what does NOT apply.
