#!/usr/bin/env python3
# --- [Watchmen Core Injection] ---
import os, sys
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass
# ---------------------------------
import argparse
import json
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Validate Repo Absorption Stage Artifacts")
    parser.add_argument("--target", required=True, help="Repository name (e.g. drawdb)")
    parser.add_argument("--phase", required=True, choices=["discovery", "analysis", "evaluation", "integration"], help="Absorption stage")
    args = parser.parse_args()

    iwish_home = Path(os.environ.get("IWISH_HOME", Path.home() / ".iwish")).resolve()
    repo_dir = iwish_home / "absorbed-repos" / args.target

    if not repo_dir.exists():
        print(f"❌ Target repo directory not found: {repo_dir}")
        sys.exit(1)

    if args.phase == "discovery":
        # 1. Security report
        sec_report = repo_dir / "00-security" / "security-report.md"
        if not sec_report.exists():
            sec_report = repo_dir / "security-report.md"
        if not sec_report.exists() or sec_report.stat().st_size == 0:
            print(f"❌ Missing or empty security report: {sec_report}")
            sys.exit(1)

        # 2. CGC Health Report
        cgc_report = repo_dir / "01-indexing" / "cgc-health-report.json"
        if not cgc_report.exists():
            print(f"❌ Missing cgc-health-report.json: {cgc_report}")
            sys.exit(1)
        try:
            with open(cgc_report, "r", encoding="utf-8") as f:
                cgc_data = json.load(f)
            parse_rate = cgc_data.get("parse_rate", 0)
            if parse_rate < 0.6:
                print(f"❌ CGC parse rate too low: {parse_rate} (< 0.6)")
                sys.exit(1)
        except Exception as e:
            print(f"❌ Invalid cgc-health-report.json: {e}")
            sys.exit(1)

        # 3. Asset Inventory
        inventory = repo_dir / "01-indexing" / "asset-inventory.md"
        if not inventory.exists() or inventory.stat().st_size == 0:
            print(f"❌ Missing or empty asset-inventory.md: {inventory}")
            sys.exit(1)

        # 4. Architecture Map
        arch_map = repo_dir / "01-indexing" / "architecture-map.md"
        if not arch_map.exists() or arch_map.stat().st_size == 0:
            print(f"❌ Missing or empty architecture-map.md: {arch_map}")
            sys.exit(1)

        print(f"✅ Stage 1 Discovery validation passed for '{args.target}'!")
        print(f"   - Security Report: {sec_report.name}")
        print(f"   - CGC Health: parse_rate = {parse_rate * 100:.1f}%")
        print(f"   - Asset Inventory: {inventory.name}")
        print(f"   - Architecture Map: {arch_map.name}")
        sys.exit(0)

    elif args.phase == "analysis":
        # 1. Trace matrix
        matrix = repo_dir / "02-deep-dive" / "trace-matrix.json"
        if not matrix.exists() or matrix.stat().st_size == 0:
            print(f"❌ Missing or empty trace-matrix.json: {matrix}")
            sys.exit(1)

        # 2. Community report
        comm_report = repo_dir / "03-community" / "community-report.md"
        if not comm_report.exists() or comm_report.stat().st_size == 0:
            print(f"❌ Missing or empty community-report.md: {comm_report}")
            sys.exit(1)

        # 3. DNA artifact
        dna_path = iwish_home / "repo-dna" / f"{args.target}-dna.md"
        if not dna_path.exists() or dna_path.stat().st_size == 0:
            print(f"❌ Missing or empty repo DNA: {dna_path}")
            sys.exit(1)

        print(f"✅ Stage 2 Analysis validation passed for '{args.target}'!")
        sys.exit(0)

if __name__ == "__main__":
    main()
