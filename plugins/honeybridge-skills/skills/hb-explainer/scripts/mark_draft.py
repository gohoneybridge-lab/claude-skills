"""Record which version of a flow's sources a new draft was drawn from.

usage: python3 mark_draft.py <flow-id> "<one-line note>"
Run after writing ~/.claude/hb-log/brain/flows/<flow-id>.draft.svg.
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.expanduser("~/.claude/hb-log"))
import meena_brain as B  # noqa: E402

fid = sys.argv[1]
note = sys.argv[2] if len(sys.argv) > 2 else ""
m = next((m for m in B.manifests() if m["id"] == fid), None)
if not m:
    sys.exit(f"no manifest for {fid}")
if not os.path.isfile(B.svg_path(fid, "draft")):
    sys.exit(f"no draft at {B.svg_path(fid, 'draft')}")
state = B.load_state()
st = state.setdefault(fid, {})
st.update(draft_hash=B.flow_hash(m), draft_at=datetime.now(timezone.utc).isoformat(timespec="seconds"), note=note)
B.save_state(state)
print(f"{fid}: draft marked (hash {st['draft_hash']})")
