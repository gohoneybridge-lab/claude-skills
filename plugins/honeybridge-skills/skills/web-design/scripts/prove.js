#!/usr/bin/env node
/**
 * prove.js — the Prove phase of /web-design.
 *
 * Drives a built page and asserts the things every design checklist claims but
 * nothing ever checks: that it is actually responsive, actually readable,
 * actually keyboard-usable, actually visible without JS, and that its motion
 * actually respects reduced-motion and stays off the LCP element.
 *
 * Sibling of clone-motion/scripts/verify.js. That one proves motion RUNS;
 * this one proves the page HOLDS UP.
 *
 * usage:
 *   node prove.js <url|file> [--out=DIR] [--widths=375,768,1024,1440] [--shots]
 *
 * Exits non-zero if any check FAILs. WARNs never fail the run.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const getFlag = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : d;
};
const wantShots = args.includes('--shots');
const outDir = path.resolve(getFlag('out', './prove-out'));
const widths = getFlag('widths', '375,768,1024,1440')
  .split(',')
  .map((w) => parseInt(w.trim(), 10))
  .filter(Boolean);

if (!target) {
  console.error('usage: node prove.js <url|file> [--out=DIR] [--widths=375,768,1024,1440] [--shots]');
  process.exit(1);
}

const url = /^https?:|^file:/.test(target) ? target : 'file://' + path.resolve(target);

const results = [];
const record = (level, check, detail) => results.push({ level, check, detail });
const FAIL = (c, d) => record('FAIL', c, d);
const WARN = (c, d) => record('WARN', c, d);
const PASS = (c, d) => record('PASS', c, d);
const INFO = (c, d) => record('INFO', c, d);

/* ------------------------------------------------------------------ *
 * In-page probe installed before any page script runs.
 * Records which elements animate during the entrance window, because
 * getAnimations() only returns LIVE animations and a 500ms fade is gone
 * long before the page settles.
 * ------------------------------------------------------------------ */
const INIT = () => {
  window.__wd = { animated: new Set(), animatedProps: new Map(), lcp: null };
  const tick = () => {
    for (const a of document.getAnimations()) {
      const el = a.effect && a.effect.target;
      if (!el) continue;
      window.__wd.animated.add(el);
      try {
        const props = new Set(window.__wd.animatedProps.get(el) || []);
        for (const kf of a.effect.getKeyframes()) {
          for (const k of Object.keys(kf)) {
            if (k !== 'offset' && k !== 'computedOffset' && k !== 'easing' && k !== 'composite') props.add(k);
          }
        }
        window.__wd.animatedProps.set(el, [...props]);
      } catch (e) {
        /* cross-origin or detached */
      }
    }
  };
  const start = Date.now();
  const loop = () => {
    tick();
    if (Date.now() - start < 2500) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) window.__wd.lcp = last.element || null;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    /* unsupported */
  }
};

/* ------------------------------------------------------------------ *
 * Colour helpers, injected as page functions.
 * ------------------------------------------------------------------ */
