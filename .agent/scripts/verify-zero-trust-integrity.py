#!/usr/bin/env python3
import os, sys
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

import argparse
import hashlib
import json
import re
from pathlib import Path
from datetime import datetime, timezone

# Zero-width / non-printable Unicode characters to reject (EC-P1-001)
ZERO_WIDTH_CHARS = [
    '\u200B', # Zero Width Space
    '\u200C', # Zero Width Non-Joiner
    '\u200D', # Zero Width Joiner
    '\uFEFF', # Byte Order Mark / Zero Width No-Break Space
    '\u2060', # Word Joiner
    '\u200E', # Left-to-Right Mark
    '\u200F', # Right-to-Left Mark
]

def sanitize_and_hash(file_path):
    """
    [EDGE-CASE: EC-P1-001]
    Enforces strict UTF-8 decoding, strips BOM header, rejects hidden zero-width characters,
    and normalizes CRLF -> LF before computing SHA-256.
    If binary file (e.g. .sig, model weight), falls back gracefully to raw byte hashing.
    """
    raw_bytes = Path(file_path).read_bytes()
    
    # Strip UTF-8 BOM if present at the byte level
    if raw_bytes.startswith(b'\xef\xbb\xbf'):
        raw_bytes = raw_bytes[3:]

    # Normalize CRLF to LF
    normalized_bytes = raw_bytes.replace(b'\r\n', b'\n')

    # Try inspecting text files for zero-width attack sequences
    try:
        text_content = normalized_bytes.decode('utf-8')
        for zw in ZERO_WIDTH_CHARS:
            if zw in text_content:
                raise ValueError(f"File contains suspicious zero-width/hidden Unicode character: {repr(zw)}")
    except UnicodeDecodeError:
        # Graceful handling for non-text / binary artifacts
        pass

    hasher = hashlib.sha256()
    hasher.update(normalized_bytes)
    return hasher.hexdigest()

def verify_provenance(conversation_id, target_file):
    """
    [EDGE-CASE: EC-P4-001]
    Reads transcript_full.jsonl to prove the target file was legitimately generated
    by a recognized agent tool rather than dropped by an untracked process.
    Enforces regex sanitization on conversation_id to prevent Path Traversal.
    """
    if not conversation_id:
        return False, "Fail-Closed: --conversation-id is strictly required to verify physical provenance."

    if not re.match(r"^[a-zA-Z0-9-]+$", conversation_id):
        return False, f"Invalid conversation ID format (Path Traversal guard rejected): '{conversation_id}'"

    brain_dir = os.path.expanduser("~/.gemini/antigravity/brain")
    convo_dir = os.path.realpath(os.path.join(brain_dir, conversation_id))
    if not convo_dir.startswith(brain_dir):
        return False, "Path Traversal attempt blocked: conversation directory outside brain directory."

    log_file = os.path.join(convo_dir, ".system_generated", "logs", "transcript_full.jsonl")
    if not os.path.exists(log_file):
        log_file = os.path.join(convo_dir, ".system_generated", "logs", "transcript.jsonl")

    if not os.path.exists(log_file):
        return False, f"Transcript log not found for conversation: {conversation_id}"

    target_basename = os.path.basename(target_file)
    target_realpath = os.path.realpath(target_file)
    # Check parent directory + basename (e.g. scripts/foo.py or profiles/bar.md) to prevent generic basename collision
    target_parent_base = os.path.join(os.path.basename(os.path.dirname(target_realpath)), target_basename)
    found_trace = False

    try:
        with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    step = json.loads(line)
                    if step.get("type") == "PLANNER_RESPONSE":
                        for tc in step.get("tool_calls", []):
                            args = tc.get("arguments") or tc.get("args") or {}
                            args_str = json.dumps(args)
                            if target_realpath in args_str or target_parent_base in args_str:
                                found_trace = True
                                break
                    if found_trace:
                        break
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        return False, f"Error inspecting transcript: {e}"

    if not found_trace:
        return False, f"Untracked artifact! No physical tool call generated or modified '{target_basename}' in transcript."

    return True, "Provenance verified in transcript_full.jsonl."

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Physical Hash & Provenance Integrity Verifier (Category A+)")
    parser.add_argument("--file", required=True, help="File path to verify")
    parser.add_argument("--conversation-id", required=False, help="Agent conversation ID to check provenance")
    parser.add_argument("--expected-hash", required=False, help="Expected SHA-256 hash to verify against")
    parser.add_argument("--output", required=False, help="Path to write integrity evidence JSON")
    parser.add_argument("--sign", action="store_true", help="Prepare payload for Watchmen OOB HMAC signing")
    args = parser.parse_args()

    file_path = os.path.realpath(args.file)
    if not os.path.exists(file_path):
        print(f"❌ [ZERO-TRUST GATE FAIL] File not found: {file_path}")
        sys.exit(1)

    # 1. Deterministic Hash Engine (EC-P1-001)
    try:
        calculated_hash = sanitize_and_hash(file_path)
    except ValueError as e:
        print(f"❌ [ZERO-TRUST GATE FAIL - ENCODING / TAMPERING DETECTED] {e}")
        sys.exit(1)

    # 2. Hash match check
    if args.expected_hash:
        if calculated_hash.lower() != args.expected_hash.strip().lower():
            print(f"❌ [ZERO-TRUST GATE FAIL - HASH MISMATCH]")
            print(f"   Expected: {args.expected_hash}")
            print(f"   Got:      {calculated_hash}")
            sys.exit(1)

    # 3. Transcript Provenance (EC-P4-001)
    prov_ok, prov_msg = verify_provenance(args.conversation_id, file_path)
    if not prov_ok:
        print(f"❌ [ZERO-TRUST GATE FAIL - PROVENANCE ALERT] {prov_msg}")
        sys.exit(1)

    evidence = {
        "file": file_path,
        "sha256": calculated_hash,
        "signature_version": "v1",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "provenance_status": prov_msg,
        "verdict": "PROVEN_SAFE"
    }

    if args.sign:
        evidence["ready_for_watchmen_oob_signing"] = True
        evidence["verified_sha256"] = calculated_hash

    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(evidence, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps(evidence, indent=2, ensure_ascii=False))
    print(f"✅ [ZERO-TRUST INTEGRITY PASS] File hash: {calculated_hash}")
    sys.exit(0)

if __name__ == "__main__":
    main()

