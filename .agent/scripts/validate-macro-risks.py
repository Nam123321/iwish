#!/usr/bin/env python3
import yaml
import sys
import os
import re
import datetime

def validate_macro_risks(filepath):
    if not os.path.exists(filepath):
        print(f"Error: Macro risks file {filepath} not found.")
        sys.exit(1)

    try:
        with open(filepath, 'r') as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML: {e}")
        sys.exit(1)

    if not isinstance(data, dict) or 'risks' not in data:
        print("Error: Must contain a 'risks' list.")
        sys.exit(1)

    risks = data.get('risks', [])
    valid_types = {'product-market-fit', 'tech-stack-fit', 'architecture-decision', 'domain-assumption', 'business-model', 'regulatory', 'team-capability'}
    valid_statuses = {'monitored', 'validated', 'invalidated', 'retired'}

    errors = []
    
    for i, risk in enumerate(risks):
        required_fields = ['id', 'type', 'assumption', 'evidence_for', 'evidence_against', 'confidence', 'status', 'dependent_stories']
        for field in required_fields:
            if field not in risk:
                errors.append(f"Risk {i}: Missing required field '{field}'")
        
        # ID Format
        risk_id = risk.get('id', '')
        if not re.match(r'^MACRO-\d{8}-\d{3}$', risk_id):
            errors.append(f"Risk {i}: Invalid ID format '{risk_id}'. Expected MACRO-YYYYMMDD-NNN")
            
        # Type
        type_val = risk.get('type')
        if type_val not in valid_types:
            errors.append(f"Risk {i}: Invalid type '{type_val}'")
            
        # Confidence
        confidence = risk.get('confidence')
        if not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
            errors.append(f"Risk {i}: Confidence must be a float between 0.0 and 1.0")
            
        # Status
        status = risk.get('status')
        if status not in valid_statuses:
            errors.append(f"Risk {i}: Invalid status '{status}'")
            
        # Confidence History
        history = risk.get('confidence_history', [])
        if history:
            prev_date = None
            for idx, entry in enumerate(history):
                date_str = entry.get('date', '')
                try:
                    date_obj = datetime.datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    if prev_date and date_obj < prev_date:
                        errors.append(f"Risk {i}: confidence_history is not chronologically ordered at index {idx}")
                    prev_date = date_obj
                except ValueError:
                    errors.append(f"Risk {i}: Invalid date format in confidence_history '{date_str}'")

        # Cascade thresholds check
        if confidence is not None:
            if confidence < 0.3:
                cascade = risk.get('invalidation_cascade', {})
                if not cascade.get('cascade_acknowledged', False):
                    errors.append(f"Risk {i}: Confidence < 0.3 requires 'cascade_acknowledged: true' in invalidation_cascade to clear the block.")

    if errors:
        print("Macro Risks Validation Failed:")
        for error in errors:
            print(f" - {error}")
        sys.exit(1)
    
    print("Macro Risks Validation Passed.")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        validate_macro_risks(sys.argv[1])
    else:
        # Default path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        default_path = os.path.join(script_dir, '../../_iwish-output/unknowns/macro-risks.yaml')
        validate_macro_risks(default_path)
