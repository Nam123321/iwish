import sys
import argparse
import json
import yaml

def run(context, dry_run=False):
    if dry_run:
        print("Cascade Actions Validator: DRY RUN SUCCESS")
        sys.exit(0)
        
    try:
        with open(context, 'r') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading {context}: {e}")
        sys.exit(1)
        
    confidence = data.get('overall_confidence', 1.0)
    
    result = {
        "confidence": confidence,
        "action": "proceed"
    }
    
    if confidence < 0.3:
        result["action"] = "halt"
        result["message"] = "CRITICAL: Confidence dropped below 0.3. Downstream execution HALTED. Trigger /pivot-project or /correct-course."
    elif confidence < 0.5:
        result["action"] = "escalate"
        result["message"] = "WARNING: Confidence dropped below 0.5. Escalating to user. Suggest /correct-course."
        
    print(json.dumps(result, indent=2))
    
    if result["action"] == "halt":
        sys.exit(1) # Return non-zero on halt to break pipeline
    sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("macro_risks_file", type=str, help="Path to macro-risks.yaml")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    
    run(args.macro_risks_file, args.dry_run)
