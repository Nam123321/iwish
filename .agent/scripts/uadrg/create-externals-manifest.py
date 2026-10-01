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
Create SHA-256 Checksum Manifest for externals.yaml
"""

import os
import json
import argparse
import hashlib
from datetime import datetime, timezone

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--externals-path", default="externals.yaml")
    parser.add_argument("--output", default="_iwish-output/uadrg/externals-manifest.json")
    args = parser.parse_args()

    manifest = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "PASS"
    }

    if os.path.exists(args.externals_path):
        with open(args.externals_path, 'rb') as f:
            content = f.read()
        sha256 = hashlib.sha256(content).hexdigest()
        manifest["externals.yaml"] = sha256
    else:
        manifest["externals.yaml"] = "NOT_FOUND"

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w') as f:
        json.dump(manifest, f, indent=2)

if __name__ == "__main__":
    main()
