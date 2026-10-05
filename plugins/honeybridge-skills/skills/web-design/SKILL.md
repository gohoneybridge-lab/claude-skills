---
name: web-design
description: >
  The whole web design job in one pipeline — catch what you want, research it,
  source the parts, build it, and prove it holds up. Use when the user says
  "design a site", "build a landing page", "redesign this", "make this look
  better", "I want it to feel like…", "make it feel premium/warm/editorial",
  "I don't know what I want it to look like", "find me a style", "find
  components for this", "design the UI", "audit this website", "what's wrong
  with this site", "add animations", "add scroll animations", "make it feel
  alive", "hero animation", "cursor effects", "page transitions", "why does
  this look AI-generated", "make it responsive", "check my design", or hands
  over a vibe instead of a spec. Also the design half of /all-skills Lanes B
  and C. Do NOT use for non-web UI (Roblox, native mobile without a web
  target) or for pure SEO work with no design change.
user-invokable: true
argument-hint: "[build|redesign|component|review|audit] [url, path, or what you want]"
metadata:
  author: the operator Shaikh
  version: "3.0.0"
---

# /web-design — catch it → search it → decide → make it

Four acts, twelve phases. Each phase is a paragraph here and a file in `references/` —
**read the reference before running the phase**, not instead of it.

Several skills do fragments of this and none close the loop. `ui-ux-pro-max` picks a system
from a catalog. `frontend-design` argues against catalogs. `web-design-guidelines` reviews and
never builds. This sequences them, settles the fight between the first two, and adds what none
of them have: **proof the built page holds up.**

Four gates at the end, orthogonal — a page can pass any one and fail the others:

- **`scripts/prove.js`** — does it *work*? Responsive, readable, keyboard-usable, visible without JS, motion-safe. Also checks the build against `DESIGN.md`'s own tokens.
- **`npx impeccable detect`** — does it *look generated*? 60 rules for the defaults agents reach for by reflex.
- **The audit list** (redesign only) — did we fix what we said was broken?
- **`references/engineering-discipline.md`** — can it *survive production*? Tested, enforced in CI, no leaked keys, rollback-able. A page can pass the other three and still be a liability.

## Hard rules

1. **Nothing is invented.** Every fact, number, logo, testimonial and stat traces to `CONTEXT.md`. If proof doesn't exist, that is a finding to report, not a gap to fill. See `references/intake.md`.
2. **Copy is approved before code.** `COPY.md` is signed off, then built verbatim.
3. **Nothing ships without the Prove act — all four gates.** A waived gate is named and justified in the closing report.
4. **Look at what you built before showing it.** Read the screenshots.
5. **Identity comes from the brief, floors come from the data.** Never let a CSV pick the palette.
6. **Motion is a budget**, not a free action. `references/motion.md`.
7. **Research at least two adjacent directions.** A direction with no alternatives is a default wearing a costume.
7b. **Never ship the same macrostructure twice in a row.** `references/macrostructure.md`. This is the one tell no per-page gate can catch, because every gate we own audits a single page and has no memory of the last client.
8. **Ask once, in one batch, at the start.** Then work.
9. **Three files, one job each** — `CONTEXT.md` facts, `COPY.md` words, `DESIGN.md` skin. Don't invent a fourth.
10. **Always end with the closing report.**
11. **HARD STOP — engineering discipline.** A build is not done until every row in
    `references/engineering-discipline.md` is `done`, `waived: <reason>`, or
    `blocked: <what is needed>`. Silence is not a waiver, and "it's only a marketing site" is a
    risk claim that must be written down so it can be wrong out loud. Read that file at Phase 10
    and report the table at Phase 12. **Do not report a build as finished with rows unaccounted
    for** — a row you never considered is a failed gate, not a blank.

## Step 0 — lane and depth

| Signal | Lane |
|---|---|
| "design/build a site", "landing page", nothing exists yet | **BUILD** |
| "redesign", "make this look better", a live URL or existing repo | **REDESIGN** |
| One element — "design a pricing table", "build the nav" | **COMPONENT** |
| "check my design", "review the UI", "is this accessible" | **REVIEW** |
| "audit this site", "what's wrong with it" — no build asked for | **AUDIT** |

| What you were given | Depth |
|---|---|
| Only a feeling — "premium", "warm" — or nothing | **FULL** — Phase 3 runs `/deep-research` |
| A brand book, an existing `DESIGN.md`, prior client work | **NONE** — the direction is decided and wins |
| Concrete visual instructions ("navy and cream, big serif") | **LIGHT** — confirm and cliché-check |
| A reference URL or screenshot to match | **LIGHT** — the reference is the direction |

**AUDIT** runs Phase 2 only. **REVIEW** runs Phases 10–12. **COMPONENT** runs everything at
element scope and never at FULL depth. State lane and depth in one line, then proceed.

---

# ACT I — CATCH

