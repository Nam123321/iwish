#!/usr/bin/env python3
import os, sys
script_dir = os.path.dirname(os.path.abspath(__file__))
agent_dir = os.path.abspath(os.path.join(script_dir, ".."))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass

import argparse
import sys
import os
import re
import subprocess

def extract_lessons(file_path):
    if not os.path.exists(file_path):
        return None, None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Attempt to extract using regex to avoid LLM hallucination and costs.
    # We look for explicit headers like "### Root Cause" and "### Actionable Rule" or "### Lesson Learned"
    root_cause_match = re.search(r'###\s*(?:Root Cause|Nguyên nhân gốc rễ)[:\s]*\n(.*?)(?=\n###|\Z)', content, re.IGNORECASE | re.DOTALL)
    rule_match = re.search(r'###\s*(?:Actionable Rule|Lesson Learned|Bài học)[:\s]*\n(.*?)(?=\n###|\Z)', content, re.IGNORECASE | re.DOTALL)
    
    root_cause = root_cause_match.group(1).strip() if root_cause_match else "context-drift"
    rule = rule_match.group(1).strip() if rule_match else None
    
    return root_cause, rule

def main():
    parser = argparse.ArgumentParser(description="Extract lessons from review transcripts without bloating LLM context.")
    parser.add_argument("--story-id", required=True, help="The ID of the story")
    args = parser.parse_args()
    
    # 1. Locate the transcript
    possible_paths = [
        f"_iwish-output/reviews/review-story-{args.story_id}.md",
        f".agent/evolution-lab/reviews/review-story-{args.story_id}.md"
    ]
    
    target_file = None
    for p in possible_paths:
        if os.path.exists(p):
            target_file = p
            break
            
    if not target_file:
        print(f"No review transcript found for {args.story_id}. Skipping lesson extraction.")
        sys.exit(0)
        
    print(f"Extracting lessons from {target_file}...")
    root_cause, rule = extract_lessons(target_file)
    
    if not rule:
        print("No explicit actionable rule found in the transcript. Skipping to prevent spam.")
        sys.exit(0)
        
    # 2. Invoke capture-lesson.py
    cmd = [
        "python3", ".agent/scripts/capture-lesson.py",
        "--story-id", args.story_id,
        "--tags", "qa,approve,auto-extracted",
        "--phase", "review,qa",
        "--severity", "warning",
        "--domain", "general",
        "--root-cause", root_cause,
        "--context", f"Extracted from {target_file}",
        "--rule", rule
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully captured extracted lesson for {args.story_id}.")
    except subprocess.CalledProcessError as e:
        print(f"WARN: Failed to capture lesson: {e}")
        sys.exit(0) # Fault isolation: Do not fail the overall workflow

if __name__ == "__main__":
    main()
