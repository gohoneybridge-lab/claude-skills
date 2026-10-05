# DESIGN — client-a.example

_Written by `/web-design` on 2026-08-02. Lane: redesign · Depth: light._
_**Worked example.** Blank version: `templates/DESIGN.md`._

> **Read this before filling the template.** The template is placeholders, and placeholders
> produce placeholder-shaped output — "modern and clean", "primary/secondary/accent", "TAKE".
> The point of this file is the *texture*: reasons that name the business rather than the
> aesthetic, a rejection that says what it cost, a category default specific enough to fail.
>
> Tokens here are real, extracted from the live site on 2026-08-02 via `skillui`. The
> directions and the reasoning are illustrative — this documents the shape of a good
> `DESIGN.md`, not a decision anyone signed off on.

## Brief

| | |
|---|---|
| **Subject** | Smash-burger shop in Boston. Live Next.js 15 site on Vercel. Orders happen in person and by phone; the site's job is to get someone to show up or call. |
| **Audience** | Mostly phones, mostly people already nearby deciding where to eat in the next twenty minutes. A minority arriving from search with "best smash burger boston". |
| **The page's single job** | Make a hungry person within two miles decide on this place and get moving. |
| **Client or showcase** | **Client** — ≤15 KB motion budget, no WebGL, nothing above the fold animates. |
| **Stack** | Next.js 15 · Tailwind. Registry components installable, which is the exception not the rule for our clients. |
| **Brand book** | None. The site's own CSS variables (`--client-a-*`) are the closest thing and are treated as brand. |

## What they asked for

> "Make it look less like a template. It looks like every other burger place — I want it to
> look like *us*, we've got a proper kitchen not a franchise."

## Directions considered

### 1. Dark premium — what the site already does
- **Looks like:** near-black surfaces, one hot red accent, big photography, tight type.
- **Buys:** the food photography pops against near-black; it's what the site already is, so it's the cheapest to execute. · **Costs:** it is also what *every* modern burger site does. Dark + red + a big hero photo is the category default, not a direction.
- **Evidence:** current site's own extracted palette; Refero's food-and-drink cluster skews this way heavily.

### 2. Kitchen-materials — the adjacent we recommend
- **Looks like:** stainless and griddle-steel greys, paper-bag kraft, one red kept only for the CTA. Type set like a printed order ticket. Photography shot *at the pass* rather than styled.
- **Buys:** the client's own argument — "a proper kitchen, not a franchise" — becomes the visual argument. Materials are specific to this shop in a way a colour scheme never is. · **Costs:** demands real photography. Fails badly on stock imagery.
- **Evidence:** the existing `--client-a-red-text` `#e84b52` already reads warmer than a franchise red; it survives this direction unchanged.

### 3. Neighbourhood-sign — the other adjacent
- **Looks like:** hand-painted signwriting, condensed caps, cream and oxblood, visible texture.
- **Buys:** enormous personality, very hard to mistake for anyone else. · **Costs:** legibility on a phone at arm's length, and it reads *older* than a smash-burger shop actually is. Risks nostalgia the business hasn't earned.

### Chosen: kitchen-materials
Because the client's own sentence was about the kitchen, and it is the only one of the three
that a competitor two streets away couldn't adopt next week. Direction 1 is the category
default and Direction 3 is a costume.

### The category default we're avoiding
Every smash-burger site looks like: near-black background, one saturated red, a full-bleed
hero photo of a burger with a cheese pull, condensed uppercase display type, and a sticky
"ORDER NOW" bar in the accent colour.

We avoid it by: **no hero food photo above the fold** — the hero is the pass, in materials, with
the burger appearing at human scale further down; and by demoting red from a surface colour to
CTA-only.

_This is what `npx impeccable detect` gets tested against in Phase 10._

## Tokens

