#!/usr/bin/env python3
"""
Hermes Curator Recommendation Generator and Promotion Script.
Handles generating Hermes-compliant recommendation contracts, draft copies,
and promoting/rejecting evolved skills including knowledge graph updating and Git branch cleanup.
"""

import os
import sys
import shutil
import yaml
import argparse
import uuid
import subprocess
import datetime

def get_workspace_root():
    # This script is at: <root>/.agent/skills/iwish-evolver/scripts/recommendation-generator.py
    # 4 levels up
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def run_git(args, cwd=None):
    if cwd is None:
        cwd = get_workspace_root()
    try:
        res = subprocess.run(['git'] + args, cwd=cwd, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Git command failed: git {' '.join(args)}\nError: {e.stderr}", file=sys.stderr)
        raise e

def parse_frontmatter(file_path):
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                return yaml.safe_load(parts[1]) or {}
    except Exception as e:
        print(f"Error parsing frontmatter from {file_path}: {e}", file=sys.stderr)
    return {}

def read_skill_md_body(file_path):
    if not os.path.exists(file_path):
        return ""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                return parts[2]
        return content
    except Exception as e:
        print(f"Error reading body from {file_path}: {e}", file=sys.stderr)
        return ""

def write_frontmatter(file_path, frontmatter, body_content):
    try:
        frontmatter_text = yaml.safe_dump(frontmatter, default_flow_style=False, sort_keys=False)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"---\n{frontmatter_text}---\n{body_content}")
    except Exception as e:
        print(f"Error writing frontmatter to {file_path}: {e}", file=sys.stderr)

def update_knowledge_graph(skill_name, skill_dir, kg_path):
    if not os.path.exists(kg_path):
        print(f"Warning: Knowledge graph not found at {kg_path}. Cannot update.")
        return
    
    # Read SKILL.md to get details
    skill_md_path = os.path.join(skill_dir, "SKILL.md")
    frontmatter = parse_frontmatter(skill_md_path)
    
    description = frontmatter.get('description', f"Evolved {skill_name} skill.")
    tags = frontmatter.get('tags', [skill_name])
    depends_on = frontmatter.get('depends_on', [])
    
    with open(kg_path, 'r', encoding='utf-8') as f:
        kg_data = yaml.safe_load(f) or {}
    
    nodes = kg_data.get('nodes', [])
    node_id = f"skill-{skill_name}"
    
    # Check if node already exists
    existing_node = None
    for node in nodes:
        if node.get('id') == node_id:
            existing_node = node
            break
            
    relative_path = f"/.agent/skills/{skill_name}/SKILL.md"
    
    if existing_node:
        existing_node['description'] = description
        existing_node['tags'] = tags
        existing_node['depends_on'] = depends_on
        existing_node['path'] = relative_path
    else:
        new_node = {
            'id': node_id,
            'type': 'skill',
            'path': relative_path,
            'description': description,
            'tags': tags,
            'depends_on': depends_on
        }
        nodes.append(new_node)
        
    kg_data['nodes'] = nodes
    
    with open(kg_path, 'w', encoding='utf-8') as f:
        yaml.safe_dump(kg_data, f, default_flow_style=False, sort_keys=False)
    print(f"Updated knowledge-graph.yaml for node {node_id}")

