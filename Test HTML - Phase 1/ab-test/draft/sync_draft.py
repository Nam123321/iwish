import os
import json
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_HTML_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
DATA_BRIDGE_FILE = os.path.join(SCRIPT_DIR, "navigator.js")

def read_file(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return None

def find_file(directory, patterns):
    """Finds a file in directory matching any of the regex patterns (case-insensitive)."""
    if not os.path.exists(directory):
        return None
    for filename in os.listdir(directory):
        for pattern in patterns:
            if re.search(pattern, filename, re.IGNORECASE):
                return os.path.join(directory, filename)
    return None

def sync(source_dir=None):
    if not source_dir:
        source_dir = TEST_HTML_DIR
        
    print(f"🚀 Syncing Idea Navigator from: {source_dir}")
    
    # Initialize data structure
    data = {
        "project": {
            "title": "BMAD Dragonball Project",
            "tagline": "A new era of agentic development.",
            "status": f"Phase 1 Navigator - Source: {os.path.basename(source_dir)}"
        },
        "sections": {
            "origin": {"title": "The Origin", "markdown": ""},
            "spark": {"title": "The Spark", "markdown": ""},
            "deepDive": {"title": "Deep Dive", "markdown": ""},
            "forge": {"title": "The Forge", "markdown": ""}
        }
    }

    # 1. Origin (PRD, MASTER, Discovery)
    origin_path = find_file(source_dir, [r"prd\.md", r"master\.md", r"discovery\.md", r"requirements\.md"])
    if origin_path:
        content = read_file(origin_path)
        data["sections"]["origin"]["markdown"] = content
        title_match = re.search(r'^#\s+(.*)', content, re.M)
        if title_match:
            data["project"]["title"] = title_match.group(1)

    # 2. Spark (Brainstorming, Ideation)
    spark_path = find_file(source_dir, [r"brainstorming\.md", r"ideation\.md", r"spark\.md", r"vision\.md"])
    if spark_path:
        data["sections"]["spark"]["markdown"] = read_file(spark_path)

    # 3. Deep Dive (Research folder)
    research_dir = os.path.join(source_dir, "research")
    research_markdown = ""
    if os.path.exists(research_dir):
        # Sort files to maintain some order
        files = sorted(os.listdir(research_dir))
        for f in files:
            if f.endswith(".md"):
                content = read_file(os.path.join(research_dir, f))
                research_markdown += f"## {f}\n{content}\n\n"
    
    # Fallback: check if there's a research.md in the source dir
    if not research_markdown:
        res_path = find_file(source_dir, [r"research\.md", r"analysis\.md"])
        if res_path:
            research_markdown = read_file(res_path)

    data["sections"]["deepDive"]["markdown"] = research_markdown or "Awaiting research insights..."

    # 4. Forge (Product Brief)
    forge_path = find_file(source_dir, [r"product[-_]brief\.md", r"brief\.md", r"forge\.md"])
    if forge_path:
        data["sections"]["forge"]["markdown"] = read_file(forge_path)

    # Write back to navigator-data.js
    js_content = f"""/**
 * BMAD Idea Navigator - Data Bridge
 * GENERATED FILE - DO NOT EDIT MANUALLY
 */

window.NAV_DATA = {json.dumps(data, indent=4)};

// Helper to detect pivots in current data
window.NAV_DATA.pivots = [];
for (const [key, section] of Object.entries(window.NAV_DATA.sections)) {{
    if (section.markdown.includes("PIVOT")) {{
        window.NAV_DATA.pivots.push({{ 
            section: key, 
            note: `Strategic change in ${{section.title}}` 
        }});
    }}
}}
"""
    
    # Ensure SCRIPT_DIR exists
    if not os.path.exists(SCRIPT_DIR):
        os.makedirs(SCRIPT_DIR)
        
    with open(DATA_BRIDGE_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✅ Sync complete. Data written to {DATA_BRIDGE_FILE}")

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else None
    sync(src)
