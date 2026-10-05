# Macrostructure — pick the page shape before you write code

**Added 2026-09-09 after a client called our work "very generic AI".** He was right, and the
diagnosis was not any single element. Research brief:
`~/Documents/DeepResearch/ai-looking-website-tells-extreme.md`.

## The finding

Every Honey Bridge site — `client-d-site`, `client-c-site`, `client-b`,
`client-e`, `client-f-site` — shipped the same page shape: sticky nav with wordmark
left and links right, hero with type on one side and a photo on the other, an info strip under
the hero, then alternating text-and-image sections on a warm ground. Five different clients,
one skeleton.

Each of those pages passed every gate we own. That is the point: **the gates measure elements,
and the tell is the skeleton.** A page can have a hand-measured palette, real photography, real
copy and a clean `prove.js` run, and still read as generated, because a reader recognises the
shape before they read a word.

Hallmark (28.3K stars, MIT, read from source 2026-09-09) names this exactly:

> **Default-attractor sameness.** Two consecutive outputs in the same project use the same
> macrostructure... The page looks redesigned only because copy changed.

And it names our nav and footer specifically as the two most recognisable AI fingerprints,
because *"the shape is genre-blind: it lands the same on a wedding photographer's portfolio, a
bakery, a B2B SaaS, and a manifesto."*

## The rule (mandatory, Phase 6)

**1 · Name the macrostructure before writing code**, in `DESIGN.md`, in a section called
`Macrostructure`. One line: the name, and why this client gets this shape.

**2 · Stamp it in the CSS**, first line of `globals.css`:

```css
/* Honey Bridge · macrostructure: Photographic · client-f-fusion · 2026-09-09 */
```

**3 · Never reuse the previous client's shape.** Before picking, grep the other client repos:

```bash
grep -rh "macrostructure:" ~/*/app/globals.css ~/*/src/app/globals.css 2>/dev/null | sort -u
```

Whatever comes back is excluded. Two consecutive builds sharing a macrostructure is a failed
Phase 6, the same way a red `prove.js` gate is a failed Phase 10.

**4 · Nav and footer are part of the shape, not furniture.** Pick them alongside the
macrostructure. A bakery does not get the same nav as a SaaS product. If the nav could belong
to any of our five clients, it belongs to none of them.

## The menu

Twenty-one named shapes, from Hallmark's `references/macrostructures.md`. The ones that
actually fit a small local business are marked ★.

| # | Shape | What it is |
|---|---|---|
| 01 | Bento Grid | Modular blocks of varying sizes. Rhythm from size variation, not card uniformity. |
| 02 ★ | Long Document | Reads like a memo or a letter. Continuous prose, inline heads, no marketing structure. |
| 03 ★ | Marquee Hero | The hero IS the page above the fold. One statement or visual fills the viewport. Below the fold the page becomes something else. |
| 04 | Stat-Led | The hero is a giant number. Everything after supports or qualifies it. |
| 05 | Workbench | Product screenshots in frames are the primary content. |
| 06 ★ | Conversational FAQ | Bold questions, brief answers. Reads like an honest interview. |
| 07 | Manifesto | Polemical large type. Tells you what to believe before what to buy. |
| 08 ★ | Photographic | One huge image dominates each fold. Text is small annotation, not headline. *Look* before *read*. |
| 09 ★ | Quote-Led | The hero is a pull-quote with attribution. Leads with borrowed credibility. |
| 10 | Specimen | Numbered left-margin labels, huge serif, asymmetric spans. **Not a default** — editorial briefs only. |
| 11 ★ | Catalogue | Uniform grid of variations of one thing. A visual index of inventory. |
| 12 ★ | Letter | First-person, intimate, opens with a greeting. No buttons in the fold. |
| 13 | Index-First | The page IS a list of links. |
| 14 ★ | Narrative Workflow | Numbered stages telling the story of use over time. Genuinely ordered. |
| 15 | Split Studio | Diptych. Every block divides the screen, alternating direction. |
| 16 | Feature Stack | Sticky left pane, scroll-synced right pane. |
| 17 | Type Specimen | The typeface is the design. |
| 18 | Portfolio Grid | Filterable cards of work. |
| 19 | Map / Diagram | One large spatial diagram organises the page. |
| 20 | Ecosystem Index | Multiple discovery surfaces. |
| 21 | Component Playground | Interactive code-and-preview blocks. |

**What we have been building, unnamed, five times, is roughly 15 Split Studio with a stat strip
bolted on.** It is a fine shape. It is not five fine shapes.

## Restaurant-specific note

The SaaS page sequence in Hallmark's file (hero → logo wall → features → testimonials → pricing
→ FAQ → CTA strip → footer) **does not apply** to our work, and the file says so itself: *"A
bakery does not need a pricing tier comparison."* Do not import it.

For a restaurant, the shapes that carry real weight are **Photographic** (the food is the
argument), **Marquee Hero** (one dish, full bleed, and the page becomes a menu below),
**Catalogue** (the menu IS the site), **Quote-Led** (when the reviews are the strongest asset)
and **Letter** (when the owner's story is). Pick on which of those the client actually has.

## Where this sits in the pipeline

Phase 6, before `DESIGN.md` is written and before any build code. It comes *after* Phase 3's
direction research (which decides the feel) and *before* Phase 8 (which builds it). The
`impeccable detect` gate at Phase 10 will not catch a repeated macrostructure — it audits one
page at a time and has no memory of the last client. **This rule is the only thing standing
between us and shipping the same site six times.**
