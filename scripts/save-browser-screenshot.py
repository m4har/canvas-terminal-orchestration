#!/usr/bin/env python3
"""Save a CDP Page.captureScreenshot JSON response to the project screenshot folder."""
import base64
import json
import sys
from pathlib import Path

if len(sys.argv) != 3:
    print("usage: save-browser-screenshot.py <cdp-json-file> <output-name.png>")
    sys.exit(1)

src = Path(sys.argv[1])
name = Path(sys.argv[2])
out_dir = Path(__file__).resolve().parents[1] / "screenshot"
out_dir.mkdir(exist_ok=True)
out = out_dir / name.name

data = json.loads(src.read_text())
b64 = data.get("data") or data.get("result", {}).get("data")
if not b64:
    raise SystemExit(f"No screenshot data in {src}")

out.write_bytes(base64.b64decode(b64))
print(out)
