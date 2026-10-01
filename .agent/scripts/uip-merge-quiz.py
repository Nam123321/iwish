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

"""Compatibility entry point for the registered review merge quiz tool."""
import argparse
import subprocess
import sys

parser = argparse.ArgumentParser()
parser.add_argument("--context", required=True)
args = parser.parse_args()
command = [sys.executable, ".agent/scripts/uip-review-challenger.py", "--context", args.context, "--mode", "quiz"]
completed = subprocess.run(command, capture_output=True, text=True)
if completed.stdout:
    print(completed.stdout, end="")
sys.exit(completed.returncode)
