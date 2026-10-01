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

import sys
import json
import os
import hashlib

def parse_args():
    if len(sys.argv) < 2:
        print("ERROR: Missing receipt file path argument")
        sys.exit(1)
    return sys.argv[1]

def attest_evidence(receipt_path):
    if not os.path.exists(receipt_path):
        return {"valid": False, "error": f"Receipt file not found: {receipt_path}"}
        
    try:
        with open(receipt_path, 'r') as f:
            content = f.read()
            receipt = json.loads(content)
    except json.JSONDecodeError:
        return {"valid": False, "error": "Receipt is not valid JSON"}
    except Exception as e:
        return {"valid": False, "error": f"Failed to read receipt: {str(e)}"}
        
    # Zero-Trust Validation Rules
    required_fields = ['tool_id', 'execution_id', 'status', 'coverage', 'findings']
    for field in required_fields:
        if field not in receipt:
            return {"valid": False, "error": f"Missing required field: {field}"}
            
    status = receipt['status']
    if status not in ['VERIFIED', 'FAILED', 'UNASSESSED', 'INVALID']:
        return {"valid": False, "error": f"Invalid strict state status: {status}"}
        
    coverage = receipt['coverage']
    if not isinstance(coverage, (int, float)):
        return {"valid": False, "error": "Coverage must be a number"}
        
    # Nonzero coverage rule
    if status == 'VERIFIED' and coverage <= 0:
        return {"valid": False, "error": "A tool cannot claim VERIFIED status with zero or negative coverage"}
        
    # Digest generation to ensure single-writer immutability
    digest = hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    return {
        "valid": True,
        "digest": digest,
        "tool_id": receipt['tool_id'],
        "status": status,
        "coverage": coverage,
        "finding_count": len(receipt.get('findings', []))
    }

def main():
    receipt_path = parse_args()
    result = attest_evidence(receipt_path)
    
    if result['valid']:
        print(f"ATTESTATION PASSED: {result['tool_id']} | Digest: {result['digest'][:8]} | Coverage: {result['coverage']}")
        sys.exit(0)
    else:
        print(f"ATTESTATION FAILED: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main()
