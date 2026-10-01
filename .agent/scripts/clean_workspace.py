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

import os
import shutil
import glob
import re
import time
import argparse

ROOT_DIR = "{project-root}"
ADHOC_DIR = os.path.join(ROOT_DIR, "_iwish-output", "adhoc-workspace")
SCRATCH_DIR = os.path.join(ADHOC_DIR, "scratch")
REFACTOR_DIR = os.path.join(ADHOC_DIR, "refactor-scripts")

# 3 days in seconds
PURGE_AGE_SECONDS = 3 * 24 * 60 * 60

# Create directories if they don't exist
os.makedirs(SCRATCH_DIR, exist_ok=True)
os.makedirs(REFACTOR_DIR, exist_ok=True)

# Files/Directories to KEEP (Whitelist)
KEEP_LIST = [
    ".DS_Store", ".cgcignore", ".code_validator_*", ".codegraphcontext",
    ".env", ".env.example", ".env.test", ".gemini", ".git", ".github",
    ".gitignore", ".gitleaks.toml", ".gitleaksignore", ".husky", ".iwish",
    ".lighthouserc.js", ".mock-s3", ".openai", ".playwright-cli", ".pytest_cache",
    ".qa_runner_*", ".size-limit.json", ".tmp", ".venv-webwright", ".vscode",
    ".agent", ".agents",
    "DESIGN.md", "Dockerfile", "SECURITY.md", "project-context.md",
    "apps", "backend", "bin", "buf.gen.yaml", "coverage", "coverage.config.json",
    "dist", "docker-compose.yml", "docs", "e2e", "eslint.config.js",
    "frontend", "index.html", "infra", "infrastructure", "jest.config.js", "k8s",
    "monitoring", "node_modules", "otel-collector-config.yaml", "out", "output",
    "package-lock.json", "package.json", "packages", "playwright-report",
    "playwright.config.ts", "pnpm-lock.yaml", "postcss.config.js", "prisma",
    "prisma.config.js", "proto", "public", "qa", "qa-evidence", "scripts",
    "server", "services", "shared", "skills-lock.json", "src", "stats.html",
    "tailwind.config.js", "taste-skill", "temp-schema.prisma", "test-results",
    "tests", "tmp", "tsconfig.json", "uploads", "vite.config.js", "vitest.config.ts",
    "Ebook", "_bmad-output", "_iwish", "_iwish-internal-epics", "_iwish-output",
    "dummy_plugin", "test_sign.md", "test_sign.md.sig"
]

# Regex patterns for matching files to move
REFACTOR_PATTERNS = [
    r"^(fix|patch|update|generate|resolve|modify|rewrite|cleanup|create|append)_.+\.(py|js|cjs|sh)$",
    r"^(fix|patch|update|generate|resolve|modify|rewrite)\.(py|js|cjs|sh)$",
    r"^add-.+\.cjs$",
    r"^diff-migrations\.cjs$",
    r"^fix-.+\.(py|js)$",
    r"^check_wp\.sh$"
]

SCRATCH_PATTERNS = [
    r"^scratch_.+\.(py|js)$",
    r"^test_.+\.(py|js|cjs)$",
    r"^test-.+\.(py|js|cjs|sh|mjs)$",
    r"^debug.*\.py$",
    r"^debug.*\.html$",
    r"^[a-zA-Z0-9_]+\.log$",
    r".*\.txt$",
    r".*-output.*\.json$",
    r"draft.*\.json$",
    r"evidence\.json$",
    r"report_.*\.json$",
    r"debate-transcript.*\.md$",
    r"impact-report\.md$",
    r"implementation_plan\.md$",
    r"ui-spec\.md$",
    r"data-spec\.md$",
    r"task\.md$",
    r".*\.patch$",
    r".*\.zip$",
    r".*\.out$",
    r".*\.rej.*$",
    r"dummy\..*$"
]

# Folders to explicitly move to scratch
TRASH_FOLDERS = ["Epic-66", "Story-44.4", "FIX-41-05"]

def should_keep(name):
    for keep in KEEP_LIST:
        if keep.endswith('*'):
            if name.startswith(keep[:-1]):
                return True
        elif name == keep:
            return True
    return False

def get_destination(name, is_dir):
    if is_dir:
        if name in TRASH_FOLDERS:
            return SCRATCH_DIR
        return None

    # Check patterns
    for pattern in REFACTOR_PATTERNS:
        if re.match(pattern, name):
            return REFACTOR_DIR
    
    for pattern in SCRATCH_PATTERNS:
        if re.match(pattern, name):
            return SCRATCH_DIR
            
    # Default fallback for unknown python/js/json files in root (if not in keep list)
    if name.endswith(('.py', '.cjs', '.js', '.sh', '.json', '.md', '.txt', '.log', '.patch')):
        return SCRATCH_DIR
        
    return None

def purge_old_files(directory):
    if not os.path.exists(directory):
        return 0
    current_time = time.time()
    deleted_count = 0
    for root, dirs, files in os.walk(directory, topdown=False):
        for name in files:
            file_path = os.path.join(root, name)
            try:
                # Get modification time
                mtime = os.path.getmtime(file_path)
                if current_time - mtime > PURGE_AGE_SECONDS:
                    os.remove(file_path)
                    deleted_count += 1
            except Exception as e:
                print(f"Error deleting file {file_path}: {e}")
        
        # Delete empty directories
        for name in dirs:
            dir_path = os.path.join(root, name)
            try:
                if not os.listdir(dir_path):
                    os.rmdir(dir_path)
            except Exception as e:
                print(f"Error deleting directory {dir_path}: {e}")
                
    return deleted_count

def run_cleanup():
    items = os.listdir(ROOT_DIR)
    moved_count = 0
    for item in items:
        if should_keep(item):
            continue
            
        item_path = os.path.join(ROOT_DIR, item)
        is_dir = os.path.isdir(item_path)
        
        dest_dir = get_destination(item, is_dir)
        if dest_dir:
            dest_path = os.path.join(dest_dir, item)
            
            # Use a slightly different name if the file already exists
            counter = 1
            original_dest = dest_path
            while os.path.exists(dest_path):
                base, ext = os.path.splitext(item)
                dest_path = os.path.join(dest_dir, f"{base}_{counter}{ext}")
                counter += 1
                
            shutil.move(item_path, dest_path)
            moved_count += 1
            
    print(f"Cleanup completed. Moved {moved_count} items from root.")
    
    # After moving, purge old files
    print("Running time-based purge (older than 3 days)...")
    purged = purge_old_files(SCRATCH_DIR)
    purged += purge_old_files(REFACTOR_DIR)
    print(f"Purged {purged} old files/directories from adhoc-workspace.")

if __name__ == "__main__":
    run_cleanup()
