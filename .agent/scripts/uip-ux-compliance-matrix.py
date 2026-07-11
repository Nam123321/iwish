#!/usr/bin/env python3
import sys
import re
import argparse

def main():
    parser = argparse.ArgumentParser(description="UIP UX Compliance Matrix Validator (Type A)")
    parser.add_argument("--file", required=True, help="Path to the proposed UX rule / debate output")
    args = parser.parse_args()

    try:
        with open(args.file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[Error] File not found: {args.file}")
        sys.exit(2)

    # 4 Lenses that MUST be present in any Global UX Rule standardization
    required_lenses = {
        "Lens 1: User Intent": r'user\s*intent|intent',
        "Lens 2: Accessibility & Form": r'accessib|form|a11y',
        "Lens 3: Tech Constraints": r'tech\s*constraint|performance|loading|error',
        "Lens 4: Unknowns (Edge Cases)": r'unknown|edge\s*case|destructive'
    }

    missing_lenses = []
    for lens_name, pattern in required_lenses.items():
        if not re.search(pattern, content, re.IGNORECASE):
            missing_lenses.append(lens_name)

    if missing_lenses:
        print(f"[Violation] The proposed UX Standardization in {args.file} is INCOMPLETE.")
        print("A Global UX Rule MUST cover all 4 Lenses of the UX Framework.")
        print(f"Missing Lenses: {', '.join(missing_lenses)}")
        print("Please restart the Party-Mode debate to cover these missing perspectives before committing to DESIGN.md.")
        sys.exit(1)
    else:
        print("[Pass] 4-Lens UX Compliance verified. Ready to commit to DESIGN.md.")
        sys.exit(0)

if __name__ == "__main__":
    main()
