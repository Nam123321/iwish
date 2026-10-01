#!/usr/bin/env python3
import os
import sys
import re
import argparse

def scan_transcript(transcript_path: str) -> bool:
    if not os.path.exists(transcript_path):
        print(f"Error: Transcript file not found at {transcript_path}")
        return False
        
    with open(transcript_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Deterministic check: did the agent use view_file on architecture.md, ADR, or TDR?
    # Or did the agent mention loading project context?
    pattern = r'(tool_call.*view_file.*(architecture|adr|tdr|epic))|(read.*(architecture\.md|adr|tdr))'
    
    if re.search(pattern, content, re.IGNORECASE):
        return True
    return False

def main():
    parser = argparse.ArgumentParser(description="NL2SQL Context Compliance Auditor")
    parser.add_argument('--transcript-path', required=True, help="Path to the agent transcript")
    
    args = parser.add_argument()
    args = parser.parse_args()
    
    # Implement Circuit Breaker logic via an environment variable or lock file
    # For this simplified version, we just output the strict guidance.
    
    passed = scan_transcript(args.transcript_path)
    
    if passed:
        print("✅ COMPLIANCE PASSED: Agent successfully read the project context.")
        sys.exit(0)
    else:
        print("🔴 REJECTED: Compliance Audit Failed.")
        print("You failed the compliance check. You MUST execute `view_file` on `architecture.md` or the relevant ADR/TDR before trying again.")
        print("Infinite Retry Circuit Breaker: If you fail this 3 times, you must halt.")
        sys.exit(1)

if __name__ == "__main__":
    main()
