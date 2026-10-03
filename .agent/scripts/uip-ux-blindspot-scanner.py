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
import argparse

def main():
    parser = argparse.ArgumentParser(description="UIP UX Blindspot Scanner (Type B)")
    parser.add_argument("--spec", required=True, help="Path to the UX/UI Spec file")
    args = parser.parse_args()

    try:
        with open(args.spec, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[Error] File not found: {args.spec}")
        sys.exit(2)

    prompt = f"""
[UIP UX BLINDSPOT SCANNER]
You are a UX Auditor. I will provide you with a UX/UI specification.
Your task is to scan this specification through the 4-Lens Framework and identify missing standardizations (blind spots).

4-LENS FRAMEWORK:
1. User Intent (What are they trying to do?)
2. Accessibility & Form (Is it usable by all, across devices?)
3. Technical Constraints (Performance, loading states, error boundaries)
4. Unknowns Discovery (Edge cases, bulk actions, destructive limits)

SPECIFICATION:
{content}

OUTPUT REQUIRED:
Produce a list of missing standardized UX patterns (e.g., missing bulk action behaviors, missing empty states, missing pagination logic).
If you find blind spots, generate a debate request for the Party-Mode to resolve.
"""
    print(prompt)

if __name__ == "__main__":
    main()
