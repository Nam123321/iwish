import watchmen_core
watchmen_core.verify_execution(__file__)
import os
import hashlib
import json
import sys
from pathlib import Path

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        content = f.read().replace(b'\r\n', b'\n')
        hasher.update(content)
    return hasher.hexdigest()

def main():
    registry_path = Path(".agent/config/watchmen-registry.json")
    
    if not registry_path.exists():
        print("❌ Watchmen Registry not found. Run watchmen-lock-sync.py first.")
        sys.exit(1)
        
    with open(registry_path, "r") as f:
        registry = json.load(f)
        
    drift_detected = False
    for script_path, expected_hash in registry.items():
        if not os.path.exists(script_path):
            print(f"❌ Watchmen Alert: Script missing: {script_path}")
            drift_detected = True
        else:
            actual_hash = get_file_hash(script_path)
            if actual_hash != expected_hash:
                print(f"❌ Watchmen Drift: {script_path} (Expected: {expected_hash}, Got: {actual_hash})")
                drift_detected = True
                
    if drift_detected:
        print("❌ Watchmen Verification Failed: Scripts have drifted or are missing.")
        sys.exit(1)
    else:
        print("✅ Watchmen Verification Passed: All registered scripts match expected signatures.")
        sys.exit(0)

if __name__ == "__main__":
    main()
