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
    import sys
    print("❌ [Zero-Trust] CRITICAL: watchmen_core.py is missing or hijacked!")
    sys.exit(1)
# ---------------------------------
from watchmen_client import call_daemon, sign_evidence, verify_evidence

import argparse
import os
import sys
import subprocess
import re
import json
import hashlib
import urllib.parse
from typing import List, Dict, Set, Tuple

EXCLUDED_DIRS = {
    'node_modules', 'dist', 'out', 'output', 'coverage', 'build',
    '_iwish-output', '_iwish', '_iwish-internal-epics', '_bmad-output',
    '.git', '.github', '.gemini', '.agent', '.agents',
    'playwright-report', 'test-results', '.husky', '.vscode',
    'tmp', 'tmp_test', 'scratch', 'qa-evidence', 'uploads',
    'Ebook', 'docs', 'k8s', 'monitoring', 'infra', 'infrastructure',
    'public', 'proto', 'Epic-66', 'FIX-41-05', 'Story-44.4', 'taste-skill', 'dummy_plugin'
}
CODE_EXTENSIONS = ('.ts', '.tsx', '.js', '.jsx', '.py', '.css', '.go', '.java', '.prisma')

def get_project_root(start_dir: str) -> str:
    curr_dir = os.path.abspath(start_dir)
    while curr_dir != '/' and curr_dir != '':
        if os.path.exists(os.path.join(curr_dir, 'package.json')):
            return curr_dir
        curr_dir = os.path.dirname(curr_dir)
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(start_dir))))




def get_code_files(project_root: str) -> List[str]:
    files = []
    for root, dirs, filenames in os.walk(project_root):
        # modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        for file in filenames:
            if file.endswith(CODE_EXTENSIONS):
                files.append(os.path.join(root, file))
    return files

def parse_files_for_story(files_to_scan: List[str], story_id: str) -> Tuple[Dict[str, Set[str]], Dict[str, Set[str]]]:
    """Returns impl_map, test_map -> { 'AC-1': set(file_paths) }"""
    impl_map = {}
    test_map = {}
    
    story_id_lower = story_id.lower()
    tag_pattern = re.compile(rf'//\s*@story[- ]?{re.escape(story_id)}\b', re.IGNORECASE)
    ac_pattern = re.compile(r'@(?:implements|cover)[\s:]*([AE]C-[a-zA-Z0-9-\.]+|[AE]C-?\d+)', re.IGNORECASE)
    
    for file_path in files_to_scan:
        if not os.path.exists(file_path):
            continue
            
        # Ignore output artifacts, state files, and non-source extensions
        if '_iwish-output' in file_path or '.agent' in file_path:
            continue
        if file_path.endswith(('.json', '.sig', '.bak', '.log', '.html')):
            continue

        filename = os.path.basename(file_path)
        is_test = '.spec.' in filename or '.test.' in filename or filename.startswith('test_')
        
        # Check filename match or tag match
        matches_story = False
        if re.search(rf"(^|[^0-9])story-{re.escape(story_id_lower)}([^0-9]|$)", filename.lower()) or re.search(rf"(^|[^0-9]){re.escape(story_id_lower)}([^0-9]|$)", filename.lower()):
            matches_story = True
            
        ac_targets = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if tag_pattern.search(content):
                    matches_story = True
                ac_targets = re.findall(ac_pattern, content)
        except Exception:
            continue
            
        if matches_story:
            targets = [ac.upper().replace('-', '') for ac in ac_targets] if ac_targets else ['AC_ALL']
            target_map = test_map if is_test else impl_map
            for ac in targets:
                if ac not in target_map:
                    target_map[ac] = set()
                target_map[ac].add(file_path)
                
    return impl_map, test_map

def format_links(file_paths: Set[str], project_root: str, label_prefix: str) -> str:
    links = []
    for fpath in sorted(file_paths):
        rel_path = os.path.relpath(fpath, project_root)
        encoded_path = urllib.parse.quote(fpath)
        basename = os.path.basename(fpath)
        links.append(f"[{label_prefix}] Path: [{basename}](file://{encoded_path})")
    return "<br>".join(links)

