import sys
import json
import argparse

# Dummy implementation of iwish_runner_core import if needed
# import iwish_runner_core

def validate_json(target_file):
    try:
        with open(target_file, 'r') as f:
            data = json.load(f)
        print("JSON is valid.")
        return 0
    except json.JSONDecodeError as e:
        print(f"JSON validation failed: {e}")
        return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deterministic JSON validator")
    parser.add_argument("--target", required=True, help="Path to the JSON file to validate")
    args = parser.parse_args()
    sys.exit(validate_json(args.target))
