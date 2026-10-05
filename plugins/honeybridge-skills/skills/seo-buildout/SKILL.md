---
name: seo-buildout
description: The full one-client SEO overhaul in one bounded run - measures the site with the app's own SEO tools plus the /seo pack, researches the local area once, converges everything into a single approved plan, implements it on the site (with every service findable and linkable, without generating doorway pages), then fills their Google Business Profile out completely. Use when the user says "/seo-buildout", "full SEO on <client>", "run everything on their site and fix it", "do the whole SEO job for <client>", "build out their GBP", or asks for site SEO and GBP work on the same client in one go. Do NOT use for a prospect we have not signed (that is /prospect-analysis), for the monthly cycle (/monthly-client-report, /monthly-client-content), or for a single narrow question a plain /seo subcommand answers.
---

# /seo-buildout

**Spec v1.0, council-hardened 2026-09-12. Times run end to end: 0.**

Until that number is 1, every judgment in this file is reasoned and none of it is measured.
The first real run is a calibration run. Treat the guidance as considered, not as proven, and
write what actually happened to `runs-log.md` when you are done.

One client. One run. Measure, decide once, implement, fill the GBP, verify.

This skill exists because the three measurement lanes it wraps (the app's own SEO tools, the
`/seo` pack, `/extreme-research`) will each happily spend an hour and a large slice of the
usage budget on their own. Run naively and in sequence they overlap by roughly half, re-derive
the same findings three times, and produce three documents nobody reconciles. This skill's job
is to run them **once each, cheapest-first, reusing before regenerating**, and to fold the
output into a single plan that then actually gets built.

Read [references/reuse-windows.md](references/reuse-windows.md) before Phase 2 and
[references/gbp-fields.md](references/gbp-fields.md) before Phase 5.

## Three rules

There used to be seven. Four of them were one idea wearing four hats.

**R1. Cheapest lane first, and later lanes inherit what earlier lanes established.**
Order is fixed: app tools, then `/seo`, then `/extreme-research`. Before starting a later lane,
write down what the earlier one established. The later lane may not re-derive it.

**R2. Reuse before regenerate, and never re-run a lane to double-check.**
Check for an existing artifact before spending (windows in `references/reuse-windows.md`).
If a finding is doubted, write the doubt down as `[unverified]` and move on. Re-running a lane
is how the budget dies, and preventing it is most of why this skill exists.

**R3. One convergence, one approval, one build, one deploy.**
No per-finding back-and-forth. A one-off yes to shipping is not standing permission.

**There is no caps table.** There was one. Every number in it was a guess formatted to look like
a measurement, which is worse than no number. The replacement is one sentence: *if a lane is
running longer than it is worth, stop and ask.* Real numbers go in `runs-log.md` after real
runs, and the table comes back only when it is made of measurements.

**Enforcement is by visibility, not by hope.** Nothing here runs these rules. What makes them
likely to be followed is that `plan.md` must report, in the operator's sightline at the approval
checkpoint, which lanes ran and which were reused. A rule that has to be restated in a
user-facing artifact survives better than a rule buried in a skill file. Do not skip that
section, and do not summarise it away.

## Phase 0 - target, resume, budget

**Resolve the client explicitly.** Never infer from the working directory. You need:

| | |
|---|---|
| client name | must match an existing folder under `~/Desktop/Honey Bridge/Clients/` |
| live URL | the **public customer-facing domain**, never a Vercel alias or preview host |
| repo path | from `~/.claude/reference/PROJECT-MAP.md`; several projects exist twice on disk and the map says which copy is canonical |
| GBP | which of the profiles under `the agency Google account` is theirs |
| locality | the town or neighbourhood the map pack is actually fought in, not the metro |

If any of these is ambiguous, ask. Guessing the domain or the repo copy is how a run edits a
stale tree and deploys nothing.

Then read, in this order: the client's `Worklog/YYYY-MM.md` for the current month,
`./.claude/HANDOFF.md` in the repo if present, and any prior run manifest.

**Run manifest** - create or reopen
`~/Desktop/Honey Bridge/Clients/<Client>/SEO Buildout/<YYYY-MM-DD>/manifest.json`:

