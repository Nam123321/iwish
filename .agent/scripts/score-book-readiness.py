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
import json
import re

MAX_BYPASS_SIZE_BYTES = 50 * 1024  # 50KB (EC-P10-001, EC-P11-001)
MAX_SCAN_CHUNK_BYTES = 1024 * 1024 # 1MB stream read limit (EC-P1-001)

def print_result(requires_nlm, reason):
    print(json.dumps({"requires_nlm": requires_nlm, "reason": reason}))
    sys.exit(0)

def main():
    if len(sys.argv) < 2:
        print_result(True, "No input file provided")
        
    filepath = sys.argv[1]
    
    if not os.path.exists(filepath):
        print_result(True, f"File not found: {filepath}")
        
    filename = os.path.basename(filepath).lower()
    file_size = os.path.getsize(filepath)
    
    # Check binary formats
    if filename.endswith(".pdf") or filename.endswith(".epub"):
        print_result(True, "Binary/Complex format requires NotebookLM parsing")
        
    # Check LLMs.txt
    if "llms.txt" in filename or "llms-full.txt" in filename or "llms_full" in filename:
        if file_size <= MAX_BYPASS_SIZE_BYTES:
            print_result(False, "Standardized AI-ready format, can be processed directly")
        else:
            print_result(True, "File size exceeds 50KB ceiling (EC-P10-001/EC-P11-001)")
            
    # Check general Markdown
    if filename.endswith(".md"):
        if file_size > MAX_BYPASS_SIZE_BYTES:
            print_result(True, "Markdown file size exceeds 50KB ceiling (EC-P10-001/EC-P11-001)")
            
        # Stream read for structural density (EC-P1-001)
        headers = 0
        code_blocks = 0
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read(MAX_SCAN_CHUNK_BYTES)
                # Count basic structural elements
                headers = len(re.findall(r'^#{1,6}\s', content, re.MULTILINE))
                code_blocks = len(re.findall(r'^```', content, re.MULTILINE))
                
            if headers >= 3 or code_blocks >= 1:
                print_result(False, "Highly structured Markdown, can be processed directly")
            else:
                print_result(True, "Markdown lacks sufficient structure, requires NotebookLM extraction")
        except Exception as e:
            print_result(True, f"Error scanning Markdown file: {str(e)}")
            
    # Fallback
    print_result(True, "Unsupported format for direct bypass, falling back to NotebookLM")

if __name__ == "__main__":
    main()
