#!/usr/bin/env python3
import sys
import re
import yaml
from pathlib import Path

def check_dependencies_status(dependencies, project_root) -> list:
    sprint_status_file = project_root / "_iwish-output" / "3. Development" / "sprint-status.yaml"
    if not sprint_status_file.is_file():
        sprint_status_file_alt = project_root / "_iwish-output" / "sprint-status.yaml"
        if sprint_status_file_alt.is_file():
            sprint_status_file = sprint_status_file_alt
        else:
            return []  # Skip checking if sprint-status.yaml does not exist yet

    try:
        with open(sprint_status_file, "r", encoding="utf-8") as f:
            status_data = yaml.safe_load(f)

        story_statuses = {}
        if status_data and "epics" in status_data:
            for epic in status_data["epics"]:
                if "stories" in epic:
                    for story in epic["stories"]:
                        story_statuses[story["id"]] = story.get("status", "not_started")

        errors = []
        for dep in dependencies:
            dep_cleaned = str(dep).strip()
            dep_id = dep_cleaned if dep_cleaned.startswith("story-") else f"story-{dep_cleaned}"
            status = story_statuses.get(dep_id)
            if status is None:
                errors.append(f"Dependency story '{dep_id}' was not found in sprint-status.yaml.")
            elif status != "done":
                errors.append(f"Dependency story '{dep_id}' is not DONE (current status: '{status}').")
        return errors
    except Exception as e:
        return [f"Error checking dependency status from sprint-status.yaml: {e}"]

def validate_story(filepath: Path) -> bool:
    if not filepath.is_file():
        print(f"❌ Error: File not found: {filepath}")
        return False

    content = filepath.read_text()
    errors = []

    # Trích xuất Epic ID và Story ID từ tên file hoặc đường dẫn thư mục
    filepath_str = filepath.resolve().as_posix()
    project_root = Path(__file__).resolve().parents[2]
    
    # Thử khớp cấu trúc thư mục phân cấp (ví dụ: /Epic-11/Story-11.1/story.md)
    match = re.search(r'/Epic-(\d+)/Story-(\d+)[.-](\d+)', filepath_str, re.IGNORECASE)
    if match:
        epic_id = match.group(1)
        story_id = f"{match.group(2)}.{match.group(3)}"
    else:
        # Thử khớp cấu trúc phẳng tên file (ví dụ: story-16.2.md)
        filename = filepath.name
        match = re.search(r'story-(\d+)\.(\d+)', filename, re.IGNORECASE)
        if not match:
            match = re.search(r'story-(\d+)-(\d+)', filename, re.IGNORECASE)
        
        if match:
            epic_id = match.group(1)
            story_id = f"{match.group(1)}.{match.group(2)}"
        else:
            errors.append(f"Filename or path must match pattern 'Epic-N/Story-N.M/story.md' or 'story-N.M.md', found: '{filepath_str}'")
            epic_id = None
            story_id = None

    # 1. Check OKF Frontmatter Header
    yaml_block_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not yaml_block_match:
        errors.append("Missing or invalid OKF YAML frontmatter block (must be enclosed in ---).")
    else:
        yaml_content = yaml_block_match.group(1)
        try:
            frontmatter = yaml.safe_load(yaml_content)
            required_keys = ["type", "title", "description", "resource", "tags", "timestamp", "links_to", "dependencies"]
            for key in required_keys:
                if key not in frontmatter:
                    errors.append(f"Missing required OKF frontmatter key: '{key}'.")
            
            if frontmatter.get("type") != "I-Wish Story":
                errors.append(f"OKF type must be 'I-Wish Story', found: '{frontmatter.get('type')}'")
            
            if "dependencies" in frontmatter:
                deps = frontmatter["dependencies"]
                if not isinstance(deps, list):
                    errors.append("OKF frontmatter key 'dependencies' must be a list (array).")
                else:
                    dep_errors = check_dependencies_status(deps, project_root)
                    errors.extend(dep_errors)
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
    cross_feature_pattern = re.compile(r'##\s*.*?Cross-Feature Dependencies', re.IGNORECASE)
    if not cross_feature_pattern.search(content):
        errors.append("Missing '## Cross-Feature Dependencies' section.")
    else:
        subsections = ["Impacts", "Consumes", "Shared Entities", "Cross-Portal"]
        for sub in subsections:
            if not re.search(r'###\s*' + sub, content, re.IGNORECASE):
                errors.append(f"Missing subsection '### {sub}' under '## Cross-Feature Dependencies'.")

    # 6. Check QA Simulator Scorecard
    qa_scorecard_pattern = re.compile(r'QA Simulator|Scorecard|TOTAL AVERAGE', re.IGNORECASE)
    if not qa_scorecard_pattern.search(content):
        errors.append("Missing QA Simulator Scorecard.")

    # 7. Physical verification: Check review file and risk matrix
    if epic_id and story_id:
        project_root = Path(__file__).resolve().parents[2]
        
        # File review from review-agent
        review_file = project_root / "_iwish-output" / "reviews" / f"review-story-{story_id}.md"
        if not review_file.is_file():
            errors.append(f"Physical Review File missing: '{review_file.relative_to(project_root)}'. You must run review-agent first.")
        elif review_file.stat().st_size < 150:
            review_text = review_file.read_text()
            if "mock" in review_text.lower() or "placeholder" in review_text.lower():
                errors.append(f"Physical Review File '{review_file.relative_to(project_root)}' is a placeholder/mock. Please run real review-agent scan.")
            elif review_file.stat().st_size < 100:
                errors.append(f"Physical Review File '{review_file.relative_to(project_root)}' is too short ({review_file.stat().st_size} bytes). Minimum size is 100 bytes.")

        # Risk matrix file from Edge Case Guardian
        risk_file = project_root / "_iwish-output" / "edge-case-knowledge" / "epics" / f"epic-{epic_id}-risk-matrix.md"
        if not risk_file.is_file():
            # Thử tìm với chữ hoa 'Epic'
            risk_file_alt = project_root / "_iwish-output" / "edge-case-knowledge" / "epics" / f"Epic-{epic_id}-risk-matrix.md"
            if risk_file_alt.is_file():
                risk_file = risk_file_alt
            
        if not risk_file.is_file():
            errors.append(f"Physical Risk Matrix File missing: 'epic-{epic_id}-risk-matrix.md' in _iwish-output/edge-case-knowledge/epics/. You must run Edge Case Guardian scan first.")
        elif risk_file.stat().st_size < 150:
            risk_text = risk_file.read_text()
            if "mock" in risk_text.lower() or "placeholder" in risk_text.lower():
                errors.append(f"Physical Risk Matrix File '{risk_file.relative_to(project_root)}' is a placeholder/mock. Please run real Edge Case Guardian scan.")
            elif risk_file.stat().st_size < 100:
                errors.append(f"Physical Risk Matrix File '{risk_file.relative_to(project_root)}' is too short ({risk_file.stat().st_size} bytes). Minimum size is 100 bytes.")

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
