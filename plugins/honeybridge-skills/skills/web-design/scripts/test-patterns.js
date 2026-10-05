#!/usr/bin/env node
// Runs every motion pattern in references/motion-recipes.md in a real browser.
//
// The recipes file IS the test suite — fixtures are parsed out of it by their
// `<!-- @fixture N -->` marker, so the documentation cannot drift from what is
// verified. Add a pattern to the doc and it is tested on the next run.
//
//   node scripts/test-patterns.js           # all
//   node scripts/test-patterns.js 17 21     # only those
//
// Three universal gates per pattern, which are motion.md's hard rules made
// executable. They are deliberately generic: this proves patterns are SAFE
// (visible at rest, reduced-motion-clean, and actually doing something), not
// that each one is pixel-perfect. Pixel judgement is Phase 9's screenshots.

const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const RECIPES = path.join(__dirname, '..', 'references', 'motion-recipes.md');

function parseFixtures(md) {
  const out = [];
  const re = /<!--\s*@fixture\s+(\d+)(?:\s+static:\s*([^>]*?))?\s*-->\s*```html\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md)))
    out.push({ id: m[1], staticReason: (m[2] || '').trim() || null, html: m[3] });
  return out;
}

const PAGE = (body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>fixture</title>
<style>body{margin:0;font:16px/1.5 system-ui;background:#0d0d10;color:#f4f4f5}</style>
</head><body>${body}</body></html>`;

// ---- Gate 1: content is visible with animation suppressed entirely.
// Catches the `opacity:0` authored default that hands a crawler an empty page.
async function gateVisibleAtRest(browser, html) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  // Kill every animation and transition before the page runs.
  await page.addStyleTag({ content: `*,*::before,*::after{
      animation:none!important;transition:none!important}` }).catch(() => {});
  await page.setContent(PAGE(html));
  await page.addStyleTag({ content: `*,*::before,*::after{
      animation:none!important;transition:none!important}` });
  await page.waitForTimeout(120);
  const r = await page.evaluate(() => {
    const txt = [...document.body.querySelectorAll('h1,h2,h3,p,span,button,label,li')]
      .filter(el => el.textContent.trim());
    const hidden = txt.filter(el => {
      const cs = getComputedStyle(el);
      return +cs.opacity < 0.05 || cs.visibility === 'hidden' ||
             (cs.display === 'none' && !el.closest('[hidden]'));
    });
    return { total: txt.length, hidden: hidden.length,
             sample: hidden.slice(0, 2).map(e => e.textContent.trim().slice(0, 30)) };
  });
  await ctx.close();
  // No text at all is fine (media-only fixtures); text present but invisible is not.
  const pass = r.total === 0 || r.hidden === 0;
  return { pass, detail: pass ? `${r.total} text nodes visible`
    : `${r.hidden}/${r.total} invisible at rest: ${r.sample.join(' | ')}` };
}

// ---- Gate 2: reduced motion collapses cleanly.
// No transform/position animation still running, nothing stranded invisible.
async function gateReducedMotion(browser, html) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.setContent(PAGE(html));
  const inForce = await page.evaluate(() =>
    matchMedia('(prefers-reduced-motion: reduce)').matches);
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const moving = [];
    for (const a of document.getAnimations()) {
      const props = (a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : [])
        .flatMap(k => Object.keys(k));
      const kinetic = props.some(p =>
        ['transform', 'translate', 'rotate', 'scale', 'top', 'left'].includes(p));
      // An infinite kinetic animation under reduced motion is the failure.
      const inf = a.effect && a.effect.getTiming().iterations === Infinity;
      if (kinetic && (inf || a.playState === 'running')) {
        moving.push((a.effect.target && a.effect.target.className) || 'anon');
      }
    }
    const txt = [...document.body.querySelectorAll('h1,h2,h3,p,span,button,label')]
      .filter(el => el.textContent.trim());
    const stranded = txt.filter(el => {
      const cs = getComputedStyle(el);
      return (+cs.opacity < 0.05 || cs.visibility === 'hidden') && !el.closest('[hidden]');
    }).length;
    return { moving: [...new Set(moving)], stranded, total: txt.length };
  });
  await ctx.close();
  const pass = inForce && r.moving.length === 0 && r.stranded === 0;
  const why = !inForce ? 'reduced-motion emulation not in force'
    : r.moving.length ? `still animating transform: ${r.moving.join(', ')}`
    : r.stranded ? `${r.stranded}/${r.total} stranded invisible`
    : 'collapsed cleanly, nothing stranded';
  return { pass, detail: why };
}

