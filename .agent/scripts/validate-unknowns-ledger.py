#!/usr/bin/env python3
import yaml
import sys
import os
import re

def validate_ledger(filepath):
    if not os.path.exists(filepath):
        print(f"Error: Ledger file {filepath} not found.")
        sys.exit(1)

    try:
        with open(filepath, 'r') as f:
            ledger = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML: {e}")
        sys.exit(1)

    if not isinstance(ledger, dict) or 'entries' not in ledger:
        print("Error: Ledger must contain an 'entries' list.")
        sys.exit(1)

    entries = ledger.get('entries', [])
    valid_quadrants = {'unknown-unknown', 'known-unknown', 'unknown-known', 'known-known'}
    valid_statuses = {'open', 'investigating', 'mitigated', 'verified-hit', 'false-positive'}

    errors = []
    
    for i, entry in enumerate(entries):
        required_fields = ['id', 'quadrant', 'source_phase', 'technique_used', 'finding', 'severity', 'confidence', 'status']
        for field in required_fields:
            if field not in entry:
                errors.append(f"Entry {i}: Missing required field '{field}'")
        
        # ID Format
        entry_id = entry.get('id', '')
        if not re.match(r'^(MICRO|MACRO)-\d{8}-\d{3}$', entry_id):
            errors.append(f"Entry {i}: Invalid ID format '{entry_id}'. Expected (MICRO|MACRO)-YYYYMMDD-NNN")
            
        # Quadrant
        quadrant = entry.get('quadrant')
        if quadrant not in valid_quadrants:
            errors.append(f"Entry {i}: Invalid quadrant '{quadrant}'")
            
        # Confidence
        confidence = entry.get('confidence')
        if not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
            errors.append(f"Entry {i}: Confidence must be a float between 0.0 and 1.0")
            
        # Status
        status = entry.get('status')
        if status not in valid_statuses:
            errors.append(f"Entry {i}: Invalid status '{status}'")
            
        # Finding text
        finding = entry.get('finding', '')
        if len(finding) < 50:
            errors.append(f"Entry {i}: Finding text must be > 50 characters")
        if re.search(r'(placeholder|mock|tbd)', finding, re.IGNORECASE):
            errors.append(f"Entry {i}: Finding text contains mock data ('placeholder', 'mock', 'TBD')")

    if errors:
        print("Ledger Validation Failed:")
        for error in errors:
            print(f" - {error}")
        sys.exit(1)
    
    print("Ledger Validation Passed.")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        validate_ledger(sys.argv[1])
    else:
        # Default path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        default_path = os.path.join(script_dir, '../../_iwish-output/unknowns/unknowns-ledger.yaml')
        validate_ledger(default_path)
