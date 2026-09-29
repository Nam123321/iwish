#!/usr/bin/env python3
import sys
import os
import re

# List of patterns that suggest mock data or stubbing.
FORBIDDEN_PATTERNS = [
    r'mock[A-Z_a-z0-9]*\s*=', 
    r'dummy[A-Z_a-z0-9]*\s*=',
    r'fake[A-Z_a-z0-9]*\s*=',
    r'TODO:\s*(connect|integrate|implement)\s*(real|actual|api|db)',
    r'//\s*mock data',
    r'#\s*mock data',
    r'stub[A-Z_a-z0-9]*\s*='
]

# Patterns for file/directory paths to skip.
SKIP_PATHS = [
    r'/tests?/',
    r'__tests__',
    r'\.test\.[a-z]+$',
    r'\.spec\.[a-z]+$',
    r'\.story\.[a-z]+$',
    r'\.stories\.[a-z]+$',
    r'/mocks?/',
    r'/fixtures?/'
]

def should_skip(filepath):
    for skip in SKIP_PATHS:
        if re.search(skip, filepath):
            return True
    return False

def scan_file(filepath):
    if should_skip(filepath):
        return []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return []

    findings = []
    for i, line in enumerate(lines):
        for pattern in FORBIDDEN_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                findings.append((i + 1, line.strip(), pattern))
                break # One finding per line is enough
    
    return findings

def scan_path(target_path):
    all_findings = {}
    if os.path.isfile(target_path):
        res = scan_file(target_path)
        if res:
            all_findings[target_path] = res
    elif os.path.isdir(target_path):
        for root, _, files in os.walk(target_path):
            for file in files:
                filepath = os.path.join(root, file)
                res = scan_file(filepath)
                if res:
                    all_findings[filepath] = res
    else:
        print(f"Error: Path {target_path} does not exist.")
        sys.exit(1)
        
    return all_findings

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python mock_scanner.py <path>")
        sys.exit(1)

    target_path = sys.argv[1]
    results = scan_path(target_path)

    if not results:
        print("Success: No forbidden mock patterns found.")
        sys.exit(0)

    print("FAILED: Found forbidden mock patterns in production code!")
    for filepath, findings in results.items():
        print(f"\nFile: {filepath}")
        for line_num, line_content, pattern in findings:
            print(f"  Line {line_num}: {line_content} (matched: {pattern})")
    
    print("\nACTION REQUIRED: Remove mock data and integrate with real Database/API components.")
    sys.exit(1)