def get_orig_branch_from_state(skill_name):
    state_file = os.path.join(get_workspace_root(), ".git", f"iwish-sandbox-{skill_name}")
    if os.path.exists(state_file):
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith("ORIG_BRANCH="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
        except Exception as e:
            print(f"Error reading state file {state_file}: {e}")
    return "main"

def clean_state_file(skill_name):
    state_file = os.path.join(get_workspace_root(), ".git", f"iwish-sandbox-{skill_name}")
    if os.path.exists(state_file):
        try:
            os.remove(state_file)
            print(f"Cleaned up state file {state_file}")
        except Exception as e:
            print(f"Warning: Could not remove state file {state_file}: {e}")

def do_generate(args):
    name = args.name
    disposition = args.disposition
    sandbox_branch = args.sandbox_branch or f"evolve/{name}-sandbox"
    confidence = args.confidence
    risk_level = args.risk_level
    
    root = get_workspace_root()
    sandbox_dir = args.source_dir or os.path.join(root, ".agent", "skills", name)
    draft_dir = os.path.join(root, "_iwish-output", "generated-skills", name)
    rec_file = os.path.join(root, "_iwish-output", "iwish-skills", f"recommendation-{name}.yaml")
    
    if not os.path.exists(sandbox_dir):
        print(f"Error: Evolved skill source directory not found at {sandbox_dir}", file=sys.stderr)
        sys.exit(1)
        
    # Copy source directory to draft directory
    if os.path.exists(draft_dir):
        shutil.rmtree(draft_dir)
        
    # Make sure parent directory exists
    os.makedirs(os.path.dirname(draft_dir), exist_ok=True)
    
    shutil.copytree(sandbox_dir, draft_dir, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '.git'))
    print(f"Copied skill files to draft folder: {draft_dir}")
    
    # Generate metadata.yaml in the draft directory
    metadata_path = os.path.join(draft_dir, "metadata.yaml")
    metadata = {
        "status": "draft",
        "origin": "iwish-evolver",
        "promotion_target": f".agent/skills/{name}/",
        "path_policy": "runtime",
        "provenance_refs": ["iwish-evolver"],
        "validation_checklist": ["Validated in sandbox"],
        "promotion_plan": f"Copy files to .agent/skills/{name}/ and update knowledge-graph.yaml",
        "rollback_note": "Restore using git checkout"
    }
    with open(metadata_path, 'w', encoding='utf-8') as f:
        yaml.safe_dump(metadata, f, default_flow_style=False, sort_keys=False)
    print(f"Generated draft metadata.yaml at {metadata_path}")
    
    # Generate Hermes Curator Recommendation contract
    os.makedirs(os.path.dirname(rec_file), exist_ok=True)
    rec_id = f"rec-{uuid.uuid4()}"
    rec_contract = {
        "recommendation_id": rec_id,
        "target_path": f"_iwish-output/generated-skills/{name}/",
        "promotion_target": f".agent/skills/{name}/",
        "target_type": "skill",
        "disposition": disposition,
        "evidence_signals": ["other"],
        "confidence": confidence,
        "risk_level": risk_level,
        "approval_required": True,
        "proposed_action": f"Promote evolved {name} skill",
        "related_assets": [f".agent/skills/{name}/"],
        "recoverability_plan": "Restore using git checkout or reject CLI command.",
        "provenance_refs": ["iwish-evolver"],
        "blocked_reason": "none",
        "sandbox_branch": sandbox_branch
    }
    with open(rec_file, 'w', encoding='utf-8') as f:
        yaml.safe_dump(rec_contract, f, default_flow_style=False, sort_keys=False)
    print(f"Generated Hermes curator recommendation contract at {rec_file}")

def do_promote(args):
    name = args.name
    root = get_workspace_root()
    rec_file = os.path.join(root, "_iwish-output", "iwish-skills", f"recommendation-{name}.yaml")
    
    if not os.path.exists(rec_file):
        print(f"Error: Recommendation file not found at {rec_file}", file=sys.stderr)
        sys.exit(1)
        
    with open(rec_file, 'r', encoding='utf-8') as f:
        rec = yaml.safe_load(f)
        
    target_path_rel = rec.get("target_path")
    promotion_target_rel = rec.get("promotion_target")
    sandbox_branch = rec.get("sandbox_branch")
    
    target_path = os.path.join(root, target_path_rel)
    promotion_target = os.path.join(root, promotion_target_rel)
    
    if not os.path.exists(target_path):
        print(f"Error: Draft folder not found at {target_path}", file=sys.stderr)
        sys.exit(1)
        
    # Get current branch and checkout original branch if we are on the sandbox branch
    orig_branch = get_orig_branch_from_state(name)
    current_branch = run_git(['rev-parse', '--abbrev-ref', 'HEAD'])
    
    # Fetch branch commit SHA of sandbox_branch
    try:
        commit_sha = run_git(['rev-parse', sandbox_branch])
    except Exception:
        commit_sha = "unknown_sha"
        
    # Read skill's previous ID if it exists
    parent_uuid = "none"
    skill_id_path = os.path.join(target_path, ".skill_id")
    if os.path.exists(skill_id_path):
        try:
            with open(skill_id_path, 'r', encoding='utf-8') as f:
                parent_uuid = f.read().strip()
        except Exception:
            pass
            
    if current_branch == sandbox_branch:
        print(f"Switching from sandbox branch '{sandbox_branch}' to original branch '{orig_branch}'")
        run_git(['checkout', orig_branch])
        
    # Copy files from draft to canonical promotion target
    os.makedirs(promotion_target, exist_ok=True)
    for item in os.listdir(target_path):
        if item == 'metadata.yaml':
            continue
        s = os.path.join(target_path, item)
        d = os.path.join(promotion_target, item)
        if os.path.isdir(s):
            if os.path.exists(d):
                shutil.rmtree(d)
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
    print(f"Promoted files to: {promotion_target}")
    
    # Update frontmatter of SKILL.md under promotion_target
    skill_md_path = os.path.join(promotion_target, "SKILL.md")
    if os.path.exists(skill_md_path):
        frontmatter = parse_frontmatter(skill_md_path)
        body_content = read_skill_md_body(skill_md_path)
        
        frontmatter['parent_uuid'] = parent_uuid
        frontmatter['commit_sha'] = commit_sha
        
        write_frontmatter(skill_md_path, frontmatter, body_content)
        print(f"Appended lineage tags (parent_uuid: {parent_uuid}, commit_sha: {commit_sha}) to frontmatter")
        
    # Update main knowledge-graph.yaml
    kg_path = os.path.join(root, ".agent", "knowledge-graph.yaml")
    update_knowledge_graph(name, promotion_target, kg_path)
    
    # Cleanup temporary sandbox git branches
    try:
        run_git(['branch', '-D', sandbox_branch])
        print(f"Deleted temporary sandbox branch '{sandbox_branch}'")
    except Exception as e:
        print(f"Warning: Could not delete sandbox branch '{sandbox_branch}': {e}")
        
    clean_state_file(name)
    
    # Delete recommendation contract and draft folder
    if os.path.exists(rec_file):
        os.remove(rec_file)
    if os.path.exists(target_path):
        shutil.rmtree(target_path)
    print("Promotion completed successfully.")