```json
{
  "client": "", "url": "", "repo": "", "gbp_profile": "", "locality": "",
  "phases": { "inventory": "pending", "app_tools": "pending", "seo_pack": "pending",
              "area_research": "pending", "plan": "pending", "site": "pending",
              "gbp": "pending", "verify": "pending" },
  "reused": [], "spend": {}
}
```

Every phase writes its status (`pending` / `done` / `reused` / `skipped: reason`) and its output
path here before moving on. This is what makes a resume cheap.

Announce the reuse decisions in **one line**, not a ceremony. Having to think about usage is
itself a tax on the work; the point is to spend well, not to hold a budget meeting.

## Phase 1 - services inventory (local, free, and the spine of the whole run)

Before any measurement, establish **what this business actually sells.** Everything downstream
keys off this list: the keyword set, the page plan, the GBP services block, and the Phase 6
coverage check.

Sources, in priority order, and record which one each service came from:

1. Their ordering system where it is authoritative for this client (Toast wins on menu and price
   for the Client C brands - see [[client-a-menu-source-of-truth]] and [[client-d-cafe-website]]).
2. Their current GBP services and products.
3. Their live site's own navigation and menu.
4. Anything in the client folder: contracts, intake notes, prior reports.

Write `services.md` in the run folder: one row per service, with `source`, `on site?`
(URL/heading or `none`), `on GBP?`, and `confirmed by client?`. **Do not invent a service** and
do not promote something into the list because it would rank well - see
[[no-fabricated-client-content]]. Anything you cannot source goes to the client queue for Phase
6; it does not go on the site or the GBP.

This file is what Phase 6 measures the whole run against.

## Phase 2 - measure, three lanes, in this order

Do not parallelise across lanes. Later lanes are cheaper when they inherit earlier findings.

### 2a - the app's own SEO tools (first, cheapest, and the most ours)

Run from `~/app-gohoneybridge`. Never from `~` - the home directory is Vercel-linked.

A signed client **has a `partner_id`**, so unlike a prospect they can use the real review engine
rather than a composed stand-in:

```bash
# the whole engine in one call - GBP profile, reviews + owner-response rate, posts,
# gbpFindings, per-page website checks, GSC indexation evidence
POST /api/seo-review/run  { "partner_id": "<id>" }
```

Staff-gated, rate-limited fail-closed, hard cost-capped inside the engine
(`src/lib/seo-review/engine.ts`). Read the result at `/dashboard/seo/review/<runId>` or via
`buildSeoReviewExport(runId)` / `renderSeoReviewMarkdown()` in `src/lib/seo-review/export.ts`.
Take the markdown export, not a screenshot of the page.

Then the standalone tools, **only the ones the review engine does not already cover**:

| Route | Take from it |
|---|---|
| `/dashboard/seo/keywords` | real volumes for the Phase 1 service terms |
| `/dashboard/seo/quickwins` | terms already ranking 4-20 - the fastest wins in the run |
| `/dashboard/seo/gap` | gap vs the strongest map rival (most reviews), not the first listed |
| `/dashboard/seo/heatmaps` | geo-grid position, **current run only**; the run selector cannot load historical runs, so never make a month-over-month map claim ([[heatmap-run-selector-bug]]) |
| `/dashboard/seo/site-audit` | only if the review engine's page checks came back thin |

Skip `/dashboard/seo/gbp` lookup if the review engine already returned the profile.

**Lead the plan with quickwins.** "You rank #15 for a term with real volume and low difficulty"
is the finding that turns into revenue. Missing meta descriptions are a footnote next to it.

### 2b - the `/seo` pack, bounded

`/seo audit <url>` fans out across subagents and is the biggest usage risk in this skill. Run it
**once** and treat its output as final.

Before running it, write down what 2a established (GBP state, review intelligence, indexation,
keyword set, map position). The audit may not re-derive those, and its **local and GBP lanes are
skipped** - we have better first-party data from 2a.

Lanes worth having that 2a does not give you: technical (crawlability, indexability, CWV
including INP), schema, content quality and E-E-A-T, images, sitemap, and GEO / AI Overviews.
If the audit's own orchestration would fan out further than the job needs, run those lanes as
targeted subcommands instead - cheaper, same coverage.

Never re-run a `/seo` subcommand for a lane the audit already produced.

### 2c - `/extreme-research` on their area (the expensive one; gate it hard)

