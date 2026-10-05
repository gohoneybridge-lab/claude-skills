# QA checklist (read the rendered PNG, not the SVG source)

Must pass:
- [ ] White background, 16:9, nothing clipped at the edges.
- [ ] Bee is present and doing the core action (delete-Bee test fails the picture if it still makes sense without Bee).
- [ ] Every label maps to a step in the manifest. No invented steps, numbers or promises.
- [ ] 8 labels or fewer, each 5 words or fewer, no em/en dashes.
- [ ] No label sits on top of a line, arrow, object or another label.
- [ ] No arrow passes through Bee's face or body.
- [ ] Colours follow the meanings: orange flow, red gate/problem, blue loop/side note.
- [ ] One idea. Someone who has never seen the system gets the gist in ten seconds.

Failure signals, and the fix:
- Looks like a flowchart or slide → fewer boxes, one physical metaphor, let Bee do the work.
- Too busy → cut to 3-5 objects and the labels that matter.
- Bee floating → put its feet on the surface it stands on (feet sit at y=125 of the 140 symbol box).
- Label collision → move the label; keep arrows smooth.
