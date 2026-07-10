import yaml
import sys
import os

def validate(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    with open(file_path, 'r') as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            print(f"Error: Invalid YAML: {e}")
            sys.exit(1)
            
    if not isinstance(data, dict):
        print("Error: Root must be a dictionary")
        sys.exit(1)
        
    required_keys = ['schema_version', 'statistics', 'findings']
    for key in required_keys:
        if key not in data:
            print(f"Error: Missing required key '{key}'")
            sys.exit(1)
            
    print("Validation passed.")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate-unknowns-ledger.py <path_to_ledger>")
        sys.exit(1)
    validate(sys.argv[1])
