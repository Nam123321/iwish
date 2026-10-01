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
import re
import subprocess
import argparse
import json
from pathlib import Path

def validate_plan(file_path, transcript_path=None, evidence_file=None):
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find implementation plan at {file_path}")
        return False

    # Patterns indicating open technical questions or warnings
    warning_pattern = re.compile(r'> \[\!WARNING\]|> \[\!IMPORTANT\]|> \[\!CAUTION\]', re.IGNORECASE)
    open_questions_pattern = re.compile(r'## Open Questions', re.IGNORECASE)
    user_review_pattern = re.compile(r'## User Review Required', re.IGNORECASE)

    has_warnings = bool(warning_pattern.search(content))
    has_open_questions = bool(open_questions_pattern.search(content))
    has_user_review = bool(user_review_pattern.search(content))

    if has_warnings or has_open_questions or has_user_review:
        print("SYSTEM INTERCEPT: Unresolved technical warnings or Open Questions detected in the Implementation Plan.")
        print("You MUST initiate both /party-mode (e.g. with architect-agent and dev-agent) AND /unknowns to resolve these before continuing.")

        print("MANDATORY OUTPUT RULE: The results of the debate, analysis, basis of each agent's opinion, and the final decision MUST be written directly into the Implementation Plan.")
        print("ONLY ask the user for input if the question is strictly business-related or if party-mode fails to reach consensus. The user will review the recorded debate in the plan.")
        return False
        
    # HARD GATE: Check if the mandatory Readiness Evaluation section exists
    if "## AI Socratic Debate & Unknowns Readiness Evaluation" not in content and "## AI Socratic Debate Report" not in content:
        print("❌ FAIL: Zero-Trust Violation. Implementation Plan is missing the mandatory '## AI Socratic Debate & Unknowns Readiness Evaluation' section.")
        print("You MUST run /party-mode and /unknowns, and embed their evaluation before asking for user approval, regardless of whether there are warnings.")
        return False

    # Check for debate-transcript if AI Debate Report or Readiness Evaluation exists in plan
    if "## AI Socratic Debate & Unknowns Readiness Evaluation" in content or "## AI Socratic Debate Report" in content:
        # Zero-Trust Subagent Invocation Check
        conv_id = os.environ.get("AGENT_CONVERSATION_ID")
        if not conv_id:
            # Try to guess it by looking at the most recently modified brain dir
            brain_base = os.environ.get("AGENT_BRAIN_PATH", str(Path.home() / ".gemini/antigravity/brain"))
            brain_dir = Path(brain_base)
            if brain_dir.exists():
                dirs = [d for d in brain_dir.iterdir() if d.is_dir() and d.name != "shared"]
                if dirs:
                    latest_dir = max(dirs, key=os.path.getmtime)
                    conv_id = latest_dir.name
                    
        if conv_id:
            brain_base = os.environ.get("AGENT_BRAIN_PATH", str(Path.home() / ".gemini/antigravity/brain"))
            transcript_file = Path(brain_base) / conv_id / ".system_generated/logs/transcript.jsonl"
            if transcript_file.exists():
                invoke_count = 0
                has_edge_case_guardian = False
                with open(transcript_file, 'r') as tf:
                    for line in tf:
                        if 'invoke_subagent' in line:
                            invoke_count += 1
                            if 'Edge Case Guardian' in line:
                                has_edge_case_guardian = True

                if not has_edge_case_guardian:
                    print(f"❌ FAIL: Zero-Trust Violation. Edge Case Guardian loop was NOT triggered during implementation plan generation in conversation {conv_id}.")
                    print("You MUST use the invoke_subagent tool to call the 'Edge Case Guardian' role to scan the plan.")
                    return False
                
                if invoke_count < 2:
                    print(f"❌ FAIL: Zero-Trust Violation. Socratic Debate claimed in plan, but fewer than 2 subagents were actually invoked in conversation {conv_id}.")
                    print("You MUST use the invoke_subagent tool to call experts. Do not hallucinate debates.")
                    return False
            else:
                print(f"⚠️ WARNING: Could not find system transcript at {transcript_file}")
        else:
            print(f"⚠️ WARNING: Could not determine AGENT_CONVERSATION_ID to verify subagent invocation.")
            
        if not transcript_path:

            print("FAIL: AI Debate mentioned in plan but no --transcript argument provided.")
            return False
            
        if not os.path.exists(transcript_path):
            print(f"FAIL: Provided transcript path does not exist: {transcript_path}")
            return False
            
        with open(transcript_path, 'r') as tf:
            t_content = tf.read()
            
        banned_phrases = ["I agree", "Good compromise"]
        for bp in banned_phrases:
            if bp.lower() in t_content.lower():
                print(f"FAIL: Banned phrase '{bp}' found in {transcript_path}. Sycophancy detected. Aborting.")
                return False
                
        if "NLM" in t_content or "NotebookLM" in t_content:
            print("NLM Triangulation detected in Party-Mode debate. Enforcing Zero-Trust physical gate...")
            if not evidence_file:
                evidence_file = "_iwish-output/adhoc-workspace/scratch/nlm_evidence.json"
                print(f"WARNING: No --evidence provided, defaulting to {evidence_file}")
            
            result = subprocess.run([sys.executable, ".agent/scripts/validate-nlm-hook-execution.py", evidence_file], capture_output=True, text=True)
            if result.returncode != 0:
                print(result.stdout)
                print("FAIL: Party-Mode NLM Triangulation failed Zero-Trust provenance check.")
                return False
            else:
                print(result.stdout)
    
    print("Plan validation passed. No blocking technical warnings found.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate an implementation plan")
    parser.add_argument("plan_path", help="Path to the implementation plan")
    parser.add_argument("--transcript", help="Path to the physical debate transcript file", default=None)
    parser.add_argument("--evidence", help="Path to NLM evidence JSON if applicable", default=None)
    
    args = parser.parse_args()
    if not validate_plan(args.plan_path, args.transcript, args.evidence):
        sys.exit(1)
    sys.exit(0)
