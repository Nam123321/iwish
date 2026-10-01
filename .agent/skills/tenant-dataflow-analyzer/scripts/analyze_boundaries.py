import ast
import argparse
import os
import sys

def check_tenant_boundaries(file_path):
    violations = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
            
        tree = ast.parse(code)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Analyze if function processes data but lacks tenant identity context
                func_name = node.name.lower()
                if any(kw in func_name for kw in ['ingest', 'process', 'store', 'load', 'extract', 'transform']):
                    has_tenant_arg = any('tenant' in arg.arg.lower() for arg in node.args.args)
                    has_tenant_kwargs = node.args.kwarg and 'tenant' in node.args.kwarg.arg.lower()
                    
                    if not (has_tenant_arg or has_tenant_kwargs):
                        violations.append(f"Function '{node.name}' (line {node.lineno}) handles data but lacks explicit tenant context parameters.")
                        
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        
    return violations

def main():
    parser = argparse.ArgumentParser(description="Tenant Dataflow Boundary Analyzer")
    parser.add_argument("--target", required=True, help="Target file or directory to analyze")
    args = parser.parse_args()
    
    all_violations = []
    
    if os.path.isfile(args.target):
        if args.target.endswith('.py'):
            violations = check_tenant_boundaries(args.target)
            all_violations.extend([(args.target, v) for v in violations])
    elif os.path.isdir(args.target):
        for root, _, files in os.walk(args.target):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    violations = check_tenant_boundaries(file_path)
                    all_violations.extend([(file_path, v) for v in violations])
                        
    if all_violations:
        print("FAIL: Tenant Dataflow Boundary Violations Detected:")
        for path, violation in all_violations:
            print(f"[{path}] {violation}")
        sys.exit(1)
    else:
        print("PASS: No tenant boundary violations detected.")
        sys.exit(0)

if __name__ == "__main__":
    main()
