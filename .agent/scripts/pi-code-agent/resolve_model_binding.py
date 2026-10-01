#!/usr/bin/env python3
"""Resolve an approved platform/role model binding without probing credentials."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import yaml

from core import ContractError, atomic_json_write, canonical, sha256_file


def digest(value: object) -> str:
    return hashlib.sha256(canonical(value)).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--platform", required=True)
    parser.add_argument("--role", choices=["default", "planner", "scout", "worker", "reviewer", "security", "cleanse", "learning"], required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    root = Path(args.root).resolve()
    config = root / ".agent" / "config" / "pi-code-agent"
    platforms = yaml.safe_load((config / "platform-registry.yaml").read_text(encoding="utf-8"))
    policy = yaml.safe_load((config / "model-role-policy.yaml").read_text(encoding="utf-8"))
    bindings = yaml.safe_load((config / "model-bindings.yaml").read_text(encoding="utf-8"))
    platform = next((item for item in platforms.get("platforms", []) if item.get("id") == args.platform), None)
    profile = bindings.get("platform_profiles", {}).get(args.platform)
    role_policy = policy.get("roles", {}).get(args.role)
    if not isinstance(platform, dict) or not isinstance(profile, dict) or not isinstance(role_policy, dict):
        raise ContractError("platform is not registered for model routing")
    if profile.get("setup_status") != "configured":
        raise ContractError(f"platform profile requires user setup: {args.platform}")

    def resolve_role(role: str, seen: set[str] | None = None) -> dict:
        seen = set() if seen is None else seen
        if role in seen:
            raise ContractError("cyclic role inheritance")
        seen.add(role)
        value = profile.get("roles", {}).get(role)
        if not isinstance(value, dict):
            raise ContractError(f"missing role mapping: {role}")
        parent = value.get("inherit")
        inherited = resolve_role(parent, seen) if isinstance(parent, str) else {}
        return {**inherited, **{key: item for key, item in value.items() if key != "inherit"}}

    binding = resolve_role(args.role)
    model_id = binding.get("model_id")
    if not isinstance(model_id, str) or not model_id:
        raise ContractError(f"role has no user-approved model: {args.role}")
        
    # EC-P11: Safely map model ID to Antigravity invoke_subagent enums
    if args.platform == "antigravity":
        model_lower = model_id.lower()
        if "flash-lite" in model_lower or "flash_lite" in model_lower:
            model_id = "flash_lite"
        elif "flash" in model_lower:
            model_id = "flash"
        elif "pro" in model_lower:
            model_id = "pro"
        elif "inherit" in model_lower:
            model_id = "inherit"
        else:
            model_id = "pro" # Safe fallback
            
    assurance = binding.get("review_assurance", "not-applicable")
    result = {
        "schema_version": "1.0",
        "binding_id": f"binding-{digest([args.platform, args.role, binding])[:16]}",
        "platform_id": args.platform,
        "role": args.role,
        "policy_sha256": sha256_file(config / "model-role-policy.yaml"),
        "binding_sha256": sha256_file(config / "model-bindings.yaml"),
        "requested_model": model_id,
        "observed_model": None,
        "model_observation": "user-declared" if profile.get("model_observation") == "user-declared" else "unavailable",
        "reasoning": binding.get("reasoning", "host-default"),
        "decision": "bound",
        "review_assurance": assurance,
        "routing_enforcement": profile.get("routing_enforcement"),
    }
    atomic_json_write(Path(args.output), result)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ContractError, OSError, ValueError, yaml.YAMLError) as exc:
        print(f"MODEL BINDING BLOCKED: {exc}")
        raise SystemExit(2)
