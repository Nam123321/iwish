#!/usr/bin/env python3
import sys
import os
import argparse
import subprocess
import json

def run_command(cmd):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60, check=True)
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        print(f"Error: Command '{' '.join(cmd)}' timed out after 60s.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        # Ignore git diff exit 1 if it means differences exist
        return e.stdout.strip()

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Behavioral Coverage Guardian")
    parser.add_argument("--story", required=True, help="Story ID to validate")
    parser.add_argument("--coverage-file", default="coverage/lcov.info", help="Path to coverage file")
    
    args = parser.parse_args()

    # Pillar 1: Check coverage file physical existence
    if not os.path.exists(args.coverage_file):
        print(f"[TYPE 1: Execution Missing] Physical coverage file {args.coverage_file} does not exist. Tests must be executed prior to or during review.")
        sys.exit(1)

    print(f"✅ Found physical coverage file: {args.coverage_file}")

    # Read modified files from git diff
    # Usually we get changes against main
    git_diff_cmd = ["git", "diff", "--name-only", "main...HEAD"]
    diff_output = run_command(git_diff_cmd)
    modified_files = [f for f in diff_output.split("\n") if f.endswith(".ts") or f.endswith(".js")]
    
    business_files = [f for f in modified_files if not f.endswith(".test.ts") and not f.endswith(".spec.ts") and not f.endswith(".types.ts") and not f.endswith(".d.ts") and not f.endswith(".interface.ts")]

    if not business_files:
        print("✅ No business logic files modified. Skipping coverage check.")
        sys.exit(0)

    # Read lcov.info to extract files covered
    covered_files = set()
    total_lf = 0
    total_lh = 0
    with open(args.coverage_file, "r") as f:
        for line in f:
            if line.startswith("SF:"):
                covered_files.add(line.strip()[3:])
            elif line.startswith("LF:"):
                total_lf += int(line.strip()[3:])
            elif line.startswith("LH:"):
                total_lh += int(line.strip()[3:])

    # Pillar X: Global Test Coverage Threshold
    THRESHOLD = 80.0
    if total_lf > 0:
        coverage_pct = (total_lh / total_lf) * 100
        if coverage_pct < THRESHOLD:
            print(f"[TYPE 3: Coverage Threshold Failed] Global test coverage is {coverage_pct:.2f}%, which is below the required {THRESHOLD}% threshold set by the Retro AI Council.")
            sys.exit(1)
        else:
            print(f"✅ Global test coverage is {coverage_pct:.2f}% (meets {THRESHOLD}% threshold).")

    # Map diff files to coverage
    # Note: LCOV usually uses absolute paths or relative paths. We check by suffix match.
    missing_coverage = []
    for bf in business_files:
        matched = False
        for cf in covered_files:
            if cf.endswith(bf):
                matched = True
                break
        if not matched:
            missing_coverage.append(bf)

    if missing_coverage:
        print(f"[TYPE 2: Insufficient Behavioral Coverage] The following modified files lack coverage data: {', '.join(missing_coverage)}")
        sys.exit(1)

    print("✅ All modified business logic files have physical test coverage records.")
    sys.exit(0)

if __name__ == "__main__":
    main()
