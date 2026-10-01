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

"""NLM Hook Execution Validator — D12 Enhanced

Supports two modes:
1. Single-file mode (legacy): validate-nlm-hook-execution.py <file>
2. Aggregate mode (D12): validate-nlm-hook-execution.py --mode aggregate <dir>
"""
import sys
import os
import json


def _is_valid_id(val):
    return isinstance(val, (str, int)) and not isinstance(val, bool) and str(val).strip() != ''

def check_mcp_output(evidence_file, expected_role=None):
    """Validate a single MCP evidence JSON file. Returns parsed data on success."""
    if not os.path.exists(evidence_file):
        print(f"FAIL: NLM Evidence file {evidence_file} does not exist.")
        print("Zero-Trust Violation: You MUST call notebooklm-mcp and save the raw JSON output to this file before completing the workflow.")
        sys.exit(1)
        
    try:
        with open(evidence_file, 'r') as file:
            content = file.read().strip()
            if not content:
                print(f"FAIL: Evidence file {evidence_file} is empty.")
                sys.exit(1)
            
            # Simple check to ensure it's valid JSON
            data = json.loads(content)
            
            # Check for typical NLM output patterns with strict type checking
            is_valid_nlm = False
            
            # Require complex structures that LLMs are unlikely to hallucinate blindly
            if expected_role == 'list':
                def _check_list_items(lst):
                    if not isinstance(lst, list) or len(lst) == 0:
                        return False
                    for item in lst:
                        if not isinstance(item, dict): return False
                        if not ('id' in item or 'name' in item): return False
                        if 'id' in item and not _is_valid_id(item['id']): return False
                        if 'name' in item and not _is_valid_id(item['name']): return False
                    return True
                
                if _check_list_items(data):
                    is_valid_nlm = True
                elif isinstance(data, dict) and 'sources' in data and _check_list_items(data['sources']):
                    is_valid_nlm = True
            elif expected_role == 'add':
                if isinstance(data, dict):
                    if 'source_id' in data and 'notebook_id' in data:
                        if _is_valid_id(data['source_id']) and _is_valid_id(data['notebook_id']):
                            is_valid_nlm = True
                    elif 'id' in data and 'name' in data:
                        if _is_valid_id(data['id']) and _is_valid_id(data['name']):
                            is_valid_nlm = True
            elif expected_role == 'delete':
                if isinstance(data, dict):
                    if data.get('status') == 'success' or data.get('deleted') == True or 'id' in data:
                        is_valid_nlm = True
            else:
                # General check for legacy mode
                if isinstance(data, dict):
                    has_valid_results = 'results' in data and isinstance(data['results'], (dict, list))
                    has_valid_notebook = 'notebook_id' in data and isinstance(data['notebook_id'], str) and data['notebook_id'].strip() != ''
                    if has_valid_results or has_valid_notebook:
                        is_valid_nlm = True
                elif isinstance(data, list):
                    if len(data) > 0 and isinstance(data[0], dict):
                        item = data[0]
                        has_valid_notebook = 'notebook_id' in item and isinstance(item['notebook_id'], str)
                        has_valid_id = 'id' in item and isinstance(item['id'], str)
                        if has_valid_notebook or has_valid_id:
                            is_valid_nlm = True
                    
            if not is_valid_nlm:
                print(f"FAIL: The JSON in {evidence_file} does not match expected NotebookLM MCP output structures or lacks required types.")
                sys.exit(1)
                
    except json.JSONDecodeError:
        print(f"FAIL: Evidence file {evidence_file} contains invalid JSON.")
        sys.exit(1)
    except Exception as e:
        print(f"FAIL: Error reading evidence file: {e}")
        sys.exit(1)
        
    print(f"PASS: Valid NotebookLM MCP physical provenance verified at {evidence_file}.")
    return data


def extract_ids_from_list_data(data):
    ids = set()
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                if 'id' in item and _is_valid_id(item['id']): ids.add(str(item['id']))
                if 'name' in item and _is_valid_id(item['name']): ids.add(str(item['name']))
    elif isinstance(data, dict):
        if 'sources' in data and isinstance(data['sources'], list):
            for item in data['sources']:
                if isinstance(item, dict):
                    if 'id' in item and _is_valid_id(item['id']): ids.add(str(item['id']))
                    if 'name' in item and _is_valid_id(item['name']): ids.add(str(item['name']))
    return ids

def check_aggregate_evidence(evidence_dir):
    """D12: Validate all per-operation NLM evidence files in a directory.
    
    Expected files:
    - nlm_evidence_list.json   (REQUIRED — source listing before upsert)
    - nlm_evidence_add.json    (REQUIRED — new source addition)
    - nlm_evidence_delete.json (OPTIONAL — only if stale source existed)
    """
    expected_files = {
        'nlm_evidence_list.json': ('list', True),
        'nlm_evidence_add.json': ('add', True),
        'nlm_evidence_delete.json': ('delete', False)
    }
    
    validated = 0
    list_data = None
    delete_data = None
    
    for filename, (role, required) in expected_files.items():
        filepath = os.path.join(evidence_dir, filename)
        if os.path.exists(filepath):
            data = check_mcp_output(filepath, expected_role=role)
            validated += 1
            if filename == 'nlm_evidence_list.json':
                list_data = data
            elif filename == 'nlm_evidence_delete.json':
                delete_data = data
        elif required:
            print(f"FAIL: Required evidence file {filename} not found in {evidence_dir}")
            sys.exit(1)
    
    # Cross-validation: If delete evidence exists, verify list evidence
    # shows the source was present before deletion (proving delete was justified)
    if delete_data is not None and list_data is not None:
        list_ids = extract_ids_from_list_data(list_data)
        
        # Extract IDs from delete response
        deleted_ids = []
        if isinstance(delete_data, dict):
            for key in ['id', 'source_id', 'sourceId', 'name']:
                if key in delete_data:
                    deleted_ids.append(str(delete_data[key]))
        elif isinstance(delete_data, list):
            for item in delete_data:
                if isinstance(item, dict):
                    for key in ['id', 'source_id', 'sourceId', 'name']:
                        if key in item:
                            deleted_ids.append(str(item[key]))
        
        # Verify at least one deleted ID appears in the list response
        if deleted_ids:
            found = any(did in list_ids for did in deleted_ids)
            # Sometimes delete response doesn't explicitly return the ID, but if it does, it must match.
            if not found:
                print("FAIL: Cross-validation failed — deleted source ID/name not found in prior list response array.")
                print("      This may indicate a no-op delete (source was already removed) or hallucinatory delete evidence.")
                sys.exit(1)
            print("PASS: Cross-validation — deleted source confirmed present in prior listing.")
    
    print(f"PASS: {validated} aggregate evidence files validated in {evidence_dir}.")
    sys.exit(0)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 validate-nlm-hook-execution.py <path_to_mcp_output.json>")
        print("  python3 validate-nlm-hook-execution.py --mode aggregate <evidence_dir>")
        sys.exit(1)
    
    # D12: Aggregate mode
    if sys.argv[1] == '--mode' and len(sys.argv) >= 4 and sys.argv[2] == 'aggregate':
        evidence_dir = sys.argv[3]
        check_aggregate_evidence(evidence_dir)
    else:
        # Legacy single-file mode (backward compatible)
        evidence_file = sys.argv[-1]
        check_mcp_output(evidence_file)
        sys.exit(0)

