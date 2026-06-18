#!/usr/bin/env python3
import sys
import re
import yaml
from pathlib import Path

def validate_story(filepath: Path) -> bool:
    if not filepath.is_file():
        print(f"❌ Error: File not found: {filepath}")
        return False

    content = filepath.read_text()
    errors = []

    # 1. Check OKF Frontmatter Header
    yaml_block_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not yaml_block_match:
        errors.append("Missing or invalid OKF YAML frontmatter block (must be enclosed in ---).")
    else:
        yaml_content = yaml_block_match.group(1)
        try:
            frontmatter = yaml.safe_load(yaml_content)
            required_keys = ["type", "title", "description", "resource", "tags", "timestamp", "links_to"]
            for key in required_keys:
                if key not in frontmatter:
                    errors.append(f"Missing required OKF frontmatter key: '{key}'.")
            if frontmatter.get("type") != "I-Wish Story":
                errors.append(f"OKF type must be 'I-Wish Story', found: '{frontmatter.get('type')}'")
        except Exception as e:
            errors.append(f"Error parsing YAML frontmatter: {e}")

    # 2. Check FR Covered Mapping
    fr_covered_pattern = re.compile(r'(?:FR Covered:|FR Covered\*\*|FR Covered\*\*:)')
    if not fr_covered_pattern.search(content):
        errors.append("Missing 'FR Covered:' mapping linking to the PRD.")

    # 3. Check Complexity Score (Plan-Tune Heuristic)
    complexity_pattern = re.compile(r'(?:Complexity Score|CS\s*=)', re.IGNORECASE)
    if not complexity_pattern.search(content):
        errors.append("Missing Complexity Score (CS) calculation or reference (Plan-Tune Heuristic).")

    # 4. Check AC-Task Traceability Matrix
    traceability_pattern = re.compile(r'Traceability Matrix|Traceability|AC-to-Task', re.IGNORECASE)
    if not traceability_pattern.search(content):
        errors.append("Missing AC-to-Task Traceability Matrix.")

    # 5. Check Cross-Feature Dependencies
    cross_feature_pattern = re.compile(r'##\s*Cross-Feature Dependencies', re.IGNORECASE)
    if not cross_feature_pattern.search(content):
        errors.append("Missing '## Cross-Feature Dependencies' section.")
    else:
        # Check sub-sections
        subsections = ["Impacts", "Consumes", "Shared Entities", "Cross-Portal"]
        for sub in subsections:
            if not re.search(r'###\s*' + sub, content, re.IGNORECASE):
                errors.append(f"Missing subsection '### {sub}' under '## Cross-Feature Dependencies'.")

    # 6. Check QA Simulator Scorecard
    qa_scorecard_pattern = re.compile(r'QA Simulator|Scorecard|TOTAL AVERAGE', re.IGNORECASE)
    if not qa_scorecard_pattern.search(content):
        errors.append("Missing QA Simulator Scorecard.")

    # Print results
    if errors:
        print(f"❌ Validation failed for: {filepath.name}")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print(f"✅ Story validation passed for: {filepath.name}!")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 validate-story.py <path_to_story.md>")
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    success = validate_story(file_path)
    sys.exit(0 if success else 1)
