#!/usr/bin/env python3
import os
import json
import argparse
from typing import List, Dict, Any

def scan_logs(log_dir: str) -> List[Dict[str, Any]]:
    """
    Scans runner state/log files for repeated failures.
    Fault-Tolerant parsing handles JSONDecodeError for truncated/crashed logs.
    """
    recurring_issues = []
    
    if not os.path.exists(log_dir):
        print(f"Log directory '{log_dir}' not found.")
        return recurring_issues
        
    for filename in os.listdir(log_dir):
        if filename.endswith("_state.json") or filename.endswith(".log"):
            filepath = os.path.join(log_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                # Look for recurring issues in history
                if "history" in data and len(data["history"]) > 1:
                    recurring_issues.append({
                        "file": filename,
                        "attempts": data.get("attempts", len(data["history"])),
                        "latest_error": data["history"][-1].get("reason", "Unknown")
                    })
            except json.JSONDecodeError:
                print(f"Warning: Failed to parse '{filename}'. File may be truncated due to SDK crash.")
                continue
            except Exception as e:
                print(f"Error reading '{filename}': {e}")
                
    return recurring_issues

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retro Log Scanner (Fault-Tolerant)")
    parser.add_argument("--dir", default=".", help="Directory containing runner state logs")
    args = parser.parse_args()
    
    issues = scan_logs(args.dir)
    if issues:
        print(json.dumps({"status": "FOUND_ISSUES", "issues": issues}, indent=2))
    else:
        print(json.dumps({"status": "CLEAN", "message": "No recurring issues found in logs."}))
