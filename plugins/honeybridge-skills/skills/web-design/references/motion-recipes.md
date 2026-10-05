# Motion recipes — the runnable half

`motion.md` decides **when and why**. This file is **how** — complete, copy-pasteable
implementations for every pattern in it.

**These fixtures are the test suite.** `scripts/test-patterns.js` parses the fenced blocks
below by their `@fixture` marker and runs each one in a real browser. The docs cannot drift
from what is tested, because the docs *are* what is tested.

```bash
node ~/.claude/skills/web-design/scripts/test-patterns.js          # all
node ~/.claude/skills/web-design/scripts/test-patterns.js 17 21    # named patterns
```

Every fixture is checked against three universal gates, which are the hard rules from
`motion.md` made executable:

1. **Visible at rest** — with animation disabled the content is still on screen. Catches the
   `opacity: 0` default that hands a crawler an empty page.
2. **Reduced motion collapses** — no transform/position animation running under
   `prefers-reduced-motion: reduce`, and nothing stranded invisible or mid-transform.
3. **The effect actually happens** — something measurably changes when it should.

A pattern that cannot pass all three does not belong in a client build.

---

## 16. cursor-follower

<!-- @fixture 16 -->
```html
<style>
  .cursor-ring {
    position: fixed; top: 0; left: 0; width: 32px; height: 32px;
    border: 2px solid currentColor; border-radius: 50%;
    pointer-events: none; z-index: 9999;
    transform: translate3d(-100px, -100px, 0);
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce), (pointer: coarse) {
    .cursor-ring { display: none; }
  }
</style>
<div class="cursor-ring" id="ring"></div>
<p>Page content stays fully visible and interactive.</p>
<script>
  const ring = document.getElementById('ring');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (!reduce && !coarse) {
    let tx = -100, ty = -100, x = -100, y = -100, raf = null;
    addEventListener('pointermove', e => { tx = e.clientX - 16; ty = e.clientY - 16;
      if (!raf) raf = requestAnimationFrame(tick); });
    function tick() {
      x += (tx - x) * 0.15; y += (ty - y) * 0.15;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) ? requestAnimationFrame(tick) : null;
    }
  }
</script>
```
One rAF loop for all followers, never one per element. Never `cursor: none` without a working
replacement. Hidden on coarse pointers — there is no cursor to follow on touch.

---

## 17. spotlight

<!-- @fixture 17 -->
```html
<style>
  .card-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, 1fr); }
  .card {
    position: relative; padding: 2rem; border-radius: 12px;
    background: #1b1b1f; color: #f4f4f5; overflow: hidden; isolation: isolate;
  }
  .card::before {
    content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0;
    transition: opacity 200ms ease;
    background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%),
                                rgba(255,255,255,.10), transparent 60%);
  }
  .card:hover::before { opacity: 1; }
  @media (prefers-reduced-motion: reduce) {
    .card::before { transition: none; }
  }
</style>
<div class="card-grid" id="grid">
  <div class="card"><h3>Card one</h3><p>Readable at every pointer position.</p></div>
  <div class="card"><h3>Card two</h3><p>Readable at every pointer position.</p></div>
</div>
<script>
  // ONE listener on the grid, delegating — not one per card.
  document.getElementById('grid').addEventListener('pointermove', e => {
    const card = e.target.closest('.card'); if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
</script>
```
Contrast is computed against the *card* background, so keep the gradient subtle enough that
text clears 4.5:1 at every pointer position. Never animate `background-position`.

---

## 18. tilt-3d

<!-- @fixture 18 -->
```html
<style>
  .tilt-wrap { perspective: 800px; width: 280px; }
  .tilt {
    padding: 2rem; border-radius: 12px; background: #1b1b1f; color: #f4f4f5;
    transform: rotateX(0deg) rotateY(0deg); transition: transform 120ms ease-out;
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce) {
    .tilt { transform: none !important; transition: none; }
  }
</style>
<div class="tilt-wrap"><div class="tilt" id="tilt"><h3>Tilt card</h3><p>Body copy.</p></div></div>
<script>
  const el = document.getElementById('tilt');
  const MAX = 8; // degrees — past ~10 it reads as a gimmick and hurts legibility
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `rotateX(${-py * MAX * 2}deg) rotateY(${px * MAX * 2}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  }
</script>
```
`transform-style: preserve-3d` creates a stacking context — dropdowns and tooltips inside will
clip. Keep type out of the tilted layer or accept the resampling softness.

---

## 20. scroll-progress

<!-- @fixture 20 -->
```html
<style>
  .progress {
    position: fixed; top: 0; left: 0; height: 3px; width: 100%;
    background: currentColor; transform-origin: 0 50%;
    transform: scaleX(1);              /* static fallback = FULL, never empty-and-stuck */
    animation: grow linear both; animation-timeline: scroll(root block);
  }
  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @media (prefers-reduced-motion: reduce) {
    .progress { animation: none; transform: scaleX(1); }
  }