| | |
|---|---|
| **Palette** | `#1a1a1a` page · `#0d0d0d` raised surface · `#f4f4f5` primary text · `#bbbbbb` muted · `#555555` border · `#a01419` CTA only · `#e21e26` error only |
| **Display face** | Inter, 600/700 — headings and numbers |
| **Body face** | Playfair Display, 400 — running copy _(inherited from the live site; see waiver)_ |
| **Type scale** | 14 / 16 / 20 / 28 / 40 / 56 |
| **Spacing base** | 4px grid — 2, 4, 6, 8, 10, 12, 14, 16 |
| **Radius / elevation** | 8px on interactive, 12px on cards. One shadow level; depth comes from surface, not blur. |
| **Signature element** | The order ticket — menu items set as a printed kitchen ticket, monospaced numbers, dotted leader to the price. |

**Replaced from the generated system:** `ui-ux-pro-max` returned Playfair Display SC with
`#DC2626`/`#CA8A04` for "local restaurant warm" — the exact templated default the arbitration
rule exists for. Kept its spacing floors, type-scale ratio and Next.js stack mechanics.
Replaced palette and display face with the shop's own extracted values.

**Impeccable waivers:** `serif-body-face` — Playfair as body copy is unusual and would normally
be a hit, but it is the live site's existing face and the redesign is not a rebrand. Recorded,
not accidental. Revisit if a rebrand is ever scoped.

## Sourced parts

| Part | Source | Verdict | Tier | Licence | Note |
|---|---|---|---|---|---|
| Menu ticket rows | hand-built | — | 1 | — | The signature element. Not sourced; nobody sells this. |
| Hours / status pill | Headless UI | TAKE | 1 | MIT | Behaviour only, zero styling to fight |
| Testimonial marquee | magicui/marquee | TAKE | 1 | MIT | Pure CSS keyframe after re-skin — no Motion needed |
| Card hover on menu sections | aceternity/spotlight | PORT | 1 | free tier | → `motion.md` #17, ~15 lines of CSS |
| Photo grid reveal | cult-ui/texture-card | PORT | 1–2 | MIT | Take the texture treatment, drop the Motion wrapper |
| Hero background | aceternity/vortex | REJECT | 5 | free tier | WebGL on a client site. `prove.js` fails the build on three.js — and it would bury the pass photography this direction is built on. |
| Apple-invites hero | smoothui/apple-invites | REJECT | 3 | MIT | Pulls Motion *and* Popmotion — two animation runtimes, ~40 KB, for one screen on a ≤15 KB budget. |

**Install for the TAKEs** (Phase 8, after `DESIGN.md` is signed off):
```bash
npx shadcn@latest add @magicui/marquee
npm i @headlessui/react
```

**Port notes:**
- `aceternity/spotlight` → `motion.md` #17: `--mx`/`--my` custom properties set from one delegated `pointermove` on the grid, radial gradient painted in `::before`. Gradient must stay subtle enough that `#f4f4f5` on `#0d0d0d` still clears 4.5:1 at every pointer position.
- `cult-ui/texture-card` → keep the noise overlay and border treatment as plain CSS; drop the entrance animation entirely.

## Motion plan

| | |
|---|---|
| **Tier** | 1–2. Nothing needs a JS animation library after the ports. |
| **Patterns** | `spotlight` (#17) on menu cards · `marquee` (#9) for reviews · `press-state` (#31) on every control · `native-overlay` (#35) for the hours dialog · `scroll-progress` (#20) **rejected** — no long-form content to track |
| **Duration palette** | quick 130ms · standard 240ms · slow 400ms |
| **Signature easing** | `cubic-bezier(.2,.7,.3,1)` — decelerating, no overshoot. Overshoot reads playful; this direction is competent. |
| **Tier-3 skill** | none |
| **Added JS** | ~0 KB. The two TAKEs are CSS after re-skin; Headless UI ships with the app either way. |
| **Reduced motion** | spotlight → static gradient at rest · marquee → paused, all logos visible · press-state → colour only · native-overlay → 1ms discrete transition, verified |

## Open questions

- [ ] Real photography at the pass — does it exist, or does it need shooting? The direction fails on stock and we do not generate depictions of a real business.
- [ ] Is Playfair as body copy a deliberate brand choice or an accident nobody revisited? Changes whether the waiver above stands.
