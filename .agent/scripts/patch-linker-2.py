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

# The regex to find the old patch block (everything between "# Parse existing markdown table" and "print(\"✅ Injected updated...")
regex = re.compile(r'    # Parse existing markdown table.*?print\("✅ Injected updated 7-column Traceability Matrix into story\.md"\)', re.DOTALL)

new_matrix = """    # Generate matrix according to the TRUE 7-column standard
    story_content = story_path.read_text(encoding='utf-8')

    matrix = []
    for ac in acs:
        impls, tests = find_implementations(project_root, ac["id"])
        
        missing_impl = "No" if impls else "Yes"
        missing_test = "No" if tests else "Yes"
        
        if impls and tests:
            status = "Completed"
        elif not impls and not tests:
            status = "Pending"
        elif not impls:
            status = "Missing Code"
        else:
            status = "Missing Test"
        
        matrix.append({
            "ac_id": ac["id"],
            "description": ac["description"],
            "implementations": impls,
            "missing_implementation": missing_impl,
            "tests": tests,
            "missing_test": missing_test,
            "status": status
        })
        
    # Generate Markdown Table (7 columns)
    md_table = [
        "| AC ID | Description | Mapped Implementation Tasks | Missing Implementation? | Test File Path | Missing Test? | Status | Mapped Tasks |",
        "|---|---|---|---|---|---|---|---|"
    ]
    for row in matrix:
        impl_str = "<br>".join([f"⚛️ `{f.split('/')[-1]}`" for f in row['implementations']]) if row['implementations'] else "*(not implemented)*"
        test_str = "<br>".join([f"🧪 `{f.split('/')[-1]}`" for f in row['tests']]) if row['tests'] else "*(no tests)*"
        
        # Clean description for markdown table
        desc_clean = row['description'].replace("|", "&#124;").replace("\\n", " ")
        
        md_row = f"| **{row['ac_id']}** | {desc_clean} | {impl_str} | {row['missing_implementation']} | {test_str} | {row['missing_test']} | {row['status']} | |"
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
    print("✅ Injected standard 7-column Traceability Matrix into story.md")"""

new_content = regex.sub(new_matrix, content)
with open(file_path, "w") as f:
    f.write(new_content)

