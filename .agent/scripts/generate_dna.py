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

base_dir = os.path.expanduser("~/Desktop/AI Project/Cowok-ai")
output_path = os.path.join(base_dir, "_iwish-output/repo-dna/layer5_multi_agent_graph_llms_full-5D2BE7CD-ACEC-4EF7-B80D-5D3E5E1AB19B-dna.md")
os.makedirs(os.path.dirname(output_path), exist_ok=True)

notes_dir = os.path.expanduser("~/.iwish/sandbox/layer5_multi_agent_graph_llms_full-5D2BE7CD-ACEC-4EF7-B80D-5D3E5E1AB19B/phase3_results")

content = """# Layer 5 Multi-Agent Graph LLMs - Book DNA

## Book Typology
- **Process**: Detailed implementation strategies for graph engineering, context isolation, and deploying to production.
- **Theory**: Ontological and mathematical foundations of multi-agent state machines.
- **Checklist**: 10 Production Use Cases, 10 Fatal Anti-patterns, and Model Selection comparisons.

## Reusable Patterns
- **Topological Patterns**: Sequential Pipeline, Routing, Parallelization, Orchestrator-Workers, Evaluator-Optimizer, Multi-Agent Collaboration.
- **Transactional Safety**: Idempotency Locks, Write-Ahead Logs (WAL), Saga Coordination Pattern for distributed state rollback.
- **State Management**: Shared State Reducers, Context Isolation boundaries.

## Context Summary
This book is a production-grade blueprint that empowers developers to master cognitive graph design, cross-context isolation, multi-tier memory management, and autonomous multi-agent collaboration loops in enterprise environments.

## Extracted Chapter Notes
"""

for i in range(10):
    ch_file = os.path.join(notes_dir, f"ch_{i}.txt")
    if os.path.exists(ch_file):
        with open(ch_file, "r") as f:
            content += f"\n\n### Chapter {i+1}\n"
            content += f.read()

with open(output_path, "w") as f:
    f.write(content)

print("DNA document generated successfully.")
