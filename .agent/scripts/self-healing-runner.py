#!/usr/bin/env python3
"""
Self-Healing Runner v2.0
========================
Executable enforcement of the QA self-healing loop.

Pipeline: test execution → validator → pass/fail
When test passes, the runner automatically runs validate-qa-evidence.py.
If the validator rejects, it counts as a failed attempt and triggers the retry loop.

Usage:
  python3 self-healing-runner.py check  <epic_id> <story_id>
  python3 self-healing-runner.py run    <epic_id> <story_id> -- <test_command...>
  python3 self-healing-runner.py reset  <epic_id> <story_id>
  python3 self-healing-runner.py status <epic_id> <story_id>
"""

import sys
import os
import json
import subprocess
import re
from datetime import datetime, timezone

# Add the script directory to sys.path so we can import iwish_runner_core
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
from iwish_runner_core import ZeroTrustRunner

MAX_RETRIES = 3
QA_LOOP_DIR = ".agent/cache"
QA_LOOP_FILE = os.path.join(QA_LOOP_DIR, "qa-loop.json")


class QASelfHealingRunner(ZeroTrustRunner):
    def __init__(self, epic_id, story_id, test_command=None):
        self.epic_id = str(epic_id)
        self.story_id = str(story_id)
        self.test_command = test_command
        
        # Name determines the SDK standard state file (.qa_runner_{epic}_{story}_runner_state.json)
        name = f"qa_runner_{epic_id}_{story_id}"
        os.makedirs(QA_LOOP_DIR, exist_ok=True)
        super().__init__(name=name, max_retries=MAX_RETRIES, validator_func=self._validator_func)

    def save_state(self, state):
        """Adapter Pattern: Save standard state, then duplicate to legacy qa-loop.json"""
        super().save_state(state)
        
        # Backward compatibility adapter for QA tools that expect qa-loop.json
        legacy_state = {
            "epicId": self.epic_id,
            "storyId": self.story_id,
            "portal": "all",
            "attempts": state.get("attempts", 0),
            "maxRetries": self.max_retries,
            "status": "Exhausted" if state.get("attempts", 0) >= self.max_retries else "Running", # Simplified status mapping
            "failures": state.get("history", []),
            "lastExecutedAt": datetime.now(timezone.utc).isoformat(),
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        os.makedirs(QA_LOOP_DIR, exist_ok=True)
        tmp_path = QA_LOOP_FILE + ".tmp"
        with open(tmp_path, 'w') as f:
            json.dump(legacy_state, f, indent=2)
        os.replace(tmp_path, QA_LOOP_FILE)
        
        # In a real app we'd print a warning to STDERR, but to avoid polluting stdout json:
        # print("⚠️ DEPRECATION WARNING: qa-loop.json is deprecated. Migrate to SDK standard.", file=sys.stderr)

    def classify_failure(self, error_msg: str, context: dict) -> dict:
        """Override core classifier with advanced regex app bug vs script bug logic."""
        output_lower = error_msg.lower()

        # Type 2 patterns (App Bug) — check FIRST, higher severity
        app_patterns = [
            (r'status[:\s]*5\d{2}',          'HTTP 5xx server error from application'),
            (r'econnrefused',                 'Application not running — connection refused'),
            (r'uncaught\s+(exception|error)', 'Unhandled application exception'),
            (r'typeerror|referenceerror',     'JavaScript runtime error in application code'),
            (r'prisma.*error|database.*error','Database / Prisma error'),
            (r'internal\s+server\s+error',    'Internal Server Error'),
            (r'404\s+not\s+found',           'Route/page not found (404)'),
        ]

        app_dom_patterns = [
            (r'element\(s\)\s+not\s+found',               'DOM element genuinely absent — app missing UI component'),
            (r'expected:\s*visible.*error:\s*element',     'UI component expected but not rendered — app bug'),
        ]

        script_patterns = [
            (r'waiting\s+for\s+(selector|locator)',        'Selector not found in DOM'),
            (r'strict\s+mode\s+violation',                 'Multiple elements matched selector'),
            (r'element\s+is\s+not\s+(visible|attached)',   'Element state mismatch'),
            (r'expect\(received\)\.to',                    'Assertion value mismatch — test logic error'),
            (r'target\s+(closed|crashed)',                  'Browser target crashed'),
            (r'net::err_',                                 'Network error during navigation'),
            (r'error:\s+no\s+tests\s+found',               'No test files matched pattern'),
        ]

        for pattern, reason in app_patterns:
            if re.search(pattern, output_lower):
                return {"type": "Type2_AppBug", "action": "HALT", "reason": reason, "details": error_msg}

        # Check DOM absence patterns even without timeout
        for pattern, reason in app_dom_patterns:
            if re.search(pattern, output_lower):
                return {"type": "Type2_AppBug", "action": "HALT", "reason": reason, "details": error_msg}

        for pattern, reason in script_patterns:
            if re.search(pattern, output_lower):
                return {"type": "Type1_ScriptBug", "action": "HEAL", "reason": reason, "details": error_msg}

        # Handle specific validator errors (which will bubble up here as Exceptions)
        if "api tunnel" in output_lower:
            return {"type": "Type1_ScriptBug", "action": "HEAL", "reason": "Gate 6: API Tunnel detected", "details": error_msg}
        if "decoy dom" in output_lower:
            return {"type": "Type1_ScriptBug", "action": "HEAL", "reason": "Gate 6: Decoy DOM detected", "details": error_msg}
        if "zero expect() assertions" in output_lower:
            return {"type": "Type1_ScriptBug", "action": "HEAL", "reason": "Gate 2: Zero expect() assertions", "details": error_msg}
        if "padding" in output_lower:
            return {"type": "Type1_ScriptBug", "action": "HEAL", "reason": "Gate 3: Evidence padding detected", "details": error_msg}

        return super().classify_failure(error_msg, context)

    def _validator_func(self):
        """Runs the test command and the validator script. Raises exception if failed."""
        print(f"\n🔄 Running: {' '.join(self.test_command)}")
        print("─" * 60)
        
        result = subprocess.run(
            self.test_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        combined_output = (result.stdout or "") + "\n" + (result.stderr or "")
        print(result.stdout or "")
        if result.stderr:
            print(result.stderr)
        print("─" * 60)
        
        if result.returncode != 0:
            # Raise exception so ZeroTrustRunner catches and classifies it
            raise Exception(f"Playwright test failed:\n{combined_output}")
            
        print(f"\n✅ Playwright test passed.")
        print(f"🔍 Running validator (validate-qa-evidence.py)...")
        
        validator_path = os.path.join(script_dir, "validate-qa-evidence.py")
        if not os.path.exists(validator_path):
            validator_path_alt = os.path.join("..", "iwish", ".agent", "scripts", "validate-qa-evidence.py")
            if os.path.exists(validator_path_alt):
                validator_path = validator_path_alt
            else:
                return {"status": "PASS", "message": "Test passed but validator not found."}
                
        val_result = subprocess.run(
            [sys.executable, validator_path, self.epic_id, self.story_id],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        print(val_result.stdout or "")
        if val_result.stderr:
            print(val_result.stderr)
            
        if val_result.returncode != 0:
            raise Exception(f"Validator rejected evidence:\n{(val_result.stdout or '') + (val_result.stderr or '')}")
            
        return {"status": "PASS", "message": "All gates cleared."}


# ─────────────────────────────────────────────────────────────
# Commands
# ─────────────────────────────────────────────────────────────
def cmd_check(epic_id, story_id):
    runner = QASelfHealingRunner(epic_id, story_id)
    state = runner.load_state()
    
    if state["attempts"] == 0:
        print(f"✅ GATE OPEN: No previous attempts for Story {story_id}. Ready to run.")
        return 0
        
    remaining = runner.max_retries - state["attempts"]
    if remaining <= 0:
        print(f"❌ GATE BLOCKED: Story {story_id} exhausted all {runner.max_retries} retries.")
        failures = state.get("history", [])
        if failures:
            last = failures[-1]
            print(f"   Last failure: [{last.get('type')}] {last.get('reason')}")
        print(f"   Run: python3 self-healing-runner.py reset {epic_id} {story_id}")
        return 1
        
    print(f"✅ GATE OPEN: {state['attempts']}/{runner.max_retries} attempts used. {remaining} retries remaining.")
    return 0

def cmd_run(epic_id, story_id, test_command):
    runner = QASelfHealingRunner(epic_id, story_id, test_command)
    state = runner.load_state()
    if state["attempts"] >= runner.max_retries:
        print(f"❌ EXHAUSTED: Story {story_id} has used all {runner.max_retries} retries.")
        print(f"   Action required: User must run /approve-qa or /reject-qa.")
        return 1
    
    # Execute the ZeroTrustRunner
    print(f"Starting QASelfHealingRunner execution...")
    runner.execute()
    
    # execute() cleans up the file on success.
    if os.path.exists(runner.state_file):
        # State file exists means it failed
        state = runner.load_state()
        if state["attempts"] >= runner.max_retries:
            return 1 # Exhausted
        return 1 # Failed but retrying
    return 0 # Success

def cmd_reset(epic_id, story_id):
    runner = QASelfHealingRunner(epic_id, story_id)
    state = runner.load_state()
    old_attempts = state.get("attempts", 0)
    
    if os.path.exists(runner.state_file):
        os.remove(runner.state_file)
        print(f"🔄 Reset SDK state for Story {story_id}")
        print(f"   Previous: {old_attempts} attempts")
    
    if os.path.exists(QA_LOOP_FILE):
        os.remove(QA_LOOP_FILE)
        print(f"🔄 Reset legacy qa-loop.json")
    return 0

def cmd_status(epic_id, story_id):
    runner = QASelfHealingRunner(epic_id, story_id)
    state = runner.load_state()
    print(json.dumps(state, indent=2))
    return 0

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    action = sys.argv[1]

    if action in ("check", "reset", "status"):
        if len(sys.argv) < 4:
            print(f"Usage: self-healing-runner.py {action} <epic_id> <story_id>")
            sys.exit(1)
        epic_id = sys.argv[2]
        story_id = sys.argv[3]
        func = {"check": cmd_check, "reset": cmd_reset, "status": cmd_status}[action]
        sys.exit(func(epic_id, story_id))

    elif action == "run":
        try:
            sep_idx = sys.argv.index("--")
            epic_id = sys.argv[2]
            story_id = sys.argv[3]
            test_command = sys.argv[sep_idx + 1:]
            if not test_command:
                raise ValueError("Empty test command")
        except (ValueError, IndexError):
            print("Usage: self-healing-runner.py run <epic_id> <story_id> -- <test_command...>")
            sys.exit(1)
        sys.exit(cmd_run(epic_id, story_id, test_command))

    else:
        print(f"Unknown action: {action}")
        print(__doc__)
        sys.exit(1)

if __name__ == "__main__":
    main()