const PAGE_HELPERS = `
  function parseRGB(s) {
    const m = String(s).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(fg, bg) {
    const a = fg.a;
    return { r: fg.r*a + bg.r*(1-a), g: fg.g*a + bg.g*(1-a), b: fg.b*a + bg.b*(1-a), a: 1 };
  }
  function lum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b);
  }
  function ratio(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
  }
  // Composite every ancestor background down onto white to get the real
  // backdrop behind a text node. A single getComputedStyle read returns
  // "rgba(0,0,0,0)" for most elements and would silently pass everything.
  // Returns { color, computable }. computable=false means an ancestor painted a
  // background-IMAGE (photo, gradient, mesh) before any opaque background-COLOR
  // was found, so no colour arithmetic can describe the real backdrop.
  // Reporting a ratio anyway produces BOTH false positives (white-on-dark-photo
  // scored against the body's white) and false negatives (dark-on-dark-photo
  // scored as passing). Flag it as uncomputable instead of guessing.
  function effectiveBg(el) {
    const stack = [];
    let n = el;
    let imageBehind = false;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') imageBehind = true;
      const bg = parseRGB(cs.backgroundColor);
      if (bg && bg.a > 0) stack.push(bg);
      if (bg && bg.a === 1) break;
      n = n.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return { color: base, computable: !imageBehind };
  }
  function visible(el) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
`;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();

  /* ============ 1. RESPONSIVE — one context per width ============ */
  for (const w of widths) {
    // NOTE: deliberately no `isMobile`. Mobile emulation re-derives the layout
    // viewport from the page's own viewport meta, so a page that is MISSING that
    // meta silently reports a 980px+ layout viewport and its overflow disappears.
    // We want the raw layout truth here and check the meta tag separately below.
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 1,
      hasTouch: w < 768,
    });
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(600);

    const overflow = await page.evaluate(`(() => {
      ${PAGE_HELPERS}
      const doc = document.documentElement;
      const vw = doc.clientWidth;
      const scrollW = Math.max(doc.scrollWidth, document.body ? document.body.scrollWidth : 0);
      const offenders = [];
      if (scrollW > vw + 1) {
        for (const el of document.querySelectorAll('*')) {
          if (!visible(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 || r.left < -1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className && String(el.className).slice(0, 60)) || '',
              right: Math.round(r.right), left: Math.round(r.left)
            });
          }
          if (offenders.length >= 5) break;
        }
      }
      const meta = document.querySelector('meta[name="viewport"]');
      return { vw, scrollW, offenders, viewportMeta: meta ? meta.getAttribute('content') : null };
    })()`);

    if (w === Math.min(...widths)) {
      if (!overflow.viewportMeta) {
        FAIL('viewport meta', 'no <meta name="viewport"> — mobile browsers will render at ~980px and scale down, so every "responsive" style is bypassed');
      } else if (!/width\s*=\s*device-width/i.test(overflow.viewportMeta)) {
        FAIL('viewport meta', `<meta name="viewport" content="${overflow.viewportMeta}"> is missing width=device-width`);
      } else {
        PASS('viewport meta', overflow.viewportMeta);
      }
    }

    if (overflow.scrollW > overflow.vw + 1) {
      FAIL(
        `responsive @${w}px`,
        `horizontal scroll: content is ${overflow.scrollW}px wide in a ${overflow.vw}px viewport. ` +
          `First offenders: ${overflow.offenders.map((o) => `<${o.tag} class="${o.cls}"> right=${o.right}`).join(' | ') || 'none isolated'}`
      );
    } else {
      PASS(`responsive @${w}px`, `no horizontal scroll (content ${overflow.scrollW}px / viewport ${overflow.vw}px)`);
    }

    /* touch targets — only at the narrowest width, where fingers are the input */
    if (w === Math.min(...widths)) {
      const small = await page.evaluate(`(() => {
        ${PAGE_HELPERS}
        const sel = 'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [onclick]';
        const bad = [];
        for (const el of document.querySelectorAll(sel)) {
          if (!visible(el)) continue;
          if (el.tagName === 'INPUT' && ['hidden','submit','button'].indexOf(el.type) === -1 && el.type !== 'checkbox' && el.type !== 'radio') {
            // text inputs are sized by line-height; not a tap-target concern
            continue;
          }
          // WCAG 2.5.8 exempts links inline in a sentence.
          if (el.tagName === 'A' && el.parentElement) {
            const pd = getComputedStyle(el.parentElement).display;
            const inFlow = ['p','li','span','td','blockquote'].indexOf(el.parentElement.tagName.toLowerCase()) !== -1;
            if (inFlow && getComputedStyle(el).display === 'inline' && pd !== 'flex' && pd !== 'grid') continue;
          }
          const r = el.getBoundingClientRect();
          // 24x24 is the WCAG 2.5.8 AA floor (a real failure).
          // 44x44 is the Apple HIG / WCAG AAA comfort target (worth flagging, not failing).
          if (r.width < 44 || r.height < 44) {
            bad.push({
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
              w: Math.round(r.width), h: Math.round(r.height),
              hard: r.width < 24 || r.height < 24
            });
          }
        }
        return bad.slice(0, 10);
      })()`);
      const hard = small.filter((s) => s.hard);
      const soft = small.filter((s) => !s.hard);
      const fmt = (list) => list.map((s) => `<${s.tag}>"${s.text}" ${s.w}x${s.h}`).join(' | ');
      if (hard.length) FAIL(`touch targets @${w}px`, `${hard.length} interactive element(s) under 24x24 — below the WCAG 2.5.8 AA floor: ${fmt(hard)}`);
      if (soft.length) WARN(`touch targets @${w}px`, `${soft.length} element(s) between 24x24 and 44x44 — legal, but below the comfortable tap target: ${fmt(soft)}`);
      if (!small.length) PASS(`touch targets @${w}px`, 'all interactive elements >= 44x44');
    }

    if (wantShots) {
      for (const scheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(outDir, `${w}-${scheme}.png`), fullPage: true });
      }
      await page.emulateMedia({ colorScheme: 'light' });
    }
    await ctx.close();
  }

  /* ============ 2. A11Y + MOTION — desktop context ============ */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(INIT);

    const scriptBytes = { total: 0 };
    const libs = new Set();
    page.on('response', async (res) => {
      const ct = res.headers()['content-type'] || '';
      const u = res.url();
      if (/javascript|ecmascript/.test(ct) || /\.m?js(\?|$)/.test(u)) {
        const len = parseInt(res.headers()['content-length'] || '0', 10);
        if (len) scriptBytes.total += len;
        if (/gsap/i.test(u)) libs.add('gsap');
        if (/lenis/i.test(u)) libs.add('lenis');
        if (/locomotive/i.test(u)) libs.add('locomotive');
        if (/three(\.min)?\.js|three-/i.test(u)) libs.add('three.js');
        if (/vanta/i.test(u)) libs.add('vanta');
        if (/framer-motion|\bmotion\b/i.test(u)) libs.add('framer-motion');
      }
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1200);

    /* --- contrast --- */
    const contrast = await page.evaluate(`(() => {
      ${PAGE_HELPERS}
      const bad = [];
      const unknown = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent.trim();
        if (t.length < 3) continue;
        const el = node.parentElement;
        if (!el || seen.has(el) || !visible(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        const fg0 = parseRGB(cs.color);
        if (!fg0) continue;
        const bgr = effectiveBg(el);
        const bg = bgr.color;
        if (!bgr.computable) {
          unknown.push({ text: t.slice(0, 34), tag: el.tagName.toLowerCase() });
          continue;
        }
        const fg = fg0.a < 1 ? over(fg0, bg) : fg0;
        const size = parseFloat(cs.fontSize);
        const weight = parseInt(cs.fontWeight, 10) || 400;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const need = large ? 3.0 : 4.5;
        const r = ratio(fg, bg);
        if (r < need) {
          bad.push({ text: t.slice(0, 34), ratio: Math.round(r*100)/100, need, size: Math.round(size), tag: el.tagName.toLowerCase() });
        }
      }
      return { bad: bad.slice(0, 10), unknown: unknown.slice(0, 8), unknownTotal: unknown.length };
    })()`);
    if (contrast.bad.length) {
      FAIL(
        'contrast',
        `${contrast.bad.length}+ text runs below WCAG AA: ` +
          contrast.bad.map((c) => `<${c.tag}> "${c.text}" ${c.ratio}:1 (needs ${c.need})`).join(' | ')
      );
    } else {
      PASS('contrast', 'all colour-computable text meets WCAG AA (4.5:1 / 3:1 large)');
    }
    if (contrast.unknownTotal) {
      WARN(
        'contrast (not computable)',
        `${contrast.unknownTotal} text run(s) sit on a background IMAGE or gradient, where colour arithmetic cannot describe the real backdrop — ` +
          `check these by eye or with a pixel-based checker (\`npx impeccable detect <url>\`): ` +
          contrast.unknown.map((c) => `<${c.tag}> "${c.text}"`).join(' | ')
      );
    }

    /* --- accessible names --- */
    const names = await page.evaluate(`(() => {
      ${PAGE_HELPERS}
      const imgs = [...document.querySelectorAll('img')].filter(i => visible(i) && !i.hasAttribute('alt'));
      const inputs = [...document.querySelectorAll('input, select, textarea')].filter(el => {
        if (!visible(el) || el.type === 'hidden') return false;
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.title) return false;
        if (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) return false;
        if (el.closest('label')) return false;
        return true;
      });
      const iconBtns = [...document.querySelectorAll('button, [role="button"]')].filter(b => {
        if (!visible(b)) return false;
        const txt = (b.textContent || '').trim();
        if (txt.length > 0) return false;
        return !(b.getAttribute('aria-label') || b.getAttribute('aria-labelledby') || b.title);
      });
      return {
        imgs: imgs.slice(0,5).map(i => (i.currentSrc||i.src||'').split('/').pop().slice(0,40)),
        inputs: inputs.slice(0,5).map(i => i.name || i.type || i.tagName.toLowerCase()),
        iconBtns: iconBtns.length
      };
    })()`);
    if (names.imgs.length) FAIL('alt text', `${names.imgs.length}+ <img> with no alt attribute: ${names.imgs.join(', ')}`);
    else PASS('alt text', 'every visible <img> has an alt attribute');
    if (names.inputs.length) FAIL('form labels', `${names.inputs.length}+ inputs with no label or aria-label: ${names.inputs.join(', ')}`);
    else PASS('form labels', 'every visible form control has an accessible name');
    if (names.iconBtns) FAIL('icon buttons', `${names.iconBtns} icon-only button(s) with no accessible name`);
    else PASS('icon buttons', 'icon-only buttons are labelled');

    /* --- focus visibility: tab through and diff the computed style --- */
    const focusable = await page.evaluate(`(() => {
      ${PAGE_HELPERS}
      return [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(visible).length;
    })()`);
    let noRing = [];
    const toTab = Math.min(focusable, 25);
    for (let i = 0; i < toTab; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(`(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring =
          (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ||
          (cs.boxShadow && cs.boxShadow !== 'none');
        return {
          ring,
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)
        };
      })()`);
      if (r && !r.ring) noRing.push(`<${r.tag}>"${r.text}"`);
    }
    if (noRing.length) {
      FAIL('focus visible', `${noRing.length} of ${toTab} tab stops show no outline or box-shadow when focused: ${noRing.slice(0, 5).join(' | ')}`);
    } else if (toTab === 0) {
      WARN('focus visible', 'no focusable elements found — is this page interactive?');
    } else {
      PASS('focus visible', `all ${toTab} sampled tab stops render a visible focus indicator`);
    }

    /* --- LCP element must not animate on entry --- */
    const lcp = await page.evaluate(`(() => {
      const w = window.__wd;
      if (!w || !w.lcp) return { known: false };
      let n = w.lcp, hit = null;
      while (n && n.nodeType === 1) {
        if (w.animated.has(n)) { hit = n; break; }
        n = n.parentElement;
      }
      const props = hit ? (w.animatedProps.get(hit) || []) : [];
      return {
        known: true,
        tag: w.lcp.tagName ? w.lcp.tagName.toLowerCase() : '?',
        text: (w.lcp.textContent || '').trim().slice(0, 40),
        animated: !!hit,
        self: hit === w.lcp,
        props
      };
    })()`);
    if (!lcp.known) {
      INFO('LCP motion', 'no LCP entry reported (very small or file:// page) — check by eye');
    } else if (lcp.animated) {
      FAIL(
        'LCP motion',
        `the LCP element <${lcp.tag}> "${lcp.text}" ${lcp.self ? 'is' : 'has an ancestor'} animated on entry (${lcp.props.join(', ') || 'unknown props'}). ` +
          `Largest paint is delayed by exactly the animation duration.`
      );
    } else {
      PASS('LCP motion', `LCP element <${lcp.tag}> is not animated on entry`);
    }

    /* --- motion budget: libraries + JS weight --- */
    const runtimeLibs = await page.evaluate(`(() => {
      const l = [];
      if (window.gsap) l.push('gsap');
      if (window.Lenis || document.documentElement.classList.contains('lenis')) l.push('lenis');
      if (window.THREE) l.push('three.js');
      if (window.VANTA) l.push('vanta');
      if (window.LocomotiveScroll) l.push('locomotive');
      return l;
    })()`);
    runtimeLibs.forEach((l) => libs.add(l));
    const banned = [...libs].filter((l) => l === 'three.js' || l === 'vanta');
    if (banned.length) {
      FAIL('motion budget', `${banned.join(' + ')} detected. WebGL backgrounds are banned on client sites — continuous main-thread render loop, LCP and INP regression on mid-tier Android.`);
    } else {
      PASS('motion budget', libs.size ? `libraries in play: ${[...libs].join(', ')} — none banned` : 'no animation library detected (CSS-only)');
    }
    INFO('js weight', `${Math.round(scriptBytes.total / 1024)} KB of script declared via content-length (uncompressed where servers omit it — treat as a signal, not a verdict)`);

    /* --- content must not be gated on motion --- */
    const jsText = await page.evaluate('document.body ? document.body.innerText.replace(/\\s+/g," ").trim().length : 0');
    await ctx.close();

    const noJsCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const noJsPage = await noJsCtx.newPage();
    await noJsPage.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
    await noJsPage.waitForTimeout(500);
    const noJsText = await noJsPage.evaluate(`(() => {
      ${PAGE_HELPERS}
      let n = 0;
      for (const el of document.querySelectorAll('h1,h2,h3,p,li,a,span,td')) {
        if (visible(el)) n += (el.innerText || '').replace(/\\s+/g,' ').trim().length;
      }
      return n;
    })()`);
    await noJsCtx.close();

    if (jsText > 200 && noJsText < jsText * 0.3) {
      FAIL(
        'content not gated on JS',
        `only ~${noJsText} visible characters without JS vs ~${jsText} with it (${Math.round((noJsText / jsText) * 100)}%). ` +
          `Elements are likely animating FROM opacity:0 — a crawler sees an empty page. Animate from visible instead.`
      );
    } else if (jsText > 200) {
      PASS('content not gated on JS', `~${Math.round((noJsText / jsText) * 100)}% of text still visible with JS disabled`);
    }
  }

  /* ============ 3. REDUCED MOTION ============ */
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(300);

    const rm = await page.evaluate(`(() => {
      const w = window.__wd;
      const offenders = [];
      for (const [el, props] of w.animatedProps) {
        const moving = props.filter(p => /transform|translate|scale|rotate|top|left|right|bottom|width|height|margin/i.test(p));
        if (moving.length) {
          offenders.push({ tag: el.tagName ? el.tagName.toLowerCase() : '?', props: moving });
        }
      }
      // Nothing may be left stranded mid-transform either.
      const stranded = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (parseFloat(cs.opacity) === 0 && (el.innerText || '').trim().length > 8) {
          stranded.push(el.tagName.toLowerCase());
        }
        if (stranded.length >= 5) break;
      }
      return { offenders: offenders.slice(0, 6), stranded: stranded.slice(0, 5), lenis: !!(window.Lenis || document.documentElement.classList.contains('lenis')) };
    })()`);

    if (rm.offenders.length) {
      FAIL(
        'reduced motion',
        `${rm.offenders.length} element(s) still animate movement under prefers-reduced-motion: ` +
          rm.offenders.map((o) => `<${o.tag}> ${o.props.join('/')}`).join(' | ') +
          `. Reduced motion means collapse to opacity-only, not "keep going".`
      );
    } else {
      PASS('reduced motion', 'no transform/position animation runs under prefers-reduced-motion');
    }
    if (rm.stranded.length) {
      FAIL('reduced motion', `content left at opacity:0 under reduced motion: <${rm.stranded.join('>, <')}>. A CSS-only media block does not stop a JS reveal.`);
    }
    if (rm.lenis) {
      FAIL('reduced motion', 'Lenis is still initialised under prefers-reduced-motion. A CSS media block does not stop a JS smooth-scroll instance — read the media query in JS and skip init.');
    }

    await ctx.close();
  }

  /* ============ DESIGN.md TOKEN CONFORMANCE ============
   * Closes the drift hole: every other gate proves the page WORKS or doesn't
   * LOOK GENERATED. None of them prove it matches the decisions we wrote down.
   * A hero that quietly ends up #DC2626 when DESIGN.md says kraft-and-slate
   * passes all twelve other gates.
   *
   * Skips silently (INFO) when there is no DESIGN.md — this must not break
   * runs on pages we did not design.
   */
  {
    const designPath = path.resolve(
      getFlag('design', path.join(path.dirname(url.replace(/^file:\/\//, '')), 'DESIGN.md'))
    );
    let md = null;
    try { md = fs.readFileSync(designPath, 'utf8'); } catch { /* none */ }

    if (!md) {
      INFO('design tokens', 'no DESIGN.md found — token conformance not checked. Pass --design=<path> to enable.');
    } else {
      // Declared palette: every hex in the file. Declared faces: the type rows.
      const hexes = new Set(
        (md.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toLowerCase())
      );
      const faces = new Set();
      for (const m of md.matchAll(/\*\*(?:Display face|Body face|Fonts?)\*\*\s*\|?\s*([^|\n]+)/gi)) {
        for (const f of m[1].split(/[,/]/)) {
          const clean = f.trim().replace(/[`*<>]/g, '').split(/\s+\d/)[0].trim();
          if (clean && clean.length < 40) faces.add(clean.toLowerCase());
        }
      }

      if (!hexes.size) {
        INFO('design tokens', `DESIGN.md at ${designPath} declares no hex colours — nothing to check against.`);
      } else {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
        const used = await page.evaluate(() => {
          const toHex = (v) => {
            const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(v || '');
            if (!m) return null;
            if (m[4] !== undefined && parseFloat(m[4]) === 0) return null; // fully transparent
            return '#' + [m[1], m[2], m[3]]
              .map((n) => (+n).toString(16).padStart(2, '0')).join('');
          };
          const colors = new Map(), fonts = new Map();
          for (const el of document.querySelectorAll('body *')) {
            const cs = getComputedStyle(el);
            if (!el.getClientRects().length) continue;
            const tag = el.tagName.toLowerCase();
            for (const prop of ['color', 'backgroundColor', 'borderTopColor']) {
              const h = toHex(cs[prop]);
              if (h && !colors.has(h)) colors.set(h, `${prop} on <${tag}>`);
            }
            const fam = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
            if (fam && !fonts.has(fam.toLowerCase())) fonts.set(fam.toLowerCase(), `<${tag}>`);
          }
          return { colors: [...colors], fonts: [...fonts] };
        });
        await ctx.close();

        const dist = (a, b) => {
          const p = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
          const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
          return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        };
        // Browser defaults nobody declares — not drift, just unstyled.
        const DEFAULTS = new Set(['#000000', '#ffffff']);
        const foreign = [], near = [];
        for (const [hex, where] of used.colors) {
          if (hexes.has(hex) || DEFAULTS.has(hex)) continue;
          let closest = null, best = Infinity;
          for (const d of hexes) { const dd = dist(hex, d); if (dd < best) { best = dd; closest = d; } }
          (best <= 24 ? near : foreign).push({ hex, where, closest, best });
        }

        if (foreign.length) {
          FAIL('design tokens',
            `${foreign.length} colour(s) on the page are not in DESIGN.md: ` +
            foreign.slice(0, 6).map((f) => `${f.hex} (${f.where})`).join(', ') +
            `. Either add them to the token set deliberately or fix the build — this is the build drifting from its own decisions.`);
        } else {
          PASS('design tokens', `every rendered colour is in the DESIGN.md palette (${hexes.size} declared)`);
        }
        if (near.length) {
          WARN('design tokens',
            `${near.length} colour(s) are close to a token but not equal — likely hand-tweaked: ` +
            near.slice(0, 5).map((n) => `${n.hex} ≈ ${n.closest}`).join(', '));
        }

        if (faces.size) {
          const offFace = used.fonts.filter(([f]) =>
            ![...faces].some((d) => f.includes(d) || d.includes(f)) &&
            !/^(system-ui|-apple-system|sans-serif|serif|monospace|ui-|inherit)/.test(f));
          if (offFace.length) {
            WARN('design tokens',
              `font families not declared in DESIGN.md: ` +
              offFace.slice(0, 4).map(([f, w]) => `${f} ${w}`).join(', '));
          } else {
            PASS('design tokens', `type faces match DESIGN.md (${[...faces].join(', ')})`);
          }
        }
      }
    }
  }

  await browser.close();

  /* ============ REPORT ============ */
  const icon = { PASS: '  ok  ', FAIL: ' FAIL ', WARN: ' warn ', INFO: ' info ' };
  console.log('\n─── prove.js ' + '─'.repeat(52));
  console.log('target: ' + url);
  console.log('widths: ' + widths.join(', ') + (wantShots ? `\nshots:  ${outDir}` : ''));
  console.log('─'.repeat(65) + '\n');
  for (const r of results) {
    console.log(`[${icon[r.level]}] ${r.check}\n            ${r.detail}\n`);
  }
  const fails = results.filter((r) => r.level === 'FAIL');
  console.log('─'.repeat(65));
  console.log(
    fails.length
      ? `VERDICT: ${fails.length} FAIL — not ready to deliver.`
      : `VERDICT: clean across ${results.filter((r) => r.level === 'PASS').length} checks.`
  );
  console.log('─'.repeat(65) + '\n');

  fs.writeFileSync(path.join(outDir, 'prove-report.json'), JSON.stringify({ url, widths, results }, null, 2));
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error('prove.js crashed:', e);
  process.exit(2);
});
