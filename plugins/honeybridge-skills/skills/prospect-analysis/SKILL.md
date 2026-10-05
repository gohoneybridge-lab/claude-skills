---
name: prospect-analysis
description: Runs a full pre-pitch SEO analysis on a Honey Bridge prospect and writes a findings brief. Gathers Google Maps position, organic position, AI Overview presence, GBP signals for a business we do NOT manage, TLS/blocking state, NAP conflicts and (optionally) a 50-page technical crawl — then ends with a short queue of the few things only a human at a browser can check. Use when the user says "/prospect-analysis", "analyse this prospect", "run a prospect analysis", "research this prospect before I pitch them", or names a business they are thinking of pitching. Do NOT use for existing clients — that is /monthly-client-report.
---

# /prospect-analysis

Pre-pitch analysis for a **prospect** (not a client). Produces a findings brief and a short attended queue. It **never** contacts the prospect and **never** generates a client document.

Everything deterministic lives in one script. Your job is to run it, then exercise judgment on the output: write the brief, rank what matters, and be honest about what was not checked.

## Invocation

Everything after `/prospect-analysis` is the prospect. You need a **name** and a **URL**. If you only got one, ask for the other — do not guess a domain.

```bash
cd ~/app-gohoneybridge && node scripts/prospect-analysis.mjs \
  --name="<business name>" \
  --url=<https://their-site> \
  --location="<City>,<Region>,United States" \
  [--deep]
```

- `--location` defaults to `Boston,Massachusetts,United States`. Set it if the prospect is elsewhere; the map-pack lane is meaningless without the right locality.
- `--deep` adds a real ~50-page DataForSEO crawl plus a Claude synthesis. Costs about a cent, takes ~3 minutes. **Default to running it** — it is where the strongest findings come from. Skip only if the user wants a fast look.

The script prints JSON and writes it to `~/Desktop/Honey Bridge/Prospects/<Prospect Name>/YYYY-MM-DD-lanes.json`.

**Run from `~/app-gohoneybridge`.** The credentials and the audit library live there. Never run it from `~`.

## What the script already did

| Phase | Lane | Notes |
|---|---|---|
| 0 | Preflight | One live call per lane. Hard-fails naming a dead lane rather than returning a partial brief. If it aborts, relay the lane name and stop. |
| 1 | Fetch triage | `200` / `403-BLOCKED` / `TLS-BROKEN` / `dead` |
| 2 | Organic SERP | brand + category queries, AI Overview presence, People Also Ask |
| 2b | Map pack | position and competitors — the strongest local signal |
| 3 | GBP via Places | rating, reviews, hours, status, category, phone |
| 3b | **The app's own SEO tools** | see below — this is the most important lane |
| 4 | Deep crawl | `--deep` only; writes to `site_audits.research` |
| 5 | NAP | Places phone vs the phone on their own site |

### Phase 3b — `app_tools` in the JSON. Lead the brief with this.

`/dashboard/seo/review` is partner-gated (`api/seo-review/run` rejects a null `partner_id`) and a prospect has none, so the skill composes its **internals** directly. Nine lanes, all from this codebase:

| Lane | What it gives you |
|---|---|
| `gbp_profile` | `isClaimed`, categories, photo count, description, and **`placeTopics`** — Google's own extracted review themes, i.e. the words this business's customers actually use |
| `gbp_reviews` | 100 reviews sampled with **`owner_response_rate`** — "1,036 reviews, 1 of the last 100 answered" beats any count |
| `gbp_posts` | last post date + `days_since_last_post` |
| `gbp_audit` | the app's own `runGbpAudit` + `gbpFindings`, vertical-weighted |
| `keywords` | seeds built from `placeTopics` + category + locality, priced with real volumes |
| `quickwins` | **terms they already rank 4-20 for** — the credible pitch |
| `keyword_gap` | vs the strongest map rival (most reviews), not the first listed |
| `local_presence` | `verifyLocalPresence` — CID-exact matching, not a title substring |
| `pitch` | `computePitch` → clicks, customers, and a ready-to-read headline per keyword |

**Lead with `pitch`, sorted by `clickGain`.** "You rank #15 for a 40,500/mo term with difficulty 13" is the finding an owner acts on. Missing meta descriptions are a footnote next to it.

**`revenueGain` is null unless `--customer-value=<avg $/customer>` was passed.** Report clicks and customers; never state a dollar figure without it. The JSON carries an explicit caveat when it's absent.

Cross-reference `placeTopics` against `keyword_gap` — a theme customers name that the business doesn't rank for is the sharpest content finding available.

### Reading the JSON — five traps

