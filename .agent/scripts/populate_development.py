import os
import re

INPUT_FILE = "_iwish-output/2. Product Planning/2.4. epics-and-stories.md"
FLAT_DIR = "_iwish-output/stories"
HIERARCHICAL_DIR = "_iwish-output/3. Development/1. Epic & Story"

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Could not find {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    is_hierarchical = True
    if os.path.exists(FLAT_DIR) and not os.path.exists(HIERARCHICAL_DIR):
        is_hierarchical = False
        
    if is_hierarchical and not os.path.exists(HIERARCHICAL_DIR):
        os.makedirs(HIERARCHICAL_DIR, exist_ok=True)
    elif not is_hierarchical and not os.path.exists(FLAT_DIR):
        os.makedirs(FLAT_DIR, exist_ok=True)

    lines = content.split('\n')
    
    count_stories = 0
    count_epics = 0
    
    current_fg = "Uncategorized"
    
    # regexes
    fg_regex = re.compile(r'^#{2,5}\s*(?:\*\*)?Feature Group\s+(\d+):\s*(?:\*\*)?\s*(.+)')
    epic_regex = re.compile(r'^#{2,5}\s*(?:\*\*)?Epic\s+(\d+):\s*(?:\*\*)?\s*(.+)')
    story_regex = re.compile(r'^#{2,5}\s*(?:\*\*)?Story\s+(\d+\.\d+):\s*(?:\*\*)?\s*(.+)')
    
    # State tracking
    current_epic_num = None
    current_epic_title = None
    current_epic_lines = []
    
    current_story_id = None
    current_story_title = None
    current_story_lines = []
    
    def flush_story():
        nonlocal current_story_id, current_story_title, current_story_lines, count_stories
        if current_story_id:
            epic_num = current_story_id.split('.')[0]
            
            # Find goal from lines
            story_goal = "Chi tiết xem tại PRD"
            for line in current_story_lines:
                goal_match = re.search(r'\*\*Goal:\*\*\s*(.+)', line)
                if goal_match:
                    story_goal = goal_match.group(1).strip()
                    break

            if is_hierarchical:
                story_dir = os.path.join(HIERARCHICAL_DIR, f"Epic-{epic_num}", f"Story-{current_story_id}")
                os.makedirs(story_dir, exist_ok=True)
                file_path = os.path.join(story_dir, "story.md")
            else:
                file_path = os.path.join(FLAT_DIR, f"story-{current_story_id}.md")
                os.makedirs(FLAT_DIR, exist_ok=True)
                
            story_body = "\n".join(current_story_lines).strip()
            
            stub_content = f"""---
type: I-Wish Story
title: "{current_story_title}"
description: "{story_goal}"
resource: "Story-{current_story_id}"
tags:
  - story
status: backlog
links_to: 
  - Epic-{epic_num}
dependencies: []
---

# {current_story_title}

**Epic:** Epic {epic_num}
**Feature Group:** {current_fg}

{story_body}

> **[LƯU Ý]** File này được trích xuất tự động từ `2.4. epics-and-stories.md`. 
> Khi bắt đầu phát triển, bạn có thể chạy `/make-story` để phân tích thêm Edge Case, hoặc dùng luôn dữ liệu này để code.
"""
            should_write = True
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as check_f:
                    existing_content = check_f.read()
                if "[STUB FILE]" not in existing_content and "[LƯU Ý]" not in existing_content:
                    should_write = False
            
            if should_write:
                with open(file_path, "w", encoding="utf-8") as sf:
                    sf.write(stub_content)
                print(f"Populated story: {file_path}")
                count_stories += 1
            else:
                print(f"Skipped existing story (modified by user): {file_path}")

            
            # Update epic.md with this story
            if is_hierarchical:
                epic_file_path = os.path.join(HIERARCHICAL_DIR, f"Epic-{epic_num}", "epic.md")
            else:
                epic_file_path = os.path.join(FLAT_DIR, f"epic-{epic_num}.md")
            
            if os.path.exists(epic_file_path):
                with open(epic_file_path, "a", encoding="utf-8") as ef:
                    ef.write(f"| **Story-{current_story_id}** | {current_story_title} | | backlog |\n")
                    
        # Reset
        current_story_id = None
        current_story_title = None
        current_story_lines = []

    def flush_epic():
        nonlocal current_epic_num, current_epic_title, current_epic_lines, count_epics
        if current_epic_num:
            if is_hierarchical:
                epic_dir = os.path.join(HIERARCHICAL_DIR, f"Epic-{current_epic_num}")
                os.makedirs(epic_dir, exist_ok=True)
                epic_file_path = os.path.join(epic_dir, "epic.md")
            else:
                epic_file_path = os.path.join(FLAT_DIR, f"epic-{current_epic_num}.md")
                os.makedirs(FLAT_DIR, exist_ok=True)
                
            epic_body = "\n".join(current_epic_lines).strip()
                
            epic_content = f"""---
type: I-Wish Epic
title: "{current_epic_title}"
resource: "Epic-{current_epic_num}"
status: backlog
---

# Epic {current_epic_num}: {current_epic_title}

**Feature Group:** {current_fg}

{epic_body}

## Stories
| Story ID | Title | Dependencies | Status |
|---|---|---|---|
"""
            should_write_epic = True
            if os.path.exists(epic_file_path):
                with open(epic_file_path, "r", encoding="utf-8") as check_ef:
                    existing_epic = check_ef.read()
                if "[STUB FILE]" not in existing_epic and "[LƯU Ý]" not in existing_epic:
                    should_write_epic = False
                    
            if should_write_epic:
                with open(epic_file_path, "w", encoding="utf-8") as ef:
                    ef.write(epic_content)
                print(f"Populated epic: {epic_file_path}")
                count_epics += 1
            else:
                print(f"Skipped existing epic: {epic_file_path}")

            
        current_epic_num = None
        current_epic_title = None
        current_epic_lines = []

    for line in lines:
        fg_match = fg_regex.match(line)
        if fg_match:
            flush_story()
            flush_epic()
            current_fg = f"FG-{fg_match.group(1)}: {fg_match.group(2)}"
            continue
            
        epic_match = epic_regex.match(line)
        if epic_match:
            flush_story()
            flush_epic()
            current_epic_num = epic_match.group(1)
            current_epic_title = epic_match.group(2).strip()
            continue
            
        story_match = story_regex.match(line)
        if story_match:
            flush_story()
            current_story_id = story_match.group(1)
            current_story_title = story_match.group(2).strip()
            continue
            
        # Accumulate lines
        if current_story_id is not None:
            current_story_lines.append(line)
        elif current_epic_num is not None:
            current_epic_lines.append(line)
            
    # Flush last items
    flush_story()
    flush_epic()

    print(f"\\nSuccessfully populated {count_epics} epics and {count_stories} stories with full context.")

if __name__ == "__main__":
    main()
