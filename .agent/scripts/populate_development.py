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

    # Determine layout mode based on existing folders
    # If FLAT_DIR exists and HIERARCHICAL_DIR doesn't, use flat. Otherwise hierarchical.
    is_hierarchical = True
    if os.path.exists(FLAT_DIR) and not os.path.exists(HIERARCHICAL_DIR):
        is_hierarchical = False
        
    if is_hierarchical and not os.path.exists(HIERARCHICAL_DIR):
        os.makedirs(HIERARCHICAL_DIR, exist_ok=True)
    elif not is_hierarchical and not os.path.exists(FLAT_DIR):
        os.makedirs(FLAT_DIR, exist_ok=True)

    # Patterns
    fg_pattern = r'## Feature Group\s+(\d+):\s*(.+)'
    epic_pattern = r'### Epic\s+(\d+):\s*(.+)'
    story_pattern = r'#### Story\s+(\d+\.\d+):\s*(.+)'
    goal_pattern = r'\*\*Goal:\*\*\s*(.+)'

    current_fg = "Unknown"
    
    lines = content.split('\n')
    
    count = 0
    for i, line in enumerate(lines):
        fg_match = re.match(fg_pattern, line)
        if fg_match:
            current_fg = f"FG-{fg_match.group(1)}: {fg_match.group(2)}"
            continue
            
        story_match = re.match(story_pattern, line)
        if story_match:
            story_id = story_match.group(1)
            story_title = story_match.group(2).strip()
            
            # Look ahead for Goal
            story_goal = "Chi tiết xem tại PRD"
            for j in range(i+1, min(i+10, len(lines))):
                goal_match = re.match(goal_pattern, lines[j])
                if goal_match:
                    story_goal = goal_match.group(1).strip()
                    break
            
            epic_num = story_id.split('.')[0]
            
            # Generate file path
            if is_hierarchical:
                story_dir = os.path.join(HIERARCHICAL_DIR, f"Epic-{epic_num}", f"Story-{story_id}")
                os.makedirs(story_dir, exist_ok=True)
                file_path = os.path.join(story_dir, "story.md")
            else:
                file_path = os.path.join(FLAT_DIR, f"story-{story_id}.md")
                os.makedirs(FLAT_DIR, exist_ok=True)
                
            if not os.path.exists(file_path):
                stub_content = f"""---
type: I-Wish Story
title: "{story_title}"
description: "{story_goal}"
resource: "Story-{story_id}"
tags:
  - story
  - stub
status: backlog
links_to: 
  - Epic-{epic_num}
dependencies: []
---

# {story_title}

> **[STUB FILE]** Đây là file stub được tự động sinh ra ở cuối giai đoạn Project Planning.
> Vui lòng chạy lệnh `/make-story` và trỏ vào ID `Story-{story_id}` để Agent tiến hành thu thập bối cảnh, quét Edge Case và sinh ra file Story hoàn chỉnh trước khi code.

**Epic:** Epic {epic_num}
**Feature Group:** {current_fg}

## Mục tiêu (Goal)
{story_goal}

"""
                with open(file_path, "w", encoding="utf-8") as sf:
                    sf.write(stub_content)
                print(f"Created stub: {file_path}")
                count += 1

    print(f"\\nSuccessfully generated {count} new story stub files.")

if __name__ == "__main__":
    main()
