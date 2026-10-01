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

import argparse
import yaml
import glob
import time
from pathlib import Path

def is_ai_workload(story_dir):
    """Checks if story.md has tag 'domain: AI-ML' or 'AI-ML'."""
    story_file = Path(story_dir).resolve() / "story.md"
    if not story_file.exists():
        return False, None

    try:
        content = story_file.read_text(encoding="utf-8", errors="ignore")
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                fm = yaml.safe_load(parts[1]) or {}
                # Check top-level domain attribute
                domain_val = str(fm.get("domain", "")).lower()
                if "ai-ml" in domain_val or "aiml" in domain_val or "ai architecture" in domain_val:
                    return True, story_file.stat().st_mtime

                tags = fm.get("tags", [])
                if isinstance(tags, list):
                    for t in tags:
                        if t in ["domain: AI-ML", "AI-ML", "aiml"]:
                            return True, story_file.stat().st_mtime
                elif isinstance(tags, str):
                    if tags in ["domain: AI-ML", "AI-ML", "aiml"]:
                        return True, story_file.stat().st_mtime
    except Exception:
        pass
    return False, None

def find_aiml_evidence(story_dir, story_mtime, story_id=None):
    """
    Searches for valid aiml evidence file in story dir or scratchpad.
    Enforces EC-P2-001: Evidence mtime must not be older than story mtime by > 5 minutes,
    and must not be older than 120 minutes total.
    Prevents Cross-Story Pollution by binding strictly to story_id if provided.
    """
    candidates = []
    
    # 1. Look inside story_dir
    story_path = Path(story_dir).resolve()
    candidates.extend(story_path.glob("*aiml*evidence*.json"))
    candidates.extend(story_path.glob("*tri-source-evidence*.json"))

    # 2. Look inside scratch directory (relative to project root)
    project_root = Path(_agent_dir).parent
    scratch_dir = (project_root / "_iwish-output" / "adhoc-workspace" / "scratch").resolve()
    if scratch_dir.exists():
        candidates.extend(scratch_dir.glob("*aiml*evidence*.json"))
        candidates.extend(scratch_dir.glob("*tri-source-evidence*.json"))

    valid_files = []
    current_time = time.time()

    for cand in candidates:
        try:
            mtime = cand.stat().st_mtime
            # Check maximum age (120 min)
            if (current_time - mtime) > 7200:
                continue
            # Check stale compared to story.md (EC-P2-001)
            if story_mtime and (story_mtime - mtime) > 300: # story was modified > 5 mins after evidence
                continue
            
            # Anti-pollution: If story_id is specified, evidence must contain or match story_id/story_dir
            if story_id:
                try:
                    ev_text = cand.read_text(encoding="utf-8", errors="ignore")
                    if story_id not in ev_text and str(story_path) not in ev_text:
                        continue
                except Exception:
                    continue

            valid_files.append((cand, mtime))
        except Exception:
            pass

    return valid_files

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust AI-ML Gate Entry Enforcer (Pure Category A)")
    parser.add_argument("--story-dir", required=True, help="Story directory path")
    parser.add_argument("--story-id", required=False, help="Story identifier")
    args = parser.parse_args()

    story_dir = os.path.realpath(args.story_dir)
    if not os.path.exists(story_dir):
        print(f"❌ Story directory does not exist: {story_dir}")
        sys.exit(1)

    is_ai, story_mtime = is_ai_workload(story_dir)
    if not is_ai:
        print("✅ [GATE ENTRY PASS] Story is NOT an AI-ML workload. Zero overhead pass-through.")
        sys.exit(0)

    print(f"🔍 [GATE ENTRY SCAN] Story in '{story_dir}' is tagged as AI-ML workload.")
    print("Checking physical existence of valid AI-ML Tri-Source Evidence...")

    valid_evidence = find_aiml_evidence(story_dir, story_mtime, args.story_id)

    if not valid_evidence:
        print("\n" + "="*80)
        print("❌ [ZERO-TRUST GATE ENTRY BLOCKED — HARD STOP]")
        print("L4 Enforced: Story contains 'domain: AI-ML' but NO valid AI/ML evidence was found!")
        print("EVIDENCE REQUIREMENTS:")
        print("  1. Evidence file must match: '*aiml*evidence*.json' or '*tri-source-evidence*.json'")
        print("  2. Evidence must not be older than 120 minutes.")
        print("  3. Evidence must not be stale (story.md was modified after evidence generation).")
        print("\nACTION REQUIRED BEFORE YOU CAN PROCEED TO PLAN OR CODE:")
        print("  Execute the AI System Architect workflow:")
        print("  /ai-system-architect --mode=evaluate")
        print("="*80 + "\n")
        sys.exit(1) # BLOCK

    latest_evidence = sorted(valid_evidence, key=lambda x: x[1], reverse=True)[0][0]
    print(f"✅ [GATE ENTRY PASS] Found valid AI/ML Evidence: {latest_evidence}")
    sys.exit(0)

if __name__ == "__main__":
    main()
