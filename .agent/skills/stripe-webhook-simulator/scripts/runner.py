#!/usr/bin/env python3
import argparse
import sys
import json
import urllib.request

def main():
    parser = argparse.ArgumentParser(description="Stripe Webhook Simulator")
    parser.add_argument("--target", required=True, help="Target URL (must be localhost)")
    parser.add_argument("--event", required=True, help="Event type to simulate")
    args = parser.parse_args()

    if "localhost" not in args.target and "127.0.0.1" not in args.target:
        print("ERROR: Target URL must be localhost.")
        sys.exit(1)

    payload = {
        "id": "evt_simulated",
        "object": "event",
        "type": args.event,
        "data": {
            "object": {
                "id": "obj_simulated",
                "tax_behavior": "inclusive"
            }
        }
    }

    try:
        req = urllib.request.Request(args.target, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        response = urllib.request.urlopen(req)
        print(f"Success: {response.getcode()}")
    except Exception as e:
        print(f"Failed to send webhook: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
