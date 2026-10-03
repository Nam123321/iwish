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

import re
import time
import shutil
import hashlib
import argparse
from pathlib import Path

CHUNK_SIZE = 64 * 1024  # 64 KB streaming buffer for large files
MAX_SAFE_FILE_SIZE = 5 * 1024 * 1024  # 5 MB threshold

# Standard Root Whitelist: config and repository essential files
ROOT_WHITELIST = {
    ".DS_Store", ".env", ".env.example", ".env.local", ".env.test", ".env.test.local",
    ".eslintrc.js", ".eslintignore", ".gitignore", ".gitattributes", ".gitmodules",
    ".npmrc", ".prettierrc", ".prettierignore", "package.json", "package-lock.json",
    "pnpm-lock.yaml", "pnpm-workspace.yaml", "turbo.json", "tsconfig.json",
    "tsconfig.base.json", "tsconfig.node.json", "tsconfig.dom.json", "tsconfig.prod.json",
    "vite.config.js", "vite.config.ts", "vitest.config.ts", "vitest.config.js",
    "playwright.config.ts", "postcss.config.js", "tailwind.config.js", "tailwind.config.ts",
    "eslint.config.js", "eslint-qa.config.mjs", "docker-compose.yml", "Dockerfile",
    "nginx.conf", "README.md", "SECURITY.md", "LICENSE", "LICENSE.md", "DEPRECATION_MANIFEST.md",
    "index.html", "_SSOT", "_iwish-output", "_iwish-skills", "_iwish-workflows", "private.pem"
}

ROOT_EXT_SCRATCH_PATTERNS = re.compile(r'\.(log|diff|err|bak|tmp|pyc)$|^(patch\d*\.sh|fix[-_].*\.(sh|py|ts)|test_.*\.txt|missing_from_.*\.txt|planning_diff\.txt|diff\.txt|ts_errors\.txt|update_epic.*\.py|generate_story\.py|sync_all\.sh)$', re.IGNORECASE)

def compute_sha256(filepath):
    """Calculates SHA-256 using chunked streaming buffers to prevent high memory usage."""
    hasher = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            while chunk := f.read(CHUNK_SIZE):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None

def safe_relocate(src_path, dest_dir, dry_run=False):
    """
    Safely relocates a file to dest_dir with Zero-Loss Collision Guard:
    - If dest file doesn't exist: move directly.
    - If dest file exists and has identical SHA-256: remove duplicate src_path.
    - If dest file exists and differs: rename to filename_PID_TIMESTAMP.ext.
    """
    os.makedirs(dest_dir, exist_ok=True)
    filename = os.path.basename(src_path)
    dest_path = os.path.join(dest_dir, filename)

    if not os.path.exists(src_path):
        return None

    # Collision Check
    if os.path.exists(dest_path):
        src_hash = compute_sha256(src_path)
        dest_hash = compute_sha256(dest_path)

        if src_hash and dest_hash and src_hash == dest_hash:
            if not dry_run:
                try:
                    os.remove(src_path)
                except OSError:
                    pass
            return f"Duplicate removed: {src_path} (identical to {dest_path})"
        else:
            name_stem = Path(filename).stem
            ext = Path(filename).suffix
            entropy_name = f"{name_stem}_{os.getpid()}_{int(time.time())}{ext}"
            dest_path = os.path.join(dest_dir, entropy_name)

    if dry_run:
        return f"[DRY-RUN] Move {src_path} -> {dest_path}"

    try:
        shutil.move(src_path, dest_path)
        return f"Moved: {src_path} -> {dest_path}"
    except OSError as e:
        return f"Warning: Could not move {src_path} (File possibly locked): {e}"

def clean_root_hygiene(repo_root, scratch_dir, dry_run=False):
    """Sweeps stray logs, diffs, temporary patches from repo root into scratch_dir."""
    actions = []
    try:
        for entry in os.scandir(repo_root):
            if entry.is_file(follow_symlinks=False):
                name = entry.name
                if name in ROOT_WHITELIST:
                    # Security Guard: If private key or cert, ensure permissions are 600
                    if name in ("private.pem", "server.key"):
                        try:
                            os.chmod(entry.path, 0o600)
                        except OSError:
                            pass
                    continue

                # Match patterns for scratch files
                if ROOT_EXT_SCRATCH_PATTERNS.search(name) or name.endswith(".log") or name.endswith(".err") or name.endswith(".diff"):
                    res = safe_relocate(entry.path, scratch_dir, dry_run=dry_run)
                    if res:
                        actions.append(res)
    except OSError as e:
        actions.append(f"Root scan error: {e}")

    return actions

