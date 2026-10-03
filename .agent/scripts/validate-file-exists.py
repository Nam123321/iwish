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

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate-file-exists.py <file_path>")
        sys.exit(1)
        
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"[ERROR] Zero-Trust Failure: File '{file_path}' does not physically exist.")
        sys.exit(1)
        
    if not os.path.isfile(file_path):
        print(f"[ERROR] Zero-Trust Failure: '{file_path}' exists but is not a file.")
        sys.exit(1)
        
    if os.path.getsize(file_path) == 0:
        print(f"[ERROR] Zero-Trust Failure: File '{file_path}' exists but is empty (0 bytes).")
        sys.exit(1)
        
    print(f"[SUCCESS] Zero-Trust Gate Passed: File '{file_path}' exists and has content.")
    sys.exit(0)

if __name__ == "__main__":
    main()
