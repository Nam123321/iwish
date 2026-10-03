#!/usr/bin/env python3
import sys
import os
import argparse

def validate_script(script_path):
    if not os.path.exists(script_path):
        print(f"❌ FAIL: Script not found: {script_path}")
        sys.exit(1)

    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()

    missing = []
    if script_path.endswith('.py'):
        if "import watchmen_core" not in content:
            missing.append("import watchmen_core")
        if "watchmen_core.verify_execution(__file__)" not in content:
            missing.append("watchmen_core.verify_execution(__file__)")
    elif script_path.endswith('.js'):
        if "require('./watchmen_core.js').verify_execution(__filename)" not in content:
            missing.append("require('./watchmen_core.js').verify_execution(__filename)")

    if missing:
        print(f"❌ FAIL: Watchmen compliance failed for {script_path}")
        print("   Missing the following required Zero-Trust lines:")
        for m in missing:
            print(f"   - {m}")
        print("\n   ACTION REQUIRED:")
        print("   1. Inject the missing lines at the top of the script.")
        print("   2. Run 'python3 .agent/scripts/watchmen_signer.py' to update the .sig file.")
        sys.exit(1)

    # Check if the script is in scripts-lock.sig
    sig_path = ".agent/config/scripts-lock.sig"
    if os.path.exists(sig_path):
        with open(sig_path, 'r', encoding='utf-8', errors='ignore') as f:
            sig_content = f.read()
            basename = os.path.basename(script_path)
            if basename not in sig_content:
                print(f"⚠️ WARNING: Script {basename} passed content check but might not be in {sig_path}.")
                print("   Remember to run 'python3 .agent/scripts/watchmen_signer.py'.")

    print(f"✅ PASS: Watchmen compliance verified for {script_path}.")

def main():
    parser = argparse.ArgumentParser(description="Verify Watchmen compliance in scripts.")
    parser.add_argument('--script', required=False, help="Path to the script to check.")
    args = parser.parse_args()

    if args.script:
        validate_script(args.script)
    else:
        scripts_dir = ".agent/scripts"
        skip_files = {'watchmen_core.py', 'watchmen_core.js', 'watchmen_signer.py', 'validate-watchmen-compliance.py', 'watchmen_policy.py', 'watchmen_client.py'}
        for f in os.listdir(scripts_dir):
            if f in skip_files:
                continue
            if f.endswith('.py') or f.endswith('.js'):
                validate_script(os.path.join(scripts_dir, f))
        sys.exit(0)



if __name__ == '__main__':
    main()
