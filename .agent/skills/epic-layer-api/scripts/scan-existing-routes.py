#!/usr/bin/env python3
"""
Route Scanner for Epic Layer API
Scans backend routes in server/**/*.routes.ts and apps/api/src/**/*.routes.ts.
"""

import os
import re
import json
import argparse
from typing import List, Dict, Any


def scan_routes(root_dir: str) -> List[Dict[str, Any]]:
    routes = []
    search_dirs = [
        os.path.join(root_dir, "server"),
        os.path.join(root_dir, "apps", "api", "src"),
        os.path.join(root_dir, "src", "backend")
    ]

    for s_dir in search_dirs:
        if not os.path.exists(s_dir):
            continue
        for r, _, files in os.walk(s_dir):
            for f in files:
                if f.endswith(".routes.ts") or f.endswith(".router.ts"):
                    filepath = os.path.join(r, f)
                    relpath = os.path.relpath(filepath, root_dir)
                    try:
                        with open(filepath, "r", encoding="utf-8") as rf:
                            content = rf.read()
                            # Find route declarations e.g. fastify.get('/path' or router.post('/path'
                            matches = re.findall(r"(fastify|router|app)\.(get|post|put|delete|patch)\(\s*['\"]([^'\"]+)['\"]", content)
                            for m in matches:
                                routes.append({
                                    "method": m[1].upper(),
                                    "path": m[2],
                                    "file": relpath
                                })
                    except Exception:
                        pass
    return routes


def main():
    parser = argparse.ArgumentParser(description="Scan backend routes")
    parser.add_argument("--root", default=".", help="Workspace root")
    parser.add_argument("--output", type=str, help="Output JSON path")
    args = parser.parse_args()

    all_routes = scan_routes(os.path.abspath(args.root))

    if args.output:
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(all_routes, f, indent=2)
    else:
        print(json.dumps(all_routes, indent=2))


if __name__ == "__main__":
    main()
