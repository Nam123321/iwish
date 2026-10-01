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
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

"""
Architecture Coherence Checker — Deterministic ADR↔Story Tech-Stack Cross-Reference.

Reads the pre-compiled tdr-manifest.json and cross-references
against story-level tech choices to detect infrastructure conflicts.

Created: 2026-07-30
Updated: Refactored to strictly use build-time compiled JSON manifest for zero-latency, deterministic governance.
"""

import sys
import os
import re
import json
import argparse
import glob

# Load the compiled manifest
def load_manifest():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    manifest_path = os.path.join(script_dir, "tdr-manifest.json")
    if not os.path.exists(manifest_path):
        print(f"ERROR: Compiled TDR manifest not found at {manifest_path}")
        print("Please run: python3 .agent/scripts/compile-tdr-manifest.py --tdr \"_iwish-output/2. Product Planning/tech-decision-registry.yaml\" --output .agent/scripts/tdr-manifest.json")
        sys.exit(1)
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_story_techs(story_dir: str, tech_patterns_dict: dict) -> list[dict]:
    """Extract technology references from story artifacts."""
    techs_found = []
    
    # Pre-compile regexes
    compiled_patterns = {
        tech_name: re.compile(pattern_str, re.IGNORECASE)
        for tech_name, pattern_str in tech_patterns_dict.items()
    }
    
    # Check story status first
    story_md_path = os.path.join(story_dir, "story.md")
    if os.path.exists(story_md_path):
        with open(story_md_path, "r", encoding="utf-8") as f:
            content = f.read()
        status_line = next((line for line in content.splitlines() if line.startswith("status:")), "")
        status = status_line.split(":")[-1].strip().lower()
        if status in ["superseded", "cancelled", "merged", "deprecated"]:
            return []  # Skip scanning deprecated/cancelled stories

    files_to_scan = ["story.md", "data-spec.md", "ui-spec.md", "task.md"]

    for filename in files_to_scan:
        filepath = os.path.join(story_dir, filename)
        if not os.path.exists(filepath):
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        for tech_name, pattern in compiled_patterns.items():
            matches = list(pattern.finditer(content))
            if matches:
                # Get context around first match
                m = matches[0]
                start = max(0, m.start() - 80)
                end = min(len(content), m.end() + 80)
                context = content[start:end].replace("\n", " ").strip()
                
                if re.search(r'migrating\s+off|migrate\s+away|legacy|deprecated|replaced|removed|instead\s+of|changelog|history|transitioned\s+to|decoupling', context, re.IGNORECASE):
                    continue

                techs_found.append({
                    "technology": tech_name,
                    "source_file": filename,
                    "match_count": len(matches),
                    "context_snippet": context[:150],
                })

    return techs_found


def cross_reference(manifest: dict, story_techs: list[dict], epic_id: str = None) -> list[dict]:
    """Cross-reference story techs against ADR registry for conflicts."""
    findings = []
    adr_registry = manifest["registry"]
    epic_restrictions = manifest.get("epic_restrictions", {})

    for st in story_techs:
        tech = st["technology"]
        
        # Find all registry entries matching this tech
        adr_matches = [a for a in adr_registry if a["technology"] == tech]
        
        # We need the category for this tech. We can take it from the first match,
        # or if not matched, we won't know the category.
        category = adr_matches[0]["category"] if adr_matches else "unknown"

        # Enforce epic-level boundaries if applicable
        if epic_id and epic_id in epic_restrictions:
            restrictions = epic_restrictions[epic_id]
            if category in restrictions.get("restricted_categories", []):
                if tech not in restrictions.get("allowed_techs", []):
                    findings.append({
                        "severity": "CRITICAL",
                        "type": "epic-boundary-violation",
                        "message": f"Story uses '{tech}' which is strictly forbidden for Epic {epic_id}. Only {restrictions['allowed_techs']} are permitted under ADR {restrictions['enforced_adr']}.",
                        "story_tech": tech,
                        "adr_tech": restrictions["enforced_adr"],
                        "adr_id": restrictions["enforced_adr"],
                        "source_file": st["source_file"],
                        "context": st["context_snippet"],
                    })
                    continue

        if not adr_matches:
            findings.append({
                "severity": "MEDIUM",
                "type": "unregistered-tech",
                "message": f"Story uses '{tech}' which is not registered in any ADR. Consider adding an ADR entry.",
                "story_tech": tech,
                "adr_tech": None,
                "adr_id": None,
                "source_file": st["source_file"],
                "context": st["context_snippet"],
            })
        else:
            # Technology IS in ADR — check status
            for adr in adr_matches:
                if adr["status"] == "future":
                    findings.append({
                        "severity": "HIGH",
                        "type": "premature-adoption",
                        "message": f"Story uses '{tech}' which is marked as 'future/enterprise-phase' in ADR {adr['adr_id']}. Current phase does not support this technology.",
                        "story_tech": tech,
                        "adr_tech": tech,
                        "adr_id": adr["adr_id"],
                        "source_file": st["source_file"],
                        "context": st["context_snippet"],
                    })
                elif adr["status"] == "deprecated":
                    findings.append({
                        "severity": "HIGH",
                        "type": "deprecated-tech",
                        "message": f"Story uses '{tech}' which is marked as 'deprecated' in ADR {adr['adr_id']}.",
                        "story_tech": tech,
                        "adr_tech": tech,
                        "adr_id": adr["adr_id"],
                        "source_file": st["source_file"],
                        "context": st["context_snippet"],
                    })
                elif adr["status"] == "active":
                    findings.append({
                        "severity": "PASS",
                        "type": "aligned",
                        "message": f"Story uses '{tech}' — aligned with active ADR {adr['adr_id']}.",
                        "story_tech": tech,
                        "adr_tech": tech,
                        "adr_id": adr["adr_id"],
                        "source_file": st["source_file"],
                        "context": "",
                    })

    # Note: We dropped the "category-conflict" check where a tech isn't in ADR but its category is,
    # because without hardcoded TECH_TO_CATEGORY we don't know an unregistered tech's category!

    return findings


