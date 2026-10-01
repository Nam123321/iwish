#!/usr/bin/env python3
import sys
import re
import yaml
from pathlib import Path

def get_project_root() -> Path:
    return Path(__file__).resolve().parents[2]

def validate_links() -> bool:
    project_root = get_project_root()
    stories_dir = project_root / "_iwish-output" / "stories"
    
    if not stories_dir.is_dir():
        print(f"❌ Error: Stories directory not found at: {stories_dir}")
        return False

    errors = []
    all_story_files = {}  # maps story ID (string 'N.M') to Path object
    
    # 1. Collect all physical stories and map them
    for filepath in stories_dir.glob("**/story-*.md"):
        # Match story-N.M.md
        match = re.search(r'story-(\d+\.\d+)\.md$', filepath.name)
        if match:
            story_id = match.group(1)
            all_story_files[story_id] = filepath
        else:
            # Try matching other naming conventions if any
            match_alt = re.search(r'story-(\d+-\d+)\.md$', filepath.name)
            if match_alt:
                story_id = match_alt.group(1).replace("-", ".")
                all_story_files[story_id] = filepath
            else:
                errors.append(f"Invalid story filename format: {filepath.relative_to(project_root)}")

    print(f"🔍 Found {len(all_story_files)} physical story files.")

    # 2. Check internal consistency for each story
    for story_id, filepath in all_story_files.items():
        relative_path = filepath.relative_to(project_root)
        content = filepath.read_text(encoding="utf-8")
        
        # A. Check H1 Header matches filename ID
        # Expected: # Story N.M:...
        h1_match = re.search(r'^#\s*Story\s+(\d+\.\d+)[:\s]', content, re.IGNORECASE | re.MULTILINE)
        if h1_match:
            internal_h1_id = h1_match.group(1)
            if internal_h1_id != story_id:
                errors.append(
                    f"Content mismatch in {relative_path}:\n"
                    f"  - Filename implies ID '{story_id}'\n"
                    f"  - Internal H1 Header has ID '{internal_h1_id}'"
                )
        else:
            errors.append(f"Missing or malformed H1 Header in {relative_path} (expected '# Story {story_id}: ...')")

        # B. Check YAML Frontmatter ID matches filename ID if frontmatter exists
        yaml_block_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if yaml_block_match:
            yaml_content = yaml_block_match.group(1)
            try:
                frontmatter = yaml.safe_load(yaml_content)
                if frontmatter and isinstance(frontmatter, dict):
                    # Check id or similar field if exists
                    if "id" in frontmatter:
                        fm_id = str(frontmatter["id"]).strip().lower().replace("story-", "")
                        if fm_id != story_id:
                            errors.append(
                                f"Frontmatter ID mismatch in {relative_path}:\n"
                                f"  - Filename implies ID '{story_id}'\n"
                                f"  - Frontmatter 'id' is '{frontmatter['id']}'"
                            )
            except Exception as e:
                errors.append(f"Failed to parse frontmatter in {relative_path}: {e}")

        # C. Scan for all links and references in the file to make sure they aren't broken
        # Check markdown links like [text](story-X.Y.md) or [text](file:///...story-X.Y.md)
        links = re.findall(r'\]\(([^)]+)\)', content)
        for link in links:
            # We care about links to other stories
            # Extract story-X.Y.md or similar
            link_match = re.search(r'story-(\d+\.\d+)\.md', link)
            if link_match:
                linked_id = link_match.group(1)
                if linked_id not in all_story_files:
                    errors.append(
                        f"Broken link in {relative_path}:\n"
                        f"  - Link targets '{link}' which does not exist physically."
                    )
            # Also check absolute links in workspace
            elif "file://" in link:
                # Resolve workspace relative paths
                clean_path = link.replace("file://", "")
                # Strip anchor hashes
                if "#" in clean_path:
                    clean_path = clean_path.split("#")[0]
                # If absolute path pointing inside this project
                if str(project_root) in clean_path:
                    path_obj = Path(clean_path)
                    if not path_obj.exists():
                        errors.append(
                            f"Broken absolute workspace link in {relative_path}:\n"
                            f"  - Link targets '{link}' which does not exist physically."
                        )

    # 3. Check other planning files (like epics.md or project-context.md) for broken story references
    planning_files = [
        project_root / "_iwish-output" / "epics.md",
        project_root / "project-context.md"
    ]
    
    # Also find other planning files in _iwish-output/2. Product Planning/
    planning_dir = project_root / "_iwish-output" / "2. Product Planning"
    if planning_dir.is_dir():
        planning_files.extend(planning_dir.glob("**/*.md"))

    for filepath in planning_files:
        if not filepath.is_file():
            continue
            
        relative_path = filepath.relative_to(project_root)
        content = filepath.read_text(encoding="utf-8")
        
        # Scan for markdown links to stories
        links = re.findall(r'\]\(([^)]+)\)', content)
        for link in links:
            link_match = re.search(r'story-(\d+\.\d+)\.md', link)
            if link_match:
                linked_id = link_match.group(1)
                if linked_id not in all_story_files:
                    errors.append(
                        f"Broken story reference in planning file {relative_path}:\n"
                        f"  - Referenced story file '{link}' does not exist physically."
                    )

    # Report results
    if errors:
        print("\n❌ Link & ID Validation Failed:")
        for err in errors:
            print(f"- {err}")
        return False
    else:
        print("\n✅ Link & ID Validation Passed successfully!")
        return True

if __name__ == "__main__":
    success = validate_links()
    sys.exit(0 if success else 1)
