import os, sys
script_dir = os.path.dirname(os.path.abspath(__file__))
agent_dir = os.path.abspath(os.path.join(script_dir, ".."))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass

import os
import subprocess

import os
import sys

def check_data_integrity(statuses):
    count = len(statuses)
    CHECKPOINT = '_iwish-output/_state/story-count-checkpoint.txt'
    min_threshold = 0
    
    if os.path.exists(CHECKPOINT):
        try:
            last_count = int(open(CHECKPOINT).read().strip())
            min_threshold = last_count - 5
        except ValueError:
            print("⚠️ Checkpoint file is corrupted. Bootstrapping new threshold.")
            min_threshold = count - 5
    else:
        print(f"⚠️ No checkpoint found. Bootstrapping threshold based on current {count} stories.")
        min_threshold = count - 5

    force = "--force" in sys.argv
    if count < min_threshold and not force:
        print(f"🔴 HALT: Only {count} stories detected (expected >= {min_threshold}).")
        print("Likely cause: _iwish-output/ replaced by git checkout.")
        print("If this is an error, fix via: cd _iwish-output && git checkout -- .")
        print("If this drop is INTENTIONAL (e.g., mass deletion), run with --force to update the checkpoint.")
        sys.exit(1)
        
    os.makedirs(os.path.dirname(CHECKPOINT), exist_ok=True)
    import tempfile
    with tempfile.NamedTemporaryFile('w', dir=os.path.dirname(CHECKPOINT), delete=False) as tmpf:
        tmp_name = tmpf.name
        tmpf.write(str(count))
    os.replace(tmp_name, CHECKPOINT)


import re
import yaml
import fcntl
import tempfile
import sys

EPICS_DIR = '_iwish-output/3. Development/1. Epic & Story'
SPRINT_STATUS_PATH = '_iwish-output/3. Development/sprint-status.yaml'

BEGIN_TAG = "<!-- BEGIN AUTO-SYNC: DO NOT EDIT -->"
END_TAG = "<!-- END AUTO-SYNC -->"

def get_true_statuses():
    statuses = {}
    for root, dirs, files in os.walk(EPICS_DIR):
        for dir_name in dirs:
            if dir_name.startswith('Story-'):
                match = re.match(r'Story-([a-zA-Z0-9-]+)\.(.+)', dir_name)
                if match:
                    epic_num = match.group(1)
                    story_num = match.group(2)
                    story_file = os.path.join(root, dir_name, 'story.md')
                    
                    if os.path.exists(story_file):
                        with open(story_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if content.startswith('---\n'):
                                parts = content.split('---\n', 2)
                                if len(parts) >= 3:
                                    try:
                                        frontmatter = yaml.safe_load(parts[1])
                                        if frontmatter and 'status' in frontmatter:
                                            status = frontmatter['status'].lower()
                                            title = frontmatter.get('title', '')
                                            title = re.sub(r'^Story(?:-|\s+)[a-zA-Z0-9\-]+\.\d+(?:[a-zA-Z]+)?:\s*', '', title, flags=re.IGNORECASE)
                                            deps_list = frontmatter.get('dependencies', [])
                                            deps = ", ".join(deps_list) if isinstance(deps_list, list) else str(deps_list)
                                            story_id = f"{epic_num}.{story_num}"
                                            statuses[story_id] = {
                                                'status': status,
                                                'title': title,
                                                'deps': deps
                                            }
                                    except Exception as e:
                                        pass
    return statuses

def update_sprint_status(statuses):
    if not os.path.exists(SPRINT_STATUS_PATH):
        return
        
    with open(SPRINT_STATUS_PATH, 'r+', encoding='utf-8') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            lines = f.readlines()
            updated_count = 0
            new_lines = []
            
            for line in lines:
                match = re.match(r'^([\'"]?Story (\d+\.\d+[a-zA-Z]?)(?:.*?)[\'"]?):\s*([a-zA-Z_]+)$', line)
                if match:
                    full_key = match.group(1)
                    story_id = match.group(2)
                    current_status = match.group(3).strip()
                    
                    if story_id in statuses:
                        new_status = str(statuses[story_id]['status'])
                        if current_status != new_status:
                            line = f"{full_key}: {new_status}\n"
                            updated_count += 1
                new_lines.append(line)
            
            f.seek(0)
            f.truncate()
            f.writelines(new_lines)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)
            
    print(f"Updated {updated_count} stories in sprint-status.yaml")

