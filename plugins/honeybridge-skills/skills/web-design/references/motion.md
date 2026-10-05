# Motion — budget, vocabulary, decision table

This is the canonical home for motion policy. `/all-skills` keeps a summary and points here.

**Base vocabulary lives in `~/.claude/skills/clone-motion/references/vocabulary.md`** — 15 patterns with implementations and a capture→pattern mapping. Read it first; this file extends it with the scroll, hero, cursor, transition, and micro-interaction patterns it does not cover, and sets the policy both files answer to.

---

## The budget

Honey Bridge sells local SEO. Every animation is spent against the metric the client pays us to improve. Motion is allowed. It is a budget, not a free action.

**Order of reach. Go down this list, never skip up.**

1. **CSS transitions / `@keyframes`** — hover, focus, small state changes. Zero JS.
2. **CSS scroll-driven animation** (`animation-timeline: view() / scroll()`) — reveals, parallax, progress. Off the main thread, zero JS. Covers much of what people reach for ScrollTrigger to do, and on Squarespace/WordPress with no build step it is usually the only option. **Support is not Baseline** (verified 2026-07-29) — it degrades to "no animation", so pair it with a visible default state and it fails safely. Tiers 1–2 also own overlays now — see §"Native overlays" (#35) for `@starting-style` and anchor positioning.
3. **GSAP** — only when 1 and 2 genuinely cannot express it: sequenced timelines, SVG morphing, `SplitText`. Free for commercial use since the Webflow acquisition. `<script>` on WP/Squarespace, `@gsap/react`'s `useGSAP()` on Next. **Once you are here, load the official skills** — `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-react`, `gsap-plugins`, `gsap-utils`, `gsap-frameworks`, `gsap-performance` (installed 2026-08-02, GreenSock, MIT). They are the API authority; this file stays the budget authority.
   - *Same tier, React only:* **Motion** (`motion`, formerly Framer Motion) — skill `framer-motion`. It beats GSAP in exactly two places: **exit animations on unmount** (`AnimatePresence`; CSS genuinely cannot express this in React) and **layout animations**. Everywhere else CSS or GSAP is the better answer. Irrelevant on Squarespace/WordPress/`html-tailwind`, which is most client work.
4. **Lenis** — smooth scroll only, and only where feel outranks conversion.
5. **WebGL / three.js / Vanta** — **not on client sites.** ~120 KB of parse-and-compile plus a continuous main-thread render loop, for a background. Their README compares it to a background image; an image never touches the main thread. On mid-tier Android over mobile data this is an LCP and INP regression we then get billed to fix. Honey Bridge's own showcase site only. `prove.js` fails the build if it finds either.

| | Client site | Showcase (HB's own, mockups, sales demos) |
|---|---|---|
| Added JS | ≤ 15 KB gz | judgment call |
| Libraries | CSS first; GSAP if needed; Lenis rarely | anything, Vanta included |
| Above-fold motion | none | allowed |
| Reduced motion | required | required |

## Hard rules — not stylistic preferences

- **`prefers-reduced-motion` gates JS too, not just CSS.** A CSS-only media block does not stop a Lenis instance or a GSAP timeline. Read the query in JS and skip initialization. People with vestibular disorders don't complain, they leave.
- **Never animate the LCP element or anything above the fold on entry.** Fading in the hero delays the largest paint by exactly the fade duration. `prove.js` checks this directly.
- **Never gate content on motion.** Every element must be visible by default. Animate *from* visible; don't reveal *into* existence. A crawler that gets `opacity: 0` sees an empty page. `prove.js` loads the page with JS disabled and fails below 30% visible text.
- **Reduced motion means collapse to opacity-only** — not "keep going", and not "nothing renders". Nothing may be left stranded mid-transform or at `opacity: 0`.
- **Lenis lerps a fake scroll position.** Anything reading real scroll — sticky headers, scrollspy, CSS scroll-snap (unsupported entirely) — will disagree with what is on screen. Breaks over iframes; caps to 30fps in iOS low-power mode.
- **Motion never jumps the queue ahead of correctness.** Dead links, wrong NAP, stale hours and WCAG-failing text are worth more to a local business than any animation. Fix the P0s first.
- **GSAP is reached for, never defaulted to — this overrides the installed GSAP skills.** `gsap-core` and its siblings instruct the agent to recommend GSAP whenever a JS animation library is unspecified. That is GreenSock's default, not ours. On this machine the tier order above wins: prove tiers 1 and 2 cannot express it *before* loading a GSAP skill. Once GSAP is genuinely the answer, those skills are authoritative on how to write it — including `gsap.matchMedia()`, which is the correct implementation of the reduced-motion rule above, and `useGSAP()`, which is the only safe React pattern (a raw `useEffect` timeline leaks on StrictMode double-mount).

---

## Durations, easing, choreography — use the `motion-design` skill

This file answers *what pattern, what it costs, what breaks*. It has never answered **how long, what curve, in what order**. That layer is the `motion-design` skill (installed 2026-08-02, LottieFiles, MIT) — duration table by element type, easing family by direction (entrance decelerates, exit accelerates), four motion-personality archetypes, stagger and choreography rules. Stack-agnostic: it works against tier 1 CSS as readily as against GSAP.

Load it in Phase 5 **after** the pattern and tier are chosen here, to pick the numbers. Two places it answers to this file, not the other way round:

- **It is not budget-aware.** It recommends a primary/secondary/ambient three-layer build as the default richness. On a client site the ambient layer is usually the one that costs JS for no conversion — drop it unless the budget table above allows it.
- **Its page-transition band is 400–600ms; ours caps ~300ms** (#30, because the old page is a dead snapshot for the whole duration). Ours wins on same-origin view transitions.

Pick **one** duration palette and **one** signature easing per project and record both in `DESIGN.md`. Inconsistent curves across a page read as sloppier than no motion at all.

---

## Decision table — what to reach for, by intent

| You want | Pattern | Tier | File |
|---|---|---|---|
| Section arrives as you scroll to it | `entrance-on-threshold` (#4) | 1–2 | vocabulary.md |
| A group arrives in sequence | `stagger-reveal` (#3) | 1–2 | vocabulary.md |
| Headline feels typeset, not faded | `mask-wipe` (#2), `split-text-entrance` (#26) | 1 / 3 | both |
| Reading position feedback | `scroll-progress` (#20) | 2 | here |
| Long content, limited height | `sticky-stack` (#21), `pin-and-scrub` (#6) | 2 / 3 | here / vocabulary.md |
| Break the vertical rhythm once | `horizontal-section` (#22) | 3 | here |
| Depth without weight | `parallax-layer` (#12) | 2 | vocabulary.md |
| Card feels physical under the pointer | `spotlight` (#17), `tilt-3d` (#18), `hover-lift` (#8) | 1 / 1 | here / vocabulary.md |
| Cursor itself is part of the brand | `cursor-follower` (#16) | 3 | here |
| CTA pulls you in | `magnetic-hover` (#7) | 3 | vocabulary.md |
| Number lands with weight | `counter-roll` (#11) | 2 | vocabulary.md |
| Navigation feels like one surface | `view-transition` (#30) | 1–2 | here |
| Modal / menu / tooltip opens and closes | `native-overlay` (#35) | 1 | here |
| Interface feels responsive to touch | `press-state` (#31), `validation-shake` (#33) | 1 | here |
| Ambient life on a static page | `blob-drift` (#13), `gradient-mesh-drift` (#29) | 1–2 | vocabulary.md / here |
| Logos / testimonials in limited width | `marquee` (#9) | 1 | vocabulary.md |

---

## Cursor and pointer patterns

### 16. `cursor-follower` — a custom cursor that lags behind the real one
A dot at the true pointer position plus a ring that eases toward it. Reads as craft on a portfolio or agency site; reads as broken on a plumber's site where people just want the phone number.

Track `pointermove`, write `transform: translate3d(x,y,0)` on a `position: fixed` element inside a single rAF loop — never one loop per element. Ease the ring with a lerp factor around `0.12–0.18`.

- **Earns its cost when:** the brand is design-forward and the site is desktop-heavy.
- **Reduced motion:** drop the lag entirely — ring snaps to the dot, or disable and restore the native cursor.
- **Traps:** never `cursor: none` without a working replacement; a pointer-lost state is a dead site. Disable on coarse pointers — `@media (pointer: coarse)` — since there is no cursor to follow on touch. Keep native focus behaviour intact for keyboard users.

### 17. `spotlight` — a radial gradient tracks the pointer across a card
Cheap, high-payoff, and the most reusable pointer effect on this list. Set `--mx` / `--my` custom properties from `pointermove` on the card, and paint `radial-gradient(circle at var(--mx) var(--my), ...)` in a `::before`.

- **Earns its cost when:** you have a grid of cards that would otherwise be flat.
- **Reduced motion:** static gradient at rest position, or omit.
- **Traps:** one listener on the *grid* delegating to the hovered card, not one per card. Never animate `background-position` — paint the gradient in a compositor-friendly overlay layer. Contrast is computed against the *card* background, so keep the gradient subtle enough that text still clears 4.5:1 at every pointer position.

### 18. `tilt-3d` — card rotates toward the pointer in perspective
`perspective` on the container, `rotateX/rotateY` on the child, mapped from pointer offset. Cap rotation at 6–10°; beyond that it reads as a gimmick and starts to hurt legibility.

- **Reduced motion:** disable — this is exactly the vestibular trigger the media query exists for.
- **Traps:** `transform-style: preserve-3d` creates a stacking context; dropdowns and tooltips inside will clip. Text inside a rotated layer resamples and can look soft — keep type out of the tilted layer or accept the softness deliberately.

---

## Scroll patterns

### 20. `scroll-progress` — reading progress bar
The single best argument for tier 2. Zero JS:

```css
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.progress { transform-origin: 0 50%; animation: grow linear both;
            animation-timeline: scroll(root block); }
@media (prefers-reduced-motion: reduce) { .progress { animation: none; transform: scaleX(1); } }
```
- **Earns its cost when:** long-form content — blog posts, guides, service pages.
- **Traps:** in unsupporting browsers the animation never applies, so the bar sits at its static state. Author that state as *full* or *hidden*, never empty-and-stuck. Do not place it over the LCP element.

### 21. `sticky-stack` — cards pin and stack as you scroll past
Each card `position: sticky; top: <n>` inside its own section; successive cards scale and dim slightly as the next arrives. Achievable with `animation-timeline: view()`; GSAP only if you need real sequencing between them.

- **Earns its cost when:** 3–5 items of equal weight that would otherwise be a long dull column.
- **Reduced motion:** unstick — plain stacked cards, all fully visible.
- **Traps:** `position: sticky` silently dies if any ancestor has `overflow: hidden` — the single most common failure. Never put more than ~5 cards in a stack; the scroll distance becomes hostile on mobile. Give each card a real `min-height` so the pin does not jump.

### 22. `horizontal-section` — vertical scroll drives horizontal travel
Pin a section, translate a track on X as scroll advances. Tier 3 (GSAP ScrollTrigger `pin` + `scrub`) in practice.

- **Earns its cost when:** the content is genuinely a sequence — a process, a timeline, a gallery — and *once per page*, never twice.
- **Reduced motion:** convert to a normal horizontal scroll container with `overflow-x: auto` and visible affordance.
- **Traps:** it hijacks scroll, which people hate when it is not obviously intentional. Must be keyboard reachable — a track nobody can Tab through is inaccessible content. On mobile, usually just ship the native scroller.

### 23. `line-scrub-text` — copy reveals word-by-word tied to scroll position
Words at low opacity brighten as the section crosses the viewport. Very effective for a single manifesto line; exhausting anywhere else.

- **Reduced motion:** all text at full opacity immediately.
- **Traps:** **this is the pattern most likely to fail the no-JS gate.** The words must be real text at readable contrast in the DOM, with the dimming applied as an enhancement — never `opacity: 0` as the authored default. Splitting text into per-word spans breaks screen-reader phrasing unless the parent keeps an accessible name.

### 24. `image-sequence` — canvas scrubbing a frame sequence
The Apple-product-page effect. **Default to no on client sites.** 100+ images is a bandwidth and decode cost no local business needs. Showcase only, and only with a preload strategy and a poster fallback.

### 25. `scroll-snap-sections` — viewport-height sections that snap
Pure CSS: `scroll-snap-type: y proximity` on the scroller, `scroll-snap-align: start` on sections.

- **Traps:** prefer `proximity` over `mandatory` — mandatory traps people mid-scroll and is miserable on content taller than the viewport. **Incompatible with Lenis**, which does not support scroll-snap at all. Pick one.

---

## Hero patterns

### 26. `split-text-entrance` — headline arrives per character or per word
Per-word almost always beats per-character; per-character on a long headline reads as a screensaver.

- **Rule:** the hero headline is usually the LCP element. Animating it on entry is a direct budget violation — `prove.js` fails it. Either animate a *secondary* line, or use `mask-wipe` (#2) which starts painted, or accept a deliberate showcase-only exception.
- **Traps:** GSAP `SplitText` and every hand-rolled splitter destroy screen-reader phrasing. Keep the intact string in an `aria-label` on the heading and mark the split spans `aria-hidden="true"`. Splitting also kills text selection and can break ligatures.

### 27. `kinetic-headline` — variable-font weight or width animates
Animate `font-variation-settings` on `wght` / `wdth`. Genuinely distinctive, and almost nobody does it — a strong candidate for `frontend-design`'s "signature element".

- **Traps:** animating variation settings triggers layout, so keep the animated text on its own line with reserved space or it reflows the page. Requires a real variable font — check the file actually ships the axis before designing around it.

### 28. `hero-video-loop` — short muted loop behind the hero
- **Rules:** `poster` is mandatory (it becomes the LCP candidate), `muted playsinline loop preload="metadata"`, and never autoplay over 6–8 seconds of footage. Serve a static image on `(pointer: coarse)` or `prefers-reduced-data`.
- **Reduced motion:** show the poster, do not play.

### 29. `gradient-mesh-drift` — slow ambient gradient movement
CSS conic/radial gradient layers with a long `@keyframes` drift. This is the **legitimate substitute for Vanta** — same ambient feel, zero WebGL, no main-thread render loop.

- **Traps:** animating `background-position` on a large area repaints every frame. Animate `transform` on an absolutely-positioned oversized gradient layer instead, and keep it `will-change: transform` only while it runs.

---

## Page transitions

### 30. `view-transition` — native cross-page morph
Same-document transitions wrap a DOM change in `document.startViewTransition()`; cross-document uses `@view-transition { navigation: auto; }` in CSS on both pages, with `view-transition-name` on the elements that should morph.

Support is Chromium and Safari-leading with Firefox behind — **verify current support before relying on it**, but it degrades to a plain navigation with no broken state, which makes it unusually safe to adopt.

- **Earns its cost when:** a product/menu grid navigates to a detail page and the image should carry across. Big perceived-quality win for very little code.
- **Reduced motion:** wrap the transition in the media query and skip it.
- **Traps:** every `view-transition-name` must be **unique on the page** — duplicates silently disable the whole transition. During the transition the old page is a snapshot, so nothing is interactive; keep durations under ~300ms.

---

## Micro-interactions

### 31. `press-state` — the control acknowledges the tap
`:active { transform: scale(0.97) }` plus a 120–150ms transition. The cheapest credibility on this list, and routinely skipped.
- **Traps:** never scale a layout-affecting box on hover (it shifts neighbours); scale on `:active` only, or animate shadow/color instead.

### 32. `toast-entrance` — notifications arrive from a consistent edge
Slide + fade from one edge, always the same edge. **Requires `role="status"` / `aria-live="polite"`** or the message does not exist for a screen reader.
- **Traps:** reserve the space or stack with `transform`, never by reflowing the page.

### 33. `validation-shake` — a wrong field shakes
Two small X oscillations, ~200ms total.
- **Rules:** shake is decoration; the actual error message next to the field is the requirement, and colour alone must never carry the meaning.
- **Reduced motion:** no shake — flash the border colour instead.

### 34. `skeleton-swap` — placeholder resolves into content
Skeleton must match the final layout's dimensions, or you have built a CLS generator. Shimmer is optional; correct sizing is not.
- **Traps:** for anything under ~300ms, show nothing rather than a skeleton flash.

### 35. `native-overlay` — dialogs, popovers and tooltips animate with zero JS
The tier 1–2 pattern this file was missing. Anything entering or leaving `display: none` used to need a JS timing hack — set a class, wait for the transition, *then* unmount. Two properties remove the JS entirely:

```css
.dialog {
  opacity: 1; transform: translateY(0);
  transition: opacity 300ms ease, transform 300ms ease,
              display 300ms allow-discrete,
              overlay 300ms allow-discrete;   /* for <dialog>/[popover] — see note below */
  @starting-style { opacity: 0; transform: translateY(-1rem); }
}
.dialog[hidden] { opacity: 0; transform: translateY(-1rem); display: none; }

@media (prefers-reduced-motion: reduce) {
  .dialog { transition: opacity 1ms, display 1ms allow-discrete, overlay 1ms allow-discrete; }
}
```

`allow-discrete` is what lets `display` and `overlay` transition at all; `@starting-style`
supplies the from-state on first render. Note the division of labour, because it decides what
breaks: **`allow-discrete` alone drives the exit** — `@starting-style` is inert on close by
spec, since it only ever supplies a first-render from-state. So a missing `@starting-style`
costs you the entrance; a missing `allow-discrete` costs you the exit entirely.

**Include `overlay` on a native `<dialog>` or `[popover]` — defensively, not because we've seen
it break.** The theory is that without it the element leaves the top layer the instant it closes
and vanishes mid-fade. **We tested that and it did not reproduce:** in Chromium 149 a `[popover]`
faded identically with and without the `overlay` line (17 visible frames on close either way,
measured 2026-08-02, evidence `.claude/evidence/2026-08-02/pattern35-v3-out.txt`). Keep the line
anyway — it is one declaration, it is what the spec intends, and other engines may not be as
forgiving — but do not go hunting for this as the cause of a bug we have no sighting of.

The reduced-motion block above **is** load-bearing and is verified: with it, the same close
collapses from 17 animating frames to 2.

For tooltips and floating UI, anchor positioning replaces the JS positioning library — `anchor-name` on the trigger, `position-anchor` + `position-area` on the floater, and animate it with the same `@starting-style` block on `:popover-open`.

- **Earns its cost when:** any menu, modal, tooltip or popover — which is most sites. This is a JS *deletion*, so it is free against the budget.
- **Reduced motion:** collapse to opacity-only; the discrete `display` transition stays, so nothing gets stranded open or half-mounted.
- **Traps:** **`@starting-style` without `allow-discrete` silently does nothing** on a `display:none` element — the transition is skipped whole. Always define `position-try-fallbacks`, or an anchored element with no room clips off-viewport instead of flipping. Support is Chromium/Safari-led with Firefox behind — verify before relying on it, though it degrades to an instant show/hide, which is a safe failure.

---

## Reduced-motion checklist

Every pattern above resolves to one of three behaviours under `prefers-reduced-motion: reduce`:

| Behaviour | Patterns |
|---|---|
| **Collapse to opacity-only** | entrances, staggers, reveals, toasts, native overlays |
| **Jump to end state, no interpolation** | scrub, parallax, sticky-stack, progress, counters, split text |
| **Disable entirely, restore native behaviour** | tilt-3d, cursor-follower, magnetic-hover, Lenis, horizontal-section, video autoplay |

Read the query in JS (`matchMedia('(prefers-reduced-motion: reduce)').matches`) before initialising anything in tiers 3–5. A CSS block cannot stop a JS instance.

Verify with `node ~/.claude/skills/web-design/scripts/prove.js <url>` — it emulates reduced motion directly, which DevTools cannot do.
