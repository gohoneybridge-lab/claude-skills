# Prove-It referee (V1.5) — the independent skeptic

The grader-is-also-builder trap: the session that built a thing shares its own
blind spots when it checks that thing. A "verified" stamp from the same optimistic
context is worth less than an honest "not proven". V1.5 closes this by making an
**independent referee** re-judge every upgrade-to-verified from a FRESH context that
sees only the claim and the raw evidence — never how it was built, never prove-it's
own verdict.

## When the referee runs

Only on items prove-it is about to mark **verified** (bin-1 passes). It gates the
upgrade. Items going to needs-human / undecidable / failed are honest downgrades
already and do NOT need a referee - downgrading is always safe.

## How to spawn it (fresh context, not this session)

Spawn the referee as a subagent (the Agent tool). It gets a self-contained prompt
containing ONLY:
- the claim text (the assumed item, verbatim),
- the recipe type used (`command` / `http` / `db_row` / `browser+orthogonal-signal`),
- the RAW evidence artifact(s): the actual command+exit+output, HTTP status+body,
  DB query+rows, or screenshot description + the orthogonal signal - copied from
  `.claude/evidence/<date>/`, NOT prove-it's interpretation of them.

It must NOT receive: the builder's reasoning, the session narrative, prove-it's
verdict line, or any "this passed" framing. Independence is the whole point.

Default is a **single referee**. For high-stakes items (money-adjacent, security,
prod, anything under `src/lib/credentials.ts` or auth), spawn a **panel of 3** and
require majority CONFIRMED.

## The referee's job (adversarial by default)

Prompt the referee to assume the claim is guilty until the evidence proves it, and
to try to REFUTE it. It checks:
- Does the evidence actually ESTABLISH the claim, or merely coexist with it?
- Is there a genuine orthogonal signal, or only a screenshot? (A screenshot alone
  never confirms - it can show a loaded-but-broken page, or an empty box that means
  two opposite things.)
- Could the same evidence be equally consistent with the claim being FALSE?
- Is the evidence stale relative to the claimed git SHA?
- For `db_row`: was it read through the authed/RLS path, or a service-role/direct
  read that does not prove the intended user can see it?

## Verdict space (skeptical default)

- **CONFIRMED** - the evidence unambiguously establishes the claim. Only this
  verdict permits writing "verified".
- **REFUTED** - the evidence contradicts the claim or clearly fails to support it.
- **INSUFFICIENT** - the evidence is too weak or ambiguous to prove the claim.

Ties go to skepticism: when uncertain, return INSUFFICIENT, never CONFIRMED. The
referee returns one verdict plus a one-line reason.

## What prove-it does with the verdict

- **CONFIRMED** (or majority CONFIRMED on a panel) → write "verified", and append
  `referee: confirmed (fresh-context)` next to the evidence path.
- **REFUTED / INSUFFICIENT** → do NOT write "verified". Downgrade to needs-human
  (or undecidable) and record the referee's reason verbatim. This is a downgrade,
  always allowed under the asymmetric write rule.

## Default = audit the evidence, not re-run it

The referee is an **evidence auditor**: it re-judges the captured evidence. It does
NOT re-execute the check, because re-execution can re-spend credits, re-drive live
properties, and hit the same human-gates. Independent RE-EXECUTION is a heavier
opt-in, allowed ONLY for owned-oracle, non-billed, non-gated checks and only when
the user asks for it explicitly. Never let a referee spend money or touch a client
property to "double-check".
