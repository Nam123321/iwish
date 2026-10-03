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
import argparse
import json

def print_result(status, message):
    print(json.dumps({"status": status, "message": message}))
    sys.exit(0 if status == "SUCCESS" else 1)

def main():
    parser = argparse.ArgumentParser(description="Validate Book DNA artifact")
    parser.add_argument("--target", required=True, help="The book name")
    parser.add_argument("--uuid", required=True, help="The unique UUID for the run")
    
    args = parser.parse_args()
    
    # EC-P4-001: Sanitize book name and uuid to prevent path traversal
    if not re.match(r'^[a-zA-Z0-9\-_]+$', args.target):
        print_result("ERROR", "Invalid --target format. Only alphanumeric characters and hyphens are allowed.")
    if not re.match(r'^[a-zA-Z0-9\-_]+$', args.uuid):
        print_result("ERROR", "Invalid --uuid format. Only alphanumeric characters and hyphens are allowed.")
        
    dna_dir = os.path.join(os.getcwd(), "_iwish-output", "repo-dna")
    dna_filename = f"{args.target}-{args.uuid}-dna.md"
    dna_path = os.path.join(dna_dir, dna_filename)
    
    # EC-P3-001: Explicit UUID matching, no wildcard globbing
    if not os.path.exists(dna_path):
        print_result("ERROR", f"DNA artifact not found at {dna_path}")
        
    file_size = os.path.getsize(dna_path)
    if file_size == 0:
        print_result("ERROR", "DNA artifact is empty (0 bytes).")
        
    # Read the file and check for required sections
    try:
        with open(dna_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        required_sections = [
            "Book Typology",
            "Reusable Patterns",
            "Context Summary"
        ]
        
        missing_sections = []
        for section in required_sections:
            # Look for the section title in markdown headers
            if not re.search(rf'^#+\s+{re.escape(section)}', content, re.MULTILINE | re.IGNORECASE):
                missing_sections.append(section)
                
        if missing_sections:
            print_result("ERROR", f"DNA artifact is missing mandatory sections: {', '.join(missing_sections)}")
            
        print_result("SUCCESS", f"DNA artifact {dna_filename} is structurally valid.")
        
    except Exception as e:
        print_result("ERROR", f"Failed to read DNA artifact: {str(e)}")

if __name__ == "__main__":
    main()
