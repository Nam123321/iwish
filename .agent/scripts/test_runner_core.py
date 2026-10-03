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
import os
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
from iwish_runner_core import ZeroTrustRunner

class TestTimeoutRunner(ZeroTrustRunner):
    def __init__(self):
        super().__init__(name="test_timeout", max_retries=1, validator_func=self._validator_func)

    def _validator_func(self):
        print("Simulating timeout...")
        raise TimeoutError("Test timeout")

class TestOOMRunner(ZeroTrustRunner):
    def __init__(self):
        super().__init__(name="test_oom", max_retries=1, validator_func=self._validator_func)

    def _validator_func(self):
        print("Simulating OOM...")
        raise MemoryError("Test OOM")

if __name__ == "__main__":
    print("Testing Timeout Runner...")
    timeout_runner = TestTimeoutRunner()
    timeout_runner.execute()
    
    print("\nTesting OOM Runner...")
    oom_runner = TestOOMRunner()
    oom_runner.execute()
    
    print("\nCheck state files:")
    for name in ["test_timeout", "test_oom"]:
        state_file = f".{name}_runner_state.json"
        if os.path.exists(state_file):
            with open(state_file, "r") as f:
                state = json.load(f)
                print(f"{state_file}: status={state.get('status')}, last_action={state.get('last_action')}")
