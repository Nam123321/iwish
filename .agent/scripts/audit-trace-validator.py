#!/usr/bin/env python3
import sys
import re
import argparse

def main():
    parser = argparse.ArgumentParser(description="Audit & Trace Zero-Trust Validator")
    parser.add_argument("--file", required=True, help="Path to the spec or story markdown file")
    args = parser.parse_args()

    try:
        with open(args.file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[Error] File not found: {args.file}")
        sys.exit(2)

    # Keywords that suggest a mutating action
    mutation_patterns = [
        r'\bPOST\b', r'\bPUT\b', r'\bPATCH\b', r'\bDELETE\b', 
        r'\bmutation\b', r'\bupdate\b', r'\bcreate\b', r'\bdelete\b'
    ]
    
    # Sensitive entity context (basic check)
    sensitive_entities = [
        r'\buser\b', r'\bpayment\b', r'\bconfig\b', r'\bsetting\b', 
        r'\btenant\b', r'\brole\b', r'\bpermission\b', r'\bbilling\b'
    ]

    has_mutation = any(re.search(p, content, re.IGNORECASE) for p in mutation_patterns)
    has_sensitive = any(re.search(p, content, re.IGNORECASE) for p in sensitive_entities)

    if has_mutation and has_sensitive:
        # Check if audit trace mechanisms are defined
        audit_patterns = [
            r'\[AUDIT-TRACE\]', r'\btraceId\b', r'\bAuditEvent\b'
        ]
        has_audit = any(re.search(p, content) for p in audit_patterns)

        if not has_audit:
            print(f"[Violation] Mutating action on sensitive entity detected in {args.file}, but no Audit/Trace mechanism found.")
            print("You MUST include [AUDIT-TRACE] block, traceId, or AuditEvent definitions in the specification.")
            sys.exit(1)
        else:
            print("[Pass] Audit & Trace mechanisms are properly defined.")
            sys.exit(0)
    else:
        print("[Skip] No sensitive mutating actions detected.")
        sys.exit(0)

if __name__ == "__main__":
    main()
