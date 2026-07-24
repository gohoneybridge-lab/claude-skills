# Rollback plan

core.rollback — a rollback strategy that is **tested, not imagined**. Every
production release must have a known revert path before it ships.

## Fast path (Vercel)
1. Vercel dashboard → Project → **Deployments**.
2. Find the last known-good deployment (green, pre-incident).
3. **Promote to Production** (⋯ menu → Promote). Traffic cuts over in seconds;
   no rebuild.

## Git path (if the bad commit must leave main)
```bash
git revert <bad-sha>     # creates a clean inverse commit
git push origin main     # CI gate runs, then auto-deploys
```
Prefer `revert` over force-push — it keeps history and re-runs the CI gate.

## Database migrations (Supabase)
Schema changes are the one thing a deploy rollback does NOT undo. Rules:
- Ship **backward-compatible** migrations (add columns/tables; don't drop in the
  same release that stops using them).
- Keep a paired **down migration** for every up migration.
- For destructive changes, use expand → migrate → contract across two releases
  so a rollback never lands on a schema the old code can't read.

## Before first production release
- [ ] Do one **practice rollback** on a preview/staging deploy — confirm the
      promote step works and the app comes up healthy.
- [ ] Confirm env vars exist in the target environment.
- [ ] Know where errors surface (observability sink) so you can tell a rollback
      actually fixed the signal.
