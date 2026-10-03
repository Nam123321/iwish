#!/usr/bin/env python3
"""
Project Drift Detector for I-Wish SDLC Anti-Drift Architecture (V3)
Operates as a continuous macro-auditor and legacy story migration engine.

Modes:
- continuous: Scans entire codebase for orphaned DB models, unmapped entities, and multi-story mutation collisions.
- migrate: Non-destructively retrofits completed legacy stories with standard contract manifests (status: UNVERIFIED).
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple

try:
    import yaml
except ImportError:
    print("[FATAL] pyyaml is required.", file=sys.stderr)
    sys.exit(1)

# Dynamic import of Prisma adapter
script_dir = os.path.dirname(os.path.abspath(__file__))
adapter_path = os.path.join(script_dir, "adapters", "prisma-contract-adapter.py")
import importlib.util
spec = importlib.util.spec_from_file_location("prisma_contract_adapter", adapter_path)
prisma_contract_adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prisma_contract_adapter)
generate_contract_ir = prisma_contract_adapter.generate_contract_ir


def find_all_story_dirs(project_root: str) -> List[Path]:
    """Finds all story directories in the workspace."""
    root = Path(project_root)
    stories = []
    
    # 1. Hierarchical layout
    search_path = root / "_iwish-output" / "3. Development" / "1. Epic & Story"
    if search_path.exists():
        for story_md in search_path.rglob("story.md"):
            stories.append(story_md.parent)
            
    # 2. Flat layout
    flat_path = root / "_iwish-output" / "stories"
    if flat_path.exists():
        for story_md in flat_path.glob("story-*.md"):
            stories.append(story_md.parent)
            
    return sorted(list(set(stories)))


def load_story_contract_declarations(story_dir: Path) -> Dict[str, Any]:
    """Extracts declared mutates, consumes, and status from a story directory."""
    manifest_path = story_dir / "contract-manifest.yaml"
    data_spec_path = story_dir / "data-spec.md"

    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if isinstance(data, dict):
                    return {
                        "source": "sidecar",
                        "status": data.get("status", "UNVERIFIED"),
                        "mutates": [m if isinstance(m, str) else m.get("entity") for m in data.get("mutates", []) if m],
                        "consumes": [c if isinstance(c, str) else c.get("entity") for c in data.get("consumes", []) if c]
                    }
        except Exception:
            pass

    if data_spec_path.exists():
        try:
            with open(data_spec_path, "r", encoding="utf-8") as f:
                content = f.read()

            fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
            if fm_match:
                fm_data = yaml.safe_load(fm_match.group(1))
                if isinstance(fm_data, dict) and "contract_manifest" in fm_data:
                    cm = fm_data["contract_manifest"]
                    return {
                        "source": "embedded",
                        "status": cm.get("status", "UNVERIFIED"),
                        "mutates": [m if isinstance(m, str) else m.get("entity") for m in cm.get("mutates", []) if m],
                        "consumes": [c if isinstance(c, str) else c.get("entity") for c in cm.get("consumes", []) if c]
                    }

            # Check for ```prisma block in markdown
            models = re.findall(r"model\s+([a-zA-Z0-9_]+)\s*\{", content)
            if models:
                return {
                    "source": "inferred_from_codeblock",
                    "status": "UNVERIFIED",
                    "mutates": models,
                    "consumes": []
                }
        except Exception:
            pass

    return {
        "source": "none",
        "status": "MISSING",
        "mutates": [],
        "consumes": []
    }


def run_continuous_audit(project_root: str, prisma_path: str) -> Dict[str, Any]:
    """Runs a complete project-wide continuous drift audit."""
    # 1. Parse current Prisma IR
    prisma_ir = generate_contract_ir(prisma_path)
    all_prisma_models = set(prisma_ir.get("entities", {}).keys())

    # 2. Collect all story declarations
    story_dirs = find_all_story_dirs(project_root)
    all_claimed_mutations: Dict[str, List[str]] = {}
    all_claimed_consumes: Dict[str, List[str]] = {}
    missing_manifest_stories: List[str] = []

    for s_dir in story_dirs:
        story_id = s_dir.name
        decl = load_story_contract_declarations(s_dir)
        if decl["status"] == "MISSING":
            missing_manifest_stories.append(story_id)
        for m in decl["mutates"]:
            all_claimed_mutations.setdefault(m, []).append(story_id)
        for c in decl["consumes"]:
            all_claimed_consumes.setdefault(c, []).append(story_id)

    # 3. Analyze drift metrics
    all_claimed_models = set(all_claimed_mutations.keys())
    orphaned_models = sorted(list(all_prisma_models - all_claimed_models))
    phantom_models = sorted(list(all_claimed_models - all_prisma_models))

    # Multi-story mutation collisions
    collisions = {
        m: stories for m, stories in all_claimed_mutations.items() if len(stories) > 1
    }

    report = {
        "auditType": "continuous_project_drift",
        "scannedStoriesCount": len(story_dirs),
        "totalPrismaModels": len(all_prisma_models),
        "orphanedModelsCount": len(orphaned_models),
        "orphanedModels": orphaned_models,
        "phantomModelsCount": len(phantom_models),
        "phantomModels": phantom_models,
        "mutationCollisionsCount": len(collisions),
        "mutationCollisions": collisions,
        "storiesMissingManifestCount": len(missing_manifest_stories),
        "storiesMissingManifest": missing_manifest_stories
    }
    return report


def run_legacy_migration(project_root: str, dry_run: bool = True) -> Dict[str, Any]:
    """
    Non-destructively injects standard YAML contract_manifest frontmatter
    into legacy completed stories that have data-spec.md without a manifest.
    """
    story_dirs = find_all_story_dirs(project_root)
    migrated_stories = []

    for s_dir in story_dirs:
        data_spec_file = s_dir / "data-spec.md"
        if not data_spec_file.exists():
            continue

        with open(data_spec_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Check if already has contract_manifest
        if "contract_manifest:" in content:
            continue

        # Extract models declared in prisma code blocks
        models = re.findall(r"model\s+([a-zA-Z0-9_]+)\s*\{", content)
        if not models:
            continue

        models_list_yaml = "\n".join([f"    - entity: {m}" for m in sorted(list(set(models)))])

        manifest_block = f"""contract_manifest:
  status: UNVERIFIED
  mutates:
{models_list_yaml}
  consumes: []
  provides: []
