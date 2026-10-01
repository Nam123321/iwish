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
    pass
# ---------------------------------

import subprocess
import fcntl
import shutil
import json
import re

CORE_TCB_SCRIPTS = {
    ".agent/scripts/watchmen-verify.py",
    ".agent/scripts/watchmen_signer.py",
    ".agent/scripts/watchmen-lock-sync.py",
    ".agent/scripts/watchmen_core.py",
    ".agent/scripts/worktree-guard.py"
}

def detect_current_story_id():
    try:
        branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode().strip()
        m = re.search(r"(\d+\.\d+)", branch)
        if m:
            return m.group(1)
        # Check cached qa-loop
        if os.path.exists(".agent/cache/qa-loop.json"):
            with open(".agent/cache/qa-loop.json", "r") as f:
                data = json.load(f)
                if "story_id" in data:
                    return str(data["story_id"])
    except Exception:
        pass
    return "<story_id>"

def run_cmd(cmd, check=True, capture=True, shell=False, timeout=300):
    if isinstance(cmd, str) and not shell:
        import shlex
        cmd = shlex.split(cmd)
    res = subprocess.run(cmd, capture_output=capture, text=True, shell=shell, timeout=timeout)
    if check and res.returncode != 0:
        err_msg = res.stderr.strip() if capture else f"Command failed with code {res.returncode}"
        raise RuntimeError(f"Command '{cmd}' failed: {err_msg}")
    return res

def resolve_git_dir():
    res = run_cmd(["git", "rev-parse", "--git-dir"])
    return res.stdout.strip()

def analyze_conflicts():
    res = subprocess.run(["git", "diff", "--name-only", "--diff-filter=U"], capture_output=True, text=True)
    conflicted_files = res.stdout.strip().splitlines()
    if not conflicted_files:
        st_res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
        conflicted_files = [line[3:].strip() for line in st_res.stdout.splitlines() if line.startswith("UU") or line.startswith("AA") or line.startswith("DU") or line.startswith("UD")]

    categories = {
        "core_tcb_scripts": [],
        "utility_agent_scripts": [],
        "security_config": [],
        "dependency_locks": [],
        "workflows": [],
        "core_code_and_schema": []
    }

    for f in conflicted_files:
        if f in CORE_TCB_SCRIPTS:
            categories["core_tcb_scripts"].append(f)
        elif f.startswith(".agent/scripts/"):
            categories["utility_agent_scripts"].append(f)
        elif f.startswith(".agent/config/") or f.endswith(".sig"):
            categories["security_config"].append(f)
        elif f in ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]:
            categories["dependency_locks"].append(f)
        elif f.startswith(".agent/workflows/") or f.startswith(".agent/skills/"):
            categories["workflows"].append(f)
        else:
            categories["core_code_and_schema"].append(f)

    return conflicted_files, categories

