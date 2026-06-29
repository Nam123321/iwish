#!/usr/bin/env python3
"""
Self-Healing Runner v2.0
========================
Executable enforcement of the QA self-healing loop.

Pipeline: test execution → validator → pass/fail
When test passes, the runner automatically runs validate-qa-evidence.py.
If the validator rejects (e.g. Gate 6 catches API Tunnel), it counts as a
failed attempt and triggers the retry loop — no gap between test and validation.

Usage:
  python3 self-healing-runner.py check  <epic_id> <story_id>
  python3 self-healing-runner.py run    <epic_id> <story_id> -- <test_command...>
  python3 self-healing-runner.py reset  <epic_id> <story_id>
  python3 self-healing-runner.py status <epic_id> <story_id>

Actions:
  check   Gate check before running tests. Exits 1 if retries exhausted.
  run     Execute test command with retry tracking + failure classification.
  reset   Clear qa-loop.json state for a story (after user /approve-qa or /reject-qa).
  status  Print current qa-loop.json state.

Examples:
  # From project root (e.g. Cowok-ai/):
  python3 ../iwish/.agent/scripts/self-healing-runner.py check 24 24.8
  python3 ../iwish/.agent/scripts/self-healing-runner.py run 24 24.8 -- npx playwright test tests/e2e/Epic-24/story-24.8-tenant.spec.ts
  python3 ../iwish/.agent/scripts/self-healing-runner.py reset 24 24.8
"""
import sys
import os
import json
import subprocess
import re
from datetime import datetime, timezone

MAX_RETRIES = 3
QA_LOOP_DIR = ".agent/cache"
QA_LOOP_FILE = os.path.join(QA_LOOP_DIR, "qa-loop.json")


# ─────────────────────────────────────────────────────────────
# State Management
# ─────────────────────────────────────────────────────────────
def load_state(epic_id, story_id):
    """Load qa-loop.json state. Returns None if no state or different story."""
    if not os.path.exists(QA_LOOP_FILE):
        return None
    try:
        with open(QA_LOOP_FILE, 'r') as f:
            state = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None

    if state.get("storyId") == story_id and str(state.get("epicId")) == str(epic_id):
        return state
    return None


def save_state(state):
    """Save qa-loop.json state atomically."""
    os.makedirs(QA_LOOP_DIR, exist_ok=True)
    tmp_path = QA_LOOP_FILE + ".tmp"
    with open(tmp_path, 'w') as f:
        json.dump(state, f, indent=2)
    os.replace(tmp_path, QA_LOOP_FILE)


def create_initial_state(epic_id, story_id):
    """Create initial state for a new story."""
    return {
        "epicId": str(epic_id),
        "storyId": str(story_id),
        "portal": "all",
        "attempts": 0,
        "maxRetries": MAX_RETRIES,
        "status": "Initialized",
        "failures": [],
        "lastExecutedAt": None,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }


