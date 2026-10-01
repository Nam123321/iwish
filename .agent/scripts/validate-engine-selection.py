#!/usr/bin/env python3
"""Stage 3.5 Engine Selection Gate Validator (Zero-Trust Category A).

Validates human authorization for the selected coding engine, enforcing:
1. Authentic Asymmetric Cryptographic Verification via OpenSSL & watchmen-pub.pem.
2. Anti-Replay protection via strict story_id binding.
3. Engine selection matching authorized choices.
4. Anti-Bait-and-Switch protection matching dispatcher intent.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
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


def normalize_story_id(story_id: str | None) -> str:
    if not story_id:
        return ""
    s = str(story_id).strip()
    for prefix in ("Story-", "story-", "Story_", "story_"):
        if s.startswith(prefix):
            s = s[len(prefix):]
    return s


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Stage 3.5 Engine Selection Evidence")
    parser.add_argument("--evidence", required=True, help="Path to engine selection evidence JSON or SIG file")
    parser.add_argument("--story-id", required=True, help="Story ID to verify against replay attack")
    parser.add_argument("--expected-engine", required=True, help="Expected engine name to match")
    args = parser.parse_args()

    evidence_path = Path(args.evidence).resolve()
    if not evidence_path.is_file():
        print(f"❌ [ENGINE GATE FAILED] Evidence file not found: {evidence_path}", file=sys.stderr)
        return 1

    # Resolve pair of JSON and SIG files
    if str(evidence_path).endswith(".sig"):
        sig_path = evidence_path
        json_path = Path(str(evidence_path)[:-4])
    else:
        json_path = evidence_path
        sig_path = Path(str(evidence_path) + ".sig")

    if not json_path.is_file():
        print(f"❌ [ENGINE GATE FAILED] Corresponding JSON file not found: {json_path}", file=sys.stderr)
        return 1

    if not sig_path.is_file():
        print(f"❌ [ENGINE GATE FAILED] Missing detached cryptographic signature file: {sig_path}", file=sys.stderr)
        return 1

    # 1. Cryptographic Zero-Trust Verification via OpenSSL & watchmen-pub.pem
    openssl_path = "/usr/bin/openssl"
    if not os.path.exists(openssl_path):
        print("❌ [ENGINE GATE FAILED] /usr/bin/openssl not found. Security check blocked.", file=sys.stderr)
        return 1

    root_dir = Path(__file__).resolve().parents[2]
    pubkey_path = root_dir / ".agent" / "config" / "watchmen-pub.pem"
    if not pubkey_path.is_file():
        print(f"❌ [ENGINE GATE FAILED] Watchmen public key not found: {pubkey_path}", file=sys.stderr)
        return 1

    verify_cmd = [
        openssl_path, "dgst", "-sha256",
        "-verify", str(pubkey_path),
        "-signature", str(sig_path),
        str(json_path)
    ]
    v_res = subprocess.run(verify_cmd, capture_output=True, text=True)
    if v_res.returncode != 0 or "Verified OK" not in v_res.stdout:
        print(
            f"❌ [ENGINE GATE FAILED] Cryptographic Verification FAILED!\n"
            f"   Signature in {sig_path} is forged, invalid, or tampered for {json_path}:\n"
            f"   {v_res.stdout.strip()} {v_res.stderr.strip()}",
            file=sys.stderr,
        )
        return 1

    # 2. Parse verified JSON payload
    try:
        content = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"❌ [ENGINE GATE FAILED] Malformed evidence JSON: {e}", file=sys.stderr)
        return 1

    # 3. Gate identity check
    gate = content.get("gate")
    if gate != "engine-selection-gate":
        print(f"❌ [ENGINE GATE FAILED] Invalid gate: expected 'engine-selection-gate', got '{gate}'", file=sys.stderr)
        return 1

    # 4. Engine validity check
    engine = content.get("selected_engine")
    if not engine or engine not in VALID_ENGINES:
        print(f"❌ [ENGINE GATE FAILED] Invalid engine '{engine}'. Must be one of: {sorted(VALID_ENGINES)}", file=sys.stderr)
        return 1

    # 5. Anti-replay story_id verification (Strict check)
    evidence_story_id = content.get("story_id")
    norm_expected = normalize_story_id(args.story_id)
    norm_actual = normalize_story_id(evidence_story_id)
    if norm_expected != norm_actual:
        print(
            f"❌ [ENGINE GATE FAILED] Replay attack detected!\n"
            f"   Cryptographic evidence is bound to Story '{evidence_story_id}'\n"
            f"   but execution is targeting Story '{args.story_id}'",
            file=sys.stderr,
        )
        return 1

    # 6. Anti-Bait-and-Switch engine alignment check
    if engine != args.expected_engine:
        print(
            f"❌ [ENGINE GATE FAILED] Engine mismatch (Bait-and-Switch blocked)!\n"
            f"   Human cryptographically authorized: '{engine}'\n"
            f"   Dispatcher attempted to execute:     '{args.expected_engine}'",
            file=sys.stderr,
        )
        return 1

    print(f"✅ [ENGINE GATE PROVEN SAFE] Asymmetric OpenSSL Verification Succeeded.")
    print(f"   Authorized Engine '{engine}' successfully bound to Story '{evidence_story_id}'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
