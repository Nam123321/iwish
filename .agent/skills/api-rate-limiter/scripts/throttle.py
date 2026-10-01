#!/usr/bin/env python3
import argparse
import subprocess
import json
import os
import time
import sys

STATE_FILE = ".agent/scratch/rate_limits.json"

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)

def main():
    parser = argparse.ArgumentParser(description="API Rate Limiter Wrapper")
    parser.add_argument("--api", required=True, help="Target API identifier (e.g. slack)")
    parser.add_argument("--command", required=True, help="Command to execute")
    args = parser.parse_args()

    state = load_state()
    api_state = state.get(args.api, {"reset_at": 0, "remaining": 100})

    now = time.time()
    if now < api_state["reset_at"] and api_state["remaining"] <= 0:
        sleep_time = api_state["reset_at"] - now
        print(f"[THROTTLE] Rate limit exceeded for {args.api}. Sleeping for {sleep_time:.2f}s...")
        time.sleep(sleep_time)

    print(f"[THROTTLE] Executing command for {args.api}...")
    result = subprocess.run(args.command, shell=True, capture_output=True, text=True)
    
    # Very basic heuristic for 429
    if "429 Too Many Requests" in result.stdout or "429 Too Many Requests" in result.stderr:
        print(f"[THROTTLE] Detected 429! Backing off...")
        api_state["remaining"] = 0
        api_state["reset_at"] = time.time() + 60 # Default 60s backoff
    else:
        api_state["remaining"] = max(0, api_state["remaining"] - 1)
        
    state[args.api] = api_state
    save_state(state)

    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
        
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
