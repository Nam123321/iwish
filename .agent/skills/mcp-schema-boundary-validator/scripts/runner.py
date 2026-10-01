import sys
import json
import re
import argparse

try:
    import iwish_runner_core
except ImportError:
    pass # For standalone execution fallback

def validate_schema(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}", file=sys.stderr)
        return False

    ssrf_pattern = re.compile(r'(127\.0\.0\.1|localhost|169\.254\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)')
    injection_pattern = re.compile(r'(ignore previous instructions|system prompt|you are a)', re.IGNORECASE)

    violations = 0
    
    def scan_node(node):
        nonlocal violations
        if isinstance(node, dict):
            for k, v in node.items():
                if isinstance(v, str):
                    if k in ['url', 'endpoint', 'server']:
                        if ssrf_pattern.search(v):
                            print(f"SSRF Violation found in URL: {v}")
                            violations += 1
                    if k in ['description', 'prompt']:
                        if injection_pattern.search(v):
                            print(f"Prompt Injection Violation found in description: {v}")
                            violations += 1
                else:
                    scan_node(v)
        elif isinstance(node, list):
            for item in node:
                scan_node(item)

    scan_node(data)

    if violations > 0:
        print(f"Validation FAILED: Found {violations} security violations.")
        return False
    
    print("Validation PASSED: No violations found.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MCP Schema Boundary Validator")
    parser.add_argument("--target", required=True, help="Path to the MCP JSON schema to validate")
    args = parser.parse_args()
    
    if validate_schema(args.target):
        sys.exit(0)
    else:
        sys.exit(1)
