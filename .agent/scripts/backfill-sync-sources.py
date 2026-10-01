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

"""Backfill sync_sources for Layer 3 Epic Context Notebooks — D10b

Scans all type: epic notebooks in the registry that have empty sync_sources,
discovers the physical story.md files in their corresponding Epic directories,
and populates sync_sources with path + MD5 entries.

Usage: python3 .agent/scripts/backfill-sync-sources.py
"""
import os
import sys
import hashlib
import json
import yaml
import subprocess
from datetime import datetime, timezone

# Import registry_crud_manager for save/load functions (or just use json/yaml directly)
import registry_crud_manager

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
REGISTRY_PATH = os.path.join(BASE_DIR, '_iwish-output', 'notebooks', 'notebook-registry.yaml')
EPIC_STORY_DIR = os.path.join(BASE_DIR, '_iwish-output', '3. Development', '1. Epic & Story')



def get_md5(filepath):
    """Compute MD5 hash of a file."""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def find_story_files(nb):
    """Find all story.md files under the notebook's feature_groups or specific epic."""
    import re
    story_files = []
    
    if not os.path.exists(EPIC_STORY_DIR):
        return story_files
        
    combined = f"{nb.get('id', '')} {nb.get('name', '')}"
    epic_match = re.search(r'[Ee]pic[- ]?(\d+)', combined)
    
    nb_fg_raw = nb.get('feature_groups') or []
    if isinstance(nb_fg_raw, str):
        nb_fgs = [nb_fg_raw]
    else:
        nb_fgs = [str(fg) for fg in nb_fg_raw]
        
    fg_ids = []
    for fg in nb_fgs:
        match = re.search(r'(FG-\d+)', fg)
        if match:
            fg_ids.append(match.group(1))
            
    # If a specific Epic ID is targeted, only find that one
    if epic_match:
        epic_id = epic_match.group(1)
        epic_folder = f"Epic-{epic_id}"
        for fg_folder in os.listdir(EPIC_STORY_DIR):
            fg_path = os.path.join(EPIC_STORY_DIR, fg_folder)
            if not os.path.isdir(fg_path): continue
            
            # If we also have fg_ids, optionally enforce it
            if fg_ids and not any(fid in fg_folder for fid in fg_ids):
                continue
                
            epic_path = os.path.join(fg_path, epic_folder)
            if os.path.isdir(epic_path):
                # Add epic.md
                epic_file = os.path.join(epic_path, 'epic.md')
                if os.path.exists(epic_file):
                    story_files.append(epic_file)
                    
                for story_folder in os.listdir(epic_path):
                    story_path = os.path.join(epic_path, story_folder)
                    if os.path.isdir(story_path):
                        for f_name in ['story.md', 'ui-spec.md', 'data-spec.md', 'task.md']:
                            s_file = os.path.join(story_path, f_name)
                            if os.path.exists(s_file):
                                story_files.append(s_file)
        return sorted(story_files)

    # Otherwise, fallback to scanning all Epics under the specified feature groups
    if not fg_ids:
        return story_files
        
    for fg_folder in os.listdir(EPIC_STORY_DIR):
        fg_path = os.path.join(EPIC_STORY_DIR, fg_folder)
        if not os.path.isdir(fg_path):
            continue
        
        folder_match = False
        for fg_id in fg_ids:
            if fg_id in fg_folder:
                folder_match = True
                break
                
        if not folder_match:
            continue
        
        for epic_folder in os.listdir(fg_path):
            epic_path = os.path.join(fg_path, epic_folder)
            if not os.path.isdir(epic_path):
                continue
            
            # Add epic.md
            epic_file = os.path.join(epic_path, 'epic.md')
            if os.path.exists(epic_file):
                story_files.append(epic_file)
                
            for story_folder in os.listdir(epic_path):
                story_path = os.path.join(epic_path, story_folder)
                if os.path.isdir(story_path):
                    for f_name in ['story.md', 'ui-spec.md', 'data-spec.md', 'task.md']:
                        s_file = os.path.join(story_path, f_name)
                        if os.path.exists(s_file):
                            story_files.append(s_file)
    
    return sorted(story_files)


