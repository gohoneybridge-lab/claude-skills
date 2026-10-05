# Honey Bridge Claude Code Skills

The skills we use every day at Honey Bridge, packaged as a Claude Code plugin marketplace.
They cover the whole path from a rough idea to shipped, verified work: research it, spec it,
pressure-test it, build it, audit it, and prove it actually works before anyone calls it done.

## Install

```
/plugin marketplace add gohoneybridge-lab/claude-skills
/plugin install honeybridge-skills@honeybridge
```

Restart or reload and the slash commands are available. To pick up changes later:

```
/plugin update honeybridge-skills@honeybridge
```

## What's in the pack

### Idea to spec

| Skill | What it does |
|---|---|
| **finalize** | Turns a rough idea into a council-hardened, shippable product spec. Calls `deep-research` and `llm-council` internally, with a hard cap on review rounds so the council cannot rubber-stamp itself. |
| **harden** | Takes an approved spec (or an existing repo), scores it against a rubric, and hands back a hardened spec, a gap report, and a runnable scaffold. |
| **llm-council** | Runs a question or decision past 5 independent AI advisors who grade each other anonymously, then synthesizes a ranked verdict. |

### Research

| Skill | What it does |
|---|---|
| **last30days** | What people actually said about a topic in the last 30 days, across Reddit, X, YouTube, TikTok, Hacker News, GitHub and the web. |
| **deep-research** | Two passes: community signal from `last30days`, then verification against primary sources only (docs, specs, source code). The brief separates verified fact, opinion, contradicted claims, and what could not be retrieved. |
| **extreme-research** | `deep-research` plus a live browser lane for pages an API cannot reach, and an `llm-council` audit of the research itself that sends the browser back out for what it missed. |

### Build and ship

| Skill | What it does |
|---|---|
| **web-design** | The whole web design job in one pipeline: pin down the look, research it, source components, build, then prove it with an automated check for performance, accessibility and motion budgets. |
| **security-check** | Security audit tuned for AI-generated sites. Maps the real attack surface, scores each current breach class as applies or not with evidence from the code, then fixes what applies. |
| **seo-buildout** | A full one-client SEO overhaul in one bounded run: measure, research the local area, agree one plan, implement it on the site, then complete the Google Business Profile. Built around our own audit app, so parts of it assume that backend. |
| **prospect-analysis** | Pre-pitch SEO analysis of a local business: Maps and organic position, AI Overview presence, profile signals, TLS state and NAP conflicts, ending in a short list of checks only a human can do. Also expects our audit backend. |
| **hb-explainer** | Draws a hand-drawn style SVG explainer of how a system or flow works, written directly by Claude with no image model. |

### Verify and hand off

| Skill | What it does |
|---|---|
| **prove-it** | Forces every "assumed working" item in a handoff to prove itself. It runs real checks where it can, writes a manual test script where a human must decide, and is forbidden to write "verified" without attached evidence. |
| **handoff** | Writes a session handoff so the next session starts with full context, then runs `prove-it` on its own claims, fixes what came back broken, and records what it got wrong. `/handoff quick` skips the loop. |
| **autopilot** | Runs everything that is automatable and reversible without stopping to ask, batches the questions that need a person into one queue at the end, and hard-stops only for irreversible actions. |
| **all-skills** | Routes a web or content job to exactly the skills it needs and says which ones it skipped and why. |

## Setup notes

- **last30days** needs API tokens for full reach (X, Bluesky, Perplexity and others). Run its
  setup wizard after install: `plugins/honeybridge-skills/skills/last30days/scripts/setup-keychain.sh`.
  Without tokens it still runs on the free sources, with narrower coverage.
- **deep-research** uses an Exa API key for its primary-source pass.
- Output lands under `~/Documents/` on your own machine (for example `~/Documents/Finalize/<idea>/`).
- Client examples in these skills are anonymized as "Client A" through "Client I".

## Maintaining this repo

The skills here are copies of `~/.claude/skills/<name>`. After editing one locally:

```
./scripts/sync-skills.sh            # re-sync everything
./scripts/sync-skills.sh prove-it   # or just one
git add -A && git commit -m "update skills" && git push
```

**This repo is public.** `sync-skills.sh` runs `scripts/sanitize.py`, which replaces client
names, domains, accounts and personal paths in the copies, then `scripts/check-public.sh`,
which fails the sync if anything identifying is left. Add a rule to `sanitize.py` rather than
editing a copy by hand, since the next sync would overwrite the hand edit. Run
`./scripts/check-public.sh` again before every push.
