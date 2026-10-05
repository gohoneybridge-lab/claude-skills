# DESIGN — <project>

_Written by `/web-design` on <date>. Lane: <build|redesign|component> · Depth: <full|light|none>._
_**Worked example: `examples/DESIGN.client-a.md`** — read it before filling this in.
Placeholders produce placeholder-shaped output; the example shows the texture to aim for._

_**The single source of truth for this build.** Research, options, decisions and the build plan
all live here. Do not create a second design file — see `references/direction.md`
§"Which file is the source of truth"._

## Brief

| | |
|---|---|
| **Subject** | <the concrete thing — not "restaurant site"> |
| **Audience** | <who, on what device> |
| **The page's single job** | <one sentence, one job> |
| **Client or showcase** | <sets the motion budget and the asset rules> |
| **Stack** | <html-tailwind · nextjs · squarespace · wordpress · …> |
| **Brand book** | <yes → it wins over everything below · no> |

## What they asked for

> "<quote them exactly — do not paraphrase into design vocabulary>"

---

## Directions considered

_Skip this section at NONE depth and say why (brand book, prior DESIGN.md)._

### 1. <named direction> — what they asked for
- **Looks like:** <palette, type, density, motion>
- **Buys:** <what this gets the business> · **Costs:** <what it gives up, or what's tired>
- **Evidence:** <refero entries, real sites, research findings>

### 2. <adjacent> — one step away
- **Looks like:** … · **Buys:** … · **Costs:** …

### 3. <adjacent> — one step the other way
- **Looks like:** … · **Buys:** … · **Costs:** …

### Chosen: <one>
Because <the reason, in terms of this business, not this aesthetic>.

### The category default we're avoiding
Every <industry> site looks like: <name it concretely — the palette, the font, the stock photo,
the layout>. We avoid it by: <the specific move>.

_This sentence is what Phase 9's taste gate (`npx impeccable detect`) will test. Make it
falsifiable._

---

## Tokens

| | |
|---|---|
| **Palette** | <hex + role for each. Text colours must clear 4.5:1 on their real backdrop> |
| **Display face** | <family, weights, where it's used> |
| **Body face** | <family, weights> |
| **Type scale** | <values> |
| **Spacing base** | <grid> |
| **Radius / elevation** | <values> |
| **Signature element** | <the one thing this site has that others don't> |

**Replaced from the generated system:** <what came out of `ui-ux-pro-max` and what you swapped
it for — the arbitration record. Floors and structure kept; palette, display face, style name
and signature replaced.>

**Impeccable waivers:** <rule name → why it's a defensible choice here, not an accident>

---

## Sourced parts

| Part | Source | Verdict | Tier | Licence | Note |
|---|---|---|---|---|---|
| <hero marquee> | magicui/marquee | TAKE | 1 | MIT | pure CSS after re-skin |
| <card hover> | aceternity/spotlight | PORT | 1 | unclear | → `motion.md` #17, ~15 lines CSS |
| <globe> | aceternity/github-globe | REJECT | 5 | unclear | WebGL on a client site — `prove.js` fails the build |

**Install commands for the TAKEs:**
```bash
# npx shadcn@latest add @cult-ui/<name>
```

**Port notes** — what each PORT becomes:
- <component> → <pattern # from motion.md, and the approach>

---

## Motion plan

| | |
|---|---|
| **Tier** | <1 · 2 · 3 — from `references/motion.md`> |
| **Patterns** | <#n names from motion.md / clone-motion vocabulary.md> |
| **Duration palette** | quick `<ms>` · standard `<ms>` · slow `<ms>` |
| **Signature easing** | `<one curve for ~80% of animations>` |
| **Tier-3 skill, if any** | `<framer-motion \| gsap-* \| none>` + the clause saying what it buys that CSS can't |
| **Added JS** | <KB gz, against ≤15 KB on a client site> |
| **Reduced motion** | <how each pattern collapses> |

---

## Open questions

Genuinely undecidable without the client — not merely unresearched.

- [ ] <question>
