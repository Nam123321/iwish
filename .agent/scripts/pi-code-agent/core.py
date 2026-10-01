#!/usr/bin/env python3
"""Small deterministic kernel for the native pi-code-agent vertical slice.

The model may propose work, but this module owns catalog identity, scope checks,
skill routing constraints, receipt validation, and state transitions.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# This kernel is the common import path for contract compilation, task running,
# receipt validation, and invocation resolution. Verify the signed TCB before
# exposing any of those operations to a direct CLI call.
SCRIPTS_ROOT = Path(__file__).resolve().parents[1]
if str(SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_ROOT))
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError as exc:
    raise RuntimeError("Watchmen TCB module is required for pi-code-agent") from exc

SCHEMA_VERSION = "1.0"
ROOT_NAMES = {"workflows": ("workflow", 30), "agents": ("agent", 20), "skills": ("skill", 10)}
STATES = {"planned", "ready", "executing", "review", "accepted", "rejected", "blocked", "cancelled"}
TRANSITIONS = {
    "planned": {"ready", "blocked", "cancelled"},
    "ready": {"executing", "blocked", "cancelled"},
    "executing": {"review", "rejected", "blocked", "cancelled"},
    "review": {"accepted", "rejected", "blocked"},
    "rejected": {"ready", "cancelled"},
    "blocked": {"ready", "cancelled"},
    "accepted": set(),
    "cancelled": set(),
}
FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n?", re.S)


class ContractError(ValueError):
    pass


def canonical(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def atomic_json_write(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{sha256_bytes(canonical(value))[:12]}.tmp")
    with temp.open("wb") as handle:
        handle.write(canonical(value))
        handle.flush()
        os.fsync(handle.fileno())
    temp.replace(path)
    try:
        directory = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    except OSError:
        # Some filesystems do not permit directory fsync; the file itself was
        # already flushed and the caller still gets atomic replace semantics.
        pass


def normalize_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKC", name).casefold().strip()
    if not normalized or any(ord(char) < 32 or ord(char) == 127 for char in normalized):
        raise ContractError("capability name contains empty/control characters")
    if "/" in normalized or "\\" in normalized or normalized in {".", ".."}:
        raise ContractError("capability name contains a path component")
    return normalized


def parse_frontmatter(path: Path) -> dict[str, str]:
    match = FRONTMATTER_RE.match(path.read_text(encoding="utf-8", errors="replace"))
    if not match:
        return {}
    result: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line or line.lstrip().startswith("#"):
            continue
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip().strip("\"'")
    return result


def project_root(value: str | None) -> Path:
    root = Path(value or Path.cwd()).resolve()
    if not (root / ".agent").is_dir():
        raise ContractError(f"not a Cowok.ai project root: {root}")
    return root


def source_candidates(root: Path) -> list[tuple[str, str, Path, int]]:
    candidates: list[tuple[str, str, Path, int]] = []
    for folder, (kind, priority) in ROOT_NAMES.items():
        base = root / ".agent" / folder
        if not base.exists():
            continue
        if folder == "skills":
            paths = sorted(base.glob("*/SKILL.md"))
            for path in paths:
                candidates.append((normalize_name(path.parent.name), kind, path, priority))
        else:
            for path in sorted(base.glob("*.md")):
                candidates.append((normalize_name(path.stem), kind, path, priority))
    return candidates


def compile_catalog(root: Path) -> dict[str, Any]:
    grouped: dict[str, list[tuple[str, str, Path, int]]] = {}
    for item in source_candidates(root):
        grouped.setdefault(item[0], []).append(item)
    sources: list[dict[str, Any]] = []
    collisions: list[dict[str, Any]] = []
    for name in sorted(grouped):
        items = grouped[name]
        chosen = sorted(items, key=lambda item: (-item[3], item[1], str(item[2])))[0]
        if len(items) > 1:
            collisions.append({"name": name, "chosen": chosen[2].relative_to(root).as_posix(), "candidates": [item[2].relative_to(root).as_posix() for item in items]})
        path = chosen[2]
        metadata = parse_frontmatter(path)
        risk = metadata.get("risk_tier", "low")
        if risk not in {"low", "medium", "high", "critical"}:
            risk = "low"
        modes = ["user-slash", "workflow-required"] if chosen[1] == "workflow" else ["routed", "autoload-denied"]
        sources.append({
            "name": name,
            "kind": chosen[1],
            "source_path": path.relative_to(root).as_posix(),
            "sha256": sha256_file(path),
            "description": metadata.get("description", ""),
            "priority": chosen[3],
            "risk_tier": risk,
            "invocation_modes": modes,
        })
    body = {"schema_version": SCHEMA_VERSION, "sources": sources, "collisions": collisions}
    return {**body, "catalog_sha256": sha256_bytes(canonical(body))}


def validate_catalog(catalog: dict[str, Any]) -> None:
    if catalog.get("schema_version") != SCHEMA_VERSION or not re.fullmatch(r"[a-f0-9]{64}", catalog.get("catalog_sha256", "")):
        raise ContractError("invalid capability catalog envelope")
    body = {key: catalog[key] for key in ("schema_version", "sources", "collisions")}
    if sha256_bytes(canonical(body)) != catalog["catalog_sha256"]:
        raise ContractError("capability catalog hash mismatch")
    seen: set[str] = set()
    for source in catalog.get("sources", []):
        name = normalize_name(source.get("name", ""))
        if name in seen:
            raise ContractError(f"duplicate catalog source: {name}")
        seen.add(name)
        if not re.fullmatch(r"[a-f0-9]{64}", source.get("sha256", "")):
            raise ContractError(f"invalid source hash: {name}")


def validate_catalog_pin(catalog: dict[str, Any], expected_sha256: str) -> None:
    validate_catalog(catalog)
    if catalog["catalog_sha256"] != expected_sha256:
        raise ContractError("capability catalog pin is stale")


def resolve_skill(catalog: dict[str, Any], requested: str, route: str, authorized: bool) -> dict[str, Any]:
    name = normalize_name(requested)
    source = next((item for item in catalog["sources"] if item["name"] == name), None)
    if source is None:
        return {"skill": name, "route": "not-found", "authorized": False, "catalog_sha256": catalog["catalog_sha256"], "reason": "no canonical source"}
    if route not in source["invocation_modes"]:
        return {"skill": name, "route": "autoload-denied", "authorized": False, "catalog_sha256": catalog["catalog_sha256"], "reason": "route is not allowed by catalog"}
    if source.get("risk_tier") in {"high", "critical"} and route == "routed" and not authorized:
        return {"skill": name, "route": route, "authorized": False, "catalog_sha256": catalog["catalog_sha256"], "reason": "high-risk route requires independent authorization"}
    if not authorized:
        return {"skill": name, "route": route, "authorized": False, "catalog_sha256": catalog["catalog_sha256"], "reason": "invocation intent does not confer authorization"}
    return {"skill": name, "route": route, "authorized": True, "catalog_sha256": catalog["catalog_sha256"], "reason": "authorized canonical source"}


def validate_receipt(receipt: dict[str, Any]) -> None:
    required = {"schema_version", "receipt_id", "run_id", "task_id", "plan_sha256", "diff_sha256", "tool_events", "diagnostics", "tests", "reviewer_decisions", "validator_decision", "redactions"}
    missing = required - receipt.keys()
    if missing:
        raise ContractError(f"receipt missing fields: {', '.join(sorted(missing))}")
    if receipt["schema_version"] != SCHEMA_VERSION:
        raise ContractError("unsupported receipt schema")
    for key in ("plan_sha256", "diff_sha256"):
        if not re.fullmatch(r"[a-f0-9]{64}", str(receipt[key])):
            raise ContractError(f"invalid receipt hash: {key}")
    if receipt["validator_decision"] not in {"accepted", "rejected", "blocked"}:
        raise ContractError("invalid validator decision")
    if receipt["validator_decision"] == "accepted":
        if not receipt["tests"] or not receipt["reviewer_decisions"]:
            raise ContractError("accepted receipt requires tests and reviewer decisions")
        if any(item.get("status") not in {"passed", "accepted"} for item in receipt["tests"]):
            raise ContractError("accepted receipt contains a non-passing test")
        if any(item.get("decision") not in {"accepted", "approved"} for item in receipt["reviewer_decisions"]):
            raise ContractError("accepted receipt contains an unresolved reviewer decision")


def validate_receipt_namespace(receipt: dict[str, Any], existing_receipt_ids: set[str]) -> None:
    validate_receipt(receipt)
    receipt_id = str(receipt["receipt_id"])
    if receipt_id in existing_receipt_ids:
        raise ContractError("receipt id has already been committed")


def validate_mandatory_edges(mandatory_edges: set[str], requested_edges: set[str]) -> None:
    missing = mandatory_edges - requested_edges
    if missing:
        raise ContractError(f"mandatory invocation edges were removed: {', '.join(sorted(missing))}")


def validate_transition(current: str, target: str, receipt: dict[str, Any] | None = None) -> None:
    if current not in STATES or target not in STATES:
        raise ContractError("unknown task state")
    if target not in TRANSITIONS[current]:
        raise ContractError(f"invalid state transition: {current} -> {target}")
    if target == "accepted":
        if receipt is None:
            raise ContractError("accepted transition requires a receipt")
        validate_receipt(receipt)
        if receipt["validator_decision"] != "accepted":
            raise ContractError("accepted transition requires validator acceptance")


def validate_lease(lease: dict[str, Any], active_lease_ids: set[str]) -> None:
    required = {"lease_id", "run_id", "task_id", "state"}
    missing = required - lease.keys()
    if missing:
        raise ContractError(f"lease missing fields: {', '.join(sorted(missing))}")
    if lease["state"] != "active":
        raise ContractError("only active leases can authorize a task")
    if lease["lease_id"] in active_lease_ids:
        raise ContractError("duplicate active lease")


def validate_invocation_dag(edges: list[dict[str, str]], max_depth: int = 8) -> None:
    graph: dict[str, list[str]] = {}
    for edge in edges:
        source, target = edge.get("from"), edge.get("to")
        if not source or not target:
            raise ContractError("invocation edge requires from and to")
        graph.setdefault(source, []).append(target)
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node: str, depth: int) -> None:
        if depth > max_depth:
            raise ContractError("invocation depth exceeds budget")
        if node in visiting:
            raise ContractError("cyclic invocation graph")
        if node in visited:
            return
        visiting.add(node)
        for child in graph.get(node, []):
            visit(child, depth + 1)
        visiting.remove(node)
        visited.add(node)

    for node in graph:
        visit(node, 0)


def validate_role_output(output: dict[str, Any], input_hash: str, allowed_files: set[str], independent_required: bool = False) -> None:
    if output.get("input_hash") != input_hash:
        raise ContractError("role output is not bound to the approved input")
    changed = output.get("changed_files", [])
    if not isinstance(changed, list) or any(path not in allowed_files for path in changed):
        raise ContractError("role output changed-file set escapes task boundary")
    if independent_required and output.get("independent_context") is not True:
        raise ContractError("independent reviewer context is required")


def command_catalog(args: argparse.Namespace) -> int:
    root = project_root(args.root)
    catalog = compile_catalog(root)
    validate_catalog(catalog)
    output = Path(args.output) if args.output else root / "_iwish-output" / "evidence" / "pi-capability-catalog.json"
    atomic_json_write(output, catalog)
    print(json.dumps({"catalog_sha256": catalog["catalog_sha256"], "sources": len(catalog["sources"]), "collisions": len(catalog["collisions"]), "output": str(output)}, indent=2))
    return 0


def command_resolve(args: argparse.Namespace) -> int:
    catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    validate_catalog(catalog)
    result = resolve_skill(catalog, args.skill, args.route, args.authorized)
    print(json.dumps(result, indent=2))
    return 0 if result["authorized"] else 1


def command_receipt(args: argparse.Namespace) -> int:
    receipt = json.loads(Path(args.receipt).read_text(encoding="utf-8"))
    validate_receipt(receipt)
    print(json.dumps({"structurally_valid": True, "authoritative": False, "receipt_id": receipt["receipt_id"], "note": "accepted state requires task_runner plus independent validator attestation"}, indent=2))
    return 0


def command_transition(args: argparse.Namespace) -> int:
    receipt = json.loads(Path(args.receipt).read_text(encoding="utf-8")) if args.receipt else None
    validate_transition(args.current, args.target, receipt)
    print(json.dumps({"valid": True, "from": args.current, "to": args.target}, indent=2))
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Native pi-code-agent deterministic contracts")
    sub = root.add_subparsers(dest="command", required=True)
    catalog = sub.add_parser("catalog")
    catalog.add_argument("--root")
    catalog.add_argument("--output")
    catalog.set_defaults(handler=command_catalog)
    resolve = sub.add_parser("resolve-skill")
    resolve.add_argument("--catalog", required=True)
    resolve.add_argument("--skill", required=True)
    resolve.add_argument("--route", choices=["user-slash", "workflow-required", "routed", "autoload-denied"], required=True)
    resolve.add_argument("--authorized", action="store_true")
    resolve.set_defaults(handler=command_resolve)
    receipt = sub.add_parser("validate-receipt")
    receipt.add_argument("--receipt", required=True)
    receipt.set_defaults(handler=command_receipt)
    transition = sub.add_parser("validate-transition")
    transition.add_argument("--current", required=True)
    transition.add_argument("--target", required=True)
    transition.add_argument("--receipt")
    transition.set_defaults(handler=command_transition)
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        return args.handler(args)
    except (ContractError, OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"valid": False, "error": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
