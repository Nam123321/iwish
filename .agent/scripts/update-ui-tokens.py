#!/usr/bin/env python3
import argparse
import sys
import re
import os
import json

def extract_policy(content):
    match = re.search(r'(<!-- \[UI_COMPLIANCE_POLICY_START\] -->.*?```json\s*)(.*?)(\s*```.*?<!-- \[UI_COMPLIANCE_POLICY_END\] -->)', content, re.DOTALL)
    if match:
        return match, match.group(2)
    # Fallback without markdown blocks
    match = re.search(r'(<!-- \[UI_COMPLIANCE_POLICY_START\] -->\s*)(.*?)(\s*<!-- \[UI_COMPLIANCE_POLICY_END\] -->)', content, re.DOTALL)
    if match:
        return match, match.group(2)
    return None, None

def main():
    parser = argparse.ArgumentParser(description="Update UI Compliance Policy JSON inside DESIGN.md")
    parser.add_argument("--design", required=True, help="Path to DESIGN.md")
    parser.add_argument("--action", required=True, choices=["add-forbidden", "add-mandatory"], help="Action to perform")
    
    # Args for add-forbidden
    parser.add_argument("--pattern", help="Regex pattern for forbidden token")
    
    # Args for add-mandatory
    parser.add_argument("--match-filenames", help="Comma-separated filenames to match")
    parser.add_argument("--requires-codes", help="Comma-separated required codes/hooks")
    
    # Common
    parser.add_argument("--message", required=True, help="Error message to display when rule is violated")
    
    args = parser.parse_args()

    if not os.path.exists(args.design):
        print(f"Error: {args.design} not found.")
        sys.exit(1)

    with open(args.design, 'r', encoding='utf-8') as f:
        content = f.read()

    match, json_str = extract_policy(content)
    if not match:
        print("Error: Could not find [UI_COMPLIANCE_POLICY_START] block in DESIGN.md")
        sys.exit(1)

    try:
        policy = json.loads(json_str.strip())
    except json.JSONDecodeError as e:
        print(f"Error parsing existing JSON: {e}")
        sys.exit(1)

    if args.action == "add-forbidden":
        if not args.pattern:
            print("Error: --pattern is required for add-forbidden")
            sys.exit(1)
            
        if "forbidden_tokens" not in policy:
            policy["forbidden_tokens"] = []
            
        # Check for duplicates
        for rule in policy["forbidden_tokens"]:
            if rule.get("pattern") == args.pattern:
                print(f"Rule for pattern '{args.pattern}' already exists.")
                sys.exit(0)
                
        policy["forbidden_tokens"].append({
            "pattern": args.pattern,
            "message": args.message
        })
        print(f"Added forbidden pattern '{args.pattern}'.")

    elif args.action == "add-mandatory":
        if not args.match_filenames or not args.requires_codes:
            print("Error: --match-filenames and --requires-codes are required for add-mandatory")
            sys.exit(1)
            
        if "mandatory_logic" not in policy:
            policy["mandatory_logic"] = []
            
        match_f = [x.strip() for x in args.match_filenames.split(",")]
        req_c = [x.strip() for x in args.requires_codes.split(",")]
        
        policy["mandatory_logic"].append({
            "match_filename": match_f,
            "requires_code": req_c,
            "message": args.message
        })
        print(f"Added mandatory logic for {match_f}.")

    new_json_str = json.dumps(policy, indent=2)
    
    # Reconstruct the file content
    new_content = content[:match.start(2)] + new_json_str + content[match.end(2):]
    
    with open(args.design, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Successfully updated DESIGN.md policy.")

if __name__ == "__main__":
    main()
