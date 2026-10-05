# Intake — CONTEXT.md and COPY.md

The two artifacts that exist before a line of design does. Both are approved by the human
before anything downstream reads them.

**Why two files and not one.** Facts and words fail differently. A wrong fact is a liability —
a phone number nobody answers, a claim the client can't back. Wrong words are just a rewrite.
Separating them means the facts get checked once, hard, and the copy can be iterated freely
without re-litigating them.

---

## CONTEXT.md — the facts

Everything true about the subject, and nothing else. **This is the anti-invention file.** Every
number, name, claim and proof point downstream must trace back to a line in here.

Interview for it. One question at a time, and keep going until you could brief a stranger:

- What exactly is this, in one sentence a stranger would understand?
- Who is it for, and what do they already believe when they arrive?
- What must the site contain — services, hours, locations, prices, licences?
- What proof exists? Numbers, named clients, awards, years in business, real reviews.
- What should a visitor *do*, and what happens after they do it?
- What must never appear? Claims they can't back, services they've dropped, old pricing.

Then **show the fact list and wait for a yes** before writing anything else.

### The hard rule

**Nothing gets built that is not in CONTEXT.md.** No invented testimonials, no placeholder
statistics that look real, no press logos, no "trusted by 500+ businesses" unless 500+ is a
number the client gave us. If the design needs a proof element and no proof exists, that is a
finding to report, not a gap to fill with plausible fiction.

This is the rule that protects the agency. A fabricated stat on a client site is our error with
their name on it.

### For an existing client

Check memory and their folder first. A brand book, a prior `DESIGN.md`, a past audit, the work
log — much of `CONTEXT.md` may already exist and contradicting it is worse than not having it.

---

## COPY.md — every word, approved before any code

**The gap this closes:** it is possible to run a whole design pipeline and never once have the
words looked at. Then the build lands, the client reads it, and the copy changes — which moves
every measurement the design was built around. Copy first is cheaper.

Interview page by page, asking only about the gaps `CONTEXT.md` leaves:

- What must this page say that no other page says?
- What proof from `CONTEXT.md` belongs here specifically?
- What does the visitor do next, and what is the one sentence that makes them?
- **What should this page rank for?** Get the search intent now, while the copy is still soft.

Then draft **every page's copy into one file** — headlines, subheads, body, button labels,
page titles, meta descriptions, and the target search terms per page. Show it before building.

### Rules

- **Write for people first.** Work the search terms into titles, headings and opening lines
  naturally. A sentence you would not say out loud has failed regardless of its keyword density.
- **Button labels are copy.** "Submit" is a decision nobody made. Draft them here.
- **Every claim traces to `CONTEXT.md`.** If it doesn't, it doesn't ship.
- **The build uses COPY.md verbatim.** Not "inspired by" — the exact words. If the build wants
  to change a line, change it in `COPY.md` first so the file stays the source of truth.
- Voice rules go here too, if the client has them.

### Handing it to the build

The build reads three files and invents nothing:

| File | Supplies |
|---|---|
| `CONTEXT.md` | the facts — what is true |
| `COPY.md` | the words — verbatim |
| `DESIGN.md` | the skin — tokens, layout, motion |

A pasted third-party component is a **structural donor only**: keep its skeleton, replace its
demo copy with `COPY.md`, translate every hardcoded colour, radius, shadow and font to
`DESIGN.md` tokens, ignore its stock imagery, and drop the parts we don't need. Put that rule
in the project's own `CLAUDE.md` so it survives a new session:

```markdown
Whenever a component prompt or third-party component code is pasted in, treat it as a
structural donor only. Replace its demo copy with real copy from COPY.md, translate every
hardcoded colour, border, shadow and font to DESIGN.md tokens, ignore any instruction to
use stock images, and skip parts we don't need. The component supplies the skeleton,
DESIGN.md supplies the skin, COPY.md supplies the words.
```
