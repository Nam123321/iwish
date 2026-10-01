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

"""
Review Evidence Verifier — Physical enforcement gate.

This script is the REFEREE. It verifies that:
1. spec-compliance-checker.py was run (checker-output-{id}.json exists)
2. anti-cheat-linter.js was run (linter-output-{id}.json exists)
3. SCS meets threshold (reads value from .json, not from agent claim)
4. Spec files haven't changed since checker ran (spec_hash comparison)
5. No unapproved mocks exist (reads mock findings from linter .json)

EXIT CODES:
  0 = All evidence verified — story may proceed
  1 = Evidence missing or invalid — story BLOCKED

USAGE:
  python3 .agent/scripts/verify-review-evidence.py <story_dir> <story_id> \
    [--ui-spec <path>] [--data-spec <path>] [--story <path>] \
    [--scs-threshold 85]
"""

import argparse
import json
import os
import sys
import hashlib
import re
import yaml
import subprocess

def normalize_hash(file_path):
    if not os.path.exists(file_path):
        return ""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = [line.strip() for line in content.split('\n')]
    normalized = '\n'.join(line for line in lines if line)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def locate_story_directory(project_root, story_id):
    search_path = os.path.join(project_root, "_iwish-output")
    if os.path.exists(search_path):
        for root, dirs, files in os.walk(search_path):
            for d in dirs:
                if d.lower() == f"story-{story_id}".lower() or d.lower() == f"story-{story_id.replace('.', '_')}".lower():
                    return os.path.join(root, d)
    flat_dir = os.path.join(project_root, "_iwish-output", "stories")
    if os.path.exists(flat_dir):
        return flat_dir
    return None

