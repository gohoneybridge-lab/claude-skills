#!/usr/bin/env python3
"""Scrub the published skill copies so this PUBLIC repo carries no client or personal detail.

The source skills in ~/.claude/skills are internal working manuals: they name real clients,
their domains, repos, folders and Google accounts. sync-skills.sh copies them here and then
runs this script over the copies. It never touches ~/.claude/skills.

Clients become "Client A".."Client I" (stable letters, so cross-references still line up),
their domains become client-x.example, personal paths become ~, and the operator's name
becomes "the operator". Files whose NAME carries a client name are renamed too.

check-public.sh runs after this and fails the sync if anything slipped through.
"""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "plugins", "honeybridge-skills", "skills")

# (regex, replacement). Order matters: domains and multi-word names before bare names.
RULES = [
    # Domains
    (r"order\.hebron-market\.com", "order.client-b.example"),
    (r"friesb4guys\.(boston|com)", "client-a.example"),
    (r"hebron-market\.com", "client-b.example"),
    (r"nubianmarkets\.com", "client-c.example"),
    (r"mynuba\.com", "client-d.example"),
    (r"crispydough(shawarma|pizza)?\.(com|net)", "client-e.example"),
    (r"halalisrva\.com", "client-g.example"),
    # Repos, folders, slugs
    (r"changed-hebron-market", "client-b-site"),
    (r"friesb4guys-vercel", "client-a-site"),
    (r"friesb4guys", "client-a"),
    (r"Clients/FRIES B4 GUYS", "Clients/Client A"),
    (r"FRIES B4 GUYS", "CLIENT A"),
    (r"fb4g", "client-a"),
    (r"nubian-markets-site", "client-c-site"),
    (r"nubianmarkets", "client-c"),
    (r"nubian-market", "client-c"),
    (r"nuba-cafe-site", "client-d-site"),
    (r"morockin-fusion-site", "client-f-site"),
    (r"morockin", "client-f"),
    (r"hebron-market", "client-b"),
    (r"hebron-landing", "client-b-landing"),
    (r"crispy-dough", "client-e"),
    (r"halalis", "client-g"),
    (r"land-of-fire", "client-h"),
    # Display names
    (r"Fries B4 Guys", "Client A"),
    (r"\bFBG\b", "Client A"),
    (r"\bfbg\b", "client-a"),
    (r"\bRoxbury\b", "Downtown"),
    (r"Hebron Market", "Client B"),
    (r"Nubian Markets?", "Client C"),
    (r"Nuba Cafe", "Client D"),
    (r"Nuba at Northeastern", "Client D"),
    (r"Crispy Chicken Shawarma Halal", "Client I"),
    (r"Crispy Dough Shawarma", "Client E"),
    (r"Crispy Dough", "Client E"),
    (r"\bCDS\b", "Client E"),
    (r"\bCCS\b", "Client I"),
    (r"Mo'?Rockin(?: Fusion)?", "Client F"),
    (r"HalAli'?s(?: RVA)?", "Client G"),
    (r"Land of Fire", "Client H"),
    (r"\bHebron\b", "Client B"),
    (r"\bNubian\b", "Client C"),
    (r"\bNuba\b", "Client D"),
    (r"\bnubian\b", "client-c"),
    (r"\bnuba\b", "client-d"),
    (r"\bhebron\b", "client-b"),
    (r"\bYousef\b", "the owner"),
    (r"\bIsmail\b", "the owner"),
    (r"\bRoz\b", "the client contact"),
    # Accounts and people
    (r"gohoneybridge@gmail\.com", "the agency Google account"),
    (r"mr\.maaz\.s9000@gmail\.com", "the personal Google account"),
    (r"2024mshaikh@gmail\.com", "the personal account"),
    (r"/Users/maazshaikh", "~"),
    (r"\bMaaz's\b", "the operator's"),
    (r"\bMaaz\b", "the operator"),
    # Google identifiers
    (r"ChIJ[A-Za-z0-9_-]{10,}", "ChIJ_EXAMPLE_PLACE_ID"),
    (r"\b734248610957\b", "<gcp-project-number>"),
    (r"rzyctsgyslsyhitnlrhy", "<supabase-project-ref>"),
]
COMPILED = [(re.compile(p), r) for p, r in RULES]
TEXT_EXT = {".md", ".py", ".sh", ".js", ".mjs", ".ts", ".json", ".svg", ".txt", ".yml", ".yaml", ".toml", ".html", ".css"}


def scrub(s):
    for rx, rep in COMPILED:
        s = rx.sub(rep, s)
    return s


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ROOT)
    changed = renamed = 0
    for dirpath, dirnames, filenames in os.walk(root, topdown=False):
        for name in filenames:
            path = os.path.join(dirpath, name)
            ext = os.path.splitext(name)[1].lower()
            if ext in TEXT_EXT or name in ("LICENSE", "NOTICE", "LICENSE.upstream"):
                with open(path, encoding="utf-8", errors="surrogateescape") as f:
                    old = f.read()
                new = scrub(old)
                if new != old:
                    with open(path, "w", encoding="utf-8", errors="surrogateescape") as f:
                        f.write(new)
                    changed += 1
            new_name = scrub(name)
            if new_name != name:
                os.rename(path, os.path.join(dirpath, new_name))
                renamed += 1
    print(f"sanitize: {changed} files scrubbed, {renamed} renamed")


if __name__ == "__main__":
    main()