// ---- Gate 3: the effect actually happens when motion IS allowed.
//
// Uses REAL Playwright input, not synthetic events: `:hover` and `:active` are
// engine state that dispatchEvent cannot fake, and several patterns (#17, #31)
// live entirely in those selectors. Also samples ::before/::after, because
// #17's whole effect is painted in a pseudo-element.
//
// Patterns marked `@fixture N static` are exempt with a recorded reason — some
// are deliberately motionless (a poster fallback, a paused video).
async function gateEffectHappens(browser, html, { staticReason } = {}) {
  if (staticReason) return { pass: true, detail: `n/a — intentionally static: ${staticReason}` };

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setContent(PAGE(html));
  await page.waitForTimeout(150);

  const snap = () => page.evaluate(() =>
    [...document.querySelectorAll('*')].slice(0, 60).map(el => {
      const c = getComputedStyle(el);
      const b = getComputedStyle(el, '::before');
      return [c.transform, c.opacity, c.borderColor, c.width, c.height,
              c.fontVariationSettings, b.opacity, b.backgroundImage.slice(0, 80)].join('|');
    }).join(';'));

  const before = await snap();
  const baseline = await page.evaluate(() => ({
    anims: document.getAnimations().length,
    timelines: [...document.getAnimations()].filter(a => a.timeline &&
      a.timeline.constructor.name !== 'DocumentTimeline').length,
    // scroll-snap is a real effect that is not an "animation"
    snap: [...document.querySelectorAll('*')].some(el =>
      getComputedStyle(el).scrollSnapType !== 'none'),
  }));

  // Real hover + real press on the most plausible interactive target.
  const sel = ['.card', '.tilt', '.btn', 'button', '.input', '.dialog', '.toast']
    .find(s => page.locator(s).first());
  for (const s of ['.card', '.tilt', '.btn', 'button', '.input']) {
    const loc = page.locator(s).first();
    if (await loc.count()) {
      try {
        await loc.hover({ timeout: 1000 });
        await page.mouse.down(); await page.waitForTimeout(90);
        const mid = await snap();
        await page.mouse.up();
        if (mid !== before) { await ctx.close();
          return { pass: true, detail: `style delta under real hover+press on ${s}` }; }
      } catch { /* not hoverable, fall through */ }
      break;
    }
  }

  // A real pointer sweep, always — cursor-driven patterns (#16) have no
  // hoverable selector to find, they just track the pointer across the viewport.
  await page.mouse.move(120, 120);
  await page.mouse.move(420, 260, { steps: 8 });
  await page.waitForTimeout(160);
  const afterPointer = await snap();
  if (afterPointer !== before) { await ctx.close();
    return { pass: true, detail: 'style delta under real pointer movement' }; }

  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.4));
  await page.waitForTimeout(280);
  const after = await snap();
  await ctx.close();

  const changed = after !== before;
  const pass = baseline.anims > 0 || baseline.timelines > 0 || baseline.snap || changed;
  return { pass, detail: pass
    ? `${baseline.anims} animation(s), ${baseline.timelines} scroll-linked` +
      `${baseline.snap ? ', scroll-snap active' : ''}, style delta: ${changed}`
    : 'no animation, no scroll timeline, no snap, no style change — pattern is inert' };
}

(async () => {
  const only = process.argv.slice(2).filter(a => /^\d+$/.test(a));
  const md = fs.readFileSync(RECIPES, 'utf8');
  let fixtures = parseFixtures(md);
  if (only.length) fixtures = fixtures.filter(f => only.includes(f.id));
  if (!fixtures.length) { console.error('no fixtures matched'); process.exit(2); }

  const names = Object.fromEntries(
    [...md.matchAll(/^## (\d+)\. (.+)$/gm)].map(m => [m[1], m[2]]));

  const browser = await chromium.launch();
  const rows = [];
  for (const f of fixtures) {
    const g1 = await gateVisibleAtRest(browser, f.html);
    const g2 = await gateReducedMotion(browser, f.html);
    const g3 = await gateEffectHappens(browser, f.html, { staticReason: f.staticReason });
    rows.push({ id: f.id, name: names[f.id] || '', g1, g2, g3,
                pass: g1.pass && g2.pass && g3.pass });
  }
  await browser.close();

  const pad = (s, n) => String(s).padEnd(n);
  console.log('\n─── motion pattern suite ' + '─'.repeat(46));
  for (const r of rows) {
    console.log(`\n${r.pass ? '[ ok  ]' : '[ FAIL]'} ${pad('#' + r.id, 5)} ${r.name}`);
    for (const [label, g] of [['visible at rest', r.g1], ['reduced motion', r.g2], ['effect happens', r.g3]]) {
      console.log(`         ${g.pass ? '·' : '✗'} ${pad(label, 16)} ${g.detail}`);
    }
  }
  const bad = rows.filter(r => !r.pass);
  console.log('\n' + '─'.repeat(70));
  console.log(bad.length
    ? `VERDICT: ${bad.length}/${rows.length} FAIL — ${bad.map(r => '#' + r.id).join(', ')}`
    : `VERDICT: all ${rows.length} patterns pass all three gates.`);
  console.log('─'.repeat(70) + '\n');
  process.exit(bad.length ? 1 : 0);
})();
