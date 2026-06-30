import unittest
import os
import tempfile
import json
import sys

# Add parent dir to path to import iwish_runner_core
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from iwish_runner_core import ZeroTrustRunner

class TestZeroTrustRunner(unittest.TestCase):

    def test_ast_security_scan_pass(self):
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py") as f:
            f.write("import math\nprint(math.pi)\n")
            filepath = f.name
            
        try:
            self.assertTrue(ZeroTrustRunner.scan_ast_security(filepath))
        finally:
            os.remove(filepath)
            
    def test_ast_security_scan_fail(self):
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py") as f:
            f.write("import os\nos.system('echo hacked')\n")
            filepath = f.name
            
        try:
            with self.assertRaises(ValueError) as context:
                ZeroTrustRunner.scan_ast_security(filepath)
            self.assertIn("Call to dangerous function 'os.system' is blocked.", str(context.exception))
        finally:
            os.remove(filepath)
            
    def test_safe_update_project_rules(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            success = ZeroTrustRunner.safe_update_project_rules("Do not use os.system.", project_root=temp_dir)
            self.assertTrue(success)
            
            rules_path = os.path.join(temp_dir, ".agents", "project-rules.md")
            self.assertTrue(os.path.exists(rules_path))
            
            with open(rules_path, "r") as f:
                content = f.read()
                self.assertIn("Do not use os.system.", content)
                
    def test_infinite_loop_prevention(self):
        runner = ZeroTrustRunner(name="test_runner", max_retries=2, validator_func=lambda: {"status": "FAIL", "error": "Always fails"})
        runner.state_file = "test_runner_state.json"
        
        # Should fail 2 times
        runner.execute()
        runner.execute()
        
        # 3rd time should hit max retries break
        runner.execute()
        
        try:
            with open(runner.state_file, "r") as f:
                state = json.load(f)
            self.assertEqual(state["attempts"], 2)
            self.assertEqual(state["history"][-1]["action"], "HALT")
            self.assertIn("Hard cap of 2 retries reached", state["history"][-1]["message"])
        finally:
            if os.path.exists(runner.state_file):
                os.remove(runner.state_file)

if __name__ == '__main__':
    unittest.main()
