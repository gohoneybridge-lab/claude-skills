# Session Handoff (SAMPLE — for prove-it/example)

_This is a fixture, not a real project handoff. It exists to demonstrate and
regression-check how /prove-it triages a mixed set of assumed items. The items are
deliberately chosen to land one in each bin (and a couple that share a bin)._

## Goal
Ship user login + a paid upgrade flow for a generic web app.

## Current status
Built and committed on branch `feat/login-and-upgrade`. Not exercised.

## Files touched
(not the point of the fixture)

## Verified vs. assumed
- **Verified (tested/confirmed):**
  - `npm run typecheck` was green before commit.
- **Assumed (not yet verified):**
  - `GET /api/health` returns 200 on the local dev build.
  - The `users.last_login` column is written after a successful login.
  - `npm run build` passes on this branch.
  - The Stripe checkout actually charges the saved card on the upgrade button.
  - The welcome email actually lands in the new customer's inbox.
  - The pricing page ranks on Google's first page for "widget pricing".

## Next steps
(not the point of the fixture)
