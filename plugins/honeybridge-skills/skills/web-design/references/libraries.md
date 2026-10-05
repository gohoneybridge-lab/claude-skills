# UI source registry

Where Phase 4 shops. **This list is meant to grow** — add a row to the table and a
section below it. Every entry needs the same five facts, because Phase 5 cannot triage
without them: *what it is · how you install it · what it drags in · what it costs ·
what it's actually good at.*

Verified 2026-08-02. Licences and pricing change; re-check before a client deliverable.

## The one thing to know before using any of them

**Four of the five component libraries below are React + Tailwind + Motion.** Honey
Bridge client sites are mostly Squarespace, WordPress and `html-tailwind`. On those,
none of these can be installed at all — the value is the *visual idea*, which you port
to CSS. Plan for porting as the normal case, not the exception.

**And they ship your tier-3 dependency by default.** `motion` is ~30 KB+ gzipped against
a ≤15 KB client budget. One component is almost never worth it. See
`web-design/references/motion.md`.

| Source | Kind | Install | Deps | Licence |
|---|---|---|---|---|
| [Refero Styles](https://styles.refero.design/) | **Reference gallery, not components** | browse / export | — | free to browse; paid MCP tier |
| [Magic UI](https://magicui.design/) | shadcn registry | `pnpm dlx shadcn@latest add @magicui/<name>` | React, Tailwind | **MIT** (21.8k★) · Pro $199 one-time |
| [Cult UI](https://www.cult-ui.com/) | shadcn registry | `npx shadcn@latest add @cult-ui/<name>` | React, Tailwind, shadcn, Motion | **MIT** (6k★) · Pro paid |
| [SmoothUI](https://smoothui.dev/) | copy-paste + own CLI | `npx smoothui-cli add <name>` | React, Tailwind, Motion, Lucide, Popmotion | **MIT** (870★) |
| [Aceternity UI](https://ui.aceternity.com/components) | copy-paste | copy from the site | React, Next, Tailwind, Framer Motion | free tier OK · **All-Access is paid** |
| 21st.dev | MCP, already connected | `mcp__21st__search` | varies | varies per component |

### The broader set

**Licences verified 2026-08-02 via the GitHub API** — the two flagged below are the only ones
that need a decision before client work. Grouped by what they're actually for, because that is
how Phase 4 shops.

| Source | Kind | Stack | Licence | Why you'd reach for it |
|---|---|---|---|---|
| [shadcn/ui](https://ui.shadcn.com/) | copy-in registry | React + Tailwind | **MIT** 120k★ | **The base layer.** Not a look — unstyled, accessible primitives you skin with our tokens. Cult UI and Magic UI both extend it. Start here on any React build. |
| [Headless UI](https://headlessui.com/) | unstyled behaviour | React/Vue + Tailwind | **MIT** 29k★ | Accessible dialog/menu/combobox behaviour with **zero styling**. The most token-safe thing on this list: nothing to re-skin because nothing is skinned. |
| [Untitled UI React](https://www.untitledui.com/react/components) | components | React + Tailwind | MIT per their site; **the Figma kit is a separate paid product** | Large, coherent, professional set. Closest to a real design system rather than an effects catalogue. Free/paid split — check per component. |
| [DaisyUI](https://daisyui.com/) | Tailwind plugin | any Tailwind | **MIT** 42k★ | Semantic class names on top of Tailwind, framework-agnostic. **The one that works on non-React stacks**, which matters here more than anywhere. |
| [HeroUI](https://heroui.com/) | components | React + Tailwind | **Apache-2.0** 30k★ — the only non-MIT here; permissive but carries patent and notice terms, so keep the LICENSE file with any vendored copy | Formerly NextUI. Polished defaults, strong theming layer. |
| [Chakra UI](https://chakra-ui.com/) | component library | React | **MIT** 41k★ | Runtime-themed, a11y-first. **Not Tailwind** — brings its own styling system, so it is a stack commitment, not a component you paste. |
| [Mantine UI](https://ui.mantine.dev/) | prebuilt blocks | React + Mantine | **MIT** 32k★ | Same caveat as Chakra: its own system. Rich block catalogue if you're already on it. |
| [Float UI](https://floatui.com/) | blocks | React/Tailwind | ⚠️ **NOASSERTION** — GitHub cannot identify its licence (3.6k★). Do not ship in a client deliverable until someone reads it | Marketing-page blocks — heroes, pricing, CTAs. Landing-page shaped. |
| [Uiverse](https://uiverse.io/) | community CSS snippets | plain CSS | **MIT** 12k★ (uiverse-io/galaxy) — but per-submission, so check the individual snippet | Thousands of single elements, **community-submitted and wildly variable in quality**. Treat as an idea source, not a dependency. MIT overall, but check the individual submission. |
| [Forever Components](https://forever-components.vercel.app/infinite/) | effects | React | ⚠️ **no source repo found** — a demo site with no discoverable licence. Idea source only | Infinite-scroll and marquee-family effects. Narrow but good at its one thing. |
| [Figma Community UI kits](https://www.figma.com/community/ui-kits/components) | **design files, not code** | Figma | per-kit — check each | The odd one out — these are kits to *design* from, not components to install. Useful upstream of Phase 4, alongside Refero. |

**How this changes Phase 4 shopping.** The list is now long enough that browsing it is a
mistake. Go in with the part you need and pick the *narrowest* source that has it:

1. **Behaviour with no look** (dialog, menu, combobox) → Headless UI or shadcn. Nothing to
   re-skin, nothing to fight.
2. **A whole coherent system** → Untitled UI or shadcn as the base.
3. **A specific effect** → Magic UI, Cult UI, SmoothUI, Aceternity, Forever.
4. **Non-React stack** → DaisyUI, Uiverse, or port. This is most Honey Bridge client work.
5. **Chakra and Mantine are stack commitments, not components.** Do not pull one component
   from them into a project that isn't already on them.
6. **Two need a licence decision before client work:** Float UI (NOASSERTION) and Forever
   Components (no source repo). Both are fine as idea sources; neither ships as-is.

---

## Refero Styles — the one that isn't a component library

2,000+ design systems extracted from real product sites, searchable by feel, each with
palette, type, spacing and component notes. **This is the best Phase 2 source in the
list** — it answers "what does this vibe look like when a real company committed to it"
better than any amount of prose research.

- **Best for:** seeing a vibe executed at production scale before you commit to it.
- **Traps:** it exports a file called **`DESIGN.md`** — that filename is already
  contested by three tools on this machine (`web-design/references/direction.md`
  §"Which file is the source of truth"). **Always write it to `./extracted/`.** It also
  skews heavily SaaS/product, because that is what it scraped. A restaurant, a butcher
  or a trade business is not a dashboard, and copying dashboard restraint onto them
  reads as cold rather than premium.
- There is a paid MCP. Not connected here; browse it.

## Magic UI — the safe default

MIT, 21.8k stars, installs through the standard shadcn registry, and most of its
catalogue is CSS-expressible. Marquee, bento grids, text effects, borders and shine.

- **Best for:** the parts you need to *just work* — marquee, ticker, bento layout.
- **Ports well.** The marquee is a CSS keyframe animation; the shine and border effects
  are gradients. Most Magic UI components survive translation to plain CSS intact,
  which makes it the friendliest library for Squarespace/WordPress work.
- **Traps:** Pro is $199 one-time for 50+ components and 8 templates. Pro components are
  **not** MIT — never paste one into a client deliverable unless we've bought it. If a
  component isn't on the free docs site, assume it's Pro.

## Cult UI — the tasteful one

MIT, shadcn-compatible, "tastefully animated with Framer Motion". Texture cards, texture
buttons, dynamic islands, text effects.

- **Best for:** surfaces with material quality — the texture components are the standout
  and they're closer to a real design system than most of this list.
- **Traps:** requires adding the registry to `components.json` before the CLI works.
  Motion is a real dependency on the animated ones — check per component whether the
  animation is Motion or CSS before counting the cost. Pro tier exists (129+ blocks);
  same rule as Magic UI, Pro is not MIT.

## SmoothUI — the interaction one

MIT, React + Tailwind + Motion, shadcn-compatible, copy-paste via its own CLI. Small
catalogue, high polish, mostly *interactions* rather than layout.

- **Best for:** a single hero interaction on a showcase site. The Apple-Invites-style
  components are the draw.
- **Traps:** pulls **Motion *and* Popmotion** on some components — that's two animation
  runtimes for one screen. Almost never justifiable on a client site. Small library, so
  don't plan a page around it.

## Aceternity UI — free tier usable, pro tier not

The most visually striking of the five. Its real constraint is the motion budget, not the
licence — see below, in that order of importance.

- **Licence — settled 2026-08-02 (the operator's call):** the **free components are usable on client
  work**, same as the MIT three. No public source repo carries a licence file (the `aceternity`
  GitHub org's only public repo ships none), so this rests on them being publicly offered for
  copy-paste rather than on a licence we've read — if that ever matters for a specific client,
  read the site terms then.
  **The paid All-Access tier is a separate product and is not ours.** Do not paste a Pro
  component into any deliverable unless we hold the subscription. If a component is not on the
  free docs site, assume it's Pro. Same boundary as Magic UI Pro and Cult UI Pro.
- **Motion budget — this is the real blocker:** its signature components are exactly the
  banned tier — 3D Globe, 3D Marquee, Vortex, Beams, aurora and WebGL backgrounds. `prove.js`
  **fails the build** when it finds three.js on a client site, licence or no licence.
- **Best for:** the card, text and button effects on any stack, and as an *idea* source
  everywhere else. `spotlight` → `motion.md` #17. Aurora/Vortex → `gradient-mesh-drift` (#29),
  genuinely close for zero WebGL.
- **Ports:** the card, text and button effects port well to CSS. The 3D and canvas ones
  do not port — they get rejected, not ported.

## 21st.dev — already connected

MCP tools are live in this session: `mcp__21st__search`, `search_picker`,
`get_inspiration`, `search_logo`, `generate`. Licence varies per component — it's a
catalogue of many authors, so check the individual component before client use.
`search_logo` is the reliable way to get real brand SVGs.

---

## Adding a library

Add the row, then a section with the same shape. The five facts Phase 5 needs:

1. **Kind** — components you install, or a gallery you learn from? (Refero is the second
   kind, and mixing the two up wastes a phase.)
2. **Install** — the exact command, including any registry setup step.
3. **Deps** — React? Motion? A second animation runtime? Roughly how many KB gzipped?
4. **Licence** — MIT, paid, or unstated. Note the free/Pro boundary explicitly; every
   library here monetises by putting the best components behind it.
5. **Ports well / doesn't** — the single most useful field for Honey Bridge, because most
   client sites can't install any of it.
