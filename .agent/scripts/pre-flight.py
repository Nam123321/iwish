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
Pre-Flight Scanner — Scoped to Category C (Dependency) and Category E (Auth)

USAGE:
  python3 .agent/scripts/pre-flight.py <story_file> [--files <modified_files>]

This script runs before implementation to detect unfinished dependencies
and potential auth/tenant fallback mock issues in API routes.
"""

import argparse
import os
import re
import sys
import yaml

def normalize_id(id_str):
    normalized = id_str.strip().lower().replace('.', '-')
    if normalized.startswith("story-"):
        normalized = normalized[6:]
    return normalized

def check_dependency_status(dependencies, project_root) -> list:
    sprint_status_file = os.path.join(project_root, "_iwish-output", "3. Development", "sprint-status.yaml")
    if not os.path.exists(sprint_status_file):
        sprint_status_file = os.path.join(project_root, "_iwish-output", "stories", "sprint-status.yaml")
        if not os.path.exists(sprint_status_file):
            return []

    try:
        with open(sprint_status_file, "r", encoding="utf-8") as f:
            status_data = yaml.safe_load(f)

        story_statuses = {}
        if status_data:
            for key, val in status_data.items():
                if key.lower().startswith("story"):
                    sid = normalize_id(key.split(" - ")[0])
                    story_statuses[sid] = val

        risks = []
        for dep in dependencies:
            dep_norm = normalize_id(str(dep))
            status = None
            for key, val in story_statuses.items():
                if key == dep_norm or key.startswith(dep_norm + "-"):
                    status = val
                    break
            
            if status is None:
                risks.append(f"[C] Dependency '{dep}' was not found in sprint-status.yaml.")
            elif status not in ("completed", "completed-with-mock"):
                risks.append(f"[C] Dependency '{dep}' is not completed (current status: '{status}').")
        return risks
    except Exception as e:
        return [f"[C] Error loading dependencies status: {e}"]

def check_auth_infrastructure(files) -> list:
    risks = []
    for filepath in files:
        if not os.path.exists(filepath):
            continue
        # Scan API and route files
        if ('/api/' in filepath or filepath.startswith('server/')) and filepath.endswith(('.ts', '.tsx', '.js', '.jsx')):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if 'tenant-context' in content or 'mock-tenant' in content or 'mock-user' in content:
                # Check if it has the bypass annotation
                if '[MOCK_APPROVED]' not in content:
                    risks.append(f"[E] Auth risk in '{filepath}': contains 'tenant-context' or 'mock-tenant' fallback without [MOCK_APPROVED].")
    return risks

def check_connector_implementation(story_file, files) -> list:
    try:
        with open(story_file, 'r', encoding='utf-8') as f:
            content = f.read()
        yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        tags = []
        if yaml_match:
            frontmatter = yaml.safe_load(yaml_match.group(1))
            tags = [t.lower() for t in frontmatter.get('tags', [])]
    except Exception:
        return []

    connector_keywords = {'connector', 'mcp', 'figma', 'canva', 'notion', 'trello', 'github', 'n8n', 'api', 'oauth', 'authentic', '3rd', 'provider'}
    active_connectors = connector_keywords.intersection(set(tags))
    if not active_connectors:
        return []

    # If no files have been modified yet, don't fail pre-flight (let coding begin)
    if not files:
        return []

    # Define platform-specific verification patterns
    platform_patterns = {
        'figma': [r'api\.figma\.com', r'figma-api', r'figma\.com/api'],
        'canva': [r'api\.canva\.com', r'canva\.com/api', r'canva\.com/oauth'],
        'notion': [r'api\.notion\.com', r'@notionhq/client', r'notion\.so/v1'],
        'trello': [r'api\.trello\.com', r'trello\.com/1', r'trello-api'],
        'github': [r'api\.github\.com', r'@octokit/rest', r'github\.com/login/oauth'],
        'n8n': [r'n8n\.io', r'/api/v1/'],
        'api': [r'https?://', r'fetch\(', r'axios\.', r'https?\.request'],
        'oauth': [r'oauth', r'client_id', r'client_secret', r'redirect_uri'],
        'authentic': [r'auth', r'bearer', r'token', r'key', r'sign'],
        '3rd': [r'api', r'client', r'sdk', r'fetch'],
        'provider': [r'provider', r'endpoint', r'api']
    }

    # Gather all file contents
    file_contents = ""
    for filepath in files:
        if not os.path.exists(filepath):
            continue
        if filepath.endswith(('.ts', '.tsx', '.js', '.jsx', '.css')):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                file_contents += "\n" + f.read()

    risks = []
    for conn in active_connectors:
        # If the platform has specific verification patterns, check for them
        if conn in platform_patterns:
            patterns = platform_patterns[conn]
            has_real_pattern = False
            for pat in patterns:
                if re.search(pat, file_contents, re.IGNORECASE):
                    has_real_pattern = True
                    break
            if not has_real_pattern:
                risks.append(
                    f"[A] Mock Integration Detected: Story is tagged with platform '{conn}', "
                    f"but modified files lack real connection patterns matching {patterns}. "
                    "You must implement actual API endpoints/SDKs rather than using mock validation stubs."
                )
    return risks

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('story', help='Path to story markdown file')
    parser.add_argument('--files', help='Comma-separated list of modified files', default='')
    args = parser.parse_args()

    if not os.path.exists(args.story):
        print(f"Error: Story file not found: {args.story}", file=sys.stderr)
        sys.exit(2)

    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(args.story))))

    # Read frontmatter for dependencies
    try:
        with open(args.story, 'r', encoding='utf-8') as f:
            content = f.read()
        yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        dependencies = []
        if yaml_match:
            frontmatter = yaml.safe_load(yaml_match.group(1))
            dependencies = frontmatter.get('dependencies', [])
    except Exception as e:
        print(f"Warning: Failed to parse story frontmatter dependencies: {e}", file=sys.stderr)
        dependencies = []

    # Get modified files list
    modified_files = [f.strip() for f in args.files.split(',') if f.strip()]

    dep_risks = check_dependency_status(dependencies, project_root)
    auth_risks = check_auth_infrastructure(modified_files)
    connector_risks = check_connector_implementation(args.story, modified_files)

    all_risks = dep_risks + auth_risks + connector_risks

    if all_risks:
        print("\n" + "="*60)
        print("⚠️  PRE-FLIGHT WARNINGS DETECTED:")
        print("="*60)
        for r in all_risks:
            print(f"  {r}")
        print("="*60)
        print("Action Recommended: Resolve the risks above or request user consent before proceeding.\n")
        # Pre-flight is advisory warning, so exit with 0 to allow execution but display log.
        sys.exit(0)
    else:
        print("✅ Pre-flight checks passed. No dependency or auth risks detected.")
        sys.exit(0)

if __name__ == '__main__':
    main()
