# Reuse windows and spend reporting

Read before Phase 2.

## There is no caps table here

There was one. It listed pages crawled, subagents, queries and page opens as hard numbers.
Every one of those numbers was a guess, written before the skill had ever run, formatted as a
table so that it read as authoritative. A guessed number that looks measured is worse than no
number, because it gets trusted.

The rule that replaces it:

> **If a lane is running longer than it is worth, stop and ask.**

The table comes back when `runs-log.md` has enough real runs to build one out of measurements.

## Reuse before regenerate

A lane is **reused**, not re-run, when an artifact exists inside its window. Record the path in
the manifest under `reused` and in the plan's spend section.

| Lane | Artifact to look for | Window |
|---|---|---|
| App review engine | latest `seo_review` run for this `partner_id` | 14 days |
| Keywords / gap | saved keyword set for this client | 30 days |
| Heatmap | last geo-grid run | 30 days |
| `/seo` audit | prior run folder under the client's `SEO Buildout/` | 30 days |
| `/extreme-research` | `~/Documents/DeepResearch/*-extreme.md`, `~/Documents/Last30Days/` | 90 days for a locality or vertical brief |
| GSC data | a pull inside the current month | current month |

These windows are judgment, not measurement. They are the one place a number still appears, and
they are cheap to be wrong about in the safe direction: reusing something slightly stale costs a
little accuracy, re-running costs the budget.

Within-window **plus a material site change** (a redesign, a domain move, a new location) is
still a re-run. Note the reason.

## Where the money actually goes

Worst to best value in this run:

1. **`/extreme-research`** - attended, slowest, largest. Gate it hardest. Reuse beats running,
   and it will not check for existing research on its own.
2. **`/seo audit` full fan-out** - large, and overlaps roughly half of lane 2a. Bound it, or run
   targeted subcommands for the lanes 2a does not cover.
3. **The app review engine** - one call, internally cost-capped, first-party data. Cheapest per
   unit of insight in the whole skill. Always run it, always first.
4. **Keywords / quickwins / gap** - small, and quickwins produce the highest-value findings in
   the run.

## Reporting

`plan.md` opens with the spend section, before anything else:

```
WHAT THIS RUN SPENT
  2a app tools      RAN | REUSED | SKIPPED   <one line of detail>
  2b /seo pack      RAN | REUSED | SKIPPED   <one line of detail>
  2c area research  RAN | REUSED | SKIPPED   <one line of detail>
```

This is the skill's only enforcement mechanism. Nothing runs the rules; what makes them stick is
that this section sits in front of the operator at the approval checkpoint. Do not summarise it away and
do not move it below the findings.

## Cleanup

Kill any headless Chrome this run started. Stale `:9222` instances from session scratchpads pin
a CPU core indefinitely ([[orphaned-headless-chrome-cpu]]).

Intermediate JSON, crawl dumps and scratch scripts go in the session scratchpad, never in the
client folder. Only `services.md`, `plan.md`, `manifest.json` and the lane exports are durable.
