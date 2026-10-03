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
import ast
import json

def analyze_python_ast(code):
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return False, []

    dangerous_calls = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute):
                # Detect patterns like db.drop, db.write, os.system
                if node.func.attr in ['dropTable', 'write', 'drop', 'execute', 'system', 'popen']:
                    dangerous_calls.append(f"{getattr(node.func.value, 'id', 'unknown')}.{node.func.attr}")
            elif isinstance(node.func, ast.Name):
                if node.func.id in ['exec', 'eval', 'open']:
                    dangerous_calls.append(node.func.id)
    
    return len(dangerous_calls) > 0, dangerous_calls

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input query string"}))
        sys.exit(1)
        
    query = sys.argv[1]
    
    # In a full implementation, we would extract code blocks from the markdown query
    # and pass them to the respective AST parsers (Python `ast`, JS `acorn`, etc.)
    # For this script, we'll run the Python AST parser on the raw query text directly 
    # to catch any direct python injections.
    
    is_dangerous, triggers = analyze_python_ast(query)
    
    # Fallback to smart heuristic if AST fails to parse it as pure code
    # (e.g. if the user provided pseudo-code). We look for high-risk combinations.
    heuristic_triggers = []
    lower_query = query.lower()
    if 'db' in lower_query and ('drop' in lower_query or 'write' in lower_query or 'delete' in lower_query):
        heuristic_triggers.append("db_mutation_intent")
    if 'api_key' in lower_query or 'secret' in lower_query:
        heuristic_triggers.append("secret_access_intent")
        
    if is_dangerous or heuristic_triggers:
        combined_triggers = list(set(triggers + heuristic_triggers))
        print(json.dumps({
            "status": "DANGEROUS",
            "hotspot_detected": True,
            "triggers": combined_triggers,
            "message": "Physical AST/Heuristic scanner detected high-risk operations. OVERRIDE LLM."
        }))
        sys.exit(0) # 0 means execution successful, output contains the result
        
    print(json.dumps({
        "status": "SAFE",
        "hotspot_detected": False,
        "triggers": [],
        "message": "No hotspots detected by SAST scanner."
    }))
    sys.exit(0)

if __name__ == "__main__":
    main()
