import watchmen_core
watchmen_core.verify_execution(__file__)
import os
import hashlib
import json
from pathlib import Path

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        hasher.update(f.read())
    return hasher.hexdigest()

def main():
    script_dir = Path(".agent/scripts")
    registry_path = Path(".agent/config/watchmen-registry.json")
    
    registry_path.parent.mkdir(parents=True, exist_ok=True)
    
    hashes = {}
    for py_file in script_dir.rglob("*.py"):
        if py_file.name == "watchmen-lock-sync.py":
            continue
        hashes[str(py_file)] = get_file_hash(py_file)
        
    with open(registry_path, "w") as f:
        json.dump(hashes, f, indent=2)
        
    print(f"✅ Watchmen Lock Sync Complete: {len(hashes)} scripts cryptographically signed.")
    print(f"Registry saved to {registry_path}")

if __name__ == "__main__":
    main()
