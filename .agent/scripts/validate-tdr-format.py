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
validate-tdr-format.py — Zero-Trust Trade-off Decision Record Format Validator

Checks every ADR section (### X.Y.) in architecture.md for the required TDR sub-sections.
Outputs a physical evidence JSON file for downstream validation gates.

Exit codes:
  0 — TDR Compliance Score >= 70%
  1 — TDR Compliance Score < 70% or missing file
"""

import sys
import re
import json
import os
from datetime import datetime, timezone

REQUIRED_SUBSECTIONS = [
    ("Decision", r"####\s+Decision"),
    ("Options Evaluated", r"####\s+Options Evaluated"),
    ("Trade-off Analysis", r"####\s+Trade-off Analysis"),
    ("Scale-Phase Roadmap", r"####\s+Scale-Phase Roadmap"),
    ("Change Log", r"####\s+Change Log"),
]

# Deeper checks for substantive content (not just headers)
SUBSTANTIVE_CHECKS = {
    "Decision": {
        "patterns": [r"\*\*(?:Chosen|Status|Decided)\*\*"],
        "min_matches": 1,
        "description": "Must have at least Status or Chosen field",
    },
    "Options Evaluated": {
        "patterns": [r"\|.*\|.*\|"],  # table rows
        "min_matches": 3,  # header + separator + at least 1 data row
        "description": "Must have a comparison table with at least 1 option row",
    },
    "Trade-off Analysis": {
        "patterns": [r"(?:Why|Trade-off|Accepted risk|Risk accepted|over)"],
        "min_matches": 1,
        "description": "Must explain why chosen option was preferred",
    },
    "Scale-Phase Roadmap": {
        "patterns": [r"\|.*\|.*\|"],  # table rows
        "min_matches": 4,  # header + separator + at least 2 phase rows
        "description": "Must have a phase table with at least 2 phases",
    },
    "Change Log": {
        "patterns": [r"\|.*\d{4}-\d{2}-\d{2}.*\|"],  # date in table
        "min_matches": 1,
        "description": "Must have at least 1 dated entry (initial decision)",
    },
}


def find_adr_sections(content: str) -> list[dict]:
    """Find all ### X.Y. sections (ADR-style numbered headings)."""
    # Match ### followed by a number pattern like 2.1., 2.2., etc.
    pattern = r"^###\s+(\d+\.\d+\.?\s+.+)$"
    lines = content.split("\n")
    sections = []
    current_section = None

    for i, line in enumerate(lines):
        match = re.match(pattern, line)
        if match:
            if current_section:
                current_section["end_line"] = i - 1
                current_section["content"] = "\n".join(
                    lines[current_section["start_line"] : i]
                )
                sections.append(current_section)
            current_section = {
                "title": match.group(1).strip(),
                "start_line": i,
                "end_line": None,
            }
        elif current_section and re.match(r"^##\s+", line):
            # Hit a higher-level heading, close current section
            current_section["end_line"] = i - 1
            current_section["content"] = "\n".join(
                lines[current_section["start_line"] : i]
            )
            sections.append(current_section)
            current_section = None

    # Close last section
    if current_section:
        current_section["end_line"] = len(lines) - 1
        current_section["content"] = "\n".join(
            lines[current_section["start_line"] :]
        )
        sections.append(current_section)

    return sections


def validate_section(section: dict) -> dict:
    """Validate a single ADR section for TDR compliance."""
    content = section["content"]
    result = {
        "title": section["title"],
        "start_line": section["start_line"] + 1,  # 1-indexed
        "subsections_found": [],
        "subsections_missing": [],
        "substantive_failures": [],
        "compliant": False,
        "score": 0,
    }

    total_checks = len(REQUIRED_SUBSECTIONS)
    passed = 0

    for name, pattern in REQUIRED_SUBSECTIONS:
        if re.search(pattern, content, re.MULTILINE):
            result["subsections_found"].append(name)

            # Extract the subsection content for substantive check
            sub_match = re.search(pattern, content, re.MULTILINE)
            if sub_match and name in SUBSTANTIVE_CHECKS:
                # Get content from this subsection header to next #### or end
                sub_start = sub_match.end()
                next_header = re.search(r"^####\s+", content[sub_start:], re.MULTILINE)
                if next_header:
                    sub_content = content[sub_start : sub_start + next_header.start()]
                else:
                    sub_content = content[sub_start:]

                check = SUBSTANTIVE_CHECKS[name]
                match_count = 0
                for p in check["patterns"]:
                    match_count += len(re.findall(p, sub_content, re.IGNORECASE))

                if match_count >= check["min_matches"]:
                    passed += 1
                else:
                    result["substantive_failures"].append(
                        f"{name}: {check['description']} (found {match_count} matches, need {check['min_matches']})"
                    )
            else:
                passed += 1
        else:
            result["subsections_missing"].append(name)

    result["score"] = round((passed / total_checks) * 100, 1) if total_checks > 0 else 0
    result["compliant"] = len(result["subsections_missing"]) == 0 and len(result["substantive_failures"]) == 0

    return result


def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: validate-tdr-format.py <architecture_file.md> [--evidence-output <path>]")
        print("\nValidates that all ADR sections follow the Trade-off Decision Record (TDR) format.")
        print("Exit 0 if TDR Compliance Score >= 70%, exit 1 otherwise.")
        sys.exit(0)

    if len(sys.argv) < 2:
        print("Usage: validate-tdr-format.py <architecture_file.md> [--evidence-output <path>]")
        sys.exit(1)

    arch_file = sys.argv[1]

    # Parse optional evidence output path
    evidence_path = None
    if "--evidence-output" in sys.argv:
        idx = sys.argv.index("--evidence-output")
        if idx + 1 < len(sys.argv):
            evidence_path = sys.argv[idx + 1]

    try:
        with open(arch_file) as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ FAIL: File not found: {arch_file}")
        sys.exit(1)

    sections = find_adr_sections(content)

    if not sections:
        print("❌ FAIL: No ADR sections (### X.Y.) found in the document.")
        sys.exit(1)

    results = []
    compliant_count = 0
    total_count = len(sections)

    for section in sections:
        result = validate_section(section)
        results.append(result)
        if result["compliant"]:
            compliant_count += 1

    compliance_score = round((compliant_count / total_count) * 100, 1)

    # Build evidence record
    evidence = {
        "tool": "validate-tdr-format",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input_file": arch_file,
        "total_adr_sections": total_count,
        "compliant_sections": compliant_count,
        "non_compliant_sections": total_count - compliant_count,
        "tdr_compliance_score": compliance_score,
        "pass": compliance_score >= 70.0,
        "section_details": results,
    }

    # Save evidence file (zero-trust)
    if evidence_path is None:
        evidence_path = os.path.join(
            os.path.dirname(arch_file) if os.path.dirname(arch_file) else ".",
            "..",
            "..",
            "adhoc-workspace",
            "scratch",
            "tdr_validation_evidence.json",
        )
        # Normalize
        evidence_dir = os.path.dirname(evidence_path)
        if evidence_dir:
            os.makedirs(evidence_dir, exist_ok=True)

    try:
        with open(evidence_path, "w") as f:
            json.dump(evidence, f, indent=2)
        print(f"📄 Evidence saved to: {evidence_path}")
    except Exception as e:
        print(f"⚠️  Warning: Could not save evidence file: {e}")

    # Print summary
    print(f"\n{'='*60}")
    print(f"TDR FORMAT VALIDATION REPORT")
    print(f"{'='*60}")
    print(f"Total ADR sections:     {total_count}")
    print(f"TDR-compliant:          {compliant_count}")
    print(f"Non-compliant:          {total_count - compliant_count}")
    print(f"TDR Compliance Score:   {compliance_score}%")
    print(f"{'='*60}")

    if total_count - compliant_count > 0:
        print(f"\n⚠️  Non-compliant sections:")
        for r in results:
            if not r["compliant"]:
                print(f"  → {r['title']} (line {r['start_line']})")
                for m in r["subsections_missing"]:
                    print(f"    ✗ Missing: {m}")
                for f_msg in r["substantive_failures"]:
                    print(f"    ✗ Weak: {f_msg}")

    if compliance_score >= 70.0:
        print(f"\n✅ PASS: TDR Compliance Score {compliance_score}% >= 70%")
        sys.exit(0)
    else:
        print(f"\n❌ FAIL: TDR Compliance Score {compliance_score}% < 70%")
        sys.exit(1)


if __name__ == "__main__":
    main()