</style>
<div class="progress"></div>
<article style="height: 300vh"><h1>Long form</h1><p>Scroll body.</p></article>
```
Zero JS. In unsupporting browsers the animation never applies, so author the static state as
*full* or *hidden* — never empty. Do not place it over the LCP element.

---

## 21. sticky-stack

<!-- @fixture 21 -->
```html
<style>
  .stack { --top: 80px; }
  .stack section {
    position: sticky; top: var(--top); min-height: 60vh;
    padding: 2rem; border-radius: 16px; margin-bottom: 2rem;
    background: #1b1b1f; color: #f4f4f5;
    animation: dim linear both;
    animation-timeline: view(); animation-range: exit -20% exit 60%;
  }
  @keyframes dim { to { transform: scale(.94); opacity: .55; } }
  @media (prefers-reduced-motion: reduce) {
    .stack section { position: static; animation: none; transform: none; opacity: 1; }
  }
</style>
<div class="stack">
  <section><h2>One</h2><p>Card body.</p></section>
  <section><h2>Two</h2><p>Card body.</p></section>
  <section><h2>Three</h2><p>Card body.</p></section>
</div>
<div style="height:120vh"></div>
```
**`position: sticky` dies silently if any ancestor has `overflow: hidden`** — the single most
common failure. Never more than ~5 cards; the scroll distance turns hostile on mobile.

---

## 22. horizontal-section

<!-- @fixture 22 -->
```html
<style>
  /* Mobile and reduced-motion default: a real, keyboard-reachable scroller. */
  .h-track {
    display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x proximity;
    padding: 1rem; -webkit-overflow-scrolling: touch;
  }
  .h-track > * {
    flex: 0 0 70%; scroll-snap-align: start; padding: 2rem; border-radius: 12px;
    background: #1b1b1f; color: #f4f4f5;
  }
  /* Enhancement only where there is room and motion is welcome. */
  @media (min-width: 900px) and (prefers-reduced-motion: no-preference) {
    .h-pin { height: 300vh; }
    .h-pin .h-track {
      position: sticky; top: 0; height: 100vh; align-items: center;
      overflow: visible; animation: slide linear both;
      animation-timeline: scroll(root block);
    }
    @keyframes slide { to { transform: translateX(calc(-100% + 90vw)); } }
  }
</style>
<div class="h-pin"><div class="h-track" tabindex="0">
  <div>Step one</div><div>Step two</div><div>Step three</div>
</div></div>
```
It hijacks scroll, which people hate when it is not obviously intentional. Once per page, never
twice. The track must be tabbable — a track nobody can reach is inaccessible content.

---

## 23. line-scrub-text

<!-- @fixture 23 -->
```html
<style>
  /* Authored state is FULLY READABLE. The dim is the enhancement, not the default. */
  .scrub span { opacity: 1; }
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .scrub span {
        opacity: .25; animation: brighten linear both;
        animation-timeline: view(); animation-range: entry 20% cover 45%;
      }
      @keyframes brighten { to { opacity: 1; } }
    }
  }
</style>
<div style="height:60vh"></div>
<p class="scrub" aria-label="We build things that outlast the trend that made them.">
  <span aria-hidden="true">We </span><span aria-hidden="true">build </span>
  <span aria-hidden="true">things </span><span aria-hidden="true">that </span>
  <span aria-hidden="true">outlast </span><span aria-hidden="true">the </span>
  <span aria-hidden="true">trend </span><span aria-hidden="true">that </span>
  <span aria-hidden="true">made </span><span aria-hidden="true">them.</span>
</p>
<div style="height:80vh"></div>
```
**The pattern most likely to fail the no-JS gate.** Words must be real text at readable contrast
in the DOM. Splitting breaks screen-reader phrasing, so the parent carries `aria-label` and the
spans are `aria-hidden`.

---

## 24. image-sequence

<!-- @fixture 24 static: poster-only by design; the canvas is showcase-scope and off by default -->
```html
<style>
  .seq { position: relative; }
  .seq img { width: 100%; display: block; }
  @media (prefers-reduced-motion: reduce) { .seq canvas { display: none; } }
</style>
<div class="seq">
  <!-- The poster IS the content. The canvas is an enhancement layered over it. -->
  <img id="poster" alt="Product, three-quarter view"
       src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%231b1b1f'/></svg>">
