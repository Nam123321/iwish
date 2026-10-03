#!/usr/bin/env python3
"""
AST Data Contract Linkage Validator (Epistemic Fact Grounding for Web UI)
Inspired by 3dviz-pro-max structural data contract & evidence linkage.
Validates that UI pages, smart containers, and stores are structurally anchored
to Data Contracts (@cowok/contracts, @cowok/shared, api-client) rather than
operating as decoupled, static mock shells.
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path

# --- [Watchmen Core Injection] ---
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

# Whitelist: Generic dumb presentation primitives are exempt from contract linkage (EC-ZT-03)
EXEMPT_DIRS = [
    "src/components/ui",
    "src/components/common",
    "src/components/layout/primitives",
]

# Patterns representing Data Contract imports
CONTRACT_IMPORT_PATTERNS = [
    re.compile(r'from\s+[\'"].*packages/contracts.*[\'"]'),
    re.compile(r'from\s+[\'"]@cowok/contracts.*[\'"]'),
    re.compile(r'from\s+[\'"]@cowok/shared.*[\'"]'),
    re.compile(r'from\s+[\'"].*api-client.*[\'"]'),
    re.compile(r'from\s+[\'"].*services/.*Service.*[\'"]'),
    re.compile(r'from\s+[\'"].*factories/.*\.factory.*[\'"]'),
    re.compile(r'fetch\s*\('),
    re.compile(r'apiClient\.'),
    re.compile(r'api\.(?:get|post|put|patch|delete)'),
]

# Patterns representing disguised mock arrays of records in business stores/components
DISGUISED_MOCK_ARRAY_PATTERNS = [
    re.compile(r'const\s+(?:INITIAL|SAMPLE|MOCK|DUMMY)_[A-Z0-9_]+\s*(?::\s*[^=]+)?=\s*\[\s*\{', re.MULTILINE),
    re.compile(r'export\s+const\s+[A-Z0-9_]+\s*(?::\s*[^=]+)?=\s*\[\s*\{\s*id\s*:', re.MULTILINE),
]

def is_exempt(filepath: str) -> bool:
    norm_path = filepath.replace("\\", "/")
    return any(exempt in norm_path for exempt in EXEMPT_DIRS)

def scan_file(filepath: str):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    has_contract_link = any(pat.search(content) for pat in CONTRACT_IMPORT_PATTERNS)
    mock_array_violations = []
    for pat in DISGUISED_MOCK_ARRAY_PATTERNS:
        matches = pat.findall(content)
        if matches:
            mock_array_violations.extend(matches)

    return {
        "file": filepath,
        "has_contract_link": bool(has_contract_link),
        "mock_array_violations": mock_array_violations,
    }

def main():
    parser = argparse.ArgumentParser(description="AST Data Contract Linkage Validator")
    parser.add_argument("--story-dir", required=False, help="Story directory")
    parser.add_argument("--files", nargs="*", help="Specific files to scan")
    parser.add_argument("--output", required=False, help="Output JSON path")
    args = parser.parse_args()

    files_to_scan = []
    if args.files:
        files_to_scan = args.files
    elif args.story_dir:
        impl_plan_path = os.path.join(args.story_dir, "impl-plan.md")
        if os.path.exists(impl_plan_path):
            with open(impl_plan_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            found_files = re.findall(r'\[(?:MODIFY|NEW)\]\s+\[.*?\]\((file:///[^)]+)\)', content)
            for ff in found_files:
                clean_path = ff.replace("file://", "")
                if (clean_path.endswith(".ts") or clean_path.endswith(".tsx") or clean_path.endswith(".js") or clean_path.endswith(".jsx")) and not clean_path.endswith(".test.ts") and not clean_path.endswith(".spec.ts"):
                    files_to_scan.append(clean_path)

    if not files_to_scan:
        # Fallback to scanning src/stores and src/components relevant to active stories
        for root, _, filenames in os.walk("src"):
            for fn in filenames:
                if fn.endswith((".ts", ".tsx")) and not fn.endswith((".test.ts", ".test.tsx", ".spec.ts")):
                    files_to_scan.append(os.path.join(root, fn))

    results = []
    failures = []

    for f in files_to_scan:
        if not os.path.exists(f) or is_exempt(f):
            continue
        # Only inspect smart containers, pages, desks, and stores
        if not any(marker in f for marker in ["stores", "Page", "Desk", "Panel", "canva", "Hub"]):
            continue

        res = scan_file(f)
        results.append(res)

        if res["mock_array_violations"]:
            failures.append(f"❌ [Hardcoded Mock Array] {f}: Found static record arrays disguised as initial state.")
        elif not res["has_contract_link"]:
            failures.append(f"❌ [Ungrounded UI Slop] {f}: Smart container / store has 0 imports from Data Contracts, API Client, or backend services.")

    status = "PASS" if not failures else "FAIL"
    report = {
        "status": status,
        "scanned_files_count": len(results),
        "failures": failures,
        "results": results
    }

    print(json.dumps(report, indent=2))

    if args.output:
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

    if failures:
        print(f"\n🚨 GATE FAILED: {len(failures)} Data Contract Linkage violations detected.")
        sys.exit(1)
    else:
        print("\n✅ GATE PASSED: All smart containers & stores are structurally linked to Data Contracts.")
        sys.exit(0)

if __name__ == "__main__":
    main()
