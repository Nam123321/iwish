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
import os

with open('_iwish/runtime/refactoring-queue/irregular_tasks.json', 'r') as f:
    tasks = json.load(f)

chunk_size = 25
chunks = [tasks[i:i + chunk_size] for i in range(0, len(tasks), chunk_size)]

for i, chunk in enumerate(chunks):
    with open(f'_iwish/runtime/refactoring-queue/irregular_chunk_{i}.json', 'w') as f:
        json.dump(chunk, f, indent=2)

print(f"Created {len(chunks)} chunks.")
