#!/usr/bin/env python3
import sys
import os

def main():
    if len(sys.argv) < 2:
        print("Usage: python strict_validator.py <file_path>")
        sys.exit(1)
        
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
        
    print(f"🛡️ Strict Validator scanning: {file_path}...\n")
    
    errors = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Rule 1: No display: none !important on react-resizable-panels
        if "display: none !important" in content and "Panel" in content:
            errors.append("[ERROR] Found 'display: none !important' in a file that seems to handle Panels. This breaks react-resizable-panels. Use onCollapse and minSize instead.")
            
        # Add more deterministic AST/Regex rules here...
        
    if errors:
        print("❌ Validation Failed:")
        for err in errors:
            print(f"  {err}")
        sys.exit(1)
    else:
        print("✅ Strict Validation Passed.")
        sys.exit(0)

if __name__ == "__main__":
    main()
