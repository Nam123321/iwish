#!/usr/bin/env -S uv run
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

# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "markdown-it-py",
#     "mdit-py-plugins",
# ]
# ///

import sys
import re
import json
import os
from pathlib import Path
from markdown_it import MarkdownIt

def parse_story(file_path: str):
    text = Path(file_path).read_text(encoding="utf-8")
    md = MarkdownIt("commonmark", {"table": True}).enable("table")
    tokens = md.parse(text)
    
    acs = {}
    tasks = {}
    
    current_section = None
    
    for i, token in enumerate(tokens):
        if token.type == "heading_open" and token.tag == "h2":
            if i + 1 < len(tokens) and tokens[i+1].type == "inline":
                current_section = tokens[i+1].content.strip()
        
        elif token.type == "inline":
            if current_section and "Acceptance Criteria" in current_section:
                for line in token.content.split('\n'):
                    m = re.search(r'(?:AC\s*(\d+)|\[AC(\d+)\]|\*\*AC(\d+)\*\*)', line, re.IGNORECASE)
                    if m:
                        ac_num = next(g for g in m.groups() if g)
                        ac_id = f"AC{ac_num}"
                        if ac_id not in acs:
                            acs[ac_id] = line
            
            elif current_section and "Tasks" in current_section:
                for line in token.content.split('\n'):
                    m = re.search(r'(?:Task\s*(\d+)|T(\d+))', line, re.IGNORECASE)
                    if m:
                        t_num = next(g for g in m.groups() if g)
                        t_id = f"T{t_num}"
                        if t_id not in tasks:
                            tasks[t_id] = line
    
    return acs, tasks, text, md, tokens

def get_mapping(acs, tasks):
    mapping = {ac: [] for ac in acs}
    confidence = {}
    
    for t_id, t_text in tasks.items():
        covers = re.findall(r'@cover\s*(AC\d+)', t_text, re.IGNORECASE)
        for c in covers:
            c = c.upper()
            if c in mapping:
                mapping[c].append(t_id)
                confidence[f"{c}-{t_id}"] = "HIGH (Explicit @cover)"
        
        if covers:
            continue
            
    
    return mapping, confidence

