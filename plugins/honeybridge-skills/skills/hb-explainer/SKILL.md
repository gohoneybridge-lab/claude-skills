---
name: hb-explainer
description: Draws a Honey Bridge hand-drawn explainer illustration of how a system or flow works, as SVG written by Claude (no image model). White background, wobbly black line, sparse red/orange/blue handwritten labels, and "Bee" (our character) doing the core action. Use when asked to "draw how X works", "explain this flow as a picture", "make an explainer illustration", "redraw the <flow> picture", or when Meena's Brain tab says a flow picture is out of date. Output always lands as a DRAFT for the operator to accept in Meena's Brain tab.
---

# hb-explainer

Turn one flow into one picture a person gets in about ten seconds. Adapted from Ian's
ian-xiaohei-illustrations (MIT, see NOTICE.md): same discipline, our character, English labels,
and SVG written by hand instead of an image model.

## Where things live

- Flow manifests: `~/.claude/hb-log/brain/flows/<id>.json` (title, summary, metaphor, poses, sources, steps)
- Pictures: `<id>.svg` = accepted (never overwrite), `<id>.draft.svg` = what you write
- Character: `~/.claude/hb-log/brain/art/bee-poses.svg` (copy `#bee-body` + the pose `<symbol>` you need)
- Brain tab: http://localhost:7717/meena/brain (the operator accepts or rejects drafts there)
- Spec: `~/Documents/Finalize/visual-brain/spec.md`

## Workflow

1. **Read the truth, not your memory.** Read every file in the manifest's `sources` (only the
   named section or matching lines matter). If the flow changed, update the manifest `steps` first.
   Every label you draw must map to a step. Inventing a step is the worst failure: a wrong
   picture looks authoritative.
2. **Pick one metaphor.** One physical action (sort, build, stamp, pull, carry, inspect) and 1-2
   low-tech objects (mail room, bridge, jar, gate, chute, desk). Keep the manifest's metaphor
   unless the flow's shape changed. Bee must DO the core action: if you can delete Bee and the
   picture still makes sense, Bee is decoration. Redo it.
3. **Write the SVG** from `references/template.svg`. 1600x900 viewBox, white background, the
   `wobble` filter on every drawn group, labels in Caveat. See `references/style.md`.
4. **Render and look.** `bash ~/.claude/skills/hb-explainer/scripts/render.sh <svg> <out.png>`
   then Read the PNG. Check `references/qa-checklist.md`. Fix overlaps (labels on arrows, arrows
   through Bee) and re-render. Two rounds is normal.
5. **Save as draft.** (Unattended runs from `brain_redraw.py` get a work folder instead and must write only there; the job installs and marks the draft.) Interactively: write `<id>.draft.svg`, then run
   `python3 ~/.claude/skills/hb-explainer/scripts/mark_draft.py <id> "<one-line note>"` so the
   Brain tab knows which source version the draft was drawn from.
6. Tell the operator the draft is waiting in Meena → Brain. Never copy a draft into a client document.

## Hard rules

- At most 8 labels, each at most 5 words. English. No title in a corner.
- Colours carry meaning: orange = main flow, red = problem, warning or a human gate,
  blue = side note, feedback loop or system state. Black for objects and plain labels.
- No em dashes or en dashes in labels.
- One idea per picture. If it needs 12 boxes it is two pictures.
- Never reuse a previous picture's composition for a different flow.

## Deep dives (for a whole system, not one flow)

When the ask is "help me UNDERSTAND and EXPLAIN <system>", one picture is not enough. Build a deep
dive in `~/.claude/hb-log/brain/dives/<id>/` (copy `app-backend/` as the template): read the real code
(a snapshot of origin/main, split across Explore agents), verify every claim with a file:line, draw
numbered diagrams with `brain/tools/diagram.py` (numbers match numbered steps in `content.html`), and
include where-it-breaks, a 2 and 10 minute script, and a check-yourself quiz. Never state an agent's
claim as fact without reading the lines yourself.

Deep dives are INTERACTIVE (the operator, 2026-09-24): the map is the page. Every box / numbered arrow is a
hotspot; `chapters.py` gives each a plain-English `s` (what you see first, use an everyday comparison)
and a robust `d` (files, line numbers, why) behind a "More detail" dropdown, plus a walking `order`.
Validate that every `data-hs` in each SVG has an entry before shipping (see app-backend build check).
Do not go back to image-then-long-text sections.
Every deep dive also gets an "Audio explanation": after editing chapters.py, run
`python3 ~/.claude/hb-log/brain/tools/narrate.py <dive-id>` (Meena's Kokoro voice, clip per step, word timings;
add a `v` field to a hotspot when the spoken version should differ from `s`). Check the preview of the script for
symbols that read badly aloud before rendering.
