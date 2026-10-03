#!/usr/bin/env python3
import sys
import json
import os
import fcntl
import time
import argparse
import yaml
import re

def extract_story_id(story_dir: str) -> str:
    match = re.search(r'Story-([\d\.]+)', story_dir)
    return match.group(1) if match else "unknown"

def extract_manifest(data_spec_path: str) -> dict:
    if not os.path.exists(data_spec_path):
        return None
    with open(data_spec_path, 'r') as f:
        content = f.read()
    
    # Simple regex to extract YAML frontmatter
    yaml_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not yaml_match:
        return None
    
    try:
        frontmatter = yaml.safe_load(yaml_match.group(1))
        return frontmatter.get('contract_manifest')
    except Exception:
        return None

def sync_back(story_dir: str, registry_path: str, dry_run: bool):
    """After DoD, merge new models from story data-spec into Master Registry."""
    
    data_spec_path = os.path.join(story_dir, "data-spec.md")
    manifest = extract_manifest(data_spec_path)
    if not manifest or manifest.get("status") == "UNVERIFIED":
        print("[SKIP] Manifest is missing or UNVERIFIED, cannot sync to registry")
        return
    
    # In a real implementation, we would extract the Prisma blocks and compare.
    # For this POC Phase 1, we simulate extraction based on manifest.mutates.
    story_id = extract_story_id(story_dir)
    models_to_sync = manifest.get("mutates", [])
    
    if not models_to_sync:
        print("[SKIP] No models to mutate in manifest.")
        return

    # Use File Locking to prevent Concurrent Agent Data Corruption (EC-P3/P13)
    lock_file = registry_path + ".lock"
    
    # Retry loop for lock acquisition (Fixing Concurrency Crash issue)
    max_retries = 30
    lock_acquired = False
    lf = open(lock_file, 'w')
    
    for attempt in range(max_retries):
        try:
            fcntl.flock(lf, fcntl.LOCK_EX | fcntl.LOCK_NB)
            lock_acquired = True
            break
        except BlockingIOError:
            time.sleep(1)
            
    if not lock_acquired:
        print("[WARN] Registry is currently locked by another process after waiting. Please retry later.")
        sys.exit(1)
        
    try:
        if not os.path.exists(registry_path):
            registry_content = ""
        else:
            with open(registry_path, 'r') as f:
                registry_content = f.read()
                
        # Simulate diffing for Phase 1
        new_models = []
        modified_models = []
        
        for model in models_to_sync:
            if f"## Model: {model}" not in registry_content:
                new_models.append(model)
            else:
                modified_models.append(model)
                
        report = {
            "story_id": story_id,
            "new_models": new_models,
            "modified_models": modified_models,
            "unchanged": 0
        }
        
        if dry_run:
            print(json.dumps(report, indent=2))
            return
            
        # Append new models
        if new_models:
            with open(registry_path, 'a') as f:
                for model in new_models:
                    f.write(f"\n\n## Model: {model}\n- Added by: Story-{story_id}\n")
        
        print(f"[SYNC] Added {len(new_models)} new, updated {len(modified_models)} models in registry")
        
        # Update manifest status to IMPLEMENTED
        with open(data_spec_path, 'r') as f:
            content = f.read()
            
        new_content = content.replace("status: DRAFT", "status: IMPLEMENTED").replace("status: APPROVED", "status: IMPLEMENTED")
        if new_content != content:
            with open(data_spec_path, 'w') as f:
                f.write(new_content)
            print("[SYNC] Marked contract_manifest status as IMPLEMENTED.")
            
    finally:
        fcntl.flock(lf, fcntl.LOCK_UN)
        lf.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--story-dir", required=True)
    parser.add_argument("--registry", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    
    sync_back(args.story_dir, args.registry, args.dry_run)
