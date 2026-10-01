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
import re

def validate_quality(prompt):
    # Gate 1: Specificity (Basic length and technical density)
    if len(prompt.split()) < 20:
        print("FAIL: Gate 1 (Specificity). Prompt is too short (< 20 words). Must be highly specific.")
        sys.exit(1)
        
    # Gate 2: Dimensions
    dimensions = ["security", "performance", "ux", "edge case", "data", "architecture", "error", "lifecycle", "state", "scale", "auth", "api", "database", "testing", "compliance", "flow", "logic"]
    found_dims = sum(1 for d in dimensions if d in prompt.lower())
    if found_dims < 4:
        print(f"FAIL: Gate 2 (Dimensions). Found {found_dims}/4 required dimensions. Ensure you probe multiple facets (e.g., Security, Performance, Edge Cases, Data).")
        sys.exit(1)
        
    # Gate 3: Anti-Patterns
    anti_patterns = [r"do not", r"ignore", r"exclude", r"without", r"avoid", r"not include"]
    has_anti = any(re.search(p, prompt, re.IGNORECASE) for p in anti_patterns)
    if not has_anti:
        print("FAIL: Gate 3 (Anti-Patterns Avoidance). Prompt MUST explicitly define boundaries (e.g., 'Do not include...').")
        sys.exit(1)
        
    # Gate 4 & 5: Target and Mode Justification
    target_mode = re.search(r'\(Target:[^)]*?,\s*Mode:[^)]*?\)', prompt, re.IGNORECASE)
    if not target_mode:
        print("FAIL: Gate 4/5 (Target & Mode). Prompt MUST contain the exact string format '(Target: [Notebook Name], Mode: [Fast Query/Deep Research])'.")
        sys.exit(1)
        
    print("PASS: Notebook Quality Gate validated successfully.")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 validate_notebook_quality.py <path_to_prompt_file>")
        sys.exit(1)
        
    try:
        with open(sys.argv[1], 'r') as f:
            prompt_content = f.read()
            validate_quality(prompt_content)
    except Exception as e:
        print(f"Error reading prompt file: {e}")
        sys.exit(1)