**Phase 1 · Intake → `CONTEXT.md`.** Read `references/intake.md`. Ask at most three questions
in **one** `AskUserQuestion` call — what is it, what should it feel like, what does it have to
survive (client or showcase, and the stack). Then interview for the facts: services, proof,
numbers, what the visitor should do, what must never appear. Show the fact list and get a yes.
Pin audience, page job and stack yourself and state your choices. Check memory and the working
directory for a brand book or prior work before inventing anything.

**Phase 2 · Audit what exists** *(REDESIGN and AUDIT lanes)*. Read `references/audit.md`. Two
passes: a deliberately messy `audit-raw.md` with 60–120 findings, then a condensed client-ready
report that opens with what's working. This is the before-half of the client report and the
argument for the project. **Do not let the audit do your thinking** — you choose which
opportunities the redesign answers, and those become requirements in `CONTEXT.md`.

---

# ACT II — SEARCH

**Phase 3 · Research the direction and its neighbours** *(skip at NONE depth)*. Read
`references/direction.md`. At FULL depth run `/deep-research` on the aesthetic, scoped tightly,
once per project. Three axes always: the **named direction** (what defines it now, what's its
cliché), **two adjacents** (what would each buy this business), and the **category default**
(what every site in this industry already looks like — you cannot avoid it without naming it).
Sources: `styles.refero.design` for how a direction looks when a real company committed to it,
plus `python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<subject> <industry>" --design-system`.
Load `frontend-design`; it is the direction authority.

