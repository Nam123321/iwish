#!/usr/bin/env python3
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