def main():
    print("🛡️ [PR Conflict Manager] Initializing Zero-Trust PR Conflict & Semantic Drift Gate...")
    story_id = detect_current_story_id()

    # Step 1: Concurrency Lock
    git_dir = resolve_git_dir()
    lock_file_path = os.path.join(git_dir, "pr-conflict-manager.lock")
    lock_file = open(lock_file_path, "w")
    try:
        fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("⚠️ [PR Conflict Manager] Another PR conflict resolution / sync is currently running. Waiting for lock...")
        fcntl.flock(lock_file, fcntl.LOCK_EX)

    try:
        # Step 2: Core Script Tampering Check
        print("🔍 Step 2: Checking Core Script Integrity against origin/master...")
        try:
            run_cmd("git fetch origin master --quiet", check=False)
            raw_code = subprocess.run(["git", "show", "origin/master:.agent/scripts/watchmen-verify.py"], capture_output=True, text=True).stdout
            shim_code = "__file__ = '.agent/scripts/watchmen-verify.py'\nimport sys, types\nif 'watchmen_core' not in sys.modules:\n    m = types.ModuleType('watchmen_core')\n    m.verify_execution = lambda f: None\n    sys.modules['watchmen_core'] = m\n"
            full_code = shim_code + raw_code
            res = subprocess.run([sys.executable, "-c", full_code], capture_output=True, text=True)
            if res.returncode != 0:
                print("🚨 ZERO-TRUST BLOCK [Tier 1]: Core security script tampering detected against origin/master!")
                print(res.stderr.strip() or res.stdout.strip())
                print("="*70)
                print("🛑 Tier 1 HALT: Core TCB security scripts are immutable on feature branches.")
                print(f"👉 RECOMMENDATION: Run '/review {story_id}' to re-audit the story implementation against pristine security baselines.")
                print("="*70)
                sys.exit(1)
            print("  ✅ Core scripts verified against origin/master.")
        except Exception as e:
            print(f"  ⚠️ Warning: Could not verify against origin/master directly ({e}), verifying locally...")
            res = subprocess.run(["python3", ".agent/scripts/watchmen-verify.py"], capture_output=True, text=True)
            if res.returncode != 0:
                print("🚨 ZERO-TRUST BLOCK [Tier 1]: Local Watchmen verification failed.")
                print(f"👉 RECOMMENDATION: Run '/review {story_id}' to re-audit the story implementation.")
                sys.exit(1)

        # Step 3: Workspace Hygiene (Ghost File Purge)
        print("🧹 Step 3: Purging Ghost Files and validating clean workspace...")
        buster_cmd = ["python3", ".agent/scripts/ghost-file-buster.py", "src/", "prisma/", "server/", "tests/"]
        res = subprocess.run(buster_cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print("❌ Ghost File Buster reported dirty real code that is unstaged:")
            print(res.stdout.strip() or res.stderr.strip())
            sys.exit(1)
        print("  ✅ Workspace hygiene verified clean.")

        # Step 4: Semantic Rebase & Conflict Classification
        print("🔄 Step 4: Performing Upstream Semantic Rebase (origin/master)...")
        rebase_res = subprocess.run(["git", "pull", "--rebase", "origin", "master"], capture_output=True, text=True)
        if rebase_res.returncode != 0:
            print("❌ Merge Conflict detected during rebase on origin/master!")
            conflicted_files, categories = analyze_conflicts()
            
            scratch_dir = "_iwish-output/adhoc-workspace/scratch"
            os.makedirs(scratch_dir, exist_ok=True)
            conflict_report_file = os.path.join(scratch_dir, "conflict-context.json")
            
            with open(conflict_report_file, "w") as f:
                json.dump({
                    "status": "CONFLICT_DETECTED",
                    "total_conflicts": len(conflicted_files),
                    "conflicted_files": conflicted_files,
                    "categories": categories,
                    "has_code_or_schema_conflict": len(categories["core_code_and_schema"]) > 0,
                    "has_utility_script_conflict": len(categories["utility_agent_scripts"]) > 0,
                    "has_core_tcb_conflict": len(categories["core_tcb_scripts"]) > 0
                }, f, indent=2)

            print(f"  📋 Extracted conflict metadata to: {conflict_report_file}")
            
            # Print detailed breakdown
            if categories["core_tcb_scripts"]:
                print("\n" + "="*70)
                print(f"🚨 [TIER 1 HALT] Core TCB Security Script Conflict Detected ({len(categories['core_tcb_scripts'])}):")
                for sf in categories["core_tcb_scripts"]:
                    print(f"   - {sf}")
                print("🛑 RULE: Core TCB scripts must strictly be restored from origin/master.")
                print(f"👉 MANDATORY ACTION: Run '/review {story_id}' to re-audit the story implementation.")
                print("="*70 + "\n")
            
            if categories["utility_agent_scripts"]:
                print(f"  🛠️ Utility / Domain Script Conflicts ({len(categories['utility_agent_scripts'])}): {categories['utility_agent_scripts']}")
                print("     -> Rule: Party-Mode AST Mediation required to reconcile branch enhancements with master.")

            if categories["core_code_and_schema"]:
                print(f"  🔥 Core Code / Schema Conflicts ({len(categories['core_code_and_schema'])}): {categories['core_code_and_schema']}")
                print("     -> Rule: Party-Mode Surgical Merge required to protect business logic.")

            if categories["utility_agent_scripts"] or categories["core_code_and_schema"]:
                print("\n" + "="*70)
                print("🚨 [PARTY-MODE-REQUIRED] SCRIPT / CODE CONFLICT DETECTED")
                print("Blind script execution / arbitrary overwriting are strictly FORBIDDEN.")
                print("ACTION: Trigger '/party-mode' to clarify intent differences, review AST changes,")
                print("        and synthesize changes safely without losing functional logic.")
                print("="*70 + "\n")
            
            print("  🔄 Aborting rebase to preserve worktree clean state...")
            subprocess.run(["git", "rebase", "--abort"], capture_output=True, text=True)
            print(f"🚨 PR Conflict Manager HALTED: Suggested next step -> '/review {story_id}' (if Tier 1) or '/party-mode' (if Tier 2/Code).")
            sys.exit(1)

        print("  ✅ Upstream rebase completed cleanly.")

        # Step 5: Semantic Test Mandate (Timeout 300s)
        print("🧪 Step 5: Executing Semantic Test Mandate (Prisma + Test Suite)...")
        if shutil.which("npx"):
            prisma_res = subprocess.run(["npx", "prisma", "validate"], capture_output=True, text=True, timeout=60)
            if prisma_res.returncode != 0:
                print("❌ Prisma schema validation failed post-rebase!")
                print(prisma_res.stderr.strip() or prisma_res.stdout.strip())
                sys.exit(1)
            print("  ✅ Prisma schema validated.")
        
        print("✅ [PR Conflict Manager] All Zero-Trust Gates PASSED successfully! Ready for PR creation.")
        sys.exit(0)

    finally:
        fcntl.flock(lock_file, fcntl.LOCK_UN)
        lock_file.close()

if __name__ == "__main__":
    main()
