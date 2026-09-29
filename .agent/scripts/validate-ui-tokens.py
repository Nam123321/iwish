#!/usr/bin/env python3
import argparse
import sys
import re
import os
import json

def extract_policy_from_design(design_path):
    if not os.path.exists(design_path):
        print(f"Warning: DESIGN.md not found at {design_path}. Skipping strict policy enforcement.")
        return None
        
    with open(design_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract JSON between <!-- [UI_COMPLIANCE_POLICY_START] --> and <!-- [UI_COMPLIANCE_POLICY_END] -->
    match = re.search(r'<!-- \[UI_COMPLIANCE_POLICY_START\] -->.*?```json(.*?)```.*?<!-- \[UI_COMPLIANCE_POLICY_END\] -->', content, re.DOTALL)
    if not match:
        # Fallback without markdown blocks
        match = re.search(r'<!-- \[UI_COMPLIANCE_POLICY_START\] -->(.*?)<!-- \[UI_COMPLIANCE_POLICY_END\] -->', content, re.DOTALL)
        
    if not match:
        print(f"Warning: No UI_COMPLIANCE_POLICY block found in {design_path}. Skipping strict policy enforcement.")
        return None
        
    try:
        json_str = match.group(1).strip()
        policy = json.loads(json_str)
        return policy
    except json.JSONDecodeError as e:
        print(f"Error parsing UI_COMPLIANCE_POLICY JSON in {design_path}: {e}")
        sys.exit(1)

def validate_ui_tokens(filepath, design_path):
    if not os.path.exists(filepath):
        print(f"Error: File {filepath} does not exist.")
        sys.exit(1)
        
    filename = os.path.basename(filepath)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    errors = []
    
    policy = extract_policy_from_design(design_path)
    
    if policy:
        # 1. Forbidden Tokens Check
        forbidden = policy.get("forbidden_tokens", [])
        for rule in forbidden:
            pattern = rule.get("pattern")
            if pattern and re.search(pattern, content):
                msg = rule.get("message", f"Forbidden token matched: {pattern}")
                errors.append(f"Forbidden Token Detected: {msg}")
                
        # 2. Mandatory Logic Check
        mandatory = policy.get("mandatory_logic", [])
        for rule in mandatory:
            match_filenames = rule.get("match_filename", [])
            requires_codes = rule.get("requires_code", [])
            
            # Check if current file matches any pattern in match_filename
            is_match = any(m.lower() in filename.lower() for m in match_filenames)
            if is_match:
                for req in requires_codes:
                    if req not in content:
                        msg = rule.get("message", f"Missing required hook/code: {req}")
                        errors.append(f"Mandatory Logic Missing: {msg} (Required: {req})")
    else:
        # Fallback to hardcoded basic rules if no DESIGN.md policy found (Legacy fallback)
        if re.search(r'\bdark:', content):
            errors.append("Forbidden Token Detected: 'dark:' variant is not allowed.")
        if re.search(r'\btext-\[#', content) or re.search(r'\bbg-\[#', content):
            errors.append("Forbidden Token Detected: Hardcoded hex colors are not allowed.")

    if errors:
        print(f"Validation FAILED for {filepath}:")
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
        
    print(f"Validation PASSED for {filepath}.")
    sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate UI Tokens dynamically using DESIGN.md policy.")
    parser.add_argument("--file", required=True, help="Path to the JSX/TSX file to validate.")
    parser.add_argument("--design", required=True, help="Path to DESIGN.md file containing UI_COMPLIANCE_POLICY.")
    args = parser.parse_args()
    
    validate_ui_tokens(args.file, args.design)
