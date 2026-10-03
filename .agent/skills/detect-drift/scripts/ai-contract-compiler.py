#!/usr/bin/env python3
"""
Migration Forwarding Shim (FMEA-12)
Redirects legacy ai-contract-compiler calls to contract-graph.
"""

import os
import sys
import subprocess

target_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../contract-graph/scripts/ai-contract-compiler.py")

if not os.path.exists(target_script):
    sys.stderr.write(f"❌ Forwarding target does not exist: {target_script}\n")
    sys.exit(1)

result = subprocess.run([sys.executable, target_script] + sys.argv[1:])
sys.exit(result.returncode)
