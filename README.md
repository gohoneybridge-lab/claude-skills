# Honey Bridge — Claude Code Skills

Our internal skill pack for Claude Code, distributed as a plugin marketplace so the
whole team stays on the same versions. Add it once, install, and `/finalize`,
`/harden`, etc. work in your Claude Code just like on Maaz's machine.

## Install (each teammate, once)

> Replace `honeybridge/claude-skills` with the real GitHub repo path once it's pushed.

```
/plugin marketplace add honeybridge/claude-skills
/plugin install honeybridge-skills@honeybridge
```

That's it. Restart or reload and the slash commands are available.

To update later when Maaz pushes changes:

```
/plugin update honeybridge-skills@honeybridge
```

## What's in the pack

| Skill | What it does |
|---|---|
| **finalize** | Turns a rough idea into a council-hardened, shippable product spec. Calls `last30days` + `llm-council` internally. |
| **last30days** | Researches what people actually say about a topic in the last 30 days (Reddit, X, YouTube, TikTok, HN, web…). |
| **llm-council** | Runs a question/decision through 5 AI advisors who peer-review and synthesize a verdict. |
| **harden** | Takes an approved spec (or a repo) and elevates it to production grade — scores against a rubric and hands you a runnable scaffold. |
| **handoff** | Writes a session handoff file so the next session picks up with full context. |
| **prove-it** | Forces every "assumed working" item in a handoff to prove it actually works, with evidence. |

The pipeline: **finalize** (what) → **harden** (how well + skeleton) → build → **handoff** / **prove-it** (verify).

## Prerequisites / setup notes

Most skills work out of the box. Two things to know:

- **last30days needs API tokens** for full coverage (X/Twitter, Bluesky, Perplexity, etc.).
  Run its own setup wizard after install — see `plugins/honeybridge-skills/skills/last30days/scripts/setup-keychain.sh`
  (or `setup-pass.sh`). Without tokens it still runs on public web + the free sources, just with
  narrower reach. Research files save to `~/Documents/Last30Days` by default (override with
  `LAST30DAYS_MEMORY_DIR`).
- **finalize** saves specs to `~/Documents/Finalize/<idea-slug>/` on your own machine.

No hardcoded machine paths — everything resolves per-user via `~` / env vars.

## Maintaining this repo (Maaz)

The skills here are **copies** of `~/.claude/skills/<name>`. To update one after you've
edited it locally, or to add `prove-it` once its edit is done:

```
./scripts/sync-skills.sh            # re-sync all 6
./scripts/sync-skills.sh prove-it   # or just one
git add -A && git commit -m "update skills" && git push
```

Demo media (`assets/`) and Python bytecode (`__pycache__`) are gitignored and stripped on
sync — they don't ship with the pack.
