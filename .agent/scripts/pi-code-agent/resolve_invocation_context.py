#!/usr/bin/env python3
"""Resolve a project-local Pi invocation without treating slash intent as authority."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import socket
import uuid
from pathlib import Path

import yaml

from core import ContractError, atomic_json_write


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_local_source(root: Path, source_value: str) -> tuple[Path, str]:
    source = (root / source_value).resolve()
    try:
        relative = source.relative_to(root)
    except ValueError as exc:
        raise ContractError("caller source is outside the current project") from exc
    if source.is_symlink() or not source.is_file():
        raise ContractError("caller source must be a project-local regular file")
    return source, relative.as_posix()


def verify_authorization(receipt: Path, profile_id: str) -> str:
    evidence = json.loads(receipt.read_text(encoding="utf-8"))
    if evidence.get("profile_id") != profile_id or evidence.get("decision") not in {"approved", "accepted"}:
        raise ContractError("authorization receipt does not approve this profile")
    if not isinstance(evidence.get("nonce"), str) or not isinstance(evidence.get("signature"), str):
        raise ContractError("authorization receipt is unsigned")
    payload = {key: value for key, value in evidence.items() if key != "signature"}
    client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    client.settimeout(5)
    try:
        client.connect("/tmp/watchmen.sock")
        request = {"action": "verify_and_consume", "payload": payload, "signature": evidence["signature"], "token": os.environ.get("WATCHMEN_TOKEN", "DEFAULT_TOKEN")}
        client.sendall((json.dumps(request) + "\n").encode())
        response = client.makefile("r", encoding="utf-8").readline()
        if not response or json.loads(response).get("success") is not True:
            raise ContractError("authorization receipt is invalid or unavailable")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        raise ContractError("authorization receipt is invalid or unavailable") from exc
    finally:
        client.close()
    value = evidence.get("receipt_id")
    if not isinstance(value, str) or not value:
        raise ContractError("authorization receipt ID is missing")
    return value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--profile", required=True)
    parser.add_argument("--caller-capability", required=True)
    parser.add_argument("--caller-source", required=True)
    parser.add_argument("--invocation-mode", choices=["workflow", "manual", "bug-fix"], required=True)
    parser.add_argument("--parent-run-id")
    parser.add_argument("--predecessor-receipt-id", action="append", default=[])
    parser.add_argument("--authorization-receipt")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    root = Path(args.root).resolve()
    config_path = root / ".agent" / "config" / "pi-code-agent" / "invocation-profiles.yaml"
    config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    profile = config.get("profiles", {}).get(args.profile)
    if not isinstance(profile, dict):
        raise ContractError("unregistered invocation profile")
    if args.caller_capability not in profile.get("allowed_callers", []):
        raise ContractError("caller capability is not authorized for invocation profile")
    source, relative_source = require_local_source(root, args.caller_source)

    # A manual slash command can start an invocation but cannot switch it into a
    # workflow authority profile. The caller's source and profile stay pinned.
    if args.invocation_mode == "manual" and args.profile not in {"manual-approved-plan", "manual-adhoc"}:
        raise ContractError("manual invocation requires a manual profile")
    if args.invocation_mode == "bug-fix" and args.profile != "fix-bug":
        raise ContractError("bug-fix invocation requires the fix-bug profile")
    if args.profile in {"manual-approved-plan", "manual-adhoc", "fix-bug"}:
        if not args.authorization_receipt:
            raise ContractError("manual and fix-bug profiles require signed authorization evidence")
        verify_authorization(Path(args.authorization_receipt), args.profile)

    envelope = {
        "schema_version": "1.0",
        "invocation_id": f"invocation-{uuid.uuid4().hex}",
        "invocation_profile_id": args.profile,
        "caller_capability_id": args.caller_capability,
        "caller_source_path": relative_source,
        "caller_source_sha256": sha256_file(source),
        "invocation_mode": args.invocation_mode,
        "parent_run_id": args.parent_run_id,
        "predecessor_receipt_ids": sorted(set(args.predecessor_receipt_id)),
        # This is only authorization context. The state machine still requires
        # the profile's artifacts and independent validator before acceptance.
        "authorized": True,
        "mandatory": True,
        "completion_sink": profile["completion_sink"],
    }
    atomic_json_write(Path(args.output), envelope)
    print(json.dumps(envelope, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ContractError, OSError, ValueError, yaml.YAMLError) as exc:
        print(f"INVOCATION BLOCKED: {exc}")
        raise SystemExit(2)
