#!/usr/bin/env python3
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

import sys, json, os, re

def extract_ac_from_markdown(content):
    ac_section_match = re.search(r'^##\s*Acceptance Criteria\s*\n(.*?)(?=^## |\Z)', content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    acs = []
    if not ac_section_match:
        return acs
        
    ac_text = ac_section_match.group(1).strip()
    
    # Match items like - [ ] AC1: ... or - AC1: ...
    ac_pattern = re.compile(r'-\s*(?:\[\s*\])?\s*(AC\d+|\[EDGE-CASE\][^:]*):\s*(.*)')
    for match in ac_pattern.finditer(ac_text):
        acs.append({"id": match.group(1).strip(), "description": match.group(2).strip(), "status": "pending"})
        
    if not acs:
        # Fallback to general numbered/bullet lists
        list_pattern = re.compile(r'^\s*(?:\d+\.|-|\*)\s+(.*)', re.MULTILINE)
        for i, match in enumerate(list_pattern.finditer(ac_text)):
            acs.append({"id": f"AC{i+1}", "description": match.group(1).strip(), "status": "pending"})
            
    return acs

def extract_ui_elements(content):
    # Match components or elements
    elements = []
    for line in content.split('\n'):
        if line.strip().startswith('- `') and '`' in line[3:]:
            elements.append(line.split('`')[1])
    return elements

def extract_data_models(content):
    models = []
    for line in content.split('\n'):
        if line.strip().startswith('### ') or line.strip().startswith('- Model:'):
            models.append(line.replace('###', '').replace('- Model:', '').strip())
    return [m for m in models if m]

def main():
    story_id = None
    for i, arg in enumerate(sys.argv[1:], 1):
        if not arg.startswith("-") and not sys.argv[i-1] in ["--story", "--ui-spec", "--data-spec", "--output"]:
            story_id = arg
            break

    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: compile-sec.py <story_id> [--output <path>]")
        sys.exit(0)

    if not story_id:
        print("Error: <story_id> is required")
        sys.exit(1)

    output_path = None
    for i, arg in enumerate(sys.argv):
        if arg == "--output" and i+1 < len(sys.argv):
            output_path = sys.argv[i+1]
            
    if not output_path:
        output_path = f"_iwish-output/sec/sec-compiled-{story_id}.json"

    story_dir = None
    for i, arg in enumerate(sys.argv):
        if arg == "--story-dir" and i+1 < len(sys.argv):
            story_dir = sys.argv[i+1]

    if story_dir:
        story_path = f"{story_dir}/story.md"
        ui_path = f"{story_dir}/ui-spec.md"
        data_path = f"{story_dir}/data-spec.md"
    else:
        # Resolve paths based on standard layout
        story_path = f"_iwish-output/stories/story-{story_id}.md"
        ui_path = f"_iwish-output/stories/ui-spec-story-{story_id}.md"
        data_path = f"_iwish-output/stories/data-spec-story-{story_id}.md"

    ac_mapping = []
    ui_elements = []
    data_models = []

    if os.path.exists(story_path):
        with open(story_path) as f:
            ac_mapping = extract_ac_from_markdown(f.read())
            
    if os.path.exists(ui_path):
        with open(ui_path) as f:
            ui_elements = extract_ui_elements(f.read())

    if os.path.exists(data_path):
        with open(data_path) as f:
            data_models = extract_data_models(f.read())

    # Throw hard error if no ACs found (Gate Hardening)
    if not ac_mapping:
        print(f"❌ Error: Story {story_id} has no Acceptance Criteria. A valid SEC cannot be compiled.")
        sys.exit(1)

    sec_data = {
        "version": "1.0",
        "story_ref": story_id,
        "ac_mapping": ac_mapping,
        "ui_elements": ui_elements,
        "data_models": data_models
    }

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(sec_data, f, indent=2)

    print(f"✅ SEC successfully compiled to {output_path}")
    sys.exit(0)

if __name__ == "__main__":
    main()
