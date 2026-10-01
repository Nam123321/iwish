#!/usr/bin/env python3
"""Stage 3.5 Engine Selection Signer (Zero-Trust Category A).

Generates the canonical engine selection artifact and signs it with the
authorized Watchmen TCB private key via OpenSSL.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass
# ---------------------------------

VALID_ENGINES = {"code", "pi-code-agent", "omp-orch-skill", "tournament"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Sign Stage 3.5 Engine Selection")
    parser.add_argument("--story-id", required=True, help="Story ID (e.g. 84.01)")
    parser.add_argument("--engine", choices=sorted(VALID_ENGINES), required=True, help="Selected engine")
    parser.add_argument("--output-json", required=True, help="Path to write evidence JSON")
    parser.add_argument("--output-sig", required=True, help="Path to write detached signature")
    parser.add_argument("--key", default=str(Path.home() / ".ssh" / "iwish_admin_key"), help="Path to signing key")
    args = parser.parse_args()

    json_path = Path(args.output_json).resolve()
    sig_path = Path(args.output_sig).resolve()
    key_path = Path(args.key).resolve()

    if not key_path.is_file():
        print(f"❌ [SIGNING BLOCKED] Private key not found: {key_path}", file=sys.stderr)
        return 1

    openssl_path = "/usr/bin/openssl"
    if not os.path.exists(openssl_path):
        print(f"❌ [SIGNING BLOCKED] /usr/bin/openssl not found", file=sys.stderr)
        return 1

    json_path.parent.mkdir(parents=True, exist_ok=True)
    sig_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "gate": "engine-selection-gate",
        "story_id": args.story_id,
        "selected_engine": args.engine,
        "timestamp": int(time.time() * 1000)
    }

    canonical_json = json.dumps(payload, indent=2, sort_keys=True)
    json_path.write_text(canonical_json, encoding="utf-8")

    sign_cmd = [
        openssl_path, "dgst", "-sha256",
        "-sign", str(key_path),
        "-out", str(sig_path),
        str(json_path)
    ]

    res = subprocess.run(sign_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"❌ [SIGNING FAILED] OpenSSL signing failed:\n{res.stdout}\n{res.stderr}", file=sys.stderr)
        return 1

    print(f"✅ [STAGE 3.5 SIGNED] Successfully signed engine selection for Story {args.story_id}:")
    print(f"   JSON: {json_path}")
    print(f"   SIG:  {sig_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
