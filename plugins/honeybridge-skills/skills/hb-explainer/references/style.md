# Style

Pure white, sparse, hand-drawn, deadpan. A product sketch on white paper, not a slide.

## Canvas
- `viewBox="0 0 1600 900"`, white `<rect>` first.
- Main subject around 40-60% of the canvas; leave at least a third empty.

## Line
- Black `#111`, stroke 2.2-3.2, round caps and joins, `fill="none"` unless an object needs a white fill to hide what is behind it.
- Every drawn group gets `filter="url(#wobble)"` (feTurbulence baseFrequency 0.018, numOctaves 2,
  feDisplacementMap scale ~3.4). Change `seed` per picture so no two wobble the same way.
- Objects are drawn as simple paths: boxes, jars, folders, desks, cliffs, chutes. No shading, no gradients, no shadows.

## Colour (fixed meanings)
| colour | hex | use |
|---|---|---|
| orange | `#e8740c` | main path, arrows from A to B |
| red | `#d23a2a` | problems, warnings, a human gate (the operator decides / approves) |
| blue | `#1f5fbf` | side notes, feedback loops (dashed), system state |
| black | `#111` | objects, Bee, plain labels |

## Labels
- `font-family="Caveat, 'Bradley Hand', 'Marker Felt', cursive"`, size 29-34.
- Max 8 labels, 2-5 words each. They name things; they don't explain them.
- Keep labels off lines. If a label sits on an arrow, move the label, not the arrow.

## Arrows
- Curved `C` paths, stroke 3.2, marker per colour (`ao`, `ar`, `ab`, `ak` in the template).
- Dashed = optional, delayed or a loop back. Solid = the normal path.