def update_table_in_markdown(text, tokens, mapping, acs):
    table_open_idx = -1
    table_close_idx = -1
    
    current_section = None
    for i, token in enumerate(tokens):
        if token.type == "heading_open" and token.tag == "h2":
            if i + 1 < len(tokens) and tokens[i+1].type == "inline":
                current_section = tokens[i+1].content.strip()
        
        if current_section == "AC-to-Task Traceability Matrix" and token.type == "table_open":
            table_open_idx = i
        
        if table_open_idx != -1 and token.type == "table_close":
            table_close_idx = i
            break
            

    if table_open_idx == -1:
        table_lines = [
            "## AC-to-Task Traceability Matrix",
            "| AC ID | Description | Mapped Implementation Tasks | Missing Implementation? | Test File Path | Missing Test? | Status | Mapped Tasks |",
            "|---|---|---|---|---|---|---|---|"
        ]
        for ac_id in mapping.keys():
            mapped = "<br>".join(mapping[ac_id]) if mapping[ac_id] else ""
            desc = acs.get(ac_id, "TBD").replace('|', '/').strip()
            # Clean up leading numbers or asterisks
            desc = re.sub(r'^[\-\*\d\.\s\[\]]*(?:AC\d+|EDGE-CASE|EC-[A-Za-z0-9._-]+)[\:\]\*]*\s*', '', desc, flags=re.IGNORECASE)
            desc = desc.strip(' *')
            table_lines.append(f"| {ac_id} | {desc} | TBD | Yes | TBD | Yes | Pending | {mapped} |")
        
        insert_idx = -1
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith("## QA Simulator Scorecard"):
                insert_idx = i
                break
        
        if insert_idx != -1:
            lines = lines[:insert_idx] + [""] + table_lines + [""] + lines[insert_idx:]
        else:
            lines.extend([""] + table_lines + [""])
            
        return '\n'.join(lines), True

        
    start_line = tokens[table_open_idx].map[0]
    end_line = tokens[table_open_idx].map[1]
    
    lines = text.split('\n')
    table_lines = lines[start_line:end_line]
    
    if not table_lines:
        return text, False
        
    header = table_lines[0].split('|')

    header_clean = [col.strip().lower() for col in header if col.strip()]
    CANONICAL_HEADERS_MAPPER = ["ac id", "description", "mapped implementation tasks", "missing implementation?", "test file path", "missing test?", "status", "mapped tasks"]
    is_canonical = len(header_clean) == len(CANONICAL_HEADERS_MAPPER) and all(h == c for h, c in zip(header_clean, CANONICAL_HEADERS_MAPPER))

    if not is_canonical:
        print(f"⚠️  Non-canonical table detected ({len(header_clean)} cols). Rebuilding from scratch...")
        lines_without_table = lines[:start_line-1] + lines[end_line:] if start_line > 0 and '## AC-to-Task' in lines[start_line-1] else lines[:start_line] + lines[end_line:]
        text = '\n'.join(lines_without_table)
        
        table_lines = [
            "## AC-to-Task Traceability Matrix",
            "| AC ID | Description | Mapped Implementation Tasks | Missing Implementation? | Test File Path | Missing Test? | Status | Mapped Tasks |",
            "|---|---|---|---|---|---|---|---|"
        ]
        for ac_id in mapping.keys():
            mapped = "<br>".join(mapping[ac_id]) if mapping[ac_id] else ""
            desc = acs.get(ac_id, "TBD").replace('|', '/').strip()
            desc = re.sub(r'^[\-\*\d\.\s\[\]]*(?:AC\d+|EDGE-CASE|EC-[A-Za-z0-9._-]+)[\:\]\*]*\s*', '', desc, flags=re.IGNORECASE)
            desc = desc.strip(' *')
            table_lines.append(f"| {ac_id} | {desc} | TBD | Yes | TBD | Yes | Pending | {mapped} |")
        
        insert_idx = -1
        lines_text = text.split('\n')
        for i, l in enumerate(lines_text):
            if l.strip().startswith("## QA Simulator Scorecard"):
                insert_idx = i
                break
        
        if insert_idx != -1:
            lines_text = lines_text[:insert_idx] + [""] + table_lines + [""] + lines_text[insert_idx:]
        else:
            lines_text.extend([""] + table_lines + [""])
            
        return '\n'.join(lines_text), True
    ac_col_idx = -1
    task_col_idx = -1
    code_col_idx = -1
    missing_impl_idx = -1
    status_idx = -1
    
    for i, col in enumerate(header):
        col_clean = col.strip().lower()
        if col_clean in ["ac id", "ac", "id"]:
            ac_col_idx = i
        elif col_clean in ["mapped tasks"]:
            task_col_idx = i
        elif col_clean in ["mapped implementation tasks", "code files"]:
            code_col_idx = i
        elif col_clean in ["missing implementation?"]:
            missing_impl_idx = i
        elif col_clean in ["status"]:
            status_idx = i
            
    is_legacy = False
    if task_col_idx == -1 and len(header) >= 7:
        is_legacy = True
        task_col_idx = len(header) - 1
        
    if ac_col_idx == -1:
        return text, False
        
    new_table_lines = []
    for idx, line in enumerate(table_lines):
        if not line.strip():
            new_table_lines.append(line)
            continue
            
        cols = line.split('|')
        
        if is_legacy:
            if idx == 0:
                if cols[-1].strip() == '':
                    cols.insert(-1, " Mapped Tasks ")
                else:
                    cols.append(" Mapped Tasks ")
            elif idx == 1 and line.strip().startswith('|-'):
                if cols[-1].strip() == '':
                    cols.insert(-1, "---")
                else:
                    cols.append("---")
            elif line.strip().startswith('|'):
                if cols[-1].strip() == '':
                    cols.insert(-1, " ")
                else:
                    cols.append(" ")
            line = "|".join(cols)
            cols = line.split('|')
            
        if idx < 2 or not line.strip().startswith('|'):
            new_table_lines.append(line)
            continue
            
        if len(cols) > ac_col_idx and len(cols) > task_col_idx:
            ac_id_raw = cols[ac_col_idx].strip()
            if re.match(r'^AC\d+', ac_id_raw, re.IGNORECASE):
                ac_id = ac_id_raw.upper()
                tasks_mapped = mapping.get(ac_id, [])
                
                new_cell_parts = tasks_mapped if tasks_mapped else ["[AUTO-MAP-FAILED]"]
                cols[task_col_idx] = " " + "<br>".join(new_cell_parts) + " "
                
                if code_col_idx != -1 and missing_impl_idx != -1 and status_idx != -1 and code_col_idx < len(cols) and missing_impl_idx < len(cols) and status_idx < len(cols):
                    code_cell = cols[code_col_idx].strip()
                    missing_cell = cols[missing_impl_idx].strip().lower()
                    status_cell = cols[status_idx].strip().lower()
                    
                    if missing_cell == 'no' or status_cell == 'pass' or status_cell == 'completed':
                        has_link = '](file://' in code_cell
                        has_override = '[NON-CODE]' in code_cell or '[MANUAL-OVERRIDE]' in code_cell
                        
                        if not has_link and not has_override:
                            cols[missing_impl_idx] = " Yes "
                            cols[status_idx] = " FAIL "
                            cols[code_col_idx] = " " + code_cell + ("<br>" if code_cell and code_cell != "[AUTO-MAP-FAILED]" else "") + "[RESET: Missing Evidence] "
                
                line = "|".join(cols)
                
        new_table_lines.append(line)
        
    lines[start_line:end_line] = new_table_lines
    return '\n'.join(lines), True

def main():
    if len(sys.argv) < 3 or sys.argv[1] != "--story":
        print("Usage: ac-to-task-mapper.py --story <path/to/story.md>")
        sys.exit(1)
        
    story_path = sys.argv[2]
    if not os.path.exists(story_path):
        print(f"Error: {story_path} not found.")
        sys.exit(1)
        
    print(f"Mapping ACs to Tasks for {story_path}...")
    acs, tasks, text, md, tokens = parse_story(story_path)
    
    print(f"Found {len(acs)} ACs and {len(tasks)} Tasks.")
    
    mapping, confidence = get_mapping(acs, tasks)
    
    output_dir = os.path.dirname(story_path)
    json_path = os.path.join(output_dir, "task-traceability.json")
    
    json_data = {
        "story": os.path.basename(story_path),
        "mapping": mapping,
        "confidence": confidence
    }
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2)
        
    print(f"Saved mapping to {json_path}")
    
    has_failures = any(not mapped for mapped in mapping.values())
    
    new_text, updated = update_table_in_markdown(text, tokens, mapping, acs)
    if updated:
        tmp_path = story_path + ".tmp.md"
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        os.rename(tmp_path, story_path)
        print("Updated AC-to-Task Traceability Matrix in story.md atomically.")
    else:
        print("Warning: Could not update table in story.md (table or columns not found).")
        
    if has_failures:
        print("Warning: Some ACs could not be mapped to any tasks ([AUTO-MAP-FAILED]).")
        sys.exit(1)

if __name__ == "__main__":
    main()
