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

"""Validates that code files do not contain simple skeleton/stub patterns."""
import sys, re, os
from pathlib import Path

# Import shared source roots
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline_constants import get_source_files


def main():
    if len(sys.argv) < 2:
        print("Usage: validate-code-complexity.py <project_root>")
        sys.exit(1)
        
    project_root = Path(sys.argv[1])
    if not project_root.exists():
        sys.exit(0)
        
    skeleton_patterns = [
        r'export\s+default\s*\{\s*\}',
        r'// TODO',
        r'throw new Error\(["\']Not implemented',
    ]

    # Use centralized source roots instead of hardcoded 'src/'
    code_files = get_source_files(project_root, extensions={".ts", ".tsx", ".js"}, include_tests=False)
    
    if not code_files:
        print("⚠️ No source files found to validate. Skipping.")
        sys.exit(0)

    for file_path in code_files:
        try:
            content = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError as e:
            print(f"❌ SECURITY ANOMALY: File {file_path} is not valid UTF-8. Potential bypass payload. {e}")
            sys.exit(1)
        except Exception:
            continue
            
        for pattern in skeleton_patterns:
            if re.search(pattern, content):
                print(f"❌ FAIL: {file_path} contains skeleton pattern: {pattern}")
                sys.exit(1)
                
    print(f"✅ Code complexity validation passed ({len(code_files)} files scanned).")
    sys.exit(0)

if __name__ == "__main__":
    main()
