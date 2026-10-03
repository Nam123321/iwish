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

import json
import subprocess
import os

notebook_id = "8ed53ff5-adb6-44e3-b14c-7f687c88a507"
toc_path = os.path.expanduser("~/.iwish/sandbox/layer5_multi_agent_graph_llms_full-5D2BE7CD-ACEC-4EF7-B80D-5D3E5E1AB19B/toc.json")
out_dir = os.path.expanduser("~/.iwish/sandbox/layer5_multi_agent_graph_llms_full-5D2BE7CD-ACEC-4EF7-B80D-5D3E5E1AB19B/phase3_results")
os.makedirs(out_dir, exist_ok=True)

with open(toc_path, 'r') as f:
    toc = json.load(f)

for i, chapter in enumerate(toc):
    print(f"Processing: {chapter}")
    query = f"Extract from {chapter}: 1) Core Principles, 2) Mental Models / Frameworks, 3) Decision Trees, 4) Anti-patterns."
    
    # Run nlm query
    cmd_query = ["nlm", "query", "notebook", notebook_id, query, "--json"]
    try:
        res = subprocess.run(cmd_query, capture_output=True, text=True, check=True)
        # Parse the JSON output which typically has 'answer' or 'text'
        try:
            res_json = json.loads(res.stdout)
            answer = res_json.get("answer", res_json.get("text", res.stdout))
        except json.JSONDecodeError:
            answer = res.stdout
        
        # Save to file
        out_file = os.path.join(out_dir, f"ch_{i}.txt")
        with open(out_file, 'w') as f:
            f.write(f"Chapter: {chapter}\n\n{answer}")
        
        # Create note
        title = f"Phase 3: {chapter[:30]}..."
        cmd_note = ["nlm", "note", "create", notebook_id, "--title", title, "--content", answer]
        subprocess.run(cmd_note, check=True)
        
        print(f"Successfully processed chapter {i}")
    except subprocess.CalledProcessError as e:
        print(f"Error processing chapter {i}: {e.stderr}")

