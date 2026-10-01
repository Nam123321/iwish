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

import sys
import yaml
from pathlib import Path

REGISTRY_PATH = Path(".agent/unknowns/tool-registry.yaml")

def main():
    if not REGISTRY_PATH.exists():
        print(f"ERROR: {REGISTRY_PATH} not found.")
        sys.exit(1)

    try:
        with open(REGISTRY_PATH, 'r') as f:
            registry = yaml.safe_load(f)
    except Exception as e:
        print(f"ERROR: Failed to parse YAML: {e}")
        sys.exit(1)

    if registry.get('contract_version') != '2.0':
        print("ERROR: Registry is not contract_version 2.0")
        sys.exit(1)

    valid_statuses = {'active', 'adapter', 'experimental', 'unavailable'}
    
    tools = registry.get('tools', [])
    errors = []

    for idx, tool in enumerate(tools):
        tool_id = tool.get('id', f'Tool[{idx}]')
        
        status = tool.get('status')
        if status not in valid_statuses:
            errors.append(f"{tool_id}: Invalid status '{status}'")
            
        impl = tool.get('implementation')
        if not impl or not isinstance(impl, dict):
            errors.append(f"{tool_id}: Missing or invalid implementation block")
        else:
            kind = impl.get('kind')
            if kind == 'prompt_generator' and status == 'active':
                errors.append(f"{tool_id}: active tools cannot use prompt_generator kind in v2. Must be adapter.")

    if errors:
        print("REGISTRY VALIDATION FAILED:")
        for err in errors:
            print(f" - {err}")
        sys.exit(1)

    print("SUCCESS: Registry v2 health check passed.")
    sys.exit(0)

if __name__ == "__main__":
    main()