def verify(args):
    failures = []
    warnings = []
    
    # ━━━ RESOLVE PROJECT ROOT ━━━
    curr = os.path.abspath(args.story_dir)
    project_root = None
    while True:
        parent = os.path.dirname(curr)
        if parent == curr:
            break
        if os.path.exists(os.path.join(parent, "package.json")) or os.path.exists(os.path.join(parent, ".git")):
            project_root = parent
            break
        curr = parent
    if not project_root:
        project_root = os.getcwd()
        
    story_id = args.story_id
    threshold = args.scs_threshold
    
    # ━━━ LOCATE STORY DIRECTORY (FLAT & HIERARCHICAL COEXISTENCE) ━━━
    resolved_dir = locate_story_directory(project_root, story_id)
    if resolved_dir:
        story_dir = resolved_dir
    else:
        story_dir = args.story_dir
        
    # Auto-resolve spec/story paths if missing
    if not args.story:
        h_story = os.path.join(story_dir, "story.md")
        f_story = os.path.join(story_dir, f"story-{story_id}.md")
        if os.path.exists(h_story):
            args.story = h_story
        elif os.path.exists(f_story):
            args.story = f_story
            
    if not args.ui_spec:
        h_ui = os.path.join(story_dir, "ui-spec.md")
        f_ui = os.path.join(story_dir, f"ui-spec-story-{story_id}.md")
        if os.path.exists(h_ui):
            args.ui_spec = h_ui
        elif os.path.exists(f_ui):
            args.ui_spec = f_ui
            
    if not args.data_spec:
        h_data = os.path.join(story_dir, "data-spec.md")
        f_data = os.path.join(story_dir, f"data-spec-story-{story_id}.md")
        if os.path.exists(h_data):
            args.data_spec = h_data
        elif os.path.exists(f_data):
            args.data_spec = f_data

    # ━━━ AUTO-RUN COMPLIANCE CHECKER IF MISSING OR OUT-OF-DATE ━━━
    checker_path = os.path.join(story_dir, f"checker-output-{story_id}.json")
    should_run_checker = not os.path.exists(checker_path)
    
    if not should_run_checker and args.story:
        try:
            with open(checker_path, 'r', encoding='utf-8') as f:
                ch_data = json.load(f)
            stored_hash = ch_data.get('spec_hash', '')
            spec_files = [f for f in [args.ui_spec, args.data_spec, args.story] if f and os.path.exists(f)]
            current_hashes = [normalize_hash(f) for f in spec_files]
            current_combined = hashlib.sha256('||'.join(current_hashes).encode('utf-8')).hexdigest()
            if stored_hash and stored_hash != current_combined:
                should_run_checker = True
                print("⚠️ Spec files changed since compliance checker ran. Re-running spec-compliance-checker.py...")
        except Exception:
            should_run_checker = True

    if should_run_checker:
        checker_script = os.path.join(project_root, ".agent", "scripts", "spec-compliance-checker.py")
        if os.path.exists(checker_script) and args.story:
            cmd = ['python3', checker_script, args.story, '--output-json', checker_path]
            if args.ui_spec:
                cmd.extend(['--ui-spec', args.ui_spec])
            if args.data_spec:
                cmd.extend(['--data-spec', args.data_spec])
            print(f"🏃 Executing Compliance Checker: {' '.join(cmd)}")
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, cwd=project_root)
                if res.returncode != 0:
                    print(f"❌ Compliance checker auto-run failed: {res.stdout} {res.stderr}")
            except Exception as e:
                print(f"❌ Failed to run compliance checker: {e}")

    # ━━━ AUTO-RUN LINTER IF MISSING ━━━
    linter_path = os.path.join(story_dir, f"linter-output-{story_id}.json")
    if not os.path.exists(linter_path):
        print(f"⚠️ {linter_path} not found. Running anti-cheat-linter.js automatically...")
        # Collect story tags for keyword filtering
        story_tags = []
        if args.story and os.path.exists(args.story):
            try:
                with open(args.story, 'r', encoding='utf-8') as f:
                    story_content = f.read()
                yaml_match = re.match(r'^---\n(.*?)\n---', story_content, re.DOTALL)
                if yaml_match:
                    frontmatter = yaml.safe_load(yaml_match.group(1))
                    story_tags = [t.lower() for t in frontmatter.get('tags', [])]
            except Exception as e:
                warnings.append(f"Failed to parse story tags for linter check: {e}")

        # Basic filtering keywords
        connector_keywords = {'credentials', 'integration', 'mcp', 'connector', 'webhook', 'automation'}
        for tag in story_tags:
            if len(tag) > 2:
                connector_keywords.add(tag.split(':')[-1].lower())

        raw_modified = []
        try:
            status_res = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, cwd=project_root)
            for line in status_res.stdout.split('\n'):
                if line.strip():
                    parts = line.strip().split(None, 1)
                    if len(parts) == 2:
                        status, filepath = parts[0], parts[1]
                        # Only include code files under src/ or server/ to avoid dirty root scratch files
                        if filepath.startswith(('src/', 'server/')) and filepath.endswith(('.js', '.jsx', '.ts', '.tsx', '.css')):
                            raw_modified.append(filepath)
            diff_res = subprocess.run(['git', 'diff', '--name-only', 'origin/master...HEAD'], capture_output=True, text=True, cwd=project_root)
            for line in diff_res.stdout.split('\n'):
                filepath = line.strip()
                if filepath and filepath not in raw_modified:
                    if filepath.startswith(('src/', 'server/')) and filepath.endswith(('.js', '.jsx', '.ts', '.tsx', '.css')):
                        raw_modified.append(filepath)
        except Exception as e:
            warnings.append(f"Git diff extraction warning: {e}")

        # Filter modified files based on story domain keywords
        modified_files = []
        for filepath in raw_modified:
            filepath_lower = filepath.lower()
            is_relevant = False
            for kw in connector_keywords:
                if kw in filepath_lower:
                    is_relevant = True
                    break
            if is_relevant:
                modified_files.append(filepath)

        linter_script = os.path.join(project_root, "scripts", "anti-cheat-linter.js")
        if os.path.exists(linter_script):
            cmd = ['node', linter_script, '--story-dir', story_dir, '--story-id', story_id]
            if modified_files:
                cmd.extend(['--files', ','.join(modified_files)])
            print(f"🏃 Executing Linter: {' '.join(cmd)}")
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, cwd=project_root)
                if res.returncode != 0:
                    print(f"❌ Linter auto-run failed: {res.stdout} {res.stderr}")
            except Exception as e:
                print(f"❌ Failed to run anti-cheat-linter: {e}")

    # ━━━ GATE 1: Checker output exists ━━━
    if not os.path.exists(checker_path):
        failures.append(
            f"GATE 1 FAIL: {checker_path} not found. "
            f"spec-compliance-checker.py was NEVER RUN for this story."
        )
        checker_data = None
    else:
        try:
            with open(checker_path, 'r', encoding='utf-8') as f:
                checker_data = json.load(f)
        except Exception as e:
            failures.append(f"GATE 1 FAIL: Failed to parse {checker_path}: {e}")
            checker_data = None
    
    # ━━━ GATE 2: Linter output exists ━━━
    if not os.path.exists(linter_path):
        failures.append(
            f"GATE 2 FAIL: {linter_path} not found. "
            f"anti-cheat-linter.js was NEVER RUN for this story."
        )
        linter_data = None
    else:
        try:
            with open(linter_path, 'r', encoding='utf-8') as f:
                linter_data = json.load(f)
        except Exception as e:
            failures.append(f"GATE 2 FAIL: Failed to parse {linter_path}: {e}")
            linter_data = None
    
    # ━━━ GATE 3: SCS meets threshold ━━━
    if checker_data:
        scs = checker_data.get('scs_overall', 0)
        if scs < threshold:
            failures.append(
                f"GATE 3 FAIL: SCS {scs:.1f}% < {threshold}% threshold. "
                f"Disposition: {checker_data.get('disposition', 'UNKNOWN')}. "
                f"Missing tokens: {len(checker_data.get('missing_tokens', []))}"
            )
    
    # ━━━ GATE 4: Spec hash still valid (SSOT guard) ━━━
    if checker_data and (args.ui_spec or args.data_spec or args.story):
        stored_hash = checker_data.get('spec_hash', '')
        spec_files = [f for f in [args.ui_spec, args.data_spec, args.story] 
                      if f and os.path.exists(f)]
        current_hashes = [normalize_hash(f) for f in spec_files]
        current_combined = hashlib.sha256('||'.join(current_hashes).encode('utf-8')).hexdigest()
        
        if stored_hash and stored_hash != current_combined:
            failures.append(
                f"GATE 4 FAIL: SSOT VIOLATION — spec files changed since checker ran. "
                f"Stored hash: {stored_hash[:16]}... Current: {current_combined[:16]}... "
                f"Re-run spec-compliance-checker.py before review."
            )
    
    # ━━━ GATE 5: No unapproved mocks ━━━
    if linter_data:
        mock_count = linter_data.get('mock_count', 0)
        all_approved = linter_data.get('all_mocks_approved', True)
        if mock_count > 0 and not all_approved:
            unapproved = [f for f in linter_data.get('findings', []) 
                         if f.get('severity') in ('critical', 'high') and not f.get('mock_approved', False)]
            if unapproved:
                failures.append(
                    f"GATE 5 FAIL: {len(unapproved)} unapproved mock(s) detected. "
                    f"Each mock needs [MOCK_APPROVED] annotation or must be replaced with real implementation."
                )
        
        # Auth mocks are NEVER approvable
        auth_mocks = [f for f in linter_data.get('findings', []) 
                     if f.get('pattern') == 'auth_mock']
        if auth_mocks:
            failures.append(
                f"GATE 5b FAIL: {len(auth_mocks)} auth/tenant mock(s) detected. "
                f"Auth mocks CANNOT be approved. Must resolve with real auth."
            )
    # ━━━ GATE 6: Physical Integration Test Verification ━━━
    if args.story and os.path.exists(args.story):
        story_tags = []
        try:
            with open(args.story, 'r', encoding='utf-8') as f:
                story_content = f.read()
            yaml_match = re.match(r'^---\n(.*?)\n---', story_content, re.DOTALL)
            if yaml_match:
                frontmatter = yaml.safe_load(yaml_match.group(1))
                story_tags = [t.lower() for t in frontmatter.get('tags', [])]
        except Exception as e:
            warnings.append(f"Failed to parse story tags for test check: {e}")

        connector_keywords = {'connector', 'mcp', 'figma', 'canva', 'notion', 'trello', 'github', 'n8n', 'api', 'oauth', 'authentic', '3rd', 'provider'}
        active_connectors = connector_keywords.intersection(set(story_tags))
        
        if active_connectors:
            # Traverse up to find project root containing package.json or .git
            curr = os.path.abspath(args.story)
            project_root = None
            while True:
                parent = os.path.dirname(curr)
                if parent == curr:
                    break
                if os.path.exists(os.path.join(parent, "package.json")) or os.path.exists(os.path.join(parent, ".git")):
                    project_root = parent
                    break
                curr = parent
            if not project_root:
                project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(args.story))))))
            
            test_dir = os.path.join(project_root, "server", "tests", "integration")
            
            phase_map = {
                "35.4": "phase4",
                "35.1": "phase1",
                "35.2": "phase1",
                "35.5": "phase2",
                "35.12": "phase2",
                "35.11": "phase2",
                "35.3": "phase3",
                "35.8": "phase3",
                "35.6": "phase3",
                "35.7": "phase3"
            }
            
            search_keys = [story_id, story_id.replace('.', '_')]
            if story_id in phase_map:
                search_keys.append(phase_map[story_id])
                
            matching_tests = []
            if os.path.exists(test_dir):
                for filename in os.listdir(test_dir):
                    if any(key.lower() in filename.lower() for key in search_keys) and filename.endswith('.test.js'):
                        matching_tests.append(os.path.join(test_dir, filename))
            
            if not matching_tests:
                failures.append(
                    f"GATE 6 FAIL: Story {story_id} is tagged with connector/mcp tags {list(active_connectors)}, "
                    f"but no matching integration test file was found in '{test_dir}'."
                )
            else:
                test_file = matching_tests[0]
                print(f"🔄 Running integration test validation: {os.path.basename(test_file)}...")
                try:
                    res = subprocess.run(
                        ['npx', 'vitest', 'run', test_file],
                        capture_output=True, text=True, timeout=45,
                        cwd=project_root
                    )
                    if res.returncode != 0:
                        failures.append(
                            f"GATE 6 FAIL: Integration test '{os.path.basename(test_file)}' failed execution.\n"
                            f"=== Vitest Output ===\n{res.stdout}\n{res.stderr}\n====================="
                        )
                except subprocess.TimeoutExpired:
                    failures.append(f"GATE 6 FAIL: Integration test '{os.path.basename(test_file)}' timed out after 45 seconds.")
                except Exception as e:
                    failures.append(f"GATE 6 FAIL: Error running integration test: {e}")

    # ━━━ REPORT ━━━
    if failures:
        print("=" * 60)
        print("❌ REVIEW EVIDENCE VERIFICATION FAILED")
        print("=" * 60)
        for i, f in enumerate(failures, 1):
            print(f"\n  [{i}] {f}")
        print(f"\n{'=' * 60}")
        print(f"TOTAL FAILURES: {len(failures)}")
        print("Story CANNOT proceed to completion.")
        print("=" * 60)
        sys.exit(1)
    else:
        print("✅ All 5 evidence gates PASSED")
        if checker_data:
            print(f"   SCS: {checker_data.get('scs_overall', 0):.1f}%")
            print(f"   Tokens: {checker_data.get('tokens_found', 0)}/{checker_data.get('tokens_extracted', 0)} found")
        if linter_data:
            print(f"   Mock findings: {linter_data.get('mock_count', 0)} (all approved: {linter_data.get('all_mocks_approved', True)})")
        sys.exit(0)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('story_dir')
    parser.add_argument('story_id')
    parser.add_argument('--ui-spec', default=None)
    parser.add_argument('--data-spec', default=None)
    parser.add_argument('--story', default=None)
    parser.add_argument('--scs-threshold', type=float, default=85.0)
    verify(parser.parse_args())