def do_reject(args):
    name = args.name
    root = get_workspace_root()
    rec_file = os.path.join(root, "_iwish-output", "iwish-skills", f"recommendation-{name}.yaml")
    
    sandbox_branch = f"evolve/{name}-sandbox"
    if os.path.exists(rec_file):
        with open(rec_file, 'r', encoding='utf-8') as f:
            rec = yaml.safe_load(f)
        sandbox_branch = rec.get("sandbox_branch", sandbox_branch)
        
    # Switch back to original branch and drop sandbox branch
    orig_branch = get_orig_branch_from_state(name)
    current_branch = run_git(['rev-parse', '--abbrev-ref', 'HEAD'])
    if current_branch == sandbox_branch:
        print(f"Switching from sandbox branch '{sandbox_branch}' to original branch '{orig_branch}'")
        run_git(['checkout', orig_branch])
        
    # Delete sandbox branch
    try:
        run_git(['branch', '-D', sandbox_branch])
        print(f"Dropped sandbox changes on branch '{sandbox_branch}'")
    except Exception as e:
        print(f"Warning: Could not delete sandbox branch '{sandbox_branch}': {e}")
        
    clean_state_file(name)
    
    # Archive the draft recovery plan safely under _iwish-output/scratch/
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    archive_dir = os.path.join(root, "_iwish-output", "scratch", f"rejected-{name}-{timestamp}")
    os.makedirs(archive_dir, exist_ok=True)
    
    draft_dir = os.path.join(root, "_iwish-output", "generated-skills", name)
    if os.path.exists(draft_dir):
        shutil.move(draft_dir, os.path.join(archive_dir, name))
        print(f"Archived draft directory to {os.path.join(archive_dir, name)}")
        
    if os.path.exists(rec_file):
        shutil.move(rec_file, os.path.join(archive_dir, f"recommendation-{name}.yaml"))
        print(f"Archived recommendation file to {os.path.join(archive_dir, f'recommendation-{name}.yaml')}")
        
    print("Rejection completed successfully.")

def main():
    parser = argparse.ArgumentParser(description="Hermes Curator Recommendation Generator and Promoter CLI.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate recommendation YAML and draft files.")
    gen_parser.add_argument("--name", required=True, help="Name of the evolved skill.")
    gen_parser.add_argument("--disposition", default="patch", choices=["patch", "merge", "archive"], help="Disposition of the evolved skill.")
    gen_parser.add_argument("--sandbox-branch", help="Sandbox branch name.")
    gen_parser.add_argument("--source-dir", help="Evolved source directory path.")
    gen_parser.add_argument("--confidence", type=int, default=9, help="Curator confidence (0-10).")
    gen_parser.add_argument("--risk-level", default="low", choices=["low", "medium", "high"], help="Risk level.")
    
    # Promote command
    promote_parser = subparsers.add_parser("promote", help="Promote recommendation (apply changes, merge branches).")
    promote_parser.add_argument("--name", required=True, help="Name of the evolved skill.")
    
    # Reject command
    reject_parser = subparsers.add_parser("reject", help="Reject recommendation (drop sandbox, archive drafts).")
    reject_parser.add_argument("--name", required=True, help="Name of the evolved skill.")
    
    args = parser.parse_args()
    
    if args.command == "generate":
        do_generate(args)
    elif args.command == "promote":
        do_promote(args)
    elif args.command == "reject":
        do_reject(args)

if __name__ == "__main__":
    main()
