#!/usr/bin/env python3
"""
Code Validator Runner
=====================
Zero-Trust runner for code compilation checks.
Ensures that if compilation fails, it halts or reports failure correctly.

Usage:
  python3 code_validator_runner.py <command...>
  
Example:
  python3 code_validator_runner.py pnpm build
  python3 code_validator_runner.py npx tsc --noEmit
"""

import sys
import os
import subprocess

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
from iwish_runner_core import ZeroTrustRunner

class CodeValidatorRunner(ZeroTrustRunner):
    def __init__(self, build_command):
        self.build_command = build_command
        # Generate a safe name based on the command
        cmd_str = "_".join(build_command).replace("/", "_").replace("\\", "_")
        # Keep name clean and bounded
        name = "".join([c if c.isalnum() else "_" for c in f"code_validator_{cmd_str}"[:50]])
        # Max retries = 1 for compilation
        super().__init__(name=name, max_retries=1, validator_func=self._validator_func)

    def _validator_func(self):
        import collections
        print(f"\n🔄 Running Compilation Check: {' '.join(self.build_command)}")
        print("─" * 60)
        
        cmd_str = " ".join(self.build_command)
        tail = collections.deque(maxlen=50)
        
        process = subprocess.Popen(
            cmd_str,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in process.stdout:
            sys.stdout.write(line)
            tail.append(line)
            
        process.wait()
        print("─" * 60)
        
        if process.returncode != 0:
            raise Exception(f"Compilation Failed (tail):\n{''.join(tail)}")
            
        return {"status": "PASS", "message": "Compilation successful."}

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
        
    build_command = sys.argv[1:]
    runner = CodeValidatorRunner(build_command)
    runner.execute()
    
    if os.path.exists(runner.state_file):
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
