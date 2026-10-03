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
import os
import re
import json
import argparse
from pathlib import Path

try:
    from jsonschema import validate, ValidationError
except ImportError:
    print("⚠️ jsonschema package not found. Skipping strict validation.")
    print("Run `pip install jsonschema` to enable deterministic schema validation.")
    sys.exit(0)

def extract_json_schemas(content):
    schemas = []
    blocks = re.findall(r'```json\s*(.*?)\s*```', content, re.DOTALL)
    for block in blocks:
        try:
            data = json.loads(block)
            if isinstance(data, dict) and ('properties' in data or 'type' in data):
                schemas.append(data)
        except json.JSONDecodeError:
            pass
    return schemas

def main():
    parser = argparse.ArgumentParser(description="Validate generated mock JSON against schema")
    parser.add_argument("--story-path", required=True, help="Path to story.md")
    args = parser.parse_args()

    story_path = Path(args.story_path)
    story_dir = story_path.parent
    data_spec_path = story_dir / "data-spec.md"
    
    if not data_spec_path.exists():
        print(f"⚠️ data-spec.md not found. Skipping schema validation.")
        sys.exit(0)
        
    content = data_spec_path.read_text(encoding='utf-8')
    schemas = extract_json_schemas(content)
    
    if not schemas:
        print("⚠️ No valid JSON schemas found in data-spec.md.")
        sys.exit(0)
        
    has_error = False
    
    for idx, schema in enumerate(schemas):
        title = schema.get('title', f"mock_schema_{idx}")
        filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', title.lower()) + ".json"
        mock_path = story_dir / filename
        
        if not mock_path.exists():
            continue
            
        try:
            mock_data = json.loads(mock_path.read_text())
            validate(instance=mock_data, schema=schema)
            print(f"✅ Schema Validation Passed for {filename}")
        except ValidationError as e:
            print(f"❌ CRITICAL ERROR (EC-P11-001): Schema Hallucination Detected!")
            print(f"   Validation failed for {filename}")
            print(f"   Reason: {e.message}")
            print(f"   Path: {' -> '.join([str(p) for p in e.path]) if e.path else 'root'}")
            has_error = True
        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")
            has_error = True
            
    if has_error:
        print("System is enforcing HARD HALT (Exit 1) due to invalid mock structure.")
        sys.exit(1)
        
if __name__ == "__main__":
    main()
