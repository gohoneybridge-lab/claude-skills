#!/usr/bin/env bash
# Fail if the published skills still carry client names, personal details or secrets.
# THIS REPO IS PUBLIC. sync-skills.sh runs this after sanitize.py; run it again before any push.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

git ls-files -co --exclude-standard -- plugins README.md .claude-plugin | python3 -c '
import re, sys
PAT = re.compile(r"fries ?b4|friesb4|hebron|nubian|\bnuba\b|crispy ?dough|crispy chicken|shawarma|\bfbg\b|roxbury|mo.?rockin|halali|land.of.fire|yousef|\bmaaz|mshaikh|@gmail\.com|@simmons\.edu|ChIJ(?!_EXAMPLE)[A-Za-z0-9_-]{10,}|734248610957|rzyctsgy|ghp_[A-Za-z0-9]{20}|sk-ant-|AIza[0-9A-Za-z_-]{30}|xox[abp]-", re.I)
files = [l.strip() for l in sys.stdin if l.strip()]
bad = []
for f in files:
    if PAT.search(f):
        bad.append(f"{f}: (file name)")
    try:
        data = open(f, encoding="utf-8").read()
    except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError):
        continue
    for n, line in enumerate(data.splitlines(), 1):
        m = PAT.search(line)
        if m:
            bad.append(f"{f}:{n}: [{m.group(0)}] {line.strip()[:150]}")
if not files:
    print("!! check-public: no files found to check"); sys.exit(1)
if bad:
    print("!! check-public FAILED. Remove or add a sanitize.py rule for these:")
    print("\n".join(bad)); sys.exit(1)
print(f"check-public: clean ({len(files)} files)")
'
