#!/usr/bin/env python3
"""
Semantic Diff Gate for I-Wish SDLC Anti-Drift Architecture (V3)
Validates that database/API mutations in the code do not exceed the boundaries
declared in contract-manifest.yaml or contract-context.json.

Enforces:
- Option 5 & 8: Prisma Drift Gate & Semantic Diff Gate.
- FMEA EC-P6-02: Cryptographic signature verification of contract manifest.
- FMEA EC-P10-02: Structured, actionable JSON report for any contract drift.
"""

import os
import sys
import json
import subprocess
import argparse
from watchmen_client import verify_evidence
import yaml
from typing import Dict, Any, List, Set, Optional, Tuple

# Dynamic import of Prisma adapter and AI Contract Compiler
script_dir = os.path.dirname(os.path.abspath(__file__))
adapters_dir = os.path.join(script_dir, "adapters")
adapter_path = os.path.join(adapters_dir, "prisma-contract-adapter.py")
if not os.path.exists(adapter_path):
    adapter_path = os.path.join(os.getcwd(), ".agent", "scripts", "adapters", "prisma-contract-adapter.py")

import importlib.util
spec = importlib.util.spec_from_file_location("prisma_contract_adapter", adapter_path)
prisma_contract_adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prisma_contract_adapter)
generate_contract_ir = prisma_contract_adapter.generate_contract_ir

compiler_path = os.path.join(script_dir, "ai-contract-compiler.py")
spec_c = importlib.util.spec_from_file_location("ai_contract_compiler", compiler_path)
ai_contract_compiler = importlib.util.module_from_spec(spec_c)
spec_c.loader.exec_module(ai_contract_compiler)
compile_contract_context = ai_contract_compiler.compile_contract_context


def get_git_modified_files() -> List[str]:
    """Returns list of files modified in current git worktree/branch vs HEAD."""
    try:
        res = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            check=True
        )
        files = []
        for line in res.stdout.splitlines():
            parts = line.strip().split(maxsplit=1)
            if len(parts) == 2:
                files.append(parts[1])
        return files
    except Exception:
        return []


def get_git_diff_for_file(filepath: str) -> str:
    """Returns git diff for a specific file vs HEAD."""
    try:
        res = subprocess.run(
            ["git", "diff", "-U99999", "HEAD", "--", filepath],
            capture_output=True,
            text=True,
            check=True
        )
        return res.stdout
    except Exception:
        return ""


def detect_mutated_prisma_models(prisma_path: str, diff_text: str) -> Set[str]:
    """
    Detects which models have changes in the git diff of schema.prisma.
    """
    mutated = set()
    current_model = None

    # Simple scan of diff lines to find which model blocks were touched
    for line in diff_text.splitlines():
        if line.startswith("@@"):
            # Context header
            continue
        # Check for model start
        if "model " in line and "{" in line:
            import re
            m = re.search(r"model\s+([a-zA-Z0-9_]+)", line)
            if m:
                current_model = m.group(1)
        if current_model and (line.startswith("+") or line.startswith("-")) and not line.startswith("+++") and not line.startswith("---"):
            mutated.add(current_model)

    return mutated


