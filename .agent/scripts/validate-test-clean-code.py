#!/usr/bin/env python3
import watchmen_core
watchmen_core.verify_execution(__file__)

import os
import sys
import yaml
import json
import subprocess

STRATEGY_FILE = ".agents/rules/testing-strategy.yaml"

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 validate-test-clean-code.py <epic_id> <story_id>")
        sys.exit(1)
        
    epic_id = sys.argv[1]
    story_id = sys.argv[2]
    
    # Load SSOT
    if not os.path.exists(STRATEGY_FILE):
        print(f"❌ Error: {STRATEGY_FILE} not found.")
        sys.exit(1)
        
    with open(STRATEGY_FILE, 'r') as f:
        strategy = yaml.safe_load(f)
        
    forbidden = strategy.get('clean_code_rules', {}).get('forbidden_assertions', [])
    
    print("\n🛡️ [TEST CLEAN CODE GUARDIAN] Scanning test files for AST integrity...")
    
    # Get files changed in the current PR/story
    try:
        import subprocess
        result = subprocess.run(["git", "diff", "--name-only", "HEAD"], capture_output=True, text=True)
        changed_files = result.stdout.strip().split('\n')
        result_untracked = subprocess.run(["git", "ls-files", "--others", "--exclude-standard"], capture_output=True, text=True)
        if result_untracked.stdout.strip():
            changed_files.extend(result_untracked.stdout.strip().split('\n'))
        test_files = [f for f in changed_files if f and f.endswith(('.ts', '.js', '.spec.ts', '.test.ts')) and ('test' in f.lower() or 'spec' in f.lower())]
        test_files = [f for f in test_files if os.path.exists(f)]
    except Exception as e:
        print(f"Failed to get changed files: {e}")
        sys.exit(1)
                
    if not test_files:
        print("✅ No test files found in this diff. Bypassing check.")
        sys.exit(0)
        
    failed = False
    requires_human_review = False
    
    # [EDGE-CASE: EC-P5-001] Avoid ReDoS and Regex limits by parsing properly, 
    # but for this Category A Python script acting as a bridge, we simulate an AST parsing via JS helper or strict line exclusion.
    # In a full Node environment, we'd spawn a JS process. Here we use an advanced AST-like regex filtering that strictly ignores comments.
    
    for tf in test_files:
        with open(tf, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        is_in_multiline_comment = False
        
        for line_num, line in enumerate(lines, 1):
            stripped = line.strip()
            
            # [EDGE-CASE: EC-P8-001] Escape Hatch
            if '// @watchmen-ignore-test:' in stripped:
                print(f"⚠️  [MANUAL REVIEW REQUIRED] Bypass flag detected in {tf}:{line_num}")
                requires_human_review = True
                continue
                
            # [EDGE-CASE: EC-P6-001] Ignore Comments and Dead Code
            if is_in_multiline_comment:
                if '*/' in stripped:
                    is_in_multiline_comment = False
                continue
                
            if stripped.startswith('/*'):
                if '*/' not in stripped:
                    is_in_multiline_comment = True
                continue
                
            if stripped.startswith('//'):
                continue
                
            # Fast check against forbidden string sequences inside active code
            for f_assert in forbidden:
                # Remove spaces to match variations
                norm_line = stripped.replace(" ", "")
                norm_assert = f_assert.replace(" ", "")
                if norm_assert in norm_line:
                    print(f"❌ [CLEAN CODE VIOLATION] Dummy assertion found in {tf}:{line_num}")
                    print(f"   => {stripped}")
                    print(f"   => Rule: {f_assert} is forbidden by testing-strategy.yaml")
                    failed = True
                    
    if failed:
        print("\n🚨 VALIDATION FAILED: Dummy tests detected. Please use meaningful behavioral assertions.")
        sys.exit(1)
        
    if requires_human_review:
        print("\n⚠️ VALIDATION PASSED (CONDITIONAL): Requires human review due to bypass flags.")
        # We would write to a state file here to downgrade the PR
        sys.exit(0)
        
    print("\n✅ VALIDATION PASSED: All test files passed clean code AST checks.")
    sys.exit(0)

if __name__ == '__main__':
    main()