def clean_iwish_output_structure(iwish_dir, scratch_dir, dry_run=False):
    """
    Normalizes stray files in _iwish-output/ to their canonical subfolders:
    - review-story-*.md -> _iwish-output/reviews/
    - Epic-*-risk-matrix.md -> _iwish-output/edge-case-knowledge/epics/
    - debate-transcript*.md -> _iwish-output/party-mode/ or scratch
    - *.log / *.json dumps -> scratch or evidence
    """
    actions = []
    if not os.path.exists(iwish_dir):
        return actions

    reviews_dir = os.path.join(iwish_dir, "reviews")
    edge_dir = os.path.join(iwish_dir, "edge-case-knowledge", "epics")
    evidence_dir = os.path.join(iwish_dir, "evidence")
    party_dir = os.path.join(iwish_dir, "party-mode")

    try:
        for entry in os.scandir(iwish_dir):
            if entry.is_file(follow_symlinks=False):
                name = entry.name
                path = entry.path

                # Check file size limit (> 5MB)
                try:
                    size = entry.stat().st_size
                    if size > MAX_SAFE_FILE_SIZE:
                        actions.append(f"⚠️ Large File Alert: {name} is {size / (1024*1024):.2f} MB!")
                except OSError:
                    pass

                # 1. Review Reports
                if re.match(r'^review-story-.*\.md$', name, re.IGNORECASE):
                    res = safe_relocate(path, reviews_dir, dry_run=dry_run)
                    if res: actions.append(res)

                # 2. Epic Risk Matrices
                elif re.match(r'^Epic-.*-risk-matrix\.md$', name, re.IGNORECASE):
                    res = safe_relocate(path, edge_dir, dry_run=dry_run)
                    if res: actions.append(res)

                # 3. Debate Transcripts
                elif re.match(r'^debate-transcript.*\.md$', name, re.IGNORECASE):
                    res = safe_relocate(path, party_dir, dry_run=dry_run)
                    if res: actions.append(res)

                # 4. Evidence JSON files
                elif re.match(r'^(pipeline-evidence|layer1-2|validate-layer|nlm_evidence|sync_audit).*\.json$', name, re.IGNORECASE):
                    res = safe_relocate(path, evidence_dir, dry_run=dry_run)
                    if res: actions.append(res)

                # 5. Logs & Transient HTML dumps
                elif name.endswith(".log") or name.endswith(".html") or name.endswith(".err") or name.endswith(".diff"):
                    res = safe_relocate(path, scratch_dir, dry_run=dry_run)
                    if res: actions.append(res)

    except OSError as e:
        actions.append(f"IWish structure scan error: {e}")

    return actions

def main():
    parser = argparse.ArgumentParser(description="Zero-Loss Workspace Hygiene Guardian & Janitor.")
    parser.add_argument("--repo-root", default=".", help="Root of project repository")
    parser.add_argument("--auto-clean", action="store_true", help="Execute automatic cleanup of root and scratch")
    parser.add_argument("--enforce-structure", action="store_true", help="Enforce _iwish-output canonical structure")
    parser.add_argument("--dry-run", action="store_true", help="Preview cleanup operations without mutating disk")
    args = parser.parse_args()

    repo_root = os.path.abspath(args.repo_root)
    iwish_dir = os.path.join(repo_root, "_iwish-output")
    scratch_dir = os.path.join(iwish_dir, "adhoc-workspace", "scratch")
    os.makedirs(scratch_dir, exist_ok=True)

    print("🧹 [WORKSPACE-JANITOR] Running Zero-Loss Hygiene Sweep...")
    
    root_actions = clean_root_hygiene(repo_root, scratch_dir, dry_run=args.dry_run)
    iwish_actions = []
    if args.enforce_structure or args.auto_clean:
        iwish_actions = clean_iwish_output_structure(iwish_dir, scratch_dir, dry_run=args.dry_run)

    all_actions = root_actions + iwish_actions
    if all_actions:
        print(f"✅ Processed {len(all_actions)} files:")
        for act in all_actions[:30]:
            print(f"   - {act}")
        if len(all_actions) > 30:
            print(f"   ... and {len(all_actions) - 30} more actions.")
    else:
        print("✨ Workspace is pristine. 0 garbage or misplaced files found.")

    sys.exit(0)

if __name__ == "__main__":
    main()