def main():
    if not os.path.exists(REGISTRY_PATH):
        print(f"Registry not found at {REGISTRY_PATH}")
        sys.exit(1)
        
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        registry_data = yaml.safe_load(f) or {"notebooks": []}
        
    notebooks = registry_data.get('notebooks') or []
    
    # Pass 1: Verify and prune broken physical paths in existing sync_sources
    pruned_count = 0
    for nb in notebooks:
        if 'sync_sources' in nb and nb['sync_sources']:
            valid_sources = []
            for src in nb['sync_sources']:
                path = src.get('path', '')
                if path and os.path.exists(path):
                    valid_sources.append(src)
            if len(valid_sources) < len(nb['sync_sources']):
                pruned_count += (len(nb['sync_sources']) - len(valid_sources))
                nb['sync_sources'] = valid_sources
                
    if pruned_count > 0:
        print(f"Pruned {pruned_count} broken physical path(s) from sync_sources.")
        registry_crud_manager.save_registry(registry_data)
    
    # Filter to type: epic notebooks with empty sync_sources
    epic_nbs = [nb for nb in notebooks if nb.get('type') == 'epic']
    empty_nbs = [nb for nb in epic_nbs if not nb.get('sync_sources')]
    
    if not empty_nbs and pruned_count == 0:
        print("All epic notebooks already have valid sync_sources. Nothing to backfill.")
        sys.exit(0)
    elif not empty_nbs:
        print("Finished cleanup. Nothing to backfill.")
        sys.exit(0)
    
    print(f"Found {len(empty_nbs)} epic notebook(s) with empty sync_sources.")
    total_upserted = 0
    validation_failures = 0
    
    for nb in empty_nbs:
        nb_id = nb['id']
        
        story_files = find_story_files(nb)
        if not story_files:
            print(f"  [SKIP] No story.md files found for notebook: {nb_id}")
            continue
        
        print(f"  Backfilling {nb_id}: {len(story_files)} story files")
        
        if 'sync_sources' not in nb:
            nb['sync_sources'] = []
            
        for story_path in story_files:
            md5 = get_md5(story_path)
            
            payload = {
                "notebook_id": nb_id,
                "path": story_path,
                "md5": md5,
                "last_synced": None
            }
            
            try:
                registry_crud_manager.do_upsert_source(registry_data, payload)
                total_upserted += 1
            except Exception as e:
                print(f"  [ERROR] Failed to upsert {story_path}: {e}")
                
    registry_crud_manager.save_registry(registry_data)

    
    # Post-Write Self Validation (F4)
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        verified_registry = yaml.safe_load(f) or {"notebooks": []}
        
    for nb in empty_nbs:
        nb_id = nb['id']
        found = False
        for v_nb in verified_registry.get('notebooks', []):
            if v_nb.get('id') == nb_id:
                found = True
                if not v_nb.get('sync_sources'):
                    print(f"    [ERROR] Validation failed for {nb_id}: sync_sources is empty post-write!")
                    validation_failures += 1
                else:
                    for src in v_nb.get('sync_sources', []):
                        if not os.path.exists(src.get('path', '')):
                            print(f"    [ERROR] Validation failed for {nb_id}: path does not exist {src.get('path')}")
                            validation_failures += 1
                            # Optional: remove broken entries if needed, though exiting with code 1 is the requirement.
                break
        if not found:
            print(f"    [ERROR] Validation failed: notebook {nb_id} missing post-write!")
            validation_failures += 1
            
    if validation_failures > 0:
        print(f"\nBackfill failed: {validation_failures} validation error(s).")
        sys.exit(1)
        
    print(f"\nBackfill completed successfully. {total_upserted} source(s) upserted across {len(empty_nbs)} notebook(s).")


if __name__ == '__main__':
    main()
