---
name: all-skills
description: >
  Routes a web/content job to exactly the skills it needs, and explicitly skips
  the rest. Use when the user says "use all skills", "use all the skills",
  "use all relevant skills", "all skills needed", "use every skill", "all seo
  skills", "use all seo skills and humanize text", or pairs any such phrase with
  writing a blog post, revamping/upgrading an existing website, or building a new
  website. Also use when the user names a web job (blog, site revamp, new site)
  and expects the full treatment without listing skills individually. Do NOT use
  for non-web work (Roblox, scripts, data tasks) even if "all skills" is said.
user-invokable: true
argument-hint: "[blog|revamp|build] [url or topic]"
metadata:
  author: the operator Shaikh
  version: "1.0.0"
---

# /all-skills — job-aware skill router

When the operator says "use all the skills," he does **not** mean run 26 SEO skills.
He means: *figure out which ones this job needs, run those, skip the rest, and
tell me what you skipped.* This skill does that.

## Why this exists

The `seo-*` pack is analysis-shaped (`/seo <command> <url>` → report). the operator's
jobs are production-shaped (write the blog, rebuild the site). Nothing matched,
so for two months "use all seo skills" silently resolved to nothing. This routes
the production job to the analysis skills that genuinely serve it.

## Hard rules

1. **Invoke sub-skills from the main thread via the `Skill` tool.** Never hand a
   `seo-*` skill to a subagent — the `seo-*` agent types have no `Skill` tool, so
   the skill body never loads and you get the agent's generic prompt instead.
   Agents are fine for *parallel analysis*; skills must run here.
1b. **Namespace — settled 2026-07-29, use bare names.** These ship as the
   `claude-seo` plugin (v2.2.4). **Bare names resolve correctly** (verified: a bare
   `seo-content-brief` and a bare `seo-page` each resolved to
   `~/.claude/plugins/cache/agricidaniel-claude-seo/claude-seo/2.2.4/skills/...`).
   Write and pass them bare, as this file does. The `claude-seo:` prefix is not
   required. If a name ever fails to resolve, the cause is almost certainly that the
   skill does not exist in 2.2.4 — check the installed skill list before assuming a
   namespace problem. `~/.claude/skills-backup/` (the old 1.9.9 pack) is **inert**:
   it is not on the skill load path, confirmed by `seo-firecrawl` — which exists only
   there — returning `Unknown skill`.
2. **Never run the full pack.** If more than ~8 skills look relevant, you have
   mis-scoped the job. Re-read the request.
3. **Always end with the ran/skipped report** (format at the bottom). This is
   non-negotiable — it's the only way the operator can see the routing worked.
4. **Ask once if the lane is ambiguous**, then proceed. Don't ask twice.

## Step 0 — pick the lane

| Signal | Lane |
|---|---|
| "write a blog", "next post", "article about X", a keyword/topic | **A — BLOG** |
| "revamp", "upgrade this site", "fix their site", an existing live URL | **B — REVAMP** |
| "build a site", "new website", "from scratch", no live URL yet | **C — BUILD** |

Mixed asks (e.g. "revamp the site and write two posts") → run Lane B, then Lane A
per post. Don't interleave.

---

## Lane A — BLOG POST

Order matters; each step feeds the next.

1. `seo-content-brief <topic>` — outline, per-section word counts, competitor
   scoring, target keyword. **This is the spine.** Everything downstream fills it in.
2. `last30days <topic>` — real quotes, current angles, actual language people use.
   Skip only if the topic is evergreen and the brief is already rich.
3. `seo-geo` — passage-level citability so it can get pulled into AI Overviews.
   Applies to the *structure* (headers as questions, answer-first paragraphs).
4. **Write the draft** against the brief.
5. **Voice pass** — see "Voice" below. Mandatory. This is the "humanize text" step.
6. `seo-content` — E-E-A-T and thin-content check on the finished draft.
7. `seo-schema` — `BlogPosting` + `author` + `publisher`.
8. `seo-images` — alt text on every image. Add `seo-image-gen` only if a hero or
   OG image is actually missing.
9. `seo-google` — after publish: URL inspection + indexing request.

**Skip in Lane A unless a trigger below fires:** seo-audit, seo-technical,
seo-plan, seo-backlinks, seo-drift, seo-maps, seo-sitemap, seo-programmatic,
seo-ecommerce, seo-hreflang, seo-sxo, seo-competitor-pages.

---

