# The opportunity audit — REDESIGN lane

`prove.js` answers *"is the page we built broken?"* This answers a different question:
**"what is wrong with what they have, and what is that worth to them?"** One is a build gate,
the other is the argument for the project. They are not substitutes.

Run this before touching anything on a REDESIGN, for three reasons: it is the before-half of
the before→after client report, it is what justifies the invoice, and doing it after you have
already redesigned is just describing your own work.

## Two passes, deliberately

### Pass 1 — the messy one

Go wide and do not edit yourself. Write `audit-raw.md` and let it be long, duplicated and
unpolished. **A real site produces 60–120 findings.** If you have twelve, you skimmed.

Cover: information architecture and nav · conversion path and CTAs · copy and clarity ·
visual hierarchy and craft · responsive behaviour at 375/768/1440 · accessibility ·
performance and Core Web Vitals · SEO basics and metadata · trust signals and proof ·
forms · local signals (NAP, hours, map) · anything that made you wince.

For each finding record: what you saw, where (page and element), why it matters, and how
confident you are. **Label assumptions as assumptions.** Do not invent analytics you cannot
see — "bounce rate is probably high" is not a finding, it is a guess wearing a suit.

Look at the rendered page, not only the markup. A site can be flawless in source and unusable
on a phone.

### Pass 2 — the client-ready one

Now condense. `audit-report.md` (or a docx via
`~/.claude/templates/client-report-docx.js`) is a different document for a different reader:

- **What's working** — first, and genuinely. An audit that opens with fifteen failures reads
  as a sales pitch and puts the client on the defensive.
- **The critical few** — three to five things that actually cost them money, each with the
  business consequence, not the technical description. "The phone number isn't a link on
  mobile" → "a customer on a phone can't call you in one tap."
- **Prioritised recommendations** — high / medium / low, with effort alongside impact.
- **Next steps** — what we'd do first and why.

Never paste Pass 1 into a client's hands. It is our thinking, not their document.

## The rule that matters more than the format

**Do not let the audit do your thinking.** The findings are raw material; deciding which
opportunities the redesign actually addresses, and how, is the job you are being paid for. A
designer who cannot explain *why* a fix solves the problem it claims to solve has outsourced
the only part a client cannot get elsewhere.

Carry the chosen opportunities into `CONTEXT.md` as requirements, so the build is answering
them by construction rather than by coincidence — and so Phase 12 can show, item by item, that
each one was addressed.

## Feeding it back into QA

The audit is also a **per-project QA checklist**. Findings you committed to fixing become
checks: after the build, walk the list and confirm each one is actually resolved on the new
page. This is the specific thing that turns "we redesigned it" into "we fixed these eleven
things you were losing customers to."
