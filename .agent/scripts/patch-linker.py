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

import re

file_path = ".agent/scripts/auto-traceability-linker.py"
with open(file_path, "r") as f:
    content = f.read()

old_matrix = """    matrix = []
    for ac in acs:
        impls, tests = find_implementations(project_root, ac["id"])
        matrix.append({
            "ac_id": ac["id"],
            "description": ac["description"],
            "implementations": impls,
            "tests": tests,
            "status": "completed" if (impls and tests) else "pending"
        })"""

new_matrix = """    # Parse existing markdown table to preserve Tasks and Notes
    story_content = story_path.read_text(encoding='utf-8')
    existing_tasks = {}
    existing_notes = {}
    
    table_pattern = re.compile(r'\|\s*(AC-?\d+)\s*\|[^|]*\|\s*([^|]*)\s*\|[^|]*\|[^|]*\|\s*([^|]*)\s*\|', re.IGNORECASE)
    for match in table_pattern.finditer(story_content):
        ac_id = match.group(1).replace("-", "").upper()
        existing_tasks[ac_id] = match.group(2).strip()
        existing_notes[ac_id] = match.group(3).strip()

    matrix = []
    for ac in acs:
        ac_id = ac["id"].upper()
        impls, tests = find_implementations(project_root, ac["id"])
        
        # Determine status
        status = "completed" if (impls and tests) else "pending"
        
        matrix.append({
            "ac_id": ac["id"],
            "description": ac["description"],
            "tasks": existing_tasks.get(ac_id, "TODO"),
            "implementations": impls,
            "tests": tests,
            "status": status,
            "notes": existing_notes.get(ac_id, "")
        })
        
    # Generate Markdown Table
    md_table = [
        "| AC ID | Description | Tasks | Implementation Files | Test Files | Status | Notes |",
        "|---|---|---|---|---|---|---|"
    ]
    for row in matrix:
        impl_str = "<br>".join([f"⚛️ `{f.split('/')[-1]}`" for f in row['implementations']]) if row['implementations'] else "*(not implemented)*"
        test_str = "<br>".join([f"🧪 `{f.split('/')[-1]}`" for f in row['tests']]) if row['tests'] else "*(no tests)*"
        status_str = "✅ COMPLETED" if row['status'] == "completed" else "🚧 PENDING"
        
        # Clean description for markdown table
        desc_clean = row['description'].replace("|", "&#124;").replace("\\n", " ")
        tasks_clean = row['tasks'].replace("|", "&#124;").replace("\\n", " ")
        notes_clean = row['notes'].replace("|", "&#124;").replace("\\n", " ")
        
        md_row = f"| **{row['ac_id']}** | {desc_clean} | {tasks_clean} | {impl_str} | {test_str} | {status_str} | {notes_clean} |"
        md_table.append(md_row)
        
    md_table_text = "\\n".join(md_table)
    
    # Replace the existing matrix in story.md
    matrix_section_regex = re.compile(r'(## Traceability Matrix.*?\\n)(?:\|.*?\|\\n)+', re.IGNORECASE | re.DOTALL)
    if matrix_section_regex.search(story_content):
        new_content = matrix_section_regex.sub(r'\\g<1>' + md_table_text + '\\n', story_content)
    else:
        # If no matrix exists, append it
        new_content = story_content + "\\n\\n## Traceability Matrix\\n\\n" + md_table_text + "\\n"
        
    story_path.write_text(new_content, encoding='utf-8')
    print("✅ Injected updated 7-column Traceability Matrix into story.md")
"""

content = content.replace(old_matrix, new_matrix)
with open(file_path, "w") as f:
    f.write(content)

