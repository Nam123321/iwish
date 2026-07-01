#!/usr/bin/env python3
import sys
import re
import yaml
from pathlib import Path

def normalize_id(id_str):
    normalized = id_str.strip().lower().replace('.', '-')
    if normalized.startswith("story-"):
        normalized = normalized[6:]
    elif normalized.startswith("story "):
        normalized = normalized[6:]
    return normalized

def check_dependencies_status(dependencies, project_root) -> list:
    sprint_status_file = project_root / "_iwish-output" / "stories" / "sprint-status.yaml"
    if not sprint_status_file.is_file():
        sprint_status_file_alt1 = project_root / "_iwish-output" / "3. Development" / "sprint-status.yaml"
        sprint_status_file_alt2 = project_root / "_iwish-output" / "sprint-status.yaml"
        if sprint_status_file_alt1.is_file():
            sprint_status_file = sprint_status_file_alt1
        elif sprint_status_file_alt2.is_file():
            sprint_status_file = sprint_status_file_alt2
        else:
            return []  # Skip checking if sprint-status.yaml does not exist yet

    try:
        with open(sprint_status_file, "r", encoding="utf-8") as f:
            status_data = yaml.safe_load(f)

        # Build normalized status lookup
        story_statuses = {}
        if status_data:
            if "epics" in status_data:
                for epic in status_data["epics"]:
                    if "stories" in epic:
                        for story in epic["stories"]:
                            sid = normalize_id(story["id"])
                            story_statuses[sid] = story.get("status", "not_started")
            elif "development_status" in status_data and status_data["development_status"]:
                for key, val in status_data["development_status"].items():
                    if key.startswith("story-"):
                        sid = normalize_id(key)
                        story_statuses[sid] = val
            else:
                for key, val in status_data.items():
                    if key.lower().startswith("story"):
                        sid = normalize_id(key.split(" - ")[0])
                        story_statuses[sid] = val
        print(story_statuses)
        errors = []
        for dep in dependencies:
            dep_cleaned = str(dep).strip()
            dep_norm = normalize_id(dep_cleaned)
            
            # Find status using prefix matching (e.g. "23-1" matches "23-1-google-drive-oauth")
            status = None
            matched_key = None
            for key, val in story_statuses.items():
                if key == dep_norm or key.startswith(dep_norm + "-"):
                    status = val
                    matched_key = key
                    break
            
            if status is None:
                errors.append(f"Dependency story '{dep_cleaned}' was not found in sprint-status.yaml.")
            elif status != "completed":
                errors.append(f"Dependency story '{dep_cleaned}' is not completed (current status: '{status}').")
        return errors
    except Exception as e:
        return [f"Error checking dependency status from sprint-status.yaml: {e}"]

