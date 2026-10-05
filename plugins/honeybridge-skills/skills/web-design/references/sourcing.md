# Sourcing — components, assets, measurement, critique

Four capability sets were installed and referenced by no skill. This wires them in.

---

## 1. Components — don't hand-roll the twentieth navbar

**`shadcn` MCP** — the default for anything React/Next.

| Tool | Use |
|---|---|
| `mcp__shadcn__get_project_registries` | What registries this project can pull from — run first |
| `mcp__shadcn__search_items_in_registries` | Find a component or block by intent |
| `mcp__shadcn__view_items_in_registries` | Read the source before installing |
| `mcp__shadcn__get_item_examples_from_registries` | Usage examples — better than guessing the API |
| `mcp__shadcn__get_add_command_for_items` | The exact `npx shadcn add` command |
| `mcp__shadcn__get_audit_checklist` | Post-install verification |

The `vercel:shadcn` skill covers theming, custom registries and composition in depth — load it for anything beyond `add`.

**`21st` MCP** — for what shadcn doesn't have: marketing sections, hero treatments, animated components.

| Tool | Use |
|---|---|
| `mcp__21st__search` | Search the component catalog |
| `mcp__21st__search_picker` | Interactive picker when several would do |
| `mcp__21st__search_logo` | **Real brand SVGs.** Kills the "guessed logo path" anti-pattern outright |
| `mcp__21st__get_inspiration` | Direction hunting during the Direction phase, not during build |
| `mcp__21st__generate` / `iterate_generation` | Generate a component that doesn't exist in either catalog |
| `mcp__21st__get_theme` | Theme scaffolds |

**Rules.**
- Source the **structure**, then re-skin it to `DESIGN.md` tokens. A pasted component still carrying its origin palette is how a site ends up looking templated — the exact thing the Direction phase exists to prevent.
- Read before you install. `view_items_in_registries` costs one call and tells you what dependencies come with it.
- A generated component still has to pass the Prove phase. No exemptions for third-party code.
- Never import a component library wholesale for one component.

---

## 2. Assets — generate what's missing

**`seo-image-gen` explicitly does not generate images** — it plans and stops. Higgsfield picks up there.

| Tool | Use |
|---|---|
| `mcp__claude_ai_Higgsfield__generate_image` | Hero imagery, OG cards, section art, texture |
| `mcp__claude_ai_Higgsfield__models_explore` (`action:'recommend'`) | Pick the model when unsure — do this before generating |
| `mcp__claude_ai_Higgsfield__remove_background` | Product/person cutouts |
| `mcp__claude_ai_Higgsfield__outpaint_image` | Extend a too-tight client photo to a wide hero crop |
| `mcp__claude_ai_Higgsfield__upscale_image` | Low-res client-supplied assets |
| `mcp__claude_ai_Higgsfield__generate_video` | Showcase hero loops only — see `motion.md` #28 |

**Rules.**
- **Real client photography beats generated imagery every time for a local business.** Generated food, storefronts, or staff on a restaurant site is a trust problem, not a design problem. Ask for real photos first; generate only for texture, abstract backgrounds, OG cards, and placeholders explicitly labelled as such.
- **Never generate an image depicting the actual business** — its storefront, its food, its people — and present it as real. That is fabricating a record of a real organization.
- Export at 2× the display size, then compress. WebP/AVIF with a JPEG fallback.
- Every generated asset gets real alt text at build time, not later.
- Reserve dimensions in markup (`width`/`height` or `aspect-ratio`) or you have built a CLS regression.

---

## 3. Measurement — chrome-devtools

Turns the motion budget from prose into a number.

| Tool | Use |
|---|---|
| `mcp__chrome-devtools__lighthouse_audit` | Performance / a11y / SEO / best-practices scores |
| `mcp__chrome-devtools__performance_start_trace` + `stop_trace` | Real LCP/INP/CLS attribution |
| `mcp__chrome-devtools__performance_analyze_insight` | Drill into a specific finding |
| `mcp__chrome-devtools__resize_page` / `emulate` | Device and network throttling |
| `mcp__chrome-devtools__list_console_messages` | Errors that never surface visually |

**Rules.**
- **Mobile, throttled, or it doesn't count.** Desktop unthrottled Lighthouse on localhost is a number that flatters everyone and predicts nothing.
- **Measure before and after any motion pass.** A motion pass that costs Core Web Vitals gets reverted, not defended. If the site has a `seo-drift` baseline, the compare step catches this for free.
- Lighthouse's accessibility score is a floor, not a ceiling — it cannot see focus order, or whether a label describes the right thing. `prove.js` covers some of that gap; your own eyes cover the rest.

---

## 4. Visual critique — look at what you built

`frontend-design` says to screenshot and critique. Nothing wired it. Two paths:

**Static states — `prove.js --shots`** (preferred, deterministic):
```bash
node ~/.claude/skills/web-design/scripts/prove.js <url> --shots --out=./prove-out
```
Writes `<width>-<light|dark>.png` for every width. Then **read those PNGs with the Read tool** — they render visually. No browser profile, no session state, no MCP round-trip.

**Interactive states — `playwright-cli`** (preferred for scripted states). A static screenshot cannot show a hover, an open menu, a focus ring mid-tab, or a validation error. This is a terminal CLI built for coding agents specifically to avoid burning context on tool schemas:

```bash
npx @playwright/cli@latest open http://localhost:3000
npx @playwright/cli@latest snapshot                 # element refs to target
npx @playwright/cli@latest hover "Get started"
npx @playwright/cli@latest screenshot hover.png
npx @playwright/cli@latest click "Menu" && npx @playwright/cli@latest screenshot menu-open.png
npx @playwright/cli@latest press Tab && npx @playwright/cli@latest screenshot focus-1.png
```
Browser state persists between commands in a session (`-s=<name>`); `--persistent` saves a profile to disk. 50+ commands covering input, network mocking, console, tracing.

`claude-in-chrome` remains the right tool when the state requires a **logged-in session** — a client CMS, GBP, GSC — because it uses the real browser profile.

> **Browser profile:** per the global CLAUDE.md, anything touching a client property or account uses the **Honey Bridge browser** profile, regardless of working directory. Playwright (`prove.js`) is a separate browser with no profile and no session, so it is exempt.

**What to actually look for** — the things no detector can catch:
- Does it look like *this* client, or like any site in this category?
- Where does the eye land first, and is that the thing that matters?
- Is the signature element doing work, or is it decoration?
- Does dark mode look designed, or auto-inverted?
- At 375px, is it the same design or a collapsed compromise?
- Is there one element you could remove and lose nothing? Remove it.

---

## 5. Extraction — reading an existing design system

**`skillui`** does static analysis (no AI, no API keys) on a URL, repo, or directory and emits tokens, type, spacing, screenshots and bundled fonts.

```bash
npx skillui --url https://client.com --out ./extracted --mode ultra --no-skill   # --no-skill: do not install into ~/.claude/skills
npx skillui --dir . --out ./extracted --no-skill                       # tokens only
```

**Use it for:**
- **REDESIGN lanes** — capture the client's *current* system first, so the redesign knowingly keeps or breaks brand rather than accidentally losing it. This is also the before-half of a before→after client report.
- **Inheriting an undocumented codebase** — `--dir .` recovers the token set nobody wrote down.

**Rules.** *(Corrected 2026-08-02 after a real run against `client-a.example` — the previous
version of this section understated what it writes. Evidence:
`.claude/evidence/2026-08-02/skillui-real-out.txt`.)*
- **Always `--out ./extracted/`, and never point it anywhere near a project root.** It does
  not write one file — a single run produced **`DESIGN.md`, a second `references/DESIGN.md`,
  `SKILL.md`, `CLAUDE.md`, a `.skill` bundle, `screenshots/homepage.png` (2.3 MB) and 16
  font files.** `CLAUDE.md` is the dangerous one: at a project root it clobbers project
  instructions, which is a worse failure than the `DESIGN.md` collision this section used to
  warn about on its own. See `direction.md` §"Which file is the source of truth".
- **Output nests one level deeper than `--out`.** The real path is
  `<out>/<slug>-design/DESIGN.md`, not `<out>/DESIGN.md`.
- **It installs a skill into `~/.claude/skills/` no matter where you run it.** Not a
  side-effect of the working directory — `--out ./extracted` still produced
  `~/.claude/skills/client-a-design/SKILL.md`, which Claude Code registered as a live
  skill mid-session (observed twice on 2026-08-02: once from the `--out` copy under the
  skills tree, and once installed directly into the skills root). **Pass `--no-skill` to prevent it** — that is the actual fix and it was
  already in the command reference above, unused. If you forget it, check
  `~/.claude/skills/` for a new `<slug>-design/` folder afterwards and delete it unless you
  genuinely want that design system as a permanent skill.
- **Do not trust its `Frameworks:` field.** It reported `None detected` for
  `client-a.example`, a live Next.js 15 site.
- **What it is good at, confirmed:** the token extraction is real and site-specific, not
  scaffolding — it recovered the client's own CSS custom-property names (`client-a-muted`,
  `client-a-red-text`) and a bespoke brand ramp. That part earns its place in Phase 3.
- Extraction output is an **input to Phase 2, never the direction itself.** Shipping a competitor's extracted tokens is reproduction, not reference — the same line `clone-motion` draws for motion.
- Pairs with `clone-motion`: `skillui` gets the static system (colour, type, spacing), `clone-motion` gets the motion. Neither sees what the other does.