def process_epic(epic_dir: str, output_path: str):
    """Process all stories in an epic directory."""
    manifest = load_manifest()
    tech_patterns = manifest["tech_patterns"]

    epic_id = None
    basename = os.path.basename(epic_dir.rstrip("/"))
    if basename.startswith("Epic-"):
        epic_id = basename.replace("Epic-", "")
    if not epic_id:
        m = re.search(r'Epic-(\d+)', epic_dir)
        if m:
            epic_id = m.group(1)

    all_findings = []
    story_dirs = sorted(glob.glob(os.path.join(epic_dir, "Story-*")))

    if not story_dirs:
        # Maybe stories are directly in epic_dir
        story_dirs = [epic_dir]

    for story_dir in story_dirs:
        if not os.path.isdir(story_dir):
            continue
        story_id = os.path.basename(story_dir)
        story_techs = extract_story_techs(story_dir, tech_patterns)
        if story_techs:
            findings = cross_reference(manifest, story_techs, epic_id=epic_id)
            for f in findings:
                f["story_id"] = story_id
            all_findings.extend(findings)

    # Generate report
    conflicts = [f for f in all_findings if f["severity"] in ("CRITICAL", "HIGH")]
    warnings = [f for f in all_findings if f["severity"] == "MEDIUM"]
    passes = [f for f in all_findings if f["severity"] == "PASS"]

    report = {
        "tool_id": "architecture-coherence-checker-v2-compiled",
        "target": epic_dir,
        "adr_registry_count": len(manifest["registry"]),
        "stories_scanned": len(story_dirs),
        "total_findings": len(all_findings),
        "conflicts": len(conflicts),
        "warnings": len(warnings),
        "passes": len(passes),
        "overall_status": "FAIL" if conflicts else ("WARN" if warnings else "PASS"),
        "findings": all_findings,
    }

    # Write output
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Print summary
    print(f"Architecture Coherence Check (Compiled): {report['overall_status']}")
    print(f"  ADR entries found: {report['adr_registry_count']}")
    print(f"  Stories scanned: {report['stories_scanned']}")
    print(f"  Conflicts (CRITICAL/HIGH): {report['conflicts']}")
    print(f"  Warnings (MEDIUM): {report['warnings']}")
    print(f"  Aligned (PASS): {report['passes']}")

    if conflicts:
        print("\n--- CONFLICTS DETECTED ---")
        for c in conflicts:
            print(f"  [{c['severity']}] {c['story_id']}: {c['message']}")
            print(f"    Source: {c['source_file']} | Context: {c['context'][:100]}")

    return report["overall_status"] != "FAIL"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Architecture Coherence Checker — Compiled Manifest Mode"
    )
    # --architecture argument is ignored now but kept for backwards compatibility in caller scripts
    parser.add_argument("--architecture", required=False, help="Ignored. Retained for backwards compatibility.")
    parser.add_argument("--story-dir", help="Path to a single story directory")
    parser.add_argument("--epic-dir", help="Path to an epic directory (scans all stories)")
    parser.add_argument("--output-json", required=True, help="Output JSON report path")
    args = parser.parse_args()

    target_dir = args.epic_dir or args.story_dir
    if not target_dir:
        print("ERROR: Must specify either --story-dir or --epic-dir")
        sys.exit(1)

    success = process_epic(target_dir, args.output_json)
    sys.exit(0 if success else 1)
