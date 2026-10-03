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
    pass
# ---------------------------------
"""
Subagent Path-Jail & Denylist Runner
Absorbed from rohitg00/ai-engineering-from-scratch (Phase 19 Lesson 26)
Provides safe subprocess execution with:
- Symlink-safe path jailing via realpath prefix checks
- Immutable binary denylist
- Hard wall-clock execution timeouts
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

DENIED_EXIT_CODE = -100
TIMED_OUT_EXIT_CODE = -101

DEFAULT_DENYLIST = frozenset({
    "sudo", "su", "mkfs", "dd", "shutdown", "reboot", "halt", "poweroff",
    "nc", "ncat", "telnet", "iptables", "ufw", "chmod"
})

def check_path_jail(target_path: str, jail_root: str) -> bool:
    real_target = os.path.realpath(os.path.abspath(target_path))
    real_root = os.path.realpath(os.path.abspath(jail_root))
    return os.path.commonpath([real_target, real_root]) == real_root

def run_jailed(cmd_parts: list[str], jail_root: str, timeout_sec: float = 30.0):
    if not cmd_parts:
        return {"exit_code": 1, "output": "error: empty command"}
    
    bin_name = os.path.basename(cmd_parts[0]).lower()
    if bin_name in DEFAULT_DENYLIST:
        return {
            "exit_code": DENIED_EXIT_CODE,
            "output": f"error: command '{bin_name}' is blocked by security denylist"
        }
    
    # Check all path-like arguments for directory escape
    for arg in cmd_parts[1:]:
        if "/" in arg or arg.startswith(".."):
            candidate = os.path.join(jail_root, arg) if not os.path.isabs(arg) else arg
            if os.path.exists(candidate) and not check_path_jail(candidate, jail_root):
                return {
                    "exit_code": DENIED_EXIT_CODE,
                    "output": f"error: path argument '{arg}' escapes jail root '{jail_root}'"
                }

    try:
        proc = subprocess.run(
            cmd_parts,
            cwd=jail_root,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
            check=False
        )
        return {
            "exit_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            "exit_code": TIMED_OUT_EXIT_CODE,
            "output": f"error: command timed out after {timeout_sec}s"
        }
    except Exception as e:
        return {
            "exit_code": 1,
            "output": f"error: execution failed: {e}"
        }

def main():
    parser = argparse.ArgumentParser(description="Subagent Path-Jail Runner")
    parser.add_argument("--jail", required=True, help="Jail root directory")
    parser.add_argument("--timeout", type=float, default=30.0, help="Timeout in seconds")
    parser.add_argument("cmd", nargs=argparse.REMAINDER, help="Command to execute")
    args = parser.parse_args()

    if not args.cmd:
        print("Usage: subagent-path-jail.py --jail <dir> [--timeout N] -- <cmd...>")
        sys.exit(1)

    cmd = args.cmd
    if cmd[0] == "--":
        cmd = cmd[1:]

    res = run_jailed(cmd, args.jail, args.timeout)
    if "output" in res:
        print(res["output"], file=sys.stderr if res["exit_code"] != 0 else sys.stdout)
    else:
        if res["stdout"]:
            print(res["stdout"], end="")
        if res["stderr"]:
            print(res["stderr"], end="", file=sys.stderr)
    sys.exit(res["exit_code"])

if __name__ == "__main__":
    main()
