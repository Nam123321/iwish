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
import json
import yaml
import os

def verify_provenance(notebook_id, mcp_output_file):
    if not os.path.exists(mcp_output_file):
        print(f"Error: MCP output file {mcp_output_file} not found.")
        sys.exit(1)
        
    registry_path = "_iwish-output/notebooks/notebook-registry.yaml"
    if not os.path.exists(registry_path):
        print(f"Error: Registry file {registry_path} not found.")
        sys.exit(1)
        
    with open(registry_path, 'r') as f:
        registry = yaml.safe_load(f)
        
    # Check if notebook_id is registered
    registered_ids = [nb.get('id') for nb in registry.get('notebooks', [])]
    if notebook_id not in registered_ids:
        print(f"Zero-Trust Violation: Notebook ID {notebook_id} is not registered in the system.")
        sys.exit(1)
        
    # Verify MCP output format
    with open(mcp_output_file, 'r') as f:
        try:
            output_data = json.load(f)
        except json.JSONDecodeError:
            print("Zero-Trust Violation: MCP output is not valid JSON. Hallucination detected.")
            sys.exit(1)
            
    # Check for basic expected fields in MCP output
    if 'result' not in output_data and 'text' not in output_data and 'job_id' not in output_data:
        print("Zero-Trust Violation: Unrecognized MCP output schema.")
        sys.exit(1)
        
    print("Provenance Check Passed: Output is valid and Notebook ID is registered.")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 verify_notebooklm_provenance.py <notebook_id> <mcp_output_json>")
        sys.exit(1)
    verify_provenance(sys.argv[1], sys.argv[2])