**Check first, always.** `/extreme-research` does not check for existing research before spending
([[extreme-research-skill]]). Look in `~/Documents/DeepResearch/` and `~/Documents/Last30Days/`
for an existing brief on this locality or vertical. Inside the window in
`references/reuse-windows.md`, **reuse it** and record `"area_research": "reused"` in the
manifest with the path.

If it must run, scope it to the local competitive picture, not the industry in general: who ranks
in this town for these service terms, what those pages actually do, what customers here search
and say, which local citations matter.

Two hard constraints:

- Its browser lane is **attended and uses the PERSONAL Chrome profile** (deviceId
  `47e1d138-799c-4aed-9e03-0604878cff90`). Google SERP reads are research, not client work.
  Never point that lane at the Honey Bridge browser: it holds seven clients' GBP, Search Console
  and Ads sessions, and one GBP is already suspended.
- It needs the operator at the keyboard. If he is not, mark the phase `skipped: unattended`, finish the
  rest of the run, and put it in the Phase 6 queue. **Do not** substitute a pile of ad-hoc web
  searches - that spends the budget and returns less.

Cross-check anything it reports against one live Google SERP; a research engine returning zero is
not the same as no signal ([[last30days-misses-versioned-topics]]).

## Phase 3 - converge, once

Write `plan.md` in the run folder. This is the only artifact Phases 4 and 5 read.

**1. What this run spent.** First section, not buried. Per lane: ran, reused, or skipped, and
why. This is the enforcement mechanism; a reused or skipped lane must be visible here, never
silently absent.

```
WHAT THIS RUN SPENT
  2a app tools      RAN      one review-engine call + N dashboard tools
  2b /seo pack      RAN      technical/schema/content/images; local+GBP skipped
  2c area research  REUSED   <path> (N days old)
```

**2. Services decision table.** Phase 1's `services.md`, now with a decision per row and the
evidence for it. See the services rule below for what earns a dedicated page.

**3. Ranked actions** by revenue impact, not severity label. Quickwins first, then service
coverage gaps, then technical, then schema, then content, then images.

**4. GBP actions** - every field in `references/gbp-fields.md`, marked fill / fix / already
correct / blocked on client.

**5. Evidence tags on every claim** - `[verified]` (a live call returned it this run),
`[browser-observed, n=1]`, `[unverified]`, `[not-checked]`.

**6. What we are not doing**, and why.

**Checkpoint.** Show the operator the spend section, the services table and the top actions on one
screen. Get one approval. Then build. Do not re-open a measurement lane because a finding is
surprising - tag it `[unverified]` and move on.

## Phase 4 - implement on the site

Work in the canonical repo from Phase 0. `git status` first: several client deploys are a
**working-tree upload**, so uncommitted junk ships and a stale tree ships nothing
([[client-b-landing-no-remote]], [[client-a-local-repo-was-stale]]). Fetch and rebase before
editing.

### The services rule

The requirement is that **every service is findable and linkable** on the live site. It was
always about coverage. It was never about URL count, and an earlier version of this skill that
mandated a URL per service was a doorway-page generator.

**Default: one services hub page, with an anchored heading per service.** This is the shape
Google's doorway guidance points at and it satisfies the actual requirement.

**A dedicated page is earned, not mandated.** A service gets its own page only when **all four**
hold, and `plan.md` records the evidence for each:

1. **Real demand.** From lane 2a keyword or quickwin data. Not guessed, not assumed.
2. **Genuinely unique content exists** that is not already on the hub: distinct price, process,
   photos, FAQs, people, equipment. If the page would be the hub entry reworded, it fails.
3. **It will be linked** from the hub and from navigation, so it is not an island.
4. **It does not duplicate an aggregation that already exists** on the site, such as the menu.