## Lane B — REVAMP AN EXISTING SITE

1. **`seo-drift baseline <url>` — FIRST, before touching anything.** This is the
   one that proves the work. Without a baseline there is no before/after, and
   before→after is how Honey Bridge reports to clients.
2. `seo-audit <url>` — the parallel agent fan-out. Let it do the broad sweep.
3. `seo-page <url>` on the 3–5 pages that actually matter (home, top service,
   top converting). Don't page-audit the whole site; the audit covered it.
4. `seo-local <url>` — effectively always on for Honey Bridge clients.
   Add `seo-maps` if GBP rank/geo-grid is in scope.
5. `seo-technical <url>` — only if the audit flagged technical issues. Otherwise
   redundant.
6. `seo-schema`, `seo-images` — fix what the audit found.
7. `seo-geo` — retrofit citable structure into existing copy.
8. **`web-design`** — the design half of a revamp. It owns direction, tokens,
   component sourcing, motion and the Prove phase, and it invokes these internally.
   **Don't run any of them separately here:** `ui-ux-pro-max`, `frontend-design`,
   `web-design-guidelines`, `clone-motion`, `design-dna` (image-only references),
   `motion-design` (durations and easing), `framer-motion` and the eight `gsap-*`
   skills (tier 3 only — see the motion budget below).
9. **Apply the changes.**
10. `seo-drift compare <url>` — the payoff. Produces the delta for the client report.
11. `seo-google` — resubmit sitemap, request re-indexing on changed URLs.
12. `security-check` — only if the operator owns the codebase (not for Squarespace/Wix).

**Skip in Lane B unless triggered:** seo-cluster, seo-plan, seo-content-brief,
seo-programmatic, seo-competitor-pages, seo-backlinks.

---

## Lane C — BUILD A NEW SITE

1. `seo-plan <business-type>` — site architecture and URL structure, decided
   before any code exists.
2. `seo-cluster <seed keyword>` — hub-and-spoke content architecture + internal
   link matrix. Feeds the nav.
3. **`web-design`** — the whole design job in one skill: intake, aesthetic research,
   component sourcing, direction, build, motion, Prove. **Just call this.** Its Step 0 sets
   a research depth from what the brief actually contains, so a vague Lane C brief gets
   researched and a settled one skips straight to building. It runs `ui-ux-pro-max`,
   `frontend-design`, `motion-design`, `clone-motion`, `design-dna` and the tier-3 motion
   skills internally; don't invoke any of them directly here.
4. **Build it** (inside `web-design` Phase 7 — it does this itself).
5. `seo-technical`, `seo-schema`, `seo-sitemap generate`, `seo-images`.
6. `seo-local` — if it's a local business (usually yes).
7. `seo-geo` — build citability in from the start rather than retrofitting.
8. `security-check` — pre-launch review. (`web-design`'s Prove phase already ran
   `web-design-guidelines` and the responsive/a11y/motion gates.)
9. `seo-drift baseline <url>` — establish the launch baseline immediately.
10. `seo-google` — submit sitemap to GSC.

**Skip in Lane C:** seo-audit (nothing to audit yet), seo-backlinks (no profile
yet), seo-drift compare, seo-page.

---

## Conditional triggers (any lane)

Only fire these when the condition is actually observed — not preemptively.

| Condition | Add |
|---|---|
| Products / cart / shop detected | `seo-ecommerce` |
| More than one language or region | `seo-hreflang` |
| Physical location or GBP in scope | `seo-local`, `seo-maps` |
| 50+ templated/generated pages | `seo-programmatic` |
| "X vs Y" or "alternatives to X" content | `seo-competitor-pages` |
| Need real volume / SERP / backlink numbers | `seo-dataforseo` |
| Need a full crawl or page discovery | `seo-firecrawl` — **not installed** in 2.2.4 core; it's an optional MCP extension. Use `seo-audit`'s crawl or ask the operator before adding it. |
| Need GSC / GA4 / CrUX field data | `seo-google` |
| Missing OG or hero imagery | `seo-image-gen` |
| Backlink profile or link gap asked about | `seo-backlinks` |
| Page ranks poorly despite good on-page | `seo-sxo` |
| Big decision with real tradeoffs surfaced | `llm-council` |
| Output is a spec, not a page | `finalize` → `harden` |

---

## Motion budget (Lanes B and C)