def parse_table_row(line):
    pattern = re.compile(r'^\|\s*(?:\[)?(?:\*\*)?Story-([0-9]+\.[0-9a-zA-Z]+)(?:\*\*)?(?:\]\(.*?\))?\s*\|(.*?)\|(.*?)\|\s*([a-zA-Z0-9_-]+)\s*\|$')
    return pattern.search(line)

def process_epic_file(epic_file, statuses):
    with open(epic_file, 'r+', encoding='utf-8') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            content = f.read()
            
            # 1. P4 Mitigation: Balanced Tags Check
            begin_count = content.count(BEGIN_TAG)
            end_count = content.count(END_TAG)
            if begin_count != end_count or begin_count > 1:
                print(f"❌ ZERO-TRUST BLOCK [EC-P4-002]: Unbalanced or multiple sync tags in {epic_file}. Aborting sync.")
                return 0
                
            has_tags = (begin_count == 1)
            
            lines = content.split('\n')
            
            # 2. P9 Mitigation: Smart Git Conflict Parsing
            conflict_markers = [i for i, line in enumerate(lines) if line.startswith('<<<<<<< ') or line.startswith('=======') or line.startswith('>>>>>>> ')]
            
            if conflict_markers:
                if not has_tags:
                    print(f"❌ ZERO-TRUST BLOCK [EC-P4-003]: Git conflict detected in {epic_file}, but no boundary tags exist to isolate it. Aborting.")
                    return 0
                
                # Check if all conflict markers are strictly inside the BEGIN and END tags
                begin_idx = -1
                end_idx = -1
                for i, line in enumerate(lines):
                    if BEGIN_TAG in line: begin_idx = i
                    if END_TAG in line: end_idx = i
                
                for idx in conflict_markers:
                    if idx <= begin_idx or idx >= end_idx:
                        print(f"❌ ZERO-TRUST BLOCK [EC-P4-003]: Destructive merge risk. Git conflict marker outside of AUTO-SYNC block in {epic_file} at line {idx+1}. Aborting to protect manual text.")
                        return 0
            
            # 3. Process lines to rebuild table
            pre_table = []
            post_table = []
            story_metadata = {} # story_id -> (title, deps)
            
            in_table_section = False
            found_stories_header = False
            
            for line in lines:
                # Extract metadata from ANY valid table row, even if in a conflict block
                match = parse_table_row(line)
                if match:
                    story_id = match.group(1)
                    if story_id not in story_metadata:
                        story_metadata[story_id] = (match.group(2).strip(), match.group(3).strip())
            
            if has_tags:
                # We have boundary tags, so we just replace the block between them
                state = "PRE"
                in_stories_section = False
                for line in lines:
                    if line.startswith('## Stories'):
                        in_stories_section = True
                    elif line.startswith('## '):
                        in_stories_section = False
                        
                    if BEGIN_TAG in line:
                        pre_table.append(line)
                        state = "IN_BLOCK"
                    elif END_TAG in line:
                        state = "POST"
                        post_table.append(line)
                    elif state == "PRE":
                        if in_stories_section and (line.startswith('|') or (line.strip() == '' and pre_table and pre_table[-1].startswith('|'))):
                            continue # Strip out manually injected duplicate tables
                        pre_table.append(line)
                    elif state == "POST":
                        if in_stories_section and (line.startswith('|') or (line.strip() == '' and post_table and post_table[-1].startswith('|'))):
                            continue # Strip out manually injected duplicate tables
                        post_table.append(line)
            else:
                # No tags yet, find the ## Stories section and wrap the table
                state = "PRE"
                for line in lines:
                    if state == "PRE":
                        if line.startswith('## Stories'):
                            found_stories_header = True
                            pre_table.append(line)
                        elif found_stories_header and (line.startswith('| Story ID |') or line.startswith('|---|') or line.startswith('| --- |')):
                            pass # skip old headers, we will inject new ones with tags
                        elif found_stories_header and line.startswith('| **Story-'):
                            state = "IN_TABLE"
                            pre_table.append(BEGIN_TAG)
                        else:
                            pre_table.append(line)
                    elif state == "IN_TABLE":
                        if not (line.startswith('|') or line.strip() == ''):
                            # End of table
                            post_table.append(END_TAG)
                            post_table.append(line)
                            state = "POST"
                    elif state == "POST":
                        post_table.append(line)
                        
                if state == "IN_TABLE": # Table ended at EOF
                    post_table.append(END_TAG)
            
            # 3.5 Auto-inject missing stories from file system
            epic_match = re.search(r'Epic-([a-zA-Z0-9-]+)', epic_file)
            if epic_match:
                epic_id = epic_match.group(1)
                for s_id, s_data in statuses.items():
                    if s_id.startswith(f"{epic_id}.") and s_id not in story_metadata:
                        story_metadata[s_id] = (s_data.get('title', ''), s_data.get('deps', ''))

            # 4. Generate the new table block
            new_table_block = []
            new_table_block.append("| Story ID | Title | Dependencies | Status |")
            new_table_block.append("|---|---|---|---|")
            
            # Sort story metadata by ID logically
            sorted_stories = sorted(story_metadata.keys(), key=lambda x: [int(p) for p in re.findall(r'\d+', x)])
            
            updated_count = 0
            for story_id in sorted_stories:
                title, deps = story_metadata[story_id]
                status = statuses.get(story_id, {}).get('status', 'unknown')
                # Compare if we actually need to change it
                old_status = "unknown_old"
                for l in lines:
                    match = parse_table_row(l)
                    if match and match.group(1) == story_id:
                        old_status = match.group(4)
                        break
                if status != old_status:
                    updated_count += 1
                new_table_block.append(f"| [Story-{story_id}](./Story-{story_id}/story.md) | {title} | {deps} | {status} |")
                
            # Combine
            new_content = "\n".join(pre_table + new_table_block + post_table)
            
            if "--check-only" in sys.argv:
                return updated_count

            # 5. Atomic Write (EC-P4-001)
            dirname = os.path.dirname(epic_file)
            basename = os.path.basename(epic_file)
            with tempfile.NamedTemporaryFile('w', dir=dirname, delete=False, encoding='utf-8') as tmpf:
                tmp_name = tmpf.name
                tmpf.write(new_content)
                
            # Rename over the original file atomically
            os.replace(tmp_name, epic_file)
            return updated_count
            
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)

