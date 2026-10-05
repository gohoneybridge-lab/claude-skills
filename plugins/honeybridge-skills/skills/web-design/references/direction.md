# Direction — resolving the taste conflict

Two installed skills both claim the design step and they do **not** agree.

| | `ui-ux-pro-max` | `frontend-design` |
|---|---|---|
| Method | Search a CSV catalog, return the best-scoring system | Derive the look from this specific subject, then take one justified risk |
| Strength | 96 palettes, 57 pairings, 99 UX rules, 13 stack idiom sets, real a11y floors | Names the AI-design clichés and forbids them |
| Failure mode | Same input category → same output, forever | No data behind it; can drift into arbitrary |

Run `python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "local restaurant service warm" --design-system` and you get Playfair Display SC + `#DC2626` red + `#CA8A04` gold, "Hero-Centric + Conversion", every time. That output is *competent*. It is also exactly what every other agency's AI produced for every other restaurant this year.

## The rule

**`ui-ux-pro-max` supplies floors and mechanics. `frontend-design` supplies identity. The brief outranks both.**

**Take from `ui-ux-pro-max`:**
- Accessibility and interaction floors (contrast ratios, tap targets, focus, reduced motion)
- Stack idioms — `--stack nextjs|shadcn|astro|html-tailwind|react|vue|svelte` etc. (13 available; the SKILL.md table under-reports them)
- Landing-page structure inventory and CTA placement — *what sections exist*, not what they look like
- Chart selection (`--domain chart`), icon sets (`--domain icons`)
- Font-pairing **mechanics** — which weights/widths hold together technically
- The anti-pattern list and pre-delivery checklist

**Never take from `ui-ux-pro-max`:**
- The final palette
- The display typeface
- The named "style"
- The signature element

Those four are the identity. They come from the subject's own world — its materials, vernacular, artifacts — per `frontend-design`.

## The default test

After generating a system, ask one question:

> Would this exact output appear for *any other business in this category*?

If yes, it is a default, not a choice. Keep the **structure** it recommended; replace the **identity**. Say in `DESIGN.md` what you replaced and why — that sentence is the deliverable, not decoration.

Also run `frontend-design`'s own calibration: if the direction landed on (1) cream `#F4F1EA` + high-contrast serif + terracotta, (2) near-black + one acid accent, or (3) broadsheet hairline rules with zero radius — and the brief did not ask for it — it is a default. Revise and record the change.

### Then run the test mechanically

`npx impeccable detect` implements that judgment call as 60 deterministic rules, no API calls:

```bash
npx impeccable detect <file-or-dir-or-url>     # human-readable
npx impeccable detect --json <target>          # CI / parsing
```

It catches the tells by name — `cream-palette` (it flags `#F4F1EA` specifically), `italic-serif-display`, `hero-eyebrow-chip`, `ai-color-palette` (purple/violet), `gradient-text`, `numbered-section-labels`, `codex-grid-background`, `gpt-thin-border-wide-shadow`, `pulsing-dot`, `ghost-cards`, `over-rounding`, `marketing-buzzword`, `theater-slop-phrase`, `em-dash-overuse` — plus craft floors like `low-contrast`, `tight-leading`, `line-length`, `cramped-padding`, `skipped-heading`.

**Run it twice: on the direction, and again on the built page.** A direction that clears the detectors and a build that doesn't means the tokens drifted during implementation.

Waivers are legitimate when the brief pins the axis — an editorial client may genuinely want `italic-serif-display`. Record them rather than ignoring the finding:
```bash
npx impeccable ignores add-value overused-font Inter --reason "Brand font"
# or inline, scoped to one file:
# <!-- impeccable-disable italic-serif-display: editorial brand, per brand book -->
```

**This does not replace the judgment.** The detectors catch *known* tells. A direction can clear all 60 and still be forgettable — that is what the question above is for.

## Which file is the source of truth

Three installed tools write a file called `DESIGN.md`. Getting this wrong silently destroys work.

| File | Written by | Role |
|---|---|---|
| `DESIGN.md` (project root) | `/impeccable init`, then extended by Phase 2 | **Canonical.** Impeccable parses it and detects drift against it (`design-md-drift`, `design-md-coverage`) |
| `PRODUCT.md` | `/impeccable init` | Audience, voice, product context — the brief, persisted |
| `extracted/DESIGN.md` | `skillui` | **Input, never truth.** What a site *currently* looks like |
| `design-system/<project>/MASTER.md` | `ui-ux-pro-max --persist` | Generated candidate + page overrides |

**Rule: `DESIGN.md` at the project root is the single source of truth.** Never point `skillui --out` at the project root — it will overwrite it. Always `--out ./extracted/`.


**When the brief pins an axis, the brief wins outright**, including when it asks for one of those looks. A client with an existing brand book is a pinned axis: match it, don't improve it.

## Conflict resolution

| Conflict | Winner |
|---|---|
| Brief vs. either skill | **Brief** |
| Identity choice (palette, display face, signature) | `frontend-design` |
| Accessibility or performance floor | `ui-ux-pro-max` — a distinctive palette that fails 4.5:1 is not distinctive, it is broken |
| Section structure / CTA placement | `ui-ux-pro-max`, then interrogate it against the brief |
| Motion | `references/motion.md` — neither skill owns this |

Contrast is the usual collision: a bold direction produces a beautiful accent that lands at 3.8:1 on its background. Do not abandon the direction. Adjust the *pairing* — darken the accent for text use, keep it at full chroma for fills and borders where the 4.5:1 rule does not apply. `prove.js` catches it either way.

## DESIGN.md — the artifact

`--persist` writes `design-system/MASTER.md` plus `design-system/pages/*.md` overrides. Use it, then **rewrite the identity sections in place** and add a `## Direction` block at the top recording:

1. Subject, audience, and the page's single job (one line each)
2. Palette — 4–6 named hex values, with what each is *for*
3. Type — display / body / utility, and why these and not the catalog's pick
4. Layout concept — one sentence
5. Signature — the one element the page is remembered by
6. Motion plan — which patterns from `references/motion.md`, and the budget tier
7. **What was replaced from the generated system, and why**

Everything downstream reads this file. Page-level overrides in `design-system/pages/<page>.md` beat `MASTER.md`; check for the page file first, fall back to master.


## Optional: Mobin (not connected here)

`mobbin.com` is a browsable library of real product screens and flows with an MCP, which turns
Phase 3's "what are leading sites in this category doing" from manual browsing into a query,
and can produce mood-board and competitive-report deliverables for a client. **Not connected
on this machine** — it needs an account and an MCP connector. Refero covers most of the same
ground for design systems; Mobbin is stronger on *flows* and on app UI.

Same rule applies as everywhere else in this phase: what comes back is reference, not
direction. Translate, never copy — those are other companies' brands.