Tests 3 and 4 are Google's own doorway questions. The policy asks whether pages "duplicate
useful aggregations of items that already exist on the site for the purpose of capturing more
search traffic" and whether they "exist as an island"
(<https://developers.google.com/search/docs/essentials/spam-policies>).

**The self-check, at the end of Phase 4.** Count new pages created against rows in
`services.md`:

```
SERVICES COVERAGE SELF-CHECK
  rows in services.md      N
  new pages created        M
  ratio                    M/N
```

A ratio at or near 1:1 is the doorway signature: it means pages were generated from a list
rather than earned from content. Halt, justify each page against the four tests, or collapse it
back into the hub. This check exists because "is this unique enough" is otherwise an unaudited
judgment call, and moving the risk from a written rule into an invisible inference makes it
worse, not better.

### Everything else in this pass

- Title, meta and heading fixes, quickwin terms first.
- **`LocalBusiness`** (or the right subtype) JSON-LD on the apex, matching the GBP name, address
  and phone exactly. **`Service` is not a Google-supported structured data type** and earns no
  rich result (<https://developers.google.com/search/docs/appearance/structured-data/search-gallery>).
  If you use the vocabulary anyway, say plainly in the plan that it buys nothing from Google.
- Internal links from the hub to every earned page and back.
- Sitemap and `robots.txt`.
- Alt text, image formats and sizes.
- Whatever the technical lane found.

Voice rules apply to every word that ships: **no em dashes or en dashes**, no borrowed marketing
phrasing ([[no-em-dash-rule]]), nothing invented about the client.

Then build once, check it locally by **content, not by status code**
([[dev-server-port-collisions]]), and ask before deploying. A live deploy is its own approval,
not part of the implementation pass.

## Phase 5 - fill the GBP out completely

**Attended. Honey Bridge browser, deviceId `4c40c7fc-fc02-42ea-8940-345d086c2e69`.** Select it
explicitly; being connected to the right one by luck is not choosing it. Confirm **which
client's profile** with the operator before the first write - more than one profile lives under that
account and this is a live client property.

**Why we do this, stated honestly.** Google documents three local ranking factors: relevance,
distance and prominence (<https://support.google.com/business/answer/7091>). It does **not** name
services, posts, Q&A or attributes as ranking levers anywhere. Complete, accurate information
serves relevance and serves the person reading the profile. That is the real case for filling it
out and it is enough. Do not claim ranking gains the documentation does not support.

Work `references/gbp-fields.md` top to bottom. Every service from `services.md` goes in the
services block, each with a description written from what the business actually does, and each
linked to the URL Phase 4 gave it (the hub anchor counts).

Rules:

- Only what we can source. A service we cannot confirm stays out and goes to the client queue
  ([[no-fabricated-client-content]]).
- Hours are a trap on several of these clients. Verify against the live source before editing
  ([[client-e-hours]], [[client-c-gsc]]).
- The website field must point at the live public domain. Check it; at least one client's GBP has
  pointed at a dead legacy domain ([[client-e-seo-truth]], [[client-g-rva-website]]).
- Never send anything to the client from here. Draft only ([[never-send-only-draft]]).
- Screenshot each section after saving. Nothing is `[done, verified]` until it has been seen on
  screen after the save.

## Phase 6 - verify, log, hand off

1. **Services coverage check.** Fetch each service URL on the **live public domain** and confirm
   200 plus the expected heading. An internal alias returning 200 while the customer-facing
   domain is dead is exactly how `client-b.example` went unnoticed for five days. Any row that
   fails is `[blocked]`, not done.
2. **GBP re-read.** Reload the profile fresh and confirm the saved state, section by section.
3. **Spend report.** What each lane actually did, versus what Phase 0 announced.
4. **Client worklog** - append every action to
   `~/Desktop/Honey Bridge/Clients/<Client>/Worklog/YYYY-MM.md`, dated, one bullet per action,
   tagged `[done]`, `[done, verified]`, `[waiting on client]` or `[blocked: reason]`. This is a
   billable-work ledger, it feeds the monthly report, and small items count.
5. **Client queue** - the short list of things only the owner can answer. Draft it, do not send it.
6. **Handoff** - `./.claude/HANDOFF.md` in the repo, honest about verified versus assumed.
7. **`runs-log.md`** - append this run's actuals to the log in this skill folder. This is how the
   deleted caps table eventually gets rebuilt out of measurements instead of guesses.

## Out of scope

Sending anything to the client · deploying without an explicit yes for that deploy · creating a
second folder for a client that already has one · running any measurement lane a second time ·
pointing the research browser lane at the Honey Bridge profile · claiming a dollar figure without
an agreed average customer value · month-over-month heatmap claims · building a prospect-facing
version of this (that is `/prospect-analysis`, which already exists).
