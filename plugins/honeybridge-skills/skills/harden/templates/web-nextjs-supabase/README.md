# Golden web seed — Next.js + Supabase

A minimal, **production-grade** starter that the `/harden` skill clone-and-fills.
It exists so the plumbing is real and verified — the agent only adds the
product-specific parts. Every file here maps to a `rubric.yaml` item.

| Rubric item | Where it lives |
|---|---|
| `core.tests` | `vitest.config.ts` + `lib/__tests__/` |
| `core.ci_gated` | `.github/workflows/ci.yml` (lint → typecheck → test → build, blocks on fail) |
| `core.docs` | this README (What / Run / Deploy) |
| `core.security_basics` | `.env.example` (never `.env`), server-side Supabase client |
| `core.observability` | `lib/observability.ts` (Four Golden Signals) |
| `core.rollback` | `ROLLBACK.md` |
| `web.security_headers` | `next.config.mjs` headers() + `middleware.ts` |
| `web.owasp_asvs` | server-side auth in `lib/supabase/server.ts`, no client-trust |
| `web.accessibility` | semantic `app/layout.tsx`, a11y lint in CI |
| `web.core_web_vitals` | `next/image`, sized media, no blocking work |

## What it is
Replace this section with what the product actually is (from the spec).

## Run locally
```bash
cp .env.example .env.local   # fill in Supabase values — never commit .env.local
npm install
npm run dev                  # http://localhost:3000
```

## Verify (the golden gate)
```bash
npm run lint && npm run typecheck && npm test && npm run build
```
All four must pass. CI runs the same sequence and blocks merge on any failure.

## Deploy
Vercel: import the repo, set the env vars from `.env.example` in the Vercel
dashboard, deploy. See `ROLLBACK.md` before your first production release.
