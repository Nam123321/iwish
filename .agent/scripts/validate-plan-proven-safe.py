#!/usr/bin/env python3
import os, sys, time, subprocess
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

import re
import json
import argparse
from pathlib import Path

def validate_plan_proven_safe(file_path, story_id=None, story_dir=None):
    if not os.path.exists(file_path):
        print(f"❌ FAIL: Target implementation plan not found: {file_path}")
        return False
        
    file_path_obj = Path(file_path)
    
    # Infer story_dir if not provided
    if not story_dir:
        story_dir = str(file_path_obj.parent)
    
    # Infer story_id from dir name if not provided
    if not story_id:
        dir_name = os.path.basename(story_dir)
        match = re.search(r'Story-([\d\.]+)', dir_name, re.IGNORECASE)
        if match:
            story_id = match.group(1)
        else:
            match = re.search(r'(?:story-?)([\d\.]+)', dir_name, re.IGNORECASE)
            if match:
                story_id = match.group(1)
            else:
                print("❌ FAIL: Could not infer story_id from directory name. You MUST explicitly pass --story-id.")
                return False

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    errors = []

    
    # 1. Deep Audit Pillar Check (Physical Evidence)
    drift_context_path = os.path.join(os.path.abspath(os.path.join(_agent_dir, "..", "_iwish-output", "audits")), f"drift-context-{story_id}.json")
    if not os.path.exists(drift_context_path):
        errors.append(f"[Zero-Trust] Physical Evidence Missing: Could not find '{drift_context_path}'. You MUST run /deep-audit --story-id {story_id}.")
    else:
        mtime = os.path.getmtime(drift_context_path)
        if time.time() - mtime > 7200:
            errors.append(f"[Zero-Trust] Stale Evidence: 'drift-context-{story_id}.json' is older than 2 hours. Please re-run /deep-audit.")
        else:
            try:
                import json
                with open(drift_context_path, 'r') as f:
                    drift_data = json.load(f)
                    if drift_data.get('story_id') != story_id:
                        errors.append("[Zero-Trust] Forgery Detected: drift-context json 'story_id' mismatch.")
                    elif not drift_data.get('files_scanned') or drift_data.get('files_scanned') <= 0:
                        errors.append("[Zero-Trust] Forgery Detected: drift-context json 'files_scanned' is missing or 0.")
                    elif drift_data.get('status') != 'success':
                        errors.append("[Zero-Trust] Forgery Detected: drift-context json 'status' is not success.")
            except Exception as e:
                errors.append(f"[Zero-Trust] Evidence Corrupted: Could not parse drift-context.json. {str(e)}")

    
    # 2. Unknowns Discovery Pillar Check
    if not re.search(r"##\s+(?:\d+\.\s*)?.*(?:Unknowns Discovery|Unknowns Assessment|Unknowns|Epistemic Audit)", content, re.IGNORECASE):
        errors.append("Pillar 2 Missing: Plan lacks an '## Unknowns Discovery & Epistemic Audit' section.")

    # 3. Party-Mode Debate Pillar Check
    if not re.search(r"##\s+(?:\d+\.\s*)?.*(?:AI Socratic Debate|Party-Mode Debate|Party Mode|Socratic Debate|Consensus Report)", content, re.IGNORECASE):
        errors.append("Pillar 3 Missing: Plan lacks an '## AI Socratic Debate & Consensus Report' section.")

    # 4. Edge Case Guardian / FMEA Pillar Check
    if not re.search(r"##\s+(?:\d+\.\s*)?.*(?:Edge Case|13-Pillar|FMEA|Hybrid Scorecard)", content, re.IGNORECASE):
        errors.append("Pillar 4 Missing: Plan lacks a '## Edge Case Guardian & 13-Pillar FMEA Scan' section.")

    # 5. Open Technical Warnings or Unresolved Questions Check
    open_questions_pattern = re.compile(r'## Open Questions', re.IGNORECASE)
    if open_questions_pattern.search(content):
        oq_part = content.split("## Open Questions")[1].split("##")[0].strip()
        if oq_part and not re.search(r"^(?:None|Không có|N/A|\s*-\s*None)\.?$", oq_part, re.IGNORECASE):
            errors.append("Unresolved Open Questions: Plan contains unanswered questions that must be resolved via /party-mode or /unknowns.")

    # 6. Check Proven Safe Verdict
    if not re.search(r'(?:VERDICT:\s*PROVEN_SAFE|STATUS:\s*PROVEN_SAFE|✅\s*PROVEN_SAFE|\*\*Verdict\*\*:\s*PROVEN_SAFE)', content, re.IGNORECASE):
        errors.append("Missing Final Verdict: Plan must explicitly conclude with 'VERDICT: PROVEN_SAFE'.")

    # 7. Content-Aware Physical Evidence Binding (Anti-Hallucination & Anti-Touch Bypass)
    current_time = time.time()
    max_age_seconds = 120 * 60 # 120 minutes
    
    # Check Unknowns Ledger
    unknowns_ledger_path = os.path.join(story_dir, "unknowns-ledger.yaml")
    unknowns_report_path = os.path.join(story_dir, "unknowns-report.json")
    
    has_valid_unknowns = False
    
    for path in [unknowns_ledger_path, unknowns_report_path]:
        if os.path.exists(path):
            mtime = os.path.getmtime(path)
            if (current_time - mtime) <= max_age_seconds:
                with open(path, "r", encoding="utf-8") as f:
                    file_content = f.read()
                    if story_id in file_content:
                        has_valid_unknowns = True
                        break


    if not has_valid_unknowns:
        # Check if they used global unknowns
        global_unknowns = os.path.abspath(os.path.join(_agent_dir, "..", "_iwish-output", "unknowns", "unknowns-ledger.yaml"))
        if os.path.exists(global_unknowns):
            mtime = os.path.getmtime(global_unknowns)
            if (current_time - mtime) <= max_age_seconds:
                with open(global_unknowns, "r", encoding="utf-8") as f:
                    if story_id in f.read():
                        has_valid_unknowns = True

    if not has_valid_unknowns:
        errors.append(f"[Zero-Trust] Physical Evidence Missing/Stale: Could not find valid recent 'unknowns-ledger.yaml' containing story ID '{story_id}'.")

    # Check Edge Case Guardian Review
    project_root = os.path.abspath(os.path.join(_agent_dir, ".."))
    review_file = os.path.join(project_root, "_iwish-output", "reviews", f"review-story-{story_id}.md")
    
    has_valid_edge_case = False
    if os.path.exists(review_file):
        mtime = os.path.getmtime(review_file)
        if (current_time - mtime) <= max_age_seconds:
            with open(review_file, "r", encoding="utf-8") as f:
                content = f.read()
                if re.search(r"(?:RPN|Edge Case|Pillar|FMEA)", content, re.IGNORECASE):
                    has_valid_edge_case = True
                    
    # Also check risk matrix if epic is known
    epic_id = story_id.split('.')[0] if '.' in story_id else None
    if not has_valid_edge_case and epic_id:
        risk_matrix = os.path.join(project_root, "_iwish-output", "edge-case-knowledge", "epics", f"Epic-{epic_id}-risk-matrix.md")
        if os.path.exists(risk_matrix):
            mtime = os.path.getmtime(risk_matrix)
            if (current_time - mtime) <= max_age_seconds:
                has_valid_edge_case = True

    if not has_valid_edge_case:
        errors.append(f"[Zero-Trust] Physical Evidence Missing/Stale: Could not find valid recent 'review-story-{story_id}.md' with Edge Case data.")

    # Check AI-ML Pillar if story is tagged domain: AI-ML
    story_file = os.path.join(story_dir, "story.md")
    is_aiml = False
    if os.path.exists(story_file):
        try:
            with open(story_file, "r", encoding="utf-8", errors="ignore") as f:
                story_content = f.read()
                if "domain: AI-ML" in story_content or "AI-ML" in story_content:
                    is_aiml = True
        except Exception:
            pass

    if is_aiml:
        # Verify AI-ML Tri-Source Evidence bound strictly to story_id to prevent Cross-Story pollution
        scratch_dir = os.path.join(project_root, "_iwish-output", "adhoc-workspace", "scratch")
        aiml_candidates = []
        for d in [story_dir, scratch_dir]:
            if os.path.exists(d):
                for fname in os.listdir(d):
                    if ("aiml" in fname or "tri-source" in fname) and fname.endswith(".json"):
                        fpath = os.path.join(d, fname)
                        mtime = os.path.getmtime(fpath)
                        if (current_time - mtime) <= max_age_seconds:
                            try:
                                with open(fpath, "r", encoding="utf-8", errors="ignore") as ef:
                                    ev_content = ef.read()
                                    if story_id in ev_content or story_dir in ev_content:
                                        aiml_candidates.append(fpath)
                            except Exception:
                                pass
        
        if not aiml_candidates:
            errors.append(f"[Zero-Trust Category A] Story is tagged 'domain: AI-ML' but lacks valid AI-ML Tri-Source Evidence JSON for story '{story_id}' in '{story_dir}' or scratch. Run '/ai-system-architect --mode=evaluate'.")
        else:
            # Validate latest evidence with validator script
            latest_ev = sorted(aiml_candidates, key=os.path.getmtime, reverse=True)[0]
            val_script = os.path.join(_script_dir, "validate-aiml-evidence.py")
            if os.path.exists(val_script):
                # Extract conversation ID from environment or evidence
                convo_id = os.environ.get("CONVERSATION_ID", "")
                if not convo_id:
                    try:
                        with open(latest_ev, "r", encoding="utf-8") as ef:
                            ev_data = json.load(ef)
                            convo_id = ev_data.get("conversation_id", "")
                    except Exception:
                        pass
                
                cmd = ["python3", val_script, "--file", latest_ev]
                if convo_id:
                    cmd.extend(["--conversation-id", convo_id])

                res = subprocess.run(cmd, capture_output=True, text=True)
                if res.returncode != 0:
                    errors.append(f"[Zero-Trust Category A] AI-ML Evidence validation failed for '{latest_ev}': {res.stderr or res.stdout}")


    # Output results
    if errors:
        print("❌ FAIL: Implementation Plan is NOT YET Proven Safe:")
        for err in errors:
            print(f"   - {err}")
        return False

    print("✅ PASS: Implementation Plan is verified 100% PROVEN SAFE across all 4 pillars (Content-Aware Evidence verified).")
    return True

def main():
    parser = argparse.ArgumentParser(description="Deterministic Validator for Proven Safe Implementation Plans.")
    parser.add_argument("--file", "-f", required=True, help="Path to implementation_plan.md or impl-plan.md")
    parser.add_argument("--story-id", help="Explicit Story ID")
    parser.add_argument("--story-dir", help="Explicit Story Directory")
    args = parser.parse_args()

    success = validate_plan_proven_safe(args.file, args.story_id, args.story_dir)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