**Phase 4 · Extract what already exists** *(REDESIGN, or when there's a reference to match)*.
Read `references/sourcing.md` §5. `npx skillui --url <url> --out ./extracted --mode ultra --no-skill` —
note its traps: it writes a `CLAUDE.md`, and without `--no-skill` it installs a skill into `~/.claude/skills/`. Motion of a reference site → `clone-motion`. An
image rather than a URL → `design-dna`, Phase 2 only.

**Phase 5 · Source and triage the parts.** Read `references/libraries.md` — 16 sources with a
"pick the narrowest one that has it" rule. Work from the direction to the parts, never browse
first. Every candidate gets **TAKE / PORT / REJECT** with a tier and a licence:

- **Not React → almost everything ports.** Most client sites can't install any of it, and the visual idea usually survives translation to CSS.
- **Client site + WebGL → always REJECT.** `prove.js` fails the build on three.js.
- **Adding `motion` for one component is a bad trade** against a ≤15 KB budget.
- **Paid-tier components are out** unless we hold that subscription.
- Record which tier-3 skill each TAKE implies (`framer-motion` / `gsap-*`) — don't run them yet.

Then check the set looks like it came from one place. Five components from five libraries is
five design systems in a trench coat.

---

# ACT III — DECIDE

**Phase 6 · Macrostructure, then `DESIGN.md`.** **Read `references/macrostructure.md` and pick
the page shape by name BEFORE anything else in this phase.** A client called our work "very
generic AI" on 2026-09-09 and was right: five Honey Bridge sites shipped the same skeleton, and
every one of them passed every gate we own, because the gates audit elements and the tell is the
shape. Grep the other client repos for the `macrostructure:` stamp, exclude what comes back,
name your pick in `DESIGN.md`, and stamp it in `globals.css`. Nav and footer are part of the
shape, not furniture. Then: template `templates/DESIGN.md`, worked example:
`examples/DESIGN.client-a.md`. Apply the **arbitration rule** — keep the generated system's
floors, structure and stack mechanics; replace its palette, display face, style name and
signature with choices derived from the subject. When merging reference systems: **our brand
wins colours and fonts, the references win layout and feel.** Run the **default test** — would
this output appear for any other business in this category? Then check mechanically before any
build code: `npx impeccable detect --json <file>`. Every hit is fixed or waived with a reason.

**Phase 7 · `COPY.md`.** Read `references/intake.md` §COPY.md. Interview page by page for what
each must say, the proof from `CONTEXT.md` that belongs there, the next action, and what it
should rank for. Draft every headline, body block, button label, page title and meta
description into one file. **Show it and get approval before building.** Work search terms in
naturally; a sentence you wouldn't say out loud has failed regardless of keyword density.

---

# ACT IV — MAKE

**Wireframe first if the layout is unsettled.** A low-fidelity pass (claude.ai/design's
wireframe mode, or plain boxes) is worth it precisely *because* it doesn't look finished —
a hi-fi draft anchors everything downstream to its own styling, while a wireframe hands you
structure the build can then dress in our tokens. Skip it when the structure is obvious.

**Phase 8 · Build, section by section, QA'ing each.** Follow `DESIGN.md` exactly and use
`COPY.md` verbatim. Install the TAKEs and re-skin to our tokens; implement the PORTs at their
recorded tier. **A pasted component is a structural donor only** — its skeleton, our tokens,
our words; put that rule in the project `CLAUDE.md` (text in `references/intake.md`).

**QA each section as you finish it, not at the end.** Screenshot it, compare against
`DESIGN.md`, fix the drift before moving on. Drift compounds: five sections each slightly off
is a page that reads as AI-built even though every part passed on its own. Build to the quality
floor without announcing it — responsive to 375px, visible focus, reduced motion respected,
real alt text, labelled controls.

**Phase 9 · Motion.** Read `references/motion.md` for policy and `references/motion-recipes.md`
for the runnable code — 19 patterns, all three-gate tested via
`node scripts/test-patterns.js`. Respect the tier order, then `motion-design` for the numbers
(one duration palette, one signature easing, recorded in `DESIGN.md`), then `framer-motion` or
`gsap-*` only for the tier-3 items Phase 5 justified.

**Phase 10 · Prove.**
```bash
node ~/.claude/skills/web-design/scripts/prove.js <url-or-file> --shots --out=./prove-out
npx impeccable detect --json <dir-or-url>
```
`prove.js` gates, any of which fails the run: viewport meta · responsive at 375/768/1024/1440 ·
touch targets under 24×24 · contrast against the composited backdrop · alt text, form labels,
icon buttons · focus visible · LCP not animated · motion budget · content not gated on JS ·
reduced motion · **DESIGN.md token conformance** (colours and faces on the page that aren't in
the declared system — catches the build drifting from its own decisions).

Then: read the screenshots and critique them · `mcp__chrome-devtools__lighthouse_audit` mobile
throttled · interactive states via `npx @playwright/cli@latest` · `web-design-guidelines` ·
`security-check` if we own the codebase · **and walk the Phase 2 audit list**, confirming each
opportunity we committed to is actually resolved.

**Then the fourth gate.** Read `references/engineering-discipline.md` and walk all 24 rows
against the repo, running the check command in each row rather than recalling the answer. Tier 1
rows 1-12 are the floor on anything that ships; rows 13-24 apply to anything client-facing.
Record each as `done` / `waived: <reason>` / `blocked: <what is needed>`. Per hard rule 11 this
gate blocks the run — an unaccounted row fails it.

**Phase 11 · Fix and re-prove.** A gate that stays red is a stated exception with a reason,
never a quiet drop.

**Phase 12 · Closing report.** Lane and depth · what was caught · the three directions and why
this one · the category default avoided · parts taken/ported/rejected · motion tier and numbers
· every gate result · the audit items closed · what was skipped and why · **the engineering
discipline table, all 24 rows, each `done` / `waived` / `blocked`** (hard rule 11 — the report is
incomplete without it, and a `waived` row states its reason inline). For a client
engagement, this is also the pitch: the story from *what was wrong* to *what we did about it*,
which is the part that justifies the work. Format in
`~/.claude/templates/client-report-docx.js`.

---

## Relationship to other skills

- **`/all-skills`** owns SEO routing; its Lane B step 8 and Lane C step 3 call this.
- **Loaded inside this pipeline, never separately:** `frontend-design` (Phase 3), `ui-ux-pro-max` (Phases 3 and 5 — data layer, not taste layer), `clone-motion` and `design-dna` (Phase 4), `motion-design` (Phase 9), `framer-motion` and `gsap-*` (Phase 9, tier 3 only), `web-design-guidelines` and `security-check` (Phase 10).
- **Vendored-skill warning:** `motion-design`, `framer-motion` and `gsap-*` are third-party (`~/.claude/skills/VENDORED.md`) and two carry defaults that contradict our motion budget. `references/motion.md` overrules them.
- **`/harden`** and **`/prove-it`** are downstream and feed on Phase 10 evidence.

## Files

| Path | What |
|---|---|
| `references/intake.md` | CONTEXT.md and COPY.md — the anti-invention rules |
| `references/audit.md` | the opportunity audit, two passes |
| `references/direction.md` | arbitration, the default test, which file is source of truth |
| `references/sourcing.md` | extraction tools and their traps |
| `references/libraries.md` | 16 component sources, licences, what ports |
| `references/macrostructure.md` | the 21 page shapes, and the no-repeat rule (Phase 6) |
| `references/motion.md` | motion policy, budget, 35 patterns |
| `references/motion-recipes.md` | the runnable code — and the test suite |
| `templates/DESIGN.md` · `examples/DESIGN.client-a.md` | blank and filled |
| `scripts/prove.js` | the build gate |
| `scripts/test-patterns.js` | runs every motion recipe against three gates |

## External tools

`npx impeccable detect` (Phases 6 and 10) · `npx @playwright/cli@latest` (Phase 10) ·
`npx skillui` (Phase 4). No global install, no API keys. The full Impeccable skill ships a
global `PostToolUse` + `Stop` hook and is deliberately **not** installed.

## Setup (once)

```bash
cd ~/.claude/skills/web-design && npm install
```
Playwright is pinned to **1.61.1** to share the Chromium build installed for `clone-motion`.
1.62.0 wants chromium build 1234; the cache has 1228 and it crashes on launch.