def update_epic_tables(statuses):
    total_updated = 0
    for root, dirs, files in os.walk(EPICS_DIR):
        if 'epic.md' in files:
            epic_file = os.path.join(root, 'epic.md')
            try:
                count = process_epic_file(epic_file, statuses)
                total_updated += count
            except Exception as e:
                print(f"Error processing {epic_file}: {e}")
                
    if "--check-only" not in sys.argv:
        print(f"Updated {total_updated} rows across epic.md tables")
    return total_updated

def check_only_sprint_status(statuses):
    if not os.path.exists(SPRINT_STATUS_PATH):
        return 0
    updated_count = 0
    with open(SPRINT_STATUS_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines:
            match = re.match(r'^([\'"]?Story (\d+\.\d+[a-zA-Z]?)(?:.*?)[\'"]?):\s*([a-zA-Z_]+)$', line)
            if match:
                story_id = match.group(2)
                current_status = match.group(3).strip()
                if story_id in statuses:
                    new_status = str(statuses[story_id]['status'])
                    if current_status != new_status:
                        updated_count += 1
    return updated_count

if __name__ == '__main__':
    is_check = "--check-only" in sys.argv
    if not is_check:
        print("Starting master SSOT sync...")
    true_statuses = get_true_statuses()
    check_data_integrity(true_statuses)
    if not is_check:
        print(f"Found {len(true_statuses)} physical stories.")
    
    if is_check:
        sprint_drift = check_only_sprint_status(true_statuses)
        epic_drift = update_epic_tables(true_statuses)
        if sprint_drift > 0 or epic_drift > 0:
            print(f"DRIFT DETECTED: {sprint_drift} stories in sprint-status.yaml, {epic_drift} rows in epic.md")
            sys.exit(1)
        else:
            print("No drift detected.")
            sys.exit(0)
    else:
        update_sprint_status(true_statuses)
        update_epic_tables(true_statuses)
        print("SSOT sync complete!")
