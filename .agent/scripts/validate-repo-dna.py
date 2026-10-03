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

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate-repo-dna.py <file_path>")
        sys.exit(1)
        
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"[ERROR] Zero-Trust Failure: File '{file_path}' does not physically exist.")
        sys.exit(1)
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    missing_sections = []
    
    for i in range(1, 12):
        # Match "# 1. ", "## 1.", "### 1. ", etc.
        pattern = re.compile(rf"^#+\s*{i}\.\s+", re.MULTILINE)
        if not pattern.search(content):
            missing_sections.append(str(i))
            
    if missing_sections:
        print(f"[ERROR] Zero-Trust Failure: '{file_path}' is missing required sections: {', '.join(missing_sections)}")
        print("All 11 sections of the Repo DNA template must be addressed.")
        sys.exit(1)
        
    print(f"[SUCCESS] Zero-Trust Gate Passed: '{file_path}' contains all 11 sections.")
    sys.exit(0)

if __name__ == "__main__":
    main()
