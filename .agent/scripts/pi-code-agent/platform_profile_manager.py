#!/usr/bin/env python3
"""Detect and configure one user-approved native IDE routing profile at a time."""
from __future__ import annotations
import argparse, json, os, shutil
from datetime import datetime, timezone
from pathlib import Path
import yaml
from core import ContractError, atomic_json_write

CORE_ROLES = {"default", "planner", "worker", "reviewer"}
KNOWN_PLATFORMS = {"codex", "antigravity", "claude-code"}

def config_path(root: Path) -> Path:
    return root / ".agent" / "config" / "pi-code-agent" / "model-bindings.yaml"

def detect(root: Path, requested: str | None) -> dict:
    candidates = [requested] if requested else []
    if not requested:
        if os.environ.get("CLAUDECODE") or shutil.which("claude"): candidates.append("claude-code")
        if shutil.which("agy") or (root / ".agents" / "agents").exists(): candidates.append("antigravity")
        if (root / ".codex").exists() or os.environ.get("CODEX_HOME"): candidates.append("codex")
    config = yaml.safe_load(config_path(root).read_text(encoding="utf-8"))
    candidates = sorted(set(candidates)); profiles = config.get("platform_profiles", {})
    return {"candidates": candidates, "profiles": {item: profiles.get(item, {}).get("setup_status", "missing") for item in candidates}, "selection_required": len(candidates) != 1}

def assignments(values: list[str]) -> dict[str, str]:
    result = {}
    for value in values:
        if "=" not in value: raise ContractError("model assignment must use role=model")
        role, model = value.split("=", 1)
        if role not in CORE_ROLES or not model.strip(): raise ContractError("model assignment must target a core role")
        result[role] = model.strip()
    if set(result) != CORE_ROLES: raise ContractError("configure requires default, planner, worker, and reviewer")
    return result

def configure(root: Path, args: argparse.Namespace) -> dict:
    if not args.confirm: raise ContractError("configure requires explicit --confirm")
    chosen = assignments(args.model); path = config_path(root); config = yaml.safe_load(path.read_text(encoding="utf-8"))
    profile = config.get("platform_profiles", {}).get(args.platform)
    if not isinstance(profile, dict): raise ContractError("platform profile template is missing")
    for role, model in chosen.items():
        profile["roles"][role].pop("inherit", None); profile["roles"][role]["model_id"] = model; profile["roles"][role]["reasoning"] = args.reasoning
    profile.update({"setup_status": "configured", "approved_by": "user-confirmed", "approved_at": datetime.now(timezone.utc).isoformat()})
    atomic_json_write(path, config)
    return {"platform": args.platform, "setup_status": "configured", "roles": sorted(chosen), "routing_enforcement": profile["routing_enforcement"]}

def main() -> int:
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest="command", required=True)
    for name in ("detect", "status"):
        item = sub.add_parser(name); item.add_argument("--root", default="."); item.add_argument("--platform", choices=sorted(KNOWN_PLATFORMS))
    item = sub.add_parser("configure"); item.add_argument("--root", default="."); item.add_argument("--platform", choices=sorted(KNOWN_PLATFORMS), required=True); item.add_argument("--model", action="append", default=[]); item.add_argument("--reasoning", default="host-default"); item.add_argument("--confirm", action="store_true")
    args = parser.parse_args(); root = Path(args.root).resolve()
    try:
        result = configure(root, args) if args.command == "configure" else detect(root, args.platform)
        if args.command == "status": result = {"platform": args.platform, "setup_status": result["profiles"].get(args.platform, "missing"), "detected": args.platform in result["candidates"]}
        print(json.dumps(result, indent=2)); return 0
    except (ContractError, OSError, ValueError, yaml.YAMLError) as exc:
        print(f"PLATFORM SETUP BLOCKED: {exc}"); return 2
if __name__ == "__main__": raise SystemExit(main())
