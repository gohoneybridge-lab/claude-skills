#!/usr/bin/env python3
"""Domain-locked primary-source retrieval for /deep-research Stage 3.

Two modes:

  search  Domain-restricted search that returns page CONTENTS in the same call.
          "Primary sources only" stops being a sentence in a prompt and becomes
          the includeDomains parameter.

  fetch   Direct URL retrieval. Rung 2.5 of the retrieval ladder - Exa serves
          from its own index, so it returns pages that 403 an ordinary fetch.
          Verified 2026-08-05: docs.blender.org and mass.gov both 403 WebFetch
          and both come back clean here.

Every response reports cost and, in fetch mode, a per-URL retrieval status. A
failed retrieval is reported as a failure, never as an empty result - that
distinction is the whole point of the BLOCKED bin.

Usage:
  exa_source.py search "does the API document a rate limit" \
      --domains developer.apple.com,support.apple.com [--num 5] [--chars 3000]

  exa_source.py fetch https://example.com/a https://example.com/b [--chars 5000]
      [--livecrawl always|fallback|never]

  --json   emit raw JSON instead of markdown
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.exa.ai"
CONFIG = os.path.expanduser("~/.config/last30days/.env")
TIMEOUT = 90


def load_key() -> str:
    """EXA_API_KEY from the process env, else the last30days config.

    Deliberately reuses the last30days .env so there is exactly one place the
    key lives. Do not add a second copy.
    """
    key = os.environ.get("EXA_API_KEY")
    if key:
        return key.strip()
    try:
        with open(CONFIG) as fh:
            for line in fh:
                if line.startswith("EXA_API_KEY="):
                    return line.split("=", 1)[1].strip()
    except FileNotFoundError:
        pass
    sys.exit(
        "No EXA_API_KEY. Set it in the environment or add it to "
        f"{CONFIG}. Without it Stage 3 has no domain-locked retrieval and "
        "last30days' auto_resolve() also silently returns empty."
    )


def call(path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        f"{API}/{path}",
        data=json.dumps(payload).encode(),
        headers={"x-api-key": load_key(), "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")[:500]
        hint = {
            401: "key rejected - check EXA_API_KEY is current",
            402: "out of credits - free tier is $10/mo recurring plus 1000 req/mo",
            429: "rate limited - back off and retry",
        }.get(exc.code, "")
        sys.exit(f"Exa HTTP {exc.code}{' (' + hint + ')' if hint else ''}: {body}")
    except urllib.error.URLError as exc:
        sys.exit(f"Exa unreachable: {exc.reason}")


def cost_line(resp: dict) -> str:
    total = (resp.get("costDollars") or {}).get("total")
    return f"_Exa cost: ${total}_" if total is not None else ""


def render(results: list, statuses: list | None, chars: int) -> str:
    out = []
    status_by_id = {s.get("id"): s for s in (statuses or [])}
    for item in results:
        url = item.get("url", "")
        out.append(f"### {item.get('title') or '(untitled)'}")
        out.append(f"<{url}>")
        if item.get("publishedDate"):
            out.append(f"published: {item['publishedDate']}")
        st = status_by_id.get(url) or status_by_id.get(item.get("id"))
        if st:
            src = st.get("source")
            out.append(f"retrieval: {st.get('status')}" + (f" (source: {src})" if src else ""))
        text = (item.get("text") or "").strip()
        out.append("")
        out.append(text[:chars] if text else "_(no text returned)_")
        out.append("")
    return "\n".join(out)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="mode", required=True)

    s = sub.add_parser("search", help="domain-locked search with contents")
    s.add_argument("query")
    s.add_argument("--domains", required=True,
                   help="comma-separated. REQUIRED - an unrestricted search is not primary-source verification.")
    s.add_argument("--num", type=int, default=5)
    s.add_argument("--chars", type=int, default=3000)
    s.add_argument("--json", action="store_true")

    f = sub.add_parser("fetch", help="direct URL retrieval (ladder rung 2.5)")
    f.add_argument("urls", nargs="+")
    f.add_argument("--chars", type=int, default=5000)
    f.add_argument("--livecrawl", choices=["always", "fallback", "never"], default="fallback",
                   help="'fallback' (default) serves cache when fresh; 'always' forces a live crawl "
                        "when the claim is version- or price-sensitive and a stale copy would mislead.")
    f.add_argument("--json", action="store_true")

    a = ap.parse_args()

    if a.mode == "search":
        domains = [d.strip() for d in a.domains.split(",") if d.strip()]
        if not domains:
            sys.exit("--domains resolved to nothing. Refusing to run an unrestricted search.")
        resp = call("search", {
            "query": a.query,
            "includeDomains": domains,
            "numResults": a.num,
            "contents": {"text": {"maxCharacters": a.chars}},
        })
        results, statuses = resp.get("results", []), None
        header = (
            f"Exa search restricted to: {', '.join(domains)}\n\n"
            "**Neural search always returns its closest matches inside these domains, "
            "even when the domain says nothing about the claim.** A returned result is "
            "not a verification. Read the text and confirm it actually addresses the "
            "claim before marking VERIFIED; if it does not, that is NOT FOUND.\n"
        )
    else:
        resp = call("contents", {
            "urls": a.urls,
            "text": {"maxCharacters": a.chars},
            "livecrawl": a.livecrawl,
        })
        results, statuses = resp.get("results", []), resp.get("statuses", [])
        header = ""

    if a.json:
        print(json.dumps(resp, indent=2))
        return

    print(header)
    if not results:
        print("**NO RESULTS.**")
        if statuses:
            for st in statuses:
                print(f"- {st.get('id')}: {st.get('status')} {st.get('error') or ''}")
        print("\nIn search mode this is a real signal: the restricted domains do not "
              "cover this claim. In fetch mode it is a retrieval failure - continue "
              "the ladder before writing BLOCKED.")
    else:
        print(render(results, statuses, a.chars))

    # Surface partial failures explicitly - a half-successful fetch that prints
    # only its successes is how a BLOCKED item gets silently downgraded.
    failed = [s for s in (statuses or []) if s.get("status") != "success"]
    if failed:
        print("\n**RETRIEVAL FAILURES (do not report these as NOT FOUND):**")
        for st in failed:
            print(f"- {st.get('id')}: {st.get('status')} {st.get('error') or ''}")

    line = cost_line(resp)
    if line:
        print(f"\n{line}")


if __name__ == "__main__":
    main()
