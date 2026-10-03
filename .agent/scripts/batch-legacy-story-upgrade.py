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

import os
import json
import re
import urllib.parse
from pathlib import Path
import argparse

def fix_fr_covered(content):
    # Match the FR Covered line
    # (FR Covered: FR-123) or (FR Covered: [FR-123](link))
    pattern = re.compile(r'((?:FR Covered:|FR Covered\*\*:?|\*\*FR Covered:\*\*)\s*)(.*)')
    
    def repl(m):
        prefix = m.group(1)
        value = m.group(2).strip()
        
        # If it's already a markdown link
        link_match = re.match(r'\[(.*?)\]\((.*?)\)', value)
        if link_match:
            text = link_match.group(1)
            link = link_match.group(2)
            # Force the new PRD path
            new_link = f"file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/2.%20Product%20Planning/2.1.%20product-brief-or-prd.md#{text}"
            return f"{prefix}[{text}]({new_link})"
        
        # If it's just text
        text = value
        # Hardcode PRD link
        new_link = f"file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/2.%20Product%20Planning/2.1.%20product-brief-or-prd.md#{text}"
        return f"{prefix}[{text}]({new_link})"
        
    def repl_lines(line_match):
        return repl(line_match)

    return pattern.sub(repl_lines, content)

def fix_data_flow(content):
    # Inject ### Data Flow (Provider -> Consumer) into Cross-Feature Dependencies if missing
    cfd_pattern = re.compile(r'(##\s*.*?Cross-Feature Dependencies.*?)(?=## |\Z)', re.IGNORECASE | re.DOTALL)
    cfd_match = cfd_pattern.search(content)
    if cfd_match:
        cfd_text = cfd_match.group(1)
        if "Data Flow" not in cfd_text:
            # We want to inject it before ## impacts or just at the end of the section
            # But the best way is right after Cross-Feature Dependencies header
            header_end = re.search(r'^##\s*.*?Cross-Feature Dependencies\s*\n', cfd_text, re.MULTILINE | re.IGNORECASE)
            if header_end:
                idx = header_end.end()
                injection = "### Data Flow (Provider -> Consumer)\n- [MIGRATION_PLACEHOLDER] Data flow mapping needs verification.\n\n"
                new_cfd = cfd_text[:idx] + injection + cfd_text[idx:]
                content = content[:cfd_match.start()] + new_cfd + content[cfd_match.end():]
    
    # Check if 'Impacts' is missing
    cfd_match = cfd_pattern.search(content)
    if cfd_match:
        cfd_text = cfd_match.group(1)
        if "Impacts" not in cfd_text:
            header_end = re.search(r'^##\s*.*?Cross-Feature Dependencies\s*\n', cfd_text, re.MULTILINE | re.IGNORECASE)
            if header_end:
                idx = header_end.end()
                injection = "### Impacts\n- [MIGRATION_PLACEHOLDER] Impacts mapping needs verification.\n\n"
                new_cfd = cfd_text[:idx] + injection + cfd_text[idx:]
                content = content[:cfd_match.start()] + new_cfd + content[cfd_match.end():]

    return content

def fix_ac_matrix(content):
    ac_section_match = re.search(r'^##\s*Acceptance Criteria\s*\n(.*?)(?=^## |\Z)', content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    ac_items = []
    if ac_section_match:
        ac_text = ac_section_match.group(1).strip()
        explicit_acs = re.findall(r'\b(AC\d+)\b', ac_text)
        if explicit_acs:
            ac_items = list(set(explicit_acs))
        else:
            list_items = re.findall(r'^\s*(?:\d+\.|-|\*)\s+', ac_text, re.MULTILINE)
            ac_items = [f"AC{i+1}" for i in range(len(list_items))]
            
    # Also extract AC-X format
    ac_x_items = re.findall(r'-\s*\*\*(AC-\d+)\*\*', content)
    
    final_acs = []
    if ac_items:
        final_acs = ac_items
    elif ac_x_items:
        final_acs = ac_x_items
        
    matrix_pattern = re.compile(r'(##\s*(?:Traceability Matrix|Traceability|AC-to-Task|AC-to-Task Traceability Matrix)\s*\n)(.*?(?=\n## |\Z))', re.IGNORECASE | re.DOTALL)
    match = matrix_pattern.search(content)
    if not match:
        return content
        
    header_part = match.group(1)
    matrix_text = match.group(2)
    
    # Generate new matrix
    new_matrix = []
    new_matrix.append("| Acceptance Criteria | Implementation Tasks | Test File Path |")
    new_matrix.append("| :--- | :--- | :--- |")
    
    for ac in final_acs:
        new_matrix.append(f"| {ac} | - [MIGRATION_PLACEHOLDER] | [TBD] |")
    
    if not final_acs:
        new_matrix.append("| AC_ALL | - [MIGRATION_PLACEHOLDER] | [TBD] |")
        
    new_matrix_text = "\n".join(new_matrix) + "\n\n"
    
    content = content[:match.start()] + header_part + new_matrix_text + content[match.end():]
    return content

def upgrade_story(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original = content
    content = fix_fr_covered(content)
    content = fix_ac_matrix(content)
    content = fix_data_flow(content)
    
    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    
    queue_file = "{project-root}/_iwish/runtime/refactoring-queue/legacy-upgrade-queue.json"
    
    if not os.path.exists(queue_file):
        print("Queue file not found!")
        return
        
    with open(queue_file, "r") as f:
        queue = json.load(f)
        
    print(f"Found {len(queue)} files in queue.")
    
    processed = 0
    updated = 0
    
    for item in queue:
        if args.limit > 0 and processed >= args.limit:
            break
            
        file_path = item["file"]
        
        if args.dry_run:
            print(f"[DRY-RUN] Would upgrade: {file_path}")
            updated += 1
        else:
            try:
                if upgrade_story(file_path):
                    print(f"Upgraded: {file_path}")
                    updated += 1
                else:
                    print(f"No changes needed: {file_path}")
            except Exception as e:
                print(f"Error upgrading {file_path}: {e}")
                
        processed += 1
        
    print(f"\nDone. Processed: {processed}, Upgraded: {updated}")

if __name__ == "__main__":
    main()
