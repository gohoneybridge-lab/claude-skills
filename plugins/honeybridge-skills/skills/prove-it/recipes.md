# Prove-It evidence recipes

Four recipes, supported by convention, not by a schema. A bin-1 item must reduce
cleanly to exactly one of these. If it does not, it is not bin 1 - send it to a
human script (bin 2) or mark it undecidable (bin 3). Do not invent a fifth
recipe to force a pass.

Every recipe: run it, capture the raw output to
`.claude/evidence/<YYYY-MM-DD>/<item-slug>.<ext>`, and stamp the evidence with
the UTC timestamp and git SHA from Step 1.

---

## 1. `command` - a shell command decides it

Use when the claim is provable by running something locally and reading its exit
code and/or output.

PASS = exit code 0, or a specific asserted substring is present in stdout.
FAIL = non-zero exit, or the asserted substring is absent.

```bash
# capture command, stdout, stderr, and exit code together
{ OUT=$( <the-command> 2>&1 ); RC=$?; }
printf 'cmd: %s\nexit: %s\n---\n%s\n' "<the-command>" "$RC" "$OUT"
```

Examples of claims this fits: "the build passes", "typecheck is clean", "the
migration file exists and is valid SQL", "the CLI returns the expected value".

Evidence saved: the command, full output, exit code.

---

## 2. `http` - an HTTP response decides it

Use for anything you can reach over HTTP on a surface you own (localhost, your
own Vercel deploy, your own API route). NEVER use this to hit a billed API or a
client property you do not own - those are bin 2.

Assert on the status code, and where relevant a body substring or header.

```bash
# status + timing + a body snippet in one shot
curl -s -o /tmp/proveit-body.txt -w 'http_status: %{http_code}\ntime_total: %{time_total}s\n' "<url>"
echo '--- body (first 40 lines) ---'
head -40 /tmp/proveit-body.txt
```

PASS = the expected status (usually 200, or a deliberate 3xx/4xx you predicted)
AND, when the claim is about content, the expected body/JSON assertion holds.
FAIL = wrong status, or the body assertion fails.

Do not treat "the page returned 200" as proof the feature works - a 200 can
render an error state. Pair it with a body/JSON assertion when the claim is about
behavior, not just reachability.

Evidence saved: the curl status/timing line and the body snippet.

---

## 3. `db_row` - a database row decides it

Use when the claim is "a record was written / updated / exists" in your own
Supabase (or other DB you own).

**RLS honesty is mandatory.** State which client/role runs the query. A row that
exists under the service-role client may be invisible to a real user under RLS.
Default to the least-privileged path that models the real user flow; if you must
use service-role to confirm existence, note that the check does NOT prove the
row is visible to the intended user.

```bash
# example shape - adapt to how this project queries Supabase
# (supabase CLI, a psql connection string, or a small node/ts script the repo already has)
psql "$DATABASE_URL" -c "select id, created_at from <table> where <predicate>;"
```

PASS = the expected row(s) present with the expected column values, under the
stated role. FAIL = missing row, or wrong values.

Evidence saved: the exact query, the role/client used, and the returned rows.

---

## 4. `browser + orthogonal signal` - a live UI action decides it, but pixels are not enough

Use when the only way to prove the claim is to drive the real UI (a form submit,
a login, a rendered state) on a surface you own. Applies to your own app, NOT to
Google properties (those are always bin 2).

**The orthogonal-signal rule is the whole point of this recipe.** A screenshot
alone is NEVER sufficient. It counts as evidence only when paired with a second,
independent signal captured at the same time:
- a **network response** (read the actual XHR/fetch status + payload after the
  action, via the browser dev-tools / network tools), OR
- a **DOM assertion** (a specific element/text that only appears on real success,
  read from the live DOM, not inferred from the picture), OR
- a **DB row** (recipe 3, confirming the action persisted).

Why: a screenshot can show a page that loaded but is functionally broken, or a
box that looks identical in two opposite states. The empty GBP reply composer is
the canonical trap - it looks the same whether the submit failed or moderation
removed the reply. Pixels cannot disambiguate that; a network response or a
persisted row can.

PROCEDURE:
1. Drive the action with the browser tools.
2. Capture the screenshot (context).
3. Capture the orthogonal signal (the real proof) - network response, DOM
   assertion, or DB row.
4. PASS only if the orthogonal signal confirms success. If you have only the
   screenshot, the result is **inconclusive**, which means bin 3 - not verified.

Evidence saved: the screenshot AND the orthogonal signal (response body / DOM
snippet / DB row), together.

---

## The outbound-effect trap (a claim class, not a recipe)

Some claims are about a **side effect your server had on a third party** - "the
app actually called DataForSEO", "the welcome email was really sent to the
provider", "the webhook fired", "the payment intent hit Stripe". A green `http`
200 from YOUR OWN route does NOT prove any of these: your route can return 200
from a cache, a mock, a stub, or a swallowed error. This is the exact trap the
V1.5 referee caught on the DataForSEO run - a local 200 is consistent with the
upstream call never happening.

Rule: an outbound-effect claim is **bin-3 undecidable UNLESS an owned
observability signal exists** that records the outbound call itself:
- a **server log line** for the request (e.g. `console.log("[dataforseo] live
  call", { path, status, ms })`),
- a **metric / counter** the app increments,
- a **recorded response artifact** the app persists,
- or the provider's **usage/billing delta** (often itself bin-2 - the provider
  dashboard is an account you check by hand).

If such a signal exists, verify against IT (`command`/log grep, or `db_row` on the
counter) - not the local route's status. If none exists, do NOT launder the local
200 into "verified". Say: "undecidable - the app emits no signal that the outbound
call happened; add an outbound-call log/metric to make this checkable." Recommending
the instrumentation IS the honest output; guessing from local latency is not.

## Quick routing table

| The assumed item is about... | Recipe |
|---|---|
| a build, test, typecheck, file, local script | `command` |
| a page/route/API you own returning something | `http` |
| a record written/updated in your own DB | `db_row` |
| a live UI action on your own app | `browser + orthogonal signal` |
| **your server actually calling a third party** (billed API, email send, webhook) | verify the **outbound-effect signal** (log/metric/artifact) if it exists; else **bin 3 + recommend instrumentation** |
| money, a client account, a client email, a client's Google property, a billed API, a prod merge | none - **bin 2 human script** |
| a state on a property you do not own, or a genuinely ambiguous signal | none - **bin 3 undecidable** |
