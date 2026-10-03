#!/usr/bin/env python3
import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

"""Shared constants for pipeline validation scripts.
Centralizes source directory roots and exclusion patterns to avoid
hardcoded 'src/' locality bugs across multiple scripts."""

# All directories known to contain production/application source code.
# Add new roots here when the project structure evolves.
SOURCE_ROOTS = [
    "src",
    "server",
    "apps",
    "packages",
    "backend",
    "frontend",
    "app",
]

# Directories to always exclude from source scans.
EXCLUDE_DIRS = {
    "node_modules",
    ".tmp",
    "dist",
    "out",
    "__pycache__",
    ".next",
    ".venv",
    "coverage",
    "playwright-report",
    "test-results",
}

# File extensions considered source code.
SOURCE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

# File extensions considered source code (no tests).
SOURCE_EXTENSIONS_NO_TEST = {".ts", ".tsx", ".js", ".jsx"}

# Test file patterns to exclude when scanning production code.
TEST_PATTERNS = {".test.", ".spec.", "/__tests__/", "/tests/", "/test/"}


def get_source_files(project_root, extensions=None, include_tests=False):
    """Recursively collect source files from all SOURCE_ROOTS.

    Args:
        project_root: Path to the project root directory.
        extensions: Set of file extensions to include (default: SOURCE_EXTENSIONS).
        include_tests: If False, excludes files matching TEST_PATTERNS.

    Returns:
        List of Path objects for matching source files.
    """
    from pathlib import Path

    if extensions is None:
        extensions = SOURCE_EXTENSIONS

    root = Path(project_root)
    results = []

    for src_root in SOURCE_ROOTS:
        src_dir = root / src_root
        if not src_dir.exists():
            continue

        for f in src_dir.rglob("*"):
            if not f.is_file():
                continue
            if f.suffix not in extensions:
                continue

            # Check exclusions
            if any(excl in f.parts for excl in EXCLUDE_DIRS):
                continue
            
            rel = str(f.relative_to(root))

            if not include_tests:
                if any(pat in rel for pat in TEST_PATTERNS):
                    continue

            results.append(f)

    return results
