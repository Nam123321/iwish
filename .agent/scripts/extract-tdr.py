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

import os, re
arch_file = "architecture.md" if os.path.exists("architecture.md") else "_iwish-output/2. Product Planning/2.5. architecture.md"
if not os.path.exists(arch_file): exit(0)
with open(arch_file, "r") as f: content = f.read()
decisions = re.findall(r"### Decision:\s*(.*?)\n", content)
yaml_output = "decisions:\n" + "".join([f"  - id: TDR-{i+1:03d}\n    title: \"{d.strip()}\"\n    status: \"Active\"\n" for i, d in enumerate(decisions)])
with open("tech-decision-registry.yaml", "w") as f: f.write(yaml_output)
