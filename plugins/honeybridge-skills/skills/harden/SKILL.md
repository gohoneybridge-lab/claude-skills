---
name: harden
description: >-
  Takes an approved product spec (from /finalize) OR an existing repo and
  elevates it to a checkable industry standard. Scores it against a rubric
  (rubric.yaml), produces a hardened spec plus a gap-report scorecard, and
  clone-and-fills a trusted local template into a runnable reference scaffold.
  The handoff line: "/finalize decides WHAT to build; /harden decides HOW
  WELL, and hands you the skeleton." Invoke manually when a spec or project is
  ready to be pushed to production-grade quality — triggers: "/harden <path>",
  "harden this", "make this production-grade", "golden-standard this",
  "audit this repo against the rubric", "score this spec". Do NOT trigger on
  casual mentions of "done" or "finished" mid-work — this fires only on an
  explicit request to harden a specific spec or repo.
---

# /harden — golden industry-standard elevation

`/finalize` decides WHAT to build and ends at an approved `spec.md`. **`/harden`
decides HOW WELL, and hands you the skeleton to start.** It is a thin
orchestration layer, not a monolith: it scores against a checkable rubric,
delegates the actual checks to skills you already have, and produces a runnable
scaffold by copying a trusted template — never by hallucinating 40 files.

Everything after `/harden` is the TARGET: a path to a `spec.md`, or a path to
an existing repo. If none was given, ask for one and stop.

## The core principle (do not violate)

"Golden industry standard" is a **checkable rubric, not a vibe.** The rubric
lives in `rubric.yaml` next to this file — that file is the product; this file
is choreography around it. If a rubric item can't be ticked pass/fail from the
code or spec, it is an opinion, not a rubric item — it does not get scored.

## Step 1 — Determine the input and gate it

1. Decide what the target is:
   - **A spec** (`*.md` that reads like a finalize spec) → spec mode.
   - **A repo/directory** → re-audit mode (score real code, same rubric).
2. Read `rubric.yaml` (sibling of this file). It defines `core` (always scored)
   and `addons` per stack.
3. **Thin-spec gate (mandatory, spec mode).** Judge whether the spec is
   concrete enough to score honestly — does it name real features, a stack, and
   acceptance criteria? If it is a vague one-paragraph sketch, **HALT** and say
   so: "This spec is too thin to score honestly — scoring it would invent a
   standard rather than measure one. Flesh it out (or run /finalize on it)
   first." Do NOT emit a confident scorecard on a spec that can't support one.
   That confidently-wrong output is worse than no output.

## Step 2 — Resolve the stack (ask, don't guess)

Ask the user ONE question: **"Is this a web app, or something else?"** (via
AskUserQuestion, or plainly on hosts without modals). Do not build stack
auto-detection — it misfires on thin specs.

- **web** → score `core` + `addons.web`. This stack is fully scaffoldable (v1).
- **other** (game / cli / …) → score `core` + the matching `addons` block if it
  has items (v1 ships those blocks empty; core still applies). Tell the user the
  reference scaffold is web-only in v1, so for non-web targets you'll deliver the
  hardened spec + gap report without a scaffold.

## Step 3 — Score against the rubric (orchestrate, don't reinvent)

Walk every applicable rubric item. For each, decide PASS / FAIL / N-A with a
one-line evidence pointer (a `file:line`, a spec section, or "not present").

**Delegate to existing skills where the item names a `via:`** — do not
re-implement security, accessibility, or design checks:
- `via: security-check` → use the **security-check** skill's judgment for that item.
- `via: web-design-guidelines` → use **web-design-guidelines**.
- `via: ui-ux-pro-max` → use **ui-ux-pro-max**.
- `via: verify` → use the **verify** skill to confirm tests actually exercise the code.

If a delegated skill isn't available in the session, score the item yourself
from the evidence and note that it was scored directly, not via the specialist.

**Benchmark context (optional, honest).** If the user wants a "vs category
leaders" read, get it from `/last30days` (fresh) — never from memory — and label
it as dated, low-confidence context. Never present an auto-picked leader
comparison as an objective score. The rubric is the score; leaders are color.

## Step 4 — Emit the outputs

Write to the target's directory (spec mode: next to the spec; repo mode: repo
root), overwriting on re-run (idempotent):

1. **`gap-report.md`** — the scorecard:
   - Overall score per block (e.g. "core 4/6, web 3/5").
   - A table: rubric id · PASS/FAIL/N-A · evidence pointer · severity.
   - A "**Fix these first**" list, high-severity FAILs first.
2. **`golden-spec.md`** (spec mode) — the original spec with every FAIL/relevant
   rubric requirement folded in as an explicit, testable acceptance criterion.
   Preserve the Spec-Kit-compatible shape so downstream build tools can consume it.

## Step 5 — Produce the reference scaffold (web, clone-and-fill only)

**Never hand-generate a project from scratch.** For a web target:

1. Copy the trusted template at `templates/web-nextjs-supabase/` (sibling of
   this file) to the target location the user names.
2. **Fill, don't rebuild:** edit the copied template to the spec — rename, adjust
   routes/models, wire the spec's real features. The tests, CI, security headers,
   and observability hooks come from the verified template and stay intact.
3. If no matching local template exists for the chosen stack, say so and stop at
   the hardened spec + gap report — do not improvise a scaffold.

The template is a seed, not a cage: it exists so the production-grade plumbing is
real and verified, and the agent only has to add the product-specific parts.

## Step 6 — Confirm

Tell the user, briefly: the score (headline number), the top 1-3 fixes, the file
paths written, and (if built) where the scaffold landed. Don't reprint the whole
gap report.

## Notes / v1 boundaries

- v1 scaffolds **web only** (one template). Other stacks are scoreable now,
  scaffoldable later — add an `addons.<stack>` block + a `templates/<stack>/`
  seed when you actually build in that stack.
- v1 does **not** build the finished product — it stops at hardened spec +
  scaffold. Building it out is a separate instruction.
- Keep `rubric.yaml` as data and bump its `version` when the standard moves, so
  old hardened builds aren't silently re-judged.
- This is a personal tool. It is authored as data (rubric.yaml) so it *could*
  become a distributable audit later, but that is explicitly not built now.
