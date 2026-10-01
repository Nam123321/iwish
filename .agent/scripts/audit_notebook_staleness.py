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

import sys
import yaml
import os
import hashlib
from datetime import datetime

REGISTRY_PATH = "_iwish-output/notebooks/notebook-registry.yaml"

def get_file_hash(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def main():
    if not os.path.exists(REGISTRY_PATH):
        print("Registry not found. All good.")
        sys.exit(0)
        
    with open(REGISTRY_PATH, 'r') as f:
        registry = yaml.safe_load(f)
        
    drift_detected = False
    
    for nb in registry.get('notebooks', []):
        nb_id = nb.get('id')
        last_synced = nb.get('last_synced')
        sync_sources = nb.get('sync_sources', [])
        for src in sync_sources:
            path = src.get('path')
            if not os.path.exists(path):
                print(f"[DRIFT DETECTED] Missing source file for {nb_id}: {path}")
                drift_detected = True
                continue
                
            mtime = os.path.getmtime(path)
            last_mod = datetime.utcfromtimestamp(mtime).isoformat() + "Z"
            
            if last_synced and last_mod > last_synced:
                print(f"[DRIFT DETECTED] File {path} modified after last sync ({last_synced}) for Notebook {nb_id}")
                drift_detected = True
                
            expected_hash = src.get('md5')
            if expected_hash:
                actual_hash = get_file_hash(path)
                if expected_hash != actual_hash:
                    print(f"[DRIFT DETECTED] MD5 Hash mismatch for {path} in Notebook {nb_id}")
                    drift_detected = True

    # D8: Layer 3 Coverage Warning
    # Check if any type: epic notebooks have empty/missing sync_sources
    for nb in registry.get('notebooks', []):
        nb_type = nb.get('type', '')
        if nb_type == 'epic' and not nb.get('sync_sources'):
            nb_id = nb.get('id', 'unknown')
            name = nb.get('name', 'Unknown')
            print(f"[WARNING] Layer 3 notebook {nb_id} ({name}) has no tracked sync_sources.")
            print(f"         Run: python3 .agent/scripts/backfill-sync-sources.py")
            print(f"         to populate tracking entries.")

    if drift_detected:
        print("\nZero-Trust Violation: Synchronization Drift Detected. Please run `/nlm sync`.")
        sys.exit(1)
    else:
        print("Audit Passed: No staleness or drift detected.")
        sys.exit(0)

if __name__ == "__main__":
    main()