0. **Geography before conclusions.** `phases.maps` runs two scopes: the business's own `neighborhood` (derived from the Places address) and the `city` from `--location`. Ranking #1 in the neighborhood while absent city-wide is a **reach gap, not a ranking failure** — the script emits `maps.note` saying so. Never write "invisible on Google Maps" without checking both scopes. In House Cafe ranked #1 in Brighton and looked absent from a Boston-wide query.
0b. **Sanity-check `nap.site_phones` before repeating a mismatch.** The extractor now reads `tel:` hrefs, but any number that looks like an ID rather than a phone means the lane misfired. A mismatch is only real if both numbers are plausibly phone numbers — and even then it stays unconfirmed until dialled.


1. **A `403-BLOCKED` fetch does NOT mean the crawl failed.** DataForSEO's crawler walks straight through Cloudflare challenges that beat every local fetcher. Verified 2026-08-13: 49 pages pulled from a site that 403'd curl, WebFetch and headless-with-proxies. Never report "we couldn't analyse their site" on the strength of phase 1.
2. **`TLS-BROKEN` means the host is UP** with a certificate chain that does not validate. That is a headline finding, not a dead site.
3. **The crawl's findings are in `site_audits.research`, not `.summary`.** `.summary` belongs to the quick-audit path and is always NULL for a crawl. Read the wrong column and it looks like the AI synthesis silently failed.

To read the crawl output for an `audit_id` from phase 4, query Supabase for `research`, `issues`, `pages_crawled_count` on that row.

## Phase 6 — write the brief

Write to `~/Desktop/Honey Bridge/Prospects/<Prospect Name>/YYYY-MM-DD-brief.md`. (Convention changed 2026-08-21: prospect output lives under `Honey Bridge/Prospects/`, NOT `~/Documents/Prospects/`, which no longer exists.)

**This is a prospect, not a client.** Do not write to any client `Worklog/YYYY-MM.md`, and do not create a partner record in the portal. If they sign, the folder moves under `~/Desktop/Honey Bridge/Clients/` and worklog discipline starts from that date.

Structure:

1. **What's working** — lead here. They are a business, not a patient. Map position, rating, review count, organic position.
2. **What's costing them** — ranked by revenue impact, not by severity label. A missing `<title>` on the homepage outranks forty missing alt attributes.
3. **What we'd do first** — three items maximum, each tied to a specific finding above.
4. **Not checked** — everything tagged `not-checked`, said plainly.

### Evidence discipline (non-negotiable)

Every claim carries one of four tags, inherited from the JSON:

- `[verified]` — a live call returned it this run
- `[browser-observed, n=1]` — seen rendering once, in one session; **not** the same as verified
- `[unverified]` — plausible, unconfirmed
- `[not-checked]` — a lane did not run. **Say so.** A skipped lane must be visible in the brief, never silently absent.

Hard rules:

- **Never cite a phone mismatch without dialling.** Directories and sites routinely publish call-tracking numbers. The script attaches a mandatory hedge; keep it.
- **GBP posts and claimed status ARE available** — from `app_tools.gbp_posts` and `gbp_profile.isClaimed`. Only **suspension** state is genuinely unavailable for a profile we don't manage; that alone stays a queue item.
- **No vendor conversion statistics.** "Free audits convert at 30-50%" and "video audits get 3-5x replies" are unsourced marketing and were deleted from this pipeline deliberately.
- **Never extrapolate a sampled finding site-wide.** The crawl deep-checks ~10 of ~50 pages; say which.

## Phase 7 — the attended queue

End the run with the queue from `attended_queue` in the JSON — **at most 7 rows**, each with the exact URL or query to open. Present it and stop. Do not open a browser mid-run; the whole point is that the run completes unattended.

Queue items are Google SERP reads — **research** — so they use the **personal** Chrome profile, deviceId `47e1d138-799c-4aed-9e03-0604878cff90`. Never the Honey Bridge profile: it holds seven clients' GBP, Search Console and Ads sessions, and one GBP is already suspended.

Typical rows:
- Does Google print `Missing: <term>` under their result? (No API field exists for this anywhere.)
- GBP verification / suspension state.
- Dial any phone mismatch.

## Out of scope

Generating a .docx · sending anything to the prospect · creating a portal partner record · writing to a client worklog · touching the Honey Bridge browser · cold outbound at volume.

That last one is deliberate: owner-facing guidance treats unsolicited SEO audits as a scam signature and tells businesses to spam-file them. Deep prep for a named, warm prospect is a different act.

## Cost

~$0.008 without `--deep`, ~$0.016 with. Balance is checked at preflight and the run aborts below $0.50. Top-up minimum on DataForSEO is $50.

## Reference

Spec and audit trail: `~/Documents/Finalize/prospect-analysis/`. Research brief: `~/Documents/DeepResearch/prospect-analysis-skill-extreme.md`.
