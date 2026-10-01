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

import argparse
import sys
import unicodedata
import re
import os
import tempfile
from pathlib import Path

def sanitize_input(text):
    if not text:
        return ""
    # NFC normalization
    text = unicodedata.normalize('NFC', text)
    # Strip pipe, newline, and control characters
    text = re.sub(r'[|\n\r\t]+', ' ', text)
    return text.strip()

def main():
    parser = argparse.ArgumentParser(description="Register a design asset into ui-spec.md")
    parser.add_argument("--file", required=True, help="Path to ui-spec.md")
    parser.add_argument("--screen", required=True, help="Screen Name")
    parser.add_argument("--tool", required=True, help="Design Tool (e.g., Stitch, Figma)")
    parser.add_argument("--id", required=True, help="Link or ID")

    try:
        args = parser.parse_args()
    except SystemExit:
        sys.stderr.write("FATAL: Invalid arguments. Use --file, --screen, --tool, --id.\n")
        sys.exit(1)

    resolved_path = Path(args.file).resolve()
    workspace_root = Path.cwd().resolve()
    allowed_dir = (workspace_root / "_iwish-output").resolve()
    
    if not resolved_path.is_relative_to(allowed_dir) or resolved_path.name != "ui-spec.md":
        sys.stderr.write(f"FATAL: Access denied. File {resolved_path} must reside within _iwish-output directory and be named ui-spec.md.\n")
        sys.exit(1)
        
    screen_name = sanitize_input(args.screen)
    design_tool = sanitize_input(args.tool)
    design_id = sanitize_input(args.id)
    
    if not screen_name or not design_tool or not design_id:
        sys.stderr.write("FATAL: Sanity check failed. Screen, tool, or id is empty after sanitization.\n")
        sys.exit(1)

    lines = []
    if resolved_path.exists():
        with open(resolved_path, "r", encoding="utf-8") as f:
            lines = f.read().replace('\r\n', '\n').split('\n')

    # Find Screen Registry section
    registry_start_idx = -1
    for i, line in enumerate(lines):
        if line.strip() == "### Screen Registry":
            registry_start_idx = i
            break

    if registry_start_idx == -1:
        # Create missing section
        lines.extend([
            "",
            "### Screen Registry",
            "| Screen Name | Design Tool | Link / ID |",
            "|---|---|---|"
        ])
        registry_start_idx = len(lines) - 3

    # Parse existing table rows
    table_rows_start = registry_start_idx + 2
    table_rows_end = table_rows_start
    while table_rows_end < len(lines) and lines[table_rows_end].strip().startswith('|'):
        table_rows_end += 1

    existing_rows = lines[table_rows_start:table_rows_end]
    
    target_key = screen_name.lower()
    updated = False
    
    new_rows = []
    for row in existing_rows:
        # Filter divider
        if re.match(r'^\s*\|?[\s\-\:]+\|', row):
            new_rows.append(row)
            continue
            
        parts = [p.strip() for p in row.split('|') if p.strip()]
        if len(parts) >= 1 and parts[0].lower() == target_key:
            # UPSERT
            new_rows.append(f"| {screen_name} | {design_tool} | {design_id} |")
            updated = True
        else:
            new_rows.append(row)

    if not updated:
        new_rows.append(f"| {screen_name} | {design_tool} | {design_id} |")

    new_lines = lines[:table_rows_start] + new_rows + lines[table_rows_end:]

    # Atomic write
    fd, temp_path = tempfile.mkstemp(dir=resolved_path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        os.replace(temp_path, resolved_path)
    except Exception as e:
        os.unlink(temp_path)
        sys.stderr.write(f"FATAL: Atomic file replace failed: {e}\n")
        sys.exit(1)

    print(f"SUCCESS: Design asset registered for '{screen_name}'.")

if __name__ == "__main__":
    main()
