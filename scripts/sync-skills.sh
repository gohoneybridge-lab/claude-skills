#!/usr/bin/env bash
# Re-copy the source skills from ~/.claude/skills into this plugin, then it's ready to commit.
# Run this whenever you update a skill locally (or to finally drop in prove-it after editing).
#
#   ./scripts/sync-skills.sh          # sync all
#   ./scripts/sync-skills.sh prove-it # sync just one
#
# THIS REPO IS PUBLIC. After copying, sanitize.py scrubs client names, accounts and personal
# paths out of the copies, and check-public.sh fails the run if anything is left.
#
set -euo pipefail

SRC="${HOME}/.claude/skills"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST="${REPO_ROOT}/plugins/honeybridge-skills/skills"

ALL=(finalize last30days llm-council harden prove-it handoff
     deep-research extreme-research autopilot all-skills security-check
     prospect-analysis seo-buildout web-design hb-explainer)
SKILLS=("${@:-}")
[ -z "${SKILLS[*]}" ] && SKILLS=("${ALL[@]}")

for s in "${SKILLS[@]}"; do
  if [ ! -e "${SRC}/${s}" ]; then
    echo "!! ${s}: not found in ${SRC} — skipping"
    continue
  fi
  # -L follows the last30days symlink; excludes keep demo media / bytecode out of git.
  rsync -aL --delete \
    --exclude 'assets/' \
    --exclude '__pycache__/' \
    --exclude '*.pyc' \
    --exclude '.git/' \
    --exclude 'node_modules/' \
    --exclude '.claude/' \
    --exclude 'CLAUDE.md' \
    --exclude '*.bak*' \
    --exclude '*.log' \
    --exclude 'state/' \
    --exclude 'prove-out/' \
    --exclude 'runs-log.md' \
    "${SRC}/${s}/" "${DST}/${s}/"
  echo "synced ${s}"
done

python3 "${REPO_ROOT}/scripts/sanitize.py"
"${REPO_ROOT}/scripts/check-public.sh"

echo
echo "Done. Review, then:  git add -A && git commit -m 'update skills' && git push"
