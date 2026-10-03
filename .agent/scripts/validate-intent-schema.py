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

# @cover AC2, AC4, AC5
#!/usr/bin/env python3
import sys
import os
import json

def validate_dict(schema, data, path=""):
    errors = []
    
    if schema.get("type") == "object":
        if not isinstance(data, dict):
            return [f"'{path}' must be an object"]
            
        required = schema.get("required", [])
        for req in required:
            if req not in data:
                errors.append(f"Missing required field: '{path}.{req}'" if path else f"Missing required field: '{req}'")
                
        properties = schema.get("properties", {})
        for key, prop_schema in properties.items():
            if key in data:
                new_path = f"{path}.{key}" if path else key
                errors.extend(validate_dict(prop_schema, data[key], new_path))
                
    elif schema.get("type") == "array":
        if not isinstance(data, list):
            return [f"'{path}' must be an array"]
            
        items_schema = schema.get("items", {})
        for i, item in enumerate(data):
            errors.extend(validate_dict(items_schema, item, f"{path}[{i}]"))
            
    elif schema.get("type") == "string":
        if not isinstance(data, str):
            return [f"'{path}' must be a string"]
            
    return errors

def main():
    if len(sys.argv) < 2:
        print("❌ Usage: validate-intent-schema.py <path_to_intent.json>")
        sys.exit(1)
        
    intent_path = sys.argv[1]
    
    if not os.path.exists(intent_path):
        print(f"❌ Error: intent.json not found at {intent_path}. Agent must explicitly declare intent before coding.")
        sys.exit(1)
        
    # Enforce 1MB limit (EC-P1-001)
    if os.path.getsize(intent_path) > 1024 * 1024:
        print(f"❌ Error: intent.json exceeds 1MB limit. Blocking potential DOS/OOM attack.")
        sys.exit(1)
        
    # Read Schema
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    schema_path = os.path.join(project_root, ".agent", "schemas", "intent-schema.json")
    
    if not os.path.exists(schema_path):
        print(f"❌ Error: intent-schema.json not found at {schema_path}.")
        sys.exit(1)
        
    try:
        with open(schema_path, "r") as f:
            schema = json.load(f)
    except json.JSONDecodeError:
        print(f"❌ Error: intent-schema.json is invalid JSON.")
        sys.exit(1)
        
    # Read intent.json
    try:
        with open(intent_path, "r") as f:
            intent_data = json.load(f)
    except json.JSONDecodeError:
        print(f"❌ Error: intent.json is invalid JSON.")
        sys.exit(1)
        
    # Manual structural validation to avoid pip dependency (EC-P5-001)
    errors = validate_dict(schema, intent_data)
    
    if errors:
        print("❌ Error: intent.json failed schema validation:")
        for error in errors:
            print(f"  - {error}")
        print("Agent must strictly follow the intent-schema.json structure.")
        sys.exit(1)
        
    print("✅ intent.json successfully passed structural schema validation.")
    sys.exit(0)

if __name__ == "__main__":
    main()
