#!/bin/bash
# usage: shot.sh <file-or-url> <out.png> [w] [h]   (kills Chrome once the PNG lands; no `timeout` on this Mac)
src="$1"; out="$2"; w="${3:-1600}"; h="${4:-900}"
case "$src" in http*) url="$src";; *) url="file://$src";; esac
d=$(mktemp -d); rm -f "$out"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$d" --virtual-time-budget=5000 --window-size="$w,$h" --screenshot="$out" "$url" >/dev/null 2>&1 &
pid=$!
for i in $(seq 1 60); do [ -s "$out" ] && sleep 1 && break; sleep 0.5; done
kill $pid 2>/dev/null; pkill -f "user-data-dir=$d" 2>/dev/null; rm -rf "$d"
ls -la "$out" 2>/dev/null | awk '{print $5, $9}' || echo "NO SCREENSHOT"