def run_semantic_diff_check(
    story_dir: str,
    prisma_path: str,
    output_json: Optional[str] = None
) -> Tuple[bool, Dict[str, Any]]:
    """
    Runs the semantic diff gate check.
    Returns (passed, report_dict).
    """
    manifest_path = os.path.join(story_dir, "contract-manifest.yaml")
    sig_path = manifest_path + ".sig"
    
    # FMEA EC-P6-02 & EC-P6-03: Verify Watchmen .sig and signature_version
    if os.path.exists(manifest_path):
        if not os.path.exists(sig_path):
            return False, {
                "status": "FAIL",
                "reason": "Missing .sig file for contract-manifest.yaml (FMEA EC-P6-02)",
                "violations": [{"type": "MISSING_SIGNATURE", "details": "Watchmen .sig file is required for contract-manifest.yaml"}]
            }
        
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_content = f.read()
            if "signature_version" not in manifest_content:
                return False, {
                    "status": "FAIL",
                    "reason": "Missing signature_version in contract-manifest.yaml (FMEA EC-P6-03)",
                    "violations": [{"type": "MISSING_SIGNATURE_VERSION", "details": "Manifest must contain signature_version"}]
                }
        
        with open(sig_path, "r", encoding="utf-8") as f:
            signature = f.read().strip()
        
        try:
            manifest_data = yaml.safe_load(manifest_content)
            if not verify_evidence(manifest_data, signature):
                raise ValueError("Invalid cryptographic signature")
        except Exception as e:
            return False, {
                "status": "FAIL",
                "reason": f"Cryptographic signature validation failed (FMEA EC-P6-02): {str(e)}",
                "violations": [{"type": "INVALID_SIGNATURE", "details": str(e)}]
            }
                
    context_file = os.path.join(story_dir, "contract-context.json")
    if not os.path.exists(context_file):
        # Auto-compile if not already present
        try:
            context = compile_contract_context(story_dir=story_dir, prisma_path=prisma_path)
            with open(context_file, "w", encoding="utf-8") as f:
                json.dump(context, f, indent=2, ensure_ascii=False)
        except Exception as e:
            report = {
                "status": "FAIL",
                "reason": f"Failed to compile contract context: {e}",
                "violations": [{"type": "COMPILER_ERROR", "details": str(e)}]
            }
            return False, report
    else:
        with open(context_file, "r", encoding="utf-8") as f:
            context = json.load(f)

    allowed_mutations = set(context.get("boundaries", {}).get("allowedMutations", []))
    allowed_consumes = set(context.get("boundaries", {}).get("allowedConsumes", []))

    diff_text = get_git_diff_for_file(prisma_path)
    mutated_models = detect_mutated_prisma_models(prisma_path, diff_text)

    violations = []

    for model in sorted(list(mutated_models)):
        if model not in allowed_mutations:
            violations.append({
                "type": "UNAUTHORIZED_SCHEMA_MUTATION",
                "entity": model,
                "details": f"Model '{model}' in {prisma_path} was modified in git diff, but is not in allowedMutations {sorted(list(allowed_mutations))}."
            })

    passed = len(violations) == 0

    report = {
        "status": "PASS" if passed else "FAIL",
        "storyId": context.get("storyId"),
        "prismaPath": prisma_path,
        "allowedMutations": sorted(list(allowed_mutations)),
        "allowedConsumes": sorted(list(allowed_consumes)),
        "detectedMutatedModels": sorted(list(mutated_models)),
        "violations": violations
    }

    if output_json:
        os.makedirs(os.path.dirname(os.path.abspath(output_json)), exist_ok=True)
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

    return passed, report


def main():
    parser = argparse.ArgumentParser(description="Semantic Diff Gate: Enforce contract mutation boundaries")
    parser.add_argument("--story-dir", "-s", required=True, help="Path to story directory")
    parser.add_argument("--prisma-file", "-p", default="prisma/schema.prisma", help="Path to schema.prisma")
    parser.add_argument("--output-json", "-o", help="Path to write semantic diff report JSON")

    args = parser.parse_args()

    passed, report = run_semantic_diff_check(
        story_dir=args.story_dir,
        prisma_path=args.prisma_file,
        output_json=args.output_json
    )

    if passed:
        print("[PASS] Semantic Diff Gate: All Prisma mutations match contract manifest boundaries.")
        print(f"  - Detected Mutations: {report['detectedMutatedModels']}")
        print(f"  - Allowed Mutations:  {report['allowedMutations']}")
        sys.exit(0)
    else:
        print("[FAIL CLOSED] Semantic Diff Gate: Unauthorized Prisma schema drift detected!", file=sys.stderr)
        for v in report["violations"]:
            print(f"  ❌ [{v['type']}] {v['details']}", file=sys.stderr)
        if args.output_json:
            print(f"  Report written to: {args.output_json}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
