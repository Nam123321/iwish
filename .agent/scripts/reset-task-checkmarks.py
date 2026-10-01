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
import re

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 reset-task-checkmarks.py <path-to-task.md>")
        sys.exit(1)
        
    task_file = sys.argv[1]
    
    try:
        with open(task_file, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Reset [x] and [/] to [ ]
        updated_content = re.sub(r'\[x\]', '[ ]', content, flags=re.IGNORECASE)
        updated_content = re.sub(r'\[/\]', '[ ]', updated_content)
        
        with open(task_file, "w", encoding="utf-8") as f:
            f.write(updated_content)
            
        print(f"✅ Zero-Trust enforcement: Successfully reset all task checkmarks in {task_file} to enforce clean session validation.")
    except Exception as e:
        print(f"❌ Failed to reset task checkmarks: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