def update_ac_matrix(story_path: str, impl_map: Dict[str, Set[str]], test_map: Dict[str, Set[str]], project_root: str) -> bool:
    with open(story_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    matrix_match = re.search(r'(##\s*(?:Traceability Matrix|Traceability|AC-to-Task).*?\n)(.*?)(?=^## |\Z)', content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if not matrix_match:
        print(f"Warning: AC-to-Task Traceability Matrix section not found in {story_path}")
        return False
        
    pre_matrix = content[:matrix_match.start(2)]
    matrix_section = matrix_match.group(2)
    post_matrix = content[matrix_match.end(2):]
    
    lines = matrix_section.strip().split('\n')
    if len(lines) < 3:
        return False
        
    header_cols = [c.strip().lower() for c in lines[0].split('|')]
    if len(header_cols) > 2:
        header_cols = header_cols[1:-1]
        
    CANONICAL_HEADERS = [
        "ac id", "description", "mapped implementation tasks",
        "missing implementation?", "test file path",
        "missing test?", "status", "mapped tasks"
    ]
    
    def find_col_exact(headers, target):
        for i, h in enumerate(headers):
            if h == target:
                return i
        return -1
        
    id_idx = find_col_exact(header_cols, "ac id")
    if id_idx == -1:
        id_idx = find_col_exact(header_cols, "ac")
        
    impl_idx = find_col_exact(header_cols, "mapped implementation tasks")
    test_idx = find_col_exact(header_cols, "test file path")
    missing_impl_idx = find_col_exact(header_cols, "missing implementation?")
    missing_test_idx = find_col_exact(header_cols, "missing test?")
    status_idx = find_col_exact(header_cols, "status")
    
    if impl_idx == -1 or test_idx == -1:
        print(f"⚠️  SCHEMA MISMATCH: Table headers do not match 8-column canonical format.")
        print(f"   Expected: {CANONICAL_HEADERS}")
        print(f"   Action: Run `ac-to-task-mapper.py --story {story_path}` to rebuild table first.")
        return False
    
    updated_lines = lines[:2]
    data_rows = lines[2:]
    
    changed = False
    
    for row in data_rows:
        if '|' not in row or re.match(r'^[-|\s]+$', row):
            updated_lines.append(row)
            continue
            
        cols = [c.strip() for c in row.split('|')]
        if len(cols) > 2:
            cols = cols[1:-1]
            
        while len(cols) < len(header_cols):
            cols.append("")
            
        ac_id = cols[id_idx].replace('**', '').replace('`', '').strip().upper() if id_idx < len(cols) else ""
        ac_id_normalized = ac_id.replace('-', '')
        
        # Merge AC_ALL files with this specific AC
        ac_impls = set(impl_map.get(ac_id_normalized, [])) | set(impl_map.get('AC_ALL', []))
        ac_tests = set(test_map.get(ac_id_normalized, [])) | set(test_map.get('AC_ALL', []))
        
        # Existing links
        raw_impl = cols[impl_idx] if impl_idx < len(cols) else ""
        raw_test = cols[test_idx] if test_idx < len(cols) else ""
        
        def scrub_invalid_links(val: str) -> str:
            if not val or val.strip().upper() == 'TBD':
                return val
            
            # 1. Pre-filter explicit garbage using regex
            garbage_list = ['MISSING_EVIDENCE', 'Tx Missing_evidence', 'No', 'Test patch', 'mod_74_5', 'MISSING_']
            for g in garbage_list:
                val = re.sub(rf'(?i)\b{re.escape(g)}\b', '', val)
                
            links = re.split(r'(?i)<br\s*/?>', val)
            valid_links = []
            
            excluded_dirs = [
                '_iwish-output', '_iwish', '_state', '_bmad-output', 
                '.agent', '.agents', 'playwright-report', 'test-results', 
                'dist', 'out', 'output', 'node_modules', 'scratch', 'tmp',
                '.git', '.github', '.gemini', '.vscode', '.husky', 'qa-evidence',
                '01. epics & stories', '02. design', '03. data', '04. tech'
            ]
            excluded_exts = ('.log', '.bak', '.sig', '.md', '.html', '.json')
            
            for link in links:
                link = link.strip()
                if not link:
                    continue
                    
                match = re.search(r'\]\(file://([^)]+)\)', link)
                if match:
                    filepath = urllib.parse.unquote(match.group(1))
                    if any(f"/{d}/" in filepath for d in excluded_dirs) or any(filepath.startswith(f"{d}/") for d in excluded_dirs):
                        continue
                    if filepath.endswith(excluded_exts):
                        continue
                    if not os.path.exists(filepath):
                        continue
                    valid_links.append(link)
                else:
                    # It's plain text. Check if it's floating file name garbage
                    if re.search(r'(?i)\.(ts|js|tsx|jsx|spec\.ts|test\.ts)$', link):
                        continue
                    # Check if it matches exactly any garbage string (sometimes \b doesn't catch everything due to underscores)
                    if any(link.lower() == g.lower() for g in garbage_list):
                        continue
                        
                    valid_links.append(link)
            return "<br>".join(valid_links) if valid_links else "TBD"

        current_impl = scrub_invalid_links(raw_impl)
        current_test = scrub_invalid_links(raw_test)

        def resolve_cell(existing_val: str, new_files: Set[str], prefix: str) -> str:
            # Extract existing base names to check for conflicts
            existing_basenames = re.findall(r'\[([^\]]+)\]\(file://', existing_val)
            
            # If no new files, return existing (or TBD)
            if not new_files:
                return existing_val
                
            links_to_add = []
            for fpath in new_files:
                basename = os.path.basename(fpath)
                encoded = urllib.parse.quote(fpath)
                link_str = f"[{prefix}] Path: [{basename}](file://{encoded})"
                
                if link_str in existing_val:
                    continue # Already perfectly present
                    
                # Conflict Hard Gate check
                if basename in existing_basenames and link_str not in existing_val:
                    return f"[CONFLICT] {existing_val} vs {link_str}"
                    
                links_to_add.append(link_str)
                
            if not links_to_add:
                return existing_val
                
            # If existing was TBD or empty, replace it. Otherwise append.
            if 'TBD' in existing_val.upper() or not existing_val.strip():
                return "<br>".join(links_to_add)
            else:
                return existing_val + "<br>" + "<br>".join(links_to_add)
        
        new_impl = resolve_cell(current_impl, ac_impls, "Code")
        new_test = resolve_cell(current_test, ac_tests, "Test")
        
        if new_impl != raw_impl or new_test != raw_test:
            changed = True
            
        if impl_idx < len(cols):
            cols[impl_idx] = new_impl
        if test_idx < len(cols):
            cols[test_idx] = new_test
            
        # Update missing flags & status
        # ONLY set to "No" (has impl/test) if there is an actual file link present, not just plain text
        has_impl = new_impl and 'TBD' not in new_impl.upper() and '[CONFLICT]' not in new_impl and '](file://' in new_impl
        has_test = new_test and 'TBD' not in new_test.upper() and '[CONFLICT]' not in new_test and '](file://' in new_test
        
        if missing_impl_idx < len(cols):
            cols[missing_impl_idx] = "No" if has_impl else "Yes"
        if missing_test_idx < len(cols):
            cols[missing_test_idx] = "No" if has_test else "Yes"
            
        if status_idx < len(cols):
            if has_impl and has_test:
                cols[status_idx] = "Completed"
            else:
                cols[status_idx] = "In Progress"
                
        updated_lines.append("| " + " | ".join(cols) + " |")
        
    if not changed:
        return False
        
    updated_matrix = "\n".join(updated_lines) + "\n\n"
    new_content = pre_matrix + updated_matrix + post_matrix
    
    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    return True



def sync_matrix_to_markdown(story_path, acs):
    try:
        with open(story_path, 'r') as f:
            lines = f.readlines()
            
        start_idx = -1
        end_idx = -1
        for i, line in enumerate(lines):
            if "<!-- BEGIN TRACEABILITY MATRIX -->" in line:
                start_idx = i
            elif "<!-- END TRACEABILITY MATRIX -->" in line:
                end_idx = i
                
        matrix_lines = [
            "<!-- BEGIN TRACEABILITY MATRIX -->\n",
            "| AC ID | AC Description | Impl Code | Test Code | Status |\n",
            "|-------|----------------|-----------|-----------|--------|\n"
        ]
        
        for ac in acs:
            impls = "<br>".join([f"[{os.path.basename(f)}](file://{f})" for f in ac.get('impl_files', [])]) or "TBD"
            tests = "<br>".join([f"[{os.path.basename(f)}](file://{f})" for f in ac.get('test_files', [])]) or "TBD"
            status = ac.get('status', 'Pending')
            desc = ac.get('ac_text', '')[:50].replace('\n', ' ')
            matrix_lines.append(f"| {ac['ac_id']} | {desc}... | {impls} | {tests} | {status} |\n")
            
        matrix_lines.append("<!-- END TRACEABILITY MATRIX -->\n")
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            new_lines = lines[:start_idx] + matrix_lines + lines[end_idx+1:]
        else:
            new_lines = lines + ["\n## Traceability Matrix\n"] + matrix_lines
            
        with open(story_path, 'w') as f:
            f.writelines(new_lines)
        print(f"✅ Matrix synced to {story_path}")
    except Exception as e:
        print(f"⚠️ Failed to sync matrix to markdown: {e}")


RESERVED_HEADERS = {'AC_ID', 'ACID', 'AC-ID', 'AC', 'AC_ALL', 'ACALL'}

def normalize_ac_id(raw_ac: str) -> str:
    cleaned = re.sub(r'[\*`_\[\]]', '', raw_ac).strip().upper()
    return cleaned.replace('-', '').replace('_', '')

def extract_master_ac_list(story_path: str) -> list:
    if not os.path.exists(story_path):
        raise FileNotFoundError(f"CRITICAL: Story file not found: {story_path}")
        
    with open(story_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    extracted_acs = []
    seen = set()

    def add_ac(raw: str):
        norm = normalize_ac_id(raw)
        if norm and norm not in RESERVED_HEADERS and norm not in seen:
            seen.add(norm)
            extracted_acs.append(norm)

    table_matches = re.findall(
        r'^\s*\|\s*([`\*\[\]]*(?:AC|EC|SEC|PERF)[-_0-9a-zA-Z\.]+[`\*\[\]]*)\s*\|', 
        content, 
        re.MULTILINE | re.IGNORECASE
    )
    for match in table_matches:
        add_ac(match)

    if not extracted_acs:
        ac_section = re.search(
            r'##\s*Acceptance Criteria(.*?)(?=^## |\Z)', 
            content, 
            re.DOTALL | re.IGNORECASE | re.MULTILINE
        )
        if ac_section:
            bullet_matches = re.findall(
                r'(?:^|\s|[-*#])\s*[`\*\[\]]*((?:AC|EC|SEC|PERF)[-_0-9a-zA-Z\.]+)[`\*\[\]]*',
                ac_section.group(1),
                re.IGNORECASE
            )
            for match in bullet_matches:
                add_ac(match)

    if not extracted_acs:
        print(f"⚠️ CRITICAL: Zero Acceptance Criteria found in {story_path}!")
    return extracted_acs


def main():
    parser = argparse.ArgumentParser(description='Auto-Traceability Linker')
    parser.add_argument('--story', required=True, help='Path to story markdown file')
    args = parser.parse_args()
    
    story_path = os.path.abspath(args.story)
    if not os.path.exists(story_path):
        print(f"Error: File not found {story_path}")
        exit(1)
        
    basename = os.path.basename(story_path)
    story_dir = os.path.basename(os.path.dirname(story_path))
    
    story_id = ""
    match = re.search(r'story-([a-zA-Z0-9\.]+)', basename, re.IGNORECASE)
    if match:
        story_id = match.group(1)
    else:
        match = re.search(r'story-([a-zA-Z0-9\.]+)', story_dir, re.IGNORECASE)
        if match:
            story_id = match.group(1)
            
    if not story_id:
        print(f"Could not extract story ID from path: {story_path}")
        exit(1)
        
    print(f"Extracted Story ID: {story_id}")
    project_root = get_project_root(os.path.dirname(story_path))
    print(f"Project root: {project_root}")
    
    files_to_scan = get_code_files(project_root)
    if not files_to_scan:
        print("Tier 1 (Git) failed or empty. Falling back to Tier 2 (Globbing).")
        files_to_scan = get_code_files(project_root)
        
    print(f"Scanning {len(files_to_scan)} files...")
    impl_map, test_map = parse_files_for_story(files_to_scan, story_id)
    
    total_impl = sum(len(v) for v in impl_map.values())
    total_test = sum(len(v) for v in test_map.values())
    print(f"Found {total_impl} implementation mappings and {total_test} test mappings.")
    
    if impl_map or test_map:
        updated = update_ac_matrix(story_path, impl_map, test_map, project_root)
        if updated:
            print("Successfully updated AC-to-Task Traceability Matrix.")
        else:
            print("No updates made (possibly already present or blocked by conflicts).")
            
    # Always Generate traceability.json (even on cold start)
    master_ac_list = extract_master_ac_list(story_path)
    
    code_acs = (set(impl_map.keys()) | set(test_map.keys())) - {'AC_ALL', 'ACALL'}
    orphans = code_acs - set(master_ac_list)
    if orphans:
        print(f"⚠️ WARNING: Found orphaned AC annotations in code not listed in story.md: {sorted(orphans)}")
        
    all_target_acs = master_ac_list
    
    ac_all_impl = impl_map.get('AC_ALL', set()) | impl_map.get('ACALL', set())
    ac_all_test = test_map.get('AC_ALL', set()) | test_map.get('ACALL', set())
    
    matrix_data = []
    all_mapped_files = set()
    
    for ac_id in all_target_acs:
        norm_id = normalize_ac_id(ac_id)
        raw_impls = set(impl_map.get(norm_id, set())) | ac_all_impl
        raw_tests = set(test_map.get(norm_id, set())) | ac_all_test
        
        impl_files = sorted([os.path.relpath(f, project_root) for f in raw_impls])
        test_files = sorted([os.path.relpath(f, project_root) for f in raw_tests])
        all_mapped_files.update(raw_impls)
        all_mapped_files.update(raw_tests)
        
        if impl_files and test_files:
            status = "Completed"
        elif impl_files or test_files:
            status = "In Progress"
        else:
            status = "Missing"
            
        matrix_data.append({
            "ac_id": ac_id,
            "status": status,
            "implementations": impl_files,
            "tests": test_files
        })
        
    if ac_all_impl or ac_all_test:
        all_mapped_files.update(ac_all_impl | ac_all_test)
        matrix_data.append({
            "ac_id": "AC_ALL",
            "status": "Completed",
            "implementations": sorted([os.path.relpath(f, project_root) for f in ac_all_impl]),
            "tests": sorted([os.path.relpath(f, project_root) for f in ac_all_test])
        })
            
    # Exclude transient evidence files from Merkle root to avoid race conditions!
    import hashlib
    stable_files = []
    for f in all_mapped_files:
        if not f.endswith('.json') and not f.endswith('.sig'):
            stable_files.append(f)
            
    # Calculate merkle root manually for stable mapped files
    stable_files.sort()
    file_hashes = []
    for f in stable_files:
        full_path = os.path.join(project_root, f)
        if os.path.exists(full_path):
            with open(full_path, 'rb') as fp:
                file_hashes.append(hashlib.sha256(fp.read()).hexdigest())
    
    if not file_hashes:
        current_hash = "EMPTY_MATRIX"
    else:
        combined = "".join(file_hashes)
        current_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()
    
    traceability_data = {
        "story_id": story_id,
        "commit_hash": current_hash,
        "traceability_matrix": matrix_data
    }
    
    target_dir = os.path.dirname(story_path)
    json_path = os.path.join(target_dir, "traceability.json")
    sig_path = os.path.join(target_dir, "traceability.json.sig")
    
    # Sign it using Daemon
    import hashlib

    payload_str = json.dumps(traceability_data, sort_keys=True)
    digest = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
    
    nonce_res = call_daemon("request_nonce", {})
    if "error" not in nonce_res:
        nonce = nonce_res["nonce"]
        traceability_data["nonce"] = nonce
        
        # Recompute digest with nonce included
        payload_str = json.dumps(traceability_data, sort_keys=True)
        digest = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
        
        sign_res = call_daemon("sign_payload", {"nonce": nonce, "digest": digest})
        if "error" not in sign_res:
            with open(sig_path, 'w', encoding='utf-8') as f:
                f.write(sign_res["signature"])
            print(f"✅ Generated and signed traceability.json at {json_path}")
        else:
            print(f"❌ Failed to sign traceability.json: {sign_res['error']}")
    else:
        print(f"❌ Failed to get nonce: {nonce_res['error']}")
        
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(traceability_data, f, indent=2)
        

    
if __name__ == '__main__':
    main()