def validate_story(filepath: Path) -> bool:
    if not filepath.is_file():
        print(f"❌ Error: File not found: {filepath}")
        return False

    content = filepath.read_text()
    errors = []
    project_root = Path(__file__).resolve().parents[2]

    # Trích xuất Epic ID và Story ID từ tên file hoặc đường dẫn thư mục
    # Strict File Naming & Case-Insensitive FS Check
    actual_name = None
    if filepath.parent.exists():
        for p in filepath.parent.iterdir():
            if p.name.lower() == filepath.name.lower():
                actual_name = p.name
                break
    if actual_name and actual_name != filepath.name:
        errors.append(f"Case-insensitive match found. Expected '{filepath.name}', but actual file is '{actual_name}'.")

    filename = filepath.name
    if filename.lower() == "ui-ux-spec.md":
        errors.append("Invalid filename: 'ui-ux-spec.md' is strictly forbidden. Use 'ui-spec.md' instead.")

    # Thử khớp cấu trúc thư mục phân cấp (ví dụ: /Epic-11/Story-11.1/story.md)
    # Hỗ trợ ký tự alphanumeric cho minor ID như 3b, 10a, v.v.
    filepath_str = filepath.resolve().as_posix()
    match = re.search(r'/Epic-(\d+)/Story-(\d+)[.-]([a-zA-Z0-9]+)', filepath_str, re.IGNORECASE)
    if match:
        epic_id = match.group(1)
        story_id = f"{match.group(2)}.{match.group(3)}"
        if filename != "story.md":
            errors.append(f"In hierarchical layout, the story file must be named strictly 'story.md', found: '{filename}'.")
    else:
        # Thử khớp cấu trúc phẳng tên file (ví dụ: story-16.2.md)
        match = re.search(r'^story-(\d+)\.([a-zA-Z0-9]+)\.md$', filename)
        if match:
            epic_id = match.group(1)
            story_id = f"{match.group(1)}.{match.group(2)}"
        else:
            match_fallback = re.search(r'story-(\d+)[.-]([a-zA-Z0-9]+)', filename, re.IGNORECASE)
            if match_fallback:
                errors.append(f"In flat layout, the story file must be named strictly matching 'story-N.M.md' (all lowercase), found: '{filename}'.")
                epic_id = match_fallback.group(1)
                story_id = f"{match_fallback.group(1)}.{match_fallback.group(2)}"
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
        
        # Hỗ trợ đa dạng cách đặt tên của file review từ review-agent
        story_id_dash = story_id.replace('.', '-')
        reviews_dir = project_root / "_iwish-output" / "reviews"
        
        review_candidates = [
            reviews_dir / f"review-story-{story_id}.md",
            reviews_dir / f"review-story-{story_id_dash}.md",
            reviews_dir / f"review_{story_id}.md",
            reviews_dir / f"review_{story_id_dash}.md"
        ]
        
        review_file = None
        for cand in review_candidates:
            if cand.is_file():
                review_file = cand
                break
        
        if not review_file:
            errors.append(f"Physical Review File missing in _iwish-output/reviews/. Checked names: {[c.name for c in review_candidates]}. You must run review-agent first.")
        else:
            if review_file.stat().st_size < 150:
                review_text = review_file.read_text()
                if "mock" in review_text.lower() or "placeholder" in review_text.lower():
                    errors.append(f"Physical Review File '{review_file.relative_to(project_root)}' is a placeholder/mock. Please run real review-agent scan.")
                elif review_file.stat().st_size < 100:
                    errors.append(f"Physical Review File '{review_file.relative_to(project_root)}' is too short ({review_file.stat().st_size} bytes). Minimum size is 100 bytes.")

        # Risk matrix file from Edge Case Guardian
        risk_file = project_root / "_iwish-output" / "edge-case-knowledge" / "epics" / f"epic-{epic_id}-risk-matrix.md"
        if not risk_file.is_file():
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

    # 8. Status Auto-Fix Logic
    if epic_id and story_id and not errors:
        tasks_match = re.search(r'## Tasks\n(.*?)(?=\n## |$)', content, re.DOTALL)
        if tasks_match:
            tasks_text = tasks_match.group(1)
            unchecked = len(re.findall(r'- \[\s\]', tasks_text))
            checked = len(re.findall(r'- \[x\]', tasks_text, re.IGNORECASE))
            
            has_tasks = (unchecked + checked) > 0
            all_completed = has_tasks and (unchecked == 0)
            
            review_passed = False
            if review_file and review_file.is_file():
                rt = review_file.read_text().upper()
                if "PASS" in rt:
                    review_passed = True
                    
            try:
                # yaml_block_match is defined above
                frontmatter = yaml.safe_load(yaml_block_match.group(1))
                current_status = frontmatter.get("status", "").lower() if frontmatter else ""
                
                if all_completed and review_passed:
                    if current_status != "completed":
                        print("🔄 Auto-fixing status to 'completed' as all tasks are ticked and review passed QA.")
                        new_content = re.sub(r'^status:\s*.*$', "status: completed", content, flags=re.MULTILINE)
                        filepath.write_text(new_content)
                else:
                    if current_status == "completed":
                        print("🔄 Auto-downgrading status to 'in-progress' as conditions for completion are no longer met.")
                        new_content = re.sub(r'^status:\s*.*$', "status: in-progress", content, flags=re.MULTILINE)
                        filepath.write_text(new_content)
            except Exception as e:
                pass

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