</div>
```
**Default to no on client sites.** 100+ frames is a bandwidth and decode cost no local business
needs. Showcase only, and only with a preload strategy and this poster fallback.

---

## 25. scroll-snap-sections

<!-- @fixture 25 -->
```html
<style>
  .snap { scroll-snap-type: y proximity; overflow-y: auto; height: 100vh; }
  .snap > section {
    scroll-snap-align: start; min-height: 100vh; padding: 2rem;
    display: flex; align-items: center; background: #1b1b1f; color: #f4f4f5;
  }
  .snap > section:nth-child(even) { background: #101013; }
</style>
<div class="snap">
  <section><h2>One</h2></section><section><h2>Two</h2></section><section><h2>Three</h2></section>
</div>
```
Prefer `proximity` over `mandatory` — mandatory traps people mid-scroll and is miserable on
content taller than the viewport. **Incompatible with Lenis**, which does not support snap at
all. Pick one.

---

## 26. split-text-entrance

<!-- @fixture 26 -->
```html
<style>
  .split { overflow: hidden; }
  .split .w { display: inline-block; }
  @media (prefers-reduced-motion: no-preference) {
    .split .w { animation: rise 500ms cubic-bezier(.2,.7,.3,1) both;
                animation-delay: calc(var(--i) * 60ms); }
    @keyframes rise { from { transform: translateY(0.9em); opacity: 0; } }
  }
</style>
<!-- NOT the LCP element. Animate a secondary line; the h1 above it is already painted. -->
<h1>Client A</h1>
<p class="split" aria-label="Smash burgers, done properly.">
  <span class="w" style="--i:0" aria-hidden="true">Smash</span>
  <span class="w" style="--i:1" aria-hidden="true">burgers,</span>
  <span class="w" style="--i:2" aria-hidden="true">done</span>
  <span class="w" style="--i:3" aria-hidden="true">properly.</span>
</p>
```
Per-word beats per-character almost always. **The hero headline is usually the LCP element and
animating it on entry is a direct budget violation** — `prove.js` fails it. Keep the intact
string in `aria-label`; mark the spans `aria-hidden`.

---

## 27. kinetic-headline

<!-- @fixture 27 -->
```html
<style>
  .kinetic {
    font-variation-settings: 'wght' 400;
    /* Reserve the line so the axis change cannot reflow the page. */
    min-height: 1.2em; display: block;
  }
  @media (prefers-reduced-motion: no-preference) {
    .kinetic { animation: weight 4s ease-in-out infinite alternate; }
    @keyframes weight {
      from { font-variation-settings: 'wght' 300; }
      to   { font-variation-settings: 'wght' 700; }
    }
  }
</style>
<h2 class="kinetic">Built to last</h2>
```
Animating variation settings triggers layout — reserve the space or it reflows. **Check the
font file actually ships the axis** before designing around it.

---

## 28. hero-video-loop

<!-- @fixture 28 static: the still IS the fallback; no video source ships in the fixture -->
```html
<style>
  .hero-media { position: relative; aspect-ratio: 16/9; background: #101013; }
  .hero-media img, .hero-media video { width: 100%; height: 100%; object-fit: cover; }
  .hero-media video { position: absolute; inset: 0; }
  @media (prefers-reduced-motion: reduce), (pointer: coarse) {
    .hero-media video { display: none; }   /* poster carries it */
  }
</style>
<div class="hero-media">
  <img alt="Kitchen at service"
       src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'><rect width='16' height='9' fill='%231b1b1f'/></svg>">
  <video muted playsinline loop preload="metadata" aria-hidden="true"></video>
</div>
```
`poster`/`<img>` is mandatory — it becomes the LCP candidate. Never autoplay more than 6–8
seconds. Serve the still on coarse pointers and `prefers-reduced-data`.

---

## 29. gradient-mesh-drift

<!-- @fixture 29 -->
```html
<style>
  .mesh { position: relative; min-height: 60vh; overflow: hidden; background: #0d0d10; }
  .mesh::before {
    content: ''; position: absolute; inset: -40%; z-index: 0;
    background:
      radial-gradient(40% 40% at 30% 30%, rgba(160,20,25,.55), transparent 60%),
      radial-gradient(35% 35% at 70% 60%, rgba(60,15,18,.55), transparent 60%);
    will-change: transform;
  }
  @media (prefers-reduced-motion: no-preference) {
    .mesh::before { animation: drift 24s ease-in-out infinite alternate; }
    @keyframes drift { to { transform: translate3d(6%, -4%, 0) rotate(8deg); } }
  }
  .mesh > * { position: relative; z-index: 1; }
</style>
<div class="mesh"><h2 style="color:#fff;padding:2rem">Ambient without WebGL</h2></div>
```
**The legitimate substitute for Vanta** — same ambient feel, zero WebGL, no main-thread render
loop. Animate `transform` on an oversized layer, never `background-position`.

---

## 30. view-transition

<!-- @fixture 30 -->
```html
<style>
  @view-transition { navigation: auto; }
  .thumb { view-transition-name: hero-image; }   /* must be UNIQUE on the page */
  .swapped .thumb { width: 160px; }              /* the change the transition animates */
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
      animation: none !important;
    }
  }
</style>
<img class="thumb" alt="Product"
     src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%231b1b1f'/></svg>">
<button id="swap">Swap (same-document)</button>
<script>
  document.getElementById('swap').onclick = () => {
    const go = () => document.body.classList.toggle('swapped');
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return go();
    document.startViewTransition(go);
  };
</script>
```
**Every `view-transition-name` must be unique on the page** — duplicates silently disable the
whole transition. Degrades to a plain navigation, which makes it unusually safe to adopt.

---

## 31. press-state

<!-- @fixture 31 -->
```html
<style>
  .btn {
    padding: .75rem 1.25rem; border-radius: 8px; border: 0; cursor: pointer;
    background: #a01419; color: #fff; font: inherit;
    min-height: 44px; min-width: 44px;
    transition: transform 130ms ease, box-shadow 130ms ease;
  }
  .btn:active { transform: scale(.97); }
  .btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
</style>
<button class="btn">Order direct</button>
```
The cheapest credibility on the list and routinely skipped. **Scale on `:active` only** — never
on hover, which shifts neighbours.

---

## 32. toast-entrance

<!-- @fixture 32 -->
```html
<style>
  .toast-region { position: fixed; right: 1rem; bottom: 1rem; display: grid; gap: .5rem; }
  .toast {
    padding: .75rem 1rem; border-radius: 8px; background: #1b1b1f; color: #f4f4f5;
    transition: opacity 220ms ease, transform 220ms ease,
                display 220ms allow-discrete, overlay 220ms allow-discrete;
    @starting-style { opacity: 0; transform: translateY(8px); }
  }
  .toast[hidden] { opacity: 0; transform: translateY(8px); display: none; }
  @media (prefers-reduced-motion: reduce) {
    .toast { transition: opacity 1ms, display 1ms allow-discrete; }
  }
</style>
<div class="toast-region" role="status" aria-live="polite">
  <div class="toast" id="t">Saved.</div>
</div>
```
**`role="status"` / `aria-live="polite"` is required** or the message does not exist for a
screen reader. Always the same edge. Reserve space or stack with `transform`, never by reflow.

---

## 33. validation-shake

<!-- @fixture 33 -->
```html
<style>
  .field-error { color: #ffb4ad; font-size: .875rem; margin-top: .25rem; }
  .input { padding: .6rem; border: 2px solid #555; border-radius: 6px; background: #101013; color: #f4f4f5; }
  .input[aria-invalid="true"] { border-color: #e21e26; }
  @media (prefers-reduced-motion: no-preference) {
    .input[aria-invalid="true"] { animation: shake 200ms ease-in-out; }
    @keyframes shake {
      25% { transform: translateX(-4px); } 75% { transform: translateX(4px); }
    }
  }
</style>
<label for="em">Email</label>
<input class="input" id="em" aria-invalid="true" aria-describedby="em-err">
<p class="field-error" id="em-err">Enter a valid email address.</p>
```
**The shake is decoration; the message is the requirement.** Colour alone must never carry the
meaning. Under reduced motion the border colour still changes — only the shake goes.

---

## 34. skeleton-swap

<!-- @fixture 34 -->
```html
<style>
  .skeleton {
    /* Dimensions MUST match the resolved content or you have built a CLS generator. */
    min-height: 72px; border-radius: 8px; background: #1b1b1f;
  }
  @media (prefers-reduced-motion: no-preference) {
    .skeleton { animation: shimmer 1.4s ease-in-out infinite; }
    @keyframes shimmer { 50% { opacity: .55; } }
  }
</style>
<div class="skeleton" aria-hidden="true"></div>
<p>Correct sizing is the requirement; shimmer is optional.</p>
```
For anything under ~300ms, show nothing rather than a skeleton flash.

---

## 35. native-overlay

See `motion.md` #35 — that pattern's full recipe, its causation notes and its measured results
live there, because it is the one pattern with a verified negative control.

<!-- @fixture 35 -->
```html
<style>
  .dialog {
    opacity: 1; transform: translateY(0); padding: 1rem;
    background: #1b1b1f; color: #f4f4f5; border-radius: 10px;
    transition: opacity 300ms ease, transform 300ms ease,
                display 300ms allow-discrete, overlay 300ms allow-discrete;
    @starting-style { opacity: 0; transform: translateY(-1rem); }
  }
  .dialog[hidden] { opacity: 0; transform: translateY(-1rem); display: none; }
  @media (prefers-reduced-motion: reduce) {
    .dialog { transition: opacity 1ms, display 1ms allow-discrete, overlay 1ms allow-discrete; }
  }
</style>
<button id="toggle">Toggle</button>
<div class="dialog" id="d">Dialog body text</div>
<script>
  document.getElementById('toggle').onclick =
    () => document.getElementById('d').toggleAttribute('hidden');
</script>
```