# ─────────────────────────────────────────────────────────────
# Failure Classification Engine
# ─────────────────────────────────────────────────────────────
def classify_failure(output):
    """
    Classify test failure into Type 1 (Script issue) or Type 2 (App bug).
    Returns (type_str, reason_str).
    """
    output_lower = output.lower()

    # Type 2 patterns (App Bug) — check FIRST, higher severity
    app_patterns = [
        (r'status[:\s]*5\d{2}',          'HTTP 5xx server error from application'),
        (r'econnrefused',                 'Application not running — connection refused'),
        (r'uncaught\s+(exception|error)', 'Unhandled application exception'),
        (r'typeerror|referenceerror',     'JavaScript runtime error in application code'),
        (r'prisma.*error|database.*error','Database / Prisma error'),
        (r'internal\s+server\s+error',    'Internal Server Error'),
    ]

    # Type 1 patterns (Script Failure) — test logic / selector issue
    script_patterns = [
        (r'timeout\s+\d+ms\s+exceeded',              'Playwright timeout exceeded'),
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
            return ("Type2_AppBug", reason)

    for pattern, reason in script_patterns:
        if re.search(pattern, output_lower):
            return ("Type1_ScriptFailure", reason)

    return ("Type1_ScriptFailure", "Unclassified failure — defaulting to script issue for safety")


# ─────────────────────────────────────────────────────────────
# Commands
# ─────────────────────────────────────────────────────────────
def cmd_check(epic_id, story_id):
    """Gate check: are retries available?"""
    state = load_state(epic_id, story_id)

    if state is None:
        print(f"✅ GATE OPEN: No previous attempts for Story {story_id}. Ready to run.")
        return 0

    if state.get("status") == "Exhausted":
        print(f"❌ GATE BLOCKED: Story {story_id} exhausted all {MAX_RETRIES} retries.")
        failures = state.get("failures", [])
        if failures:
            last = failures[-1]
            print(f"   Last failure: [{last.get('type')}] {last.get('reason')}")
        print(f"   Run: python3 self-healing-runner.py reset {epic_id} {story_id}")
        return 1

    attempts = state.get("attempts", 0)
    remaining = MAX_RETRIES - attempts

    if remaining <= 0:
        print(f"❌ GATE BLOCKED: {attempts}/{MAX_RETRIES} attempts used. No retries remaining.")
        return 1

    print(f"✅ GATE OPEN: {attempts}/{MAX_RETRIES} attempts used. {remaining} retries remaining.")
    return 0


def cmd_run(epic_id, story_id, test_command):
    """Run test command with retry tracking and failure classification."""
    state = load_state(epic_id, story_id)
    if state is None:
        state = create_initial_state(epic_id, story_id)

    # ── Hard Gate: retry limit BEFORE running ──
    if state["attempts"] >= MAX_RETRIES:
        state["status"] = "Exhausted"
        save_state(state)
        print(f"❌ EXHAUSTED: Story {story_id} has used all {MAX_RETRIES} retries.")
        print(f"   Action required: User must run /approve-qa or /reject-qa.")
        report = {
            "action": "HALT",
            "reason": "Max retries exhausted. Manual intervention required.",
            "attempts": state["attempts"],
            "failures": state.get("failures", [])
        }
        print(f"\n📋 HEALING REPORT:\n{json.dumps(report, indent=2)}")
        return 1

    # ── Increment attempt counter BEFORE running ──
    state["attempts"] += 1
    state["lastExecutedAt"] = datetime.now(timezone.utc).isoformat()
    state["status"] = "Running"
    save_state(state)

    print(f"\n🔄 [Attempt {state['attempts']}/{MAX_RETRIES}] Running: {' '.join(test_command)}")
    print("─" * 60)

    # ── Execute the test command ──
    result = subprocess.run(
        test_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    combined_output = (result.stdout or "") + "\n" + (result.stderr or "")

    print(result.stdout or "")
    if result.stderr:
        print(result.stderr)
    print("─" * 60)

    if result.returncode == 0:
        # ══ TEST PASSED — but must still pass validator ══
        print(f"\n✅ Playwright test passed on attempt {state['attempts']}/{MAX_RETRIES}")
        print(f"🔍 Running validator (validate-qa-evidence.py) to check evidence quality...")

        # ── Find validator script ──
        script_dir = os.path.dirname(os.path.abspath(__file__))
        validator_path = os.path.join(script_dir, "validate-qa-evidence.py")

        if not os.path.exists(validator_path):
            # Fallback: try relative to CWD (when running from target project)
            validator_path_alt = os.path.join("..", "iwish", ".agent", "scripts", "validate-qa-evidence.py")
            if os.path.exists(validator_path_alt):
                validator_path = validator_path_alt
            else:
                print(f"⚠️  Validator not found at {validator_path}. Skipping evidence validation.")
                state["status"] = "Pending_Approval"
                save_state(state)
                report = {
                    "action": "VALIDATE",
                    "result": "PASS_UNVALIDATED",
                    "reason": "Test passed but validator script not found — evidence not verified",
                    "attempts": state["attempts"],
                    "status": "Pending_Approval"
                }
                print(f"\n📋 HEALING REPORT:\n{json.dumps(report, indent=2)}")
                return 0

        # ── Run validator ──
        validator_result = subprocess.run(
            [sys.executable, validator_path, str(epic_id), str(story_id)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        print(validator_result.stdout or "")
        if validator_result.stderr:
            print(validator_result.stderr)

        if validator_result.returncode == 0:
            # ── Both test AND validator passed ──
            state["status"] = "Pending_Approval"
            save_state(state)

            report = {
                "action": "VALIDATE",
                "result": "PASS",
                "reason": "Test passed AND all validator gates cleared",
                "attempts": state["attempts"],
                "status": "Pending_Approval"
            }
            print(f"\n✅ FULLY VALIDATED on attempt {state['attempts']}/{MAX_RETRIES}")
            print(f"\n📋 HEALING REPORT:\n{json.dumps(report, indent=2)}")
            return 0
        else:
            # ── Test passed but VALIDATOR FAILED ──
            # This is a Type 1 failure — the test script is inadequate
            failure_type = "Type1_ScriptFailure"
            failure_reason = "Test execution passed but validator rejected the evidence"

            # Extract specific gate failure from validator output
            validator_output = (validator_result.stdout or "") + (validator_result.stderr or "")
            gate_match = re.search(r'VALIDATION FAILED at Gate (\d+): (.+)', validator_output)
            if gate_match:
                failure_reason = f"Validator Gate {gate_match.group(1)} failed: {gate_match.group(2)}"

            # Check for specific patterns
            if "API TUNNEL" in validator_output:
                failure_reason = "Gate 6: API Tunnel detected — test uses page.evaluate(fetch()) without DOM assertions"
            elif "DECOY DOM" in validator_output:
                failure_reason = "Gate 6: Decoy DOM detected — DOM locators touched but never asserted on"
            elif "ASSERTION ENFORCER" in validator_output:
                failure_reason = "Gate 2: Test has zero expect() assertions"
            elif "ANTI-PADDING" in validator_output:
                failure_reason = "Gate 3: Evidence-padding tricks detected"

            failure_record = {
                "attempt": state["attempts"],
                "type": failure_type,
                "reason": failure_reason,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "returnCode": validator_result.returncode,
                "source": "validator"
            }
            state.setdefault("failures", []).append(failure_record)
            remaining = MAX_RETRIES - state["attempts"]

            if remaining <= 0:
                state["status"] = "Exhausted"
                action = "HALT"
            else:
                state["status"] = "Healing"
                action = "HEAL"

            save_state(state)

            report = {
                "action": action,
                "result": "FAIL",
                "failureType": failure_type,
                "failureReason": failure_reason,
                "failureSource": "validator",
                "attempts": state["attempts"],
                "remaining": remaining,
                "recommendation": "FIX THE TEST SCRIPT: The test passes but evidence is invalid. Add DOM assertions (expect(locator).toBeVisible()), remove API Tunnel patterns."
            }

            if action == "HALT":
                print(f"\n❌ EXHAUSTED after {state['attempts']} attempts (validator rejection). Manual intervention required.")
            else:
                print(f"\n⚠️  VALIDATOR REJECTED on attempt {state['attempts']}/{MAX_RETRIES}. {remaining} retries remaining.")
                print(f"   Reason: {failure_reason}")

            print(f"\n📋 HEALING REPORT:\n{json.dumps(report, indent=2)}")
            return 1

    # ══ TEST FAILED ══
    failure_type, failure_reason = classify_failure(combined_output)
    failure_record = {
        "attempt": state["attempts"],
        "type": failure_type,
        "reason": failure_reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "returnCode": result.returncode
    }

    state.setdefault("failures", []).append(failure_record)
    remaining = MAX_RETRIES - state["attempts"]

    if remaining <= 0:
        state["status"] = "Exhausted"
        action = "HALT"
    else:
        state["status"] = "Healing"
        action = "HEAL"

    save_state(state)

    # ── Structured report for agent consumption ──
    error_trace = combined_output.strip()
    if len(error_trace) > 3000:
        error_trace = error_trace[-3000:]

    report = {
        "action": action,
        "result": "FAIL",
        "failureType": failure_type,
        "failureReason": failure_reason,
        "attempts": state["attempts"],
        "remaining": remaining,
        "recommendation": (
            "FIX THE TEST SCRIPT: Check selectors, timeouts, assertions, then re-run."
            if failure_type == "Type1_ScriptFailure"
            else "FIX THE APPLICATION: Check API routes, DB, business logic, then re-run."
        ),
        "errorTrace": error_trace
    }

    if action == "HALT":
        print(f"\n❌ EXHAUSTED after {state['attempts']} attempts. Manual intervention required.")
    else:
        print(f"\n⚠️  FAILED on attempt {state['attempts']}/{MAX_RETRIES}. {remaining} retries remaining.")

    print(f"\n📋 HEALING REPORT:\n{json.dumps(report, indent=2)}")
    return 1


def cmd_reset(epic_id, story_id):
    """Reset loop state for a story."""
    state = load_state(epic_id, story_id)
    if state:
        old_attempts = state.get("attempts", 0)
        old_status = state.get("status", "Unknown")
        os.remove(QA_LOOP_FILE)
        print(f"🔄 Reset qa-loop.json for Story {story_id}")
        print(f"   Previous: {old_attempts} attempts, status={old_status}")
    else:
        print(f"ℹ️  No qa-loop.json state found for Epic {epic_id}, Story {story_id}")
    return 0


def cmd_status(epic_id, story_id):
    """Show current loop state."""
    state = load_state(epic_id, story_id)
    if state is None:
        print(f"ℹ️  No qa-loop.json state found for Epic {epic_id}, Story {story_id}")
        return 0
    print(json.dumps(state, indent=2))
    return 0


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
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