"""

        new_content = ""
        # If has frontmatter, inject inside it
        fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
        if fm_match:
            existing_fm = fm_match.group(1).rstrip()
            rest_of_body = fm_match.group(2)
            new_content = f"---\n{existing_fm}\n{manifest_block}---\n{rest_of_body}"
        else:
            new_content = f"---\n{manifest_block}---\n\n{content}"

        migrated_stories.append({
            "story": s_dir.name,
            "models": sorted(list(set(models))),
            "path": str(data_spec_file)
        })

        if not dry_run:
            with open(data_spec_file, "w", encoding="utf-8") as f:
                f.write(new_content)

    return {
        "migratedCount": len(migrated_stories),
        "dryRun": dry_run,
        "migrated": migrated_stories
    }


def main():
    parser = argparse.ArgumentParser(description="Project Drift Detector: Continuous macro-auditor & legacy migrator")
    parser.add_argument("--mode", choices=["continuous", "migrate", "reconcile", "check-collision"], default="continuous", help="Execution mode")
    parser.add_argument("--project-root", default=".", help="Project workspace root")
    parser.add_argument("--prisma-file", default="prisma/schema.prisma", help="Path to schema.prisma")
    parser.add_argument("--out", help="Path to output JSON report")
    parser.add_argument("--dry-run", action="store_true", help="Dry run for migration mode without writing changes")
    parser.add_argument("--model", help="Model name to check for collisions (only for check-collision mode)")

    args = parser.parse_args()

    if args.mode == "continuous":
        report = run_continuous_audit(args.project_root, args.prisma_file)
        print(f"=== PROJECT DRIFT AUDIT REPORT ===")
        print(f"  - Scanned Stories: {report['scannedStoriesCount']}")
        print(f"  - Total Prisma Models: {report['totalPrismaModels']}")
        print(f"  - Orphaned Models: {report['orphanedModelsCount']} (in DB but not tracked in any Story)")
        print(f"  - Phantom Models: {report['phantomModelsCount']} (in Story but missing in DB)")
        print(f"  - Mutation Collisions: {report['mutationCollisionsCount']}")
        print(f"  - Stories Missing Manifest: {report['storiesMissingManifestCount']}")
        
        if args.out:
            os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
            with open(args.out, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
            print(f"Report written to: {args.out}")


    elif args.mode == "check-collision":
        if not args.model:
            print("[ERROR] --model is required for check-collision mode", file=sys.stderr)
            sys.exit(1)
        
        story_dirs = find_all_story_dirs(args.project_root)
        conflicts = []
        for s_dir in story_dirs:
            contract = load_story_contract_declarations(s_dir)
            if contract and contract.get("status") != "IMPLEMENTED":
                if args.model in contract.get("mutates", []):
                    conflicts.append(s_dir.name)
        
        if conflicts:
            print(f"COLLISION: Model {args.model} is being concurrently mutated by {', '.join(conflicts)}")
            sys.exit(1) # Indicates collision found (although caller handles it via stdout/exit code)
        else:
            print(f"SAFE: No concurrent mutations found for {args.model}")
            sys.exit(0)

    elif args.mode == "reconcile":
        print("[INFO] Reconcile Mode: Reconciling legacy completed stories missing contract manifest...")
        res = run_legacy_migration(args.project_root, dry_run=args.dry_run)
        print(f"=== RECONCILE / MIGRATION REPORT ===")
        print(f"  - Reconciled Stories Count: {res['migratedCount']}")
        print(f"  - Dry Run: {res['dryRun']}")
        for m in res['migrated'][:10]:
            print(f"    * {m['story']} -> models: {m['models']}")
        if res['migratedCount'] > 10:
            print(f"    ... and {res['migratedCount'] - 10} more.")
        sys.exit(0)
    elif args.mode == "migrate":
        res = run_legacy_migration(args.project_root, dry_run=args.dry_run)
        print(f"=== LEGACY STORY MIGRATION REPORT ===")
        print(f"  - Migrated Stories Count: {res['migratedCount']}")
        print(f"  - Dry Run: {res['dryRun']}")
        for m in res['migrated'][:10]:
            print(f"    * {m['story']} -> models: {m['models']}")
        if res['migratedCount'] > 10:
            print(f"    ... and {res['migratedCount'] - 10} more.")


if __name__ == "__main__":
    main()
