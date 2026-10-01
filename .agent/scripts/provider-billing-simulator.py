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
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import argparse, time, random, json
parser = argparse.ArgumentParser()
parser.add_argument("--provider", required=True)
parser.add_argument("--trace-id", required=True)
parser.add_argument("--drift-percent", type=float, default=0.0)
args = parser.parse_args()
time.sleep(1)
final_cost = round(10.0 * (1 + args.drift_percent / 100.0) * random.uniform(0.001, 0.05), 4)
print(json.dumps({"status": "success", "provider": args.provider, "trace_id": args.trace_id, "simulated_cost_usd": final_cost}, indent=2))
