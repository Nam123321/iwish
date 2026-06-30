#!/usr/bin/env python3
"""
Tests for time-budget-filter.py, validating all Acceptance Criteria (AC1-AC4).
"""

import os
import sys
import json
import signal
import time
import subprocess
import unittest

SCRIPT_PATH = "{project-root}/.agent/skills/iwish-evolver/scripts/time-budget-filter.py"

class TestTimeBudgetFilter(unittest.TestCase):
    
    def test_ac1_and_ac2_cold_run_and_average(self):
        """
        AC1: First run is discarded as cold run.
        AC2: Warm runs (subsequent runs) are averaged.
        We run a simple command: python3 -c "import time; time.sleep(0.1)"
        """
        cmd = [sys.executable, SCRIPT_PATH, "-i", "3", "-b", "5.0", "--", sys.executable, "-c", "import time; time.sleep(0.1)"]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(result.returncode, 0)
        
        report = json.loads(result.stdout)
        self.assertEqual(report["status"], "SUCCESS")
        self.assertEqual(len(report["iterations"]), 3)
        
        # Verify cold run was set to the first run
        self.assertIsNotNone(report["cold_run_seconds"])
        self.assertEqual(report["cold_run_seconds"], report["iterations"][0]["duration_seconds"])
        
        # Verify warm runs are the subsequent runs
        self.assertEqual(len(report["warm_runs_seconds"]), 2)
        self.assertEqual(report["warm_runs_seconds"][0], report["iterations"][1]["duration_seconds"])
        self.assertEqual(report["warm_runs_seconds"][1], report["iterations"][2]["duration_seconds"])
        
        # Verify average warm duration is correct
        expected_avg = sum(report["warm_runs_seconds"]) / 2
        self.assertAlmostEqual(report["average_warm_duration_seconds"], expected_avg, places=5)
        self.assertLess(report["average_warm_duration_seconds"], 0.5)

    def test_ac3_timeout_enforcement(self):
        """
        AC3: Budget exceeded terminates immediately, raising TIMEOUT.
        """
        # Run a command that takes 5 seconds, but with a 1-second budget
        cmd = [sys.executable, SCRIPT_PATH, "-i", "3", "-b", "1.0", "--", sys.executable, "-c", "import time; time.sleep(5.0)"]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertNotEqual(result.returncode, 0)
        
        report = json.loads(result.stdout)
        self.assertEqual(report["status"], "TIMEOUT")
        self.assertIn("timed out", report["error"])
        
        # Should abort on iteration 1
        self.assertEqual(len(report["iterations"]), 1)
        self.assertEqual(report["iterations"][0]["status"], "timeout")
        self.assertIsNone(report["average_warm_duration_seconds"])

    def test_ac4_process_group_cleanup(self):
        """
        AC4: Releases child process groups to avoid orphaned processes.
        We'll spawn a process that spawns its own child. Both will print their PIDs to stderr/stdout
        and then sleep. When the parent is killed, both should die.
        """
        # Create a temporary script that spawns a child process and sleeps
        temp_script = "{project-root}/.agent/skills/iwish-evolver/scripts/temp_spawn.py"
        with open(temp_script, "w") as f:
            f.write(f"""import subprocess
import sys
import time
import os

# Spawn a grandchild that will sleep for 20 seconds
grandchild = subprocess.Popen([{repr(sys.executable)}, "-c", "import time; time.sleep(20)"])

# Print parent and grandchild PID so the test can check them
print(f"PARENT_PID:{{os.getpid()}}")
print(f"GRANDCHILD_PID:{{grandchild.pid}}")
sys.stdout.flush()

time.sleep(20)
""")
        
        try:
            # Run our tool wrapping this temp script. Budget is 2 seconds.
            cmd = [sys.executable, SCRIPT_PATH, "-i", "2", "-b", "2.0", "--", sys.executable, temp_script]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # The tool should report a timeout
            self.assertNotEqual(result.returncode, 0)
            report = json.loads(result.stdout)
            self.assertEqual(report["status"], "TIMEOUT")
            
            # Extract PIDs from the captured stderr of the execution log
            parent_pid = None
            grandchild_pid = None
            for line in result.stderr.splitlines():
                if "PARENT_PID:" in line:
                    parent_pid = int(line.split("PARENT_PID:")[1].strip())
                elif "GRANDCHILD_PID:" in line:
                    grandchild_pid = int(line.split("GRANDCHILD_PID:")[1].strip())
            
            self.assertIsNotNone(parent_pid)
            self.assertIsNotNone(grandchild_pid)
            
            # Wait a moment for OS to clean up processes
            time.sleep(0.5)
            
            # Verify parent PID is dead
            with self.assertRaises(OSError):
                os.kill(parent_pid, 0)
                
            # Verify grandchild PID is dead
            with self.assertRaises(OSError):
                os.kill(grandchild_pid, 0)
                
        finally:
            if os.path.exists(temp_script):
                os.remove(temp_script)

if __name__ == "__main__":
    unittest.main()
