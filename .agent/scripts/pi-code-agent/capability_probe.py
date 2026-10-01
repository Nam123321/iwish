#!/usr/bin/env python3
"""Report host capabilities without claiming unavailable LSP or agent support."""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    result = {
        "schema_version": "1.0",
        "host": sys.platform,
        "python": sys.version.split()[0],
        "project_root": str(root),
        "tools": {name: bool(shutil.which(name)) for name in ["git", "node", "npm", "npx", "python3"]},
        "project": {"agent_dir": (root / ".agent").is_dir(), "worktree_dir": (root / ".worktrees").is_dir()},
        "lsp": {"claimed": False, "reason": "probe does not infer LSP from a compiler binary"},
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