**Canonical version: `~/.claude/skills/web-design/references/motion.md`.** It has the full
tier reasoning, the 35-pattern vocabulary and the reduced-motion checklist. Read it before
adding any motion. Kept here so a standalone `/all-skills` run can't get it wrong:

**Order of reach, never skip up:** CSS transitions/keyframes → CSS scroll-driven
(`animation-timeline`) → GSAP → Lenis → **never WebGL/three.js/Vanta on a client site**
(~120 KB plus a continuous main-thread render loop, for a background).

**Non-negotiable:**
- **The installed `gsap-*` skills say to default to GSAP. Ignore that here.** They are the
  API authority *after* tiers 1–2 are ruled out, not the reason to skip to tier 3.
- Overlays (modal, menu, tooltip) are tier 1 now — `@starting-style` + `allow-discrete`,
  no JS. See `native-overlay` (#35).
- Durations and easing come from the **`motion-design`** skill, capped by the budget below.
- `prefers-reduced-motion` **gates JS too** — a CSS block does not stop a Lenis instance or
  a GSAP timeline. Read the query in JS and skip init.
- **Never animate the LCP element** or anything above the fold on entry.
- **Never gate content on motion.** Animate *from* visible. A crawler that gets `opacity: 0`
  sees an empty page.

| | Lane B / C — client site | Showcase (HB's own, mockups, demos) |
|---|---|---|
| Added JS | ≤ 15 KB gz | judgment call |
| Libraries | CSS first; GSAP if needed; Lenis rarely | anything, Vanta included |
| Above-fold motion | none | allowed |
| Reduced-motion | required | required |

**Verify, don't assume.** `node ~/.claude/skills/web-design/scripts/prove.js <url>` checks
the LCP, no-JS and reduced-motion rules mechanically. Then re-run Lighthouse mobile and
compare LCP/INP/CLS against the pre-change numbers — the Lane B step 1 `seo-drift` baseline
gives you that for free. A motion pass that costs Core Web Vitals gets reverted, not defended.

**Priority rule.** Motion never jumps the queue ahead of correctness. Dead links, wrong
NAP, stale hours, and WCAG-failing text are worth more to a local business than any
animation. Fix the P0s first.

## Voice (the "humanize text" step)

Run `humanizer` (blader/humanizer, installed 2026-08-04) for this step, then check its
output against this section. The skill catches the pattern-level tells better than a
freehand pass — it is Wikipedia's "Signs of AI writing" as a 33-rule rubric. What it
does **not** know is which strings pay our rent, so the protect list below is not
optional and is duplicated into its `SKILL.md` as a local override.

Apply to every piece of client-facing prose before it ships.

**Register — match the docx template** (`~/.claude/templates/client-report-docx.js`):
warm, plain-language, one idea per paragraph, a human sentence next to every
metric, before→after framing.

**Cut on sight:** delve, moreover, furthermore, "in today's landscape", "when it
comes to", "it's important to note", "navigate the world of", "unlock/elevate/
harness", "not just X, but Y", "isn't just about X — it's about Y".

**Structural tells to break:**
- Every paragraph the same length → vary hard. Two words is a paragraph.
- Three-item lists everywhere → make some two, some four.
- Every sentence subject-verb-object → open some with a clause or a fragment.
- Em-dash in consecutive sentences → keep one, rewrite the rest.
- Section that opens by restating its own header → delete that sentence.

**Specificity beats adjectives.** "Their burgers are incredibly popular" → "They
have 300+ reviews and people keep saying the same three words: best halal burger."

**Protect these strings verbatim — never paraphrase for flow:** target keywords,
brand names, NAP (name/address/phone), menu and service names, neighborhood and
city names, review quotes. Losing exact-match phrasing here costs real rankings.

> Do not route client copy through back-translation or detector-evasion tooling.
> It scrambles exactly the strings above and optimizes for a metric nobody
> measures on a client blog.

---

## Required closing report

Always end with this. No exceptions.

```
SKILLS RUN
  seo-content-brief   → target kw "halal burgers boston", 1,400 words, 6 sections
  last30days          → 3 usable quotes, 1 fresh angle
  seo-schema          → BlogPosting + author added
  humanizer           → 12 slop phrases cut; kw "halal burgers boston" 6 → 6, no headings changed

SKIPPED (and why)
  seo-ecommerce       → no store
  seo-hreflang        → single language
  seo-technical       → blog post, not a site change
  seo-drift           → no site change to baseline
  seo-backlinks       → not asked, no link work in scope
```
