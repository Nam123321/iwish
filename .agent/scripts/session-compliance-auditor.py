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

import sys
import os
import argparse
import json
import re
import shlex
import subprocess
from datetime import datetime, timezone
from pathlib import Path

def extract_tool_calls(transcript_path):
    tool_calls = []
    has_echo_oob = False
    hallucinated_compliance = False
    has_zero_trust_evasion = False
    
    with open(transcript_path, 'r') as f:
        for line in f:
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
            except:
                continue
                
            if entry.get("type") == "PLANNER_RESPONSE":
                content = entry.get("content", "")
                
                # Check for key extraction attempts in raw thought/content blocks
                if re.search(r'OOB_SIGNING_KEY', content):
                    has_echo_oob = True
                    
                # Check for hallucinatory compliance (e.g. saying they ran a gate but no tool call exists)
                if re.search(r'I have (run|executed) (the|validation) (script|gate|watchmen)', content, re.IGNORECASE):
                    # We will verify this against actual tool calls later
                    pass
                    
                for call in entry.get("tool_calls", []):
                    tool_calls.append(call)
                    
                    tool_name = call.get("name", "")
                    args = call.get("arguments") or call.get("args") or {}
                    
                    # Zero-Trust Enforcement: Monitor file modification tools
                    if any(tool_name.endswith(t) for t in ("replace_file_content", "multi_replace_file_content", "write_to_file")):
                        target = args.get("TargetFile", "")
                        if target and re.search(r'(sprint-status\.yaml)$', target):
                            # The auditor restricts any manual edits to status tracking files
                            has_zero_trust_evasion = True
                    
                    # Check for key extraction and shell evasion
                    elif tool_name.endswith("run_command"):
                        cmd = args.get("CommandLine", "")
                        if re.search(r'(env|echo\s+\$OOB|printenv|OOB_SIGNING_KEY)', cmd):
                            has_echo_oob = True
                        
                        # EC-P6-001: Detect shell evasion targeting status files
                        if re.search(r'(sed|awk|echo|cat|python\s+-c|perl).*?(sprint-status\.yaml)', cmd, re.IGNORECASE):
                            has_zero_trust_evasion = True
                            
    return tool_calls, has_echo_oob, has_zero_trust_evasion


def check_domain_skills(transcript_path, tool_calls, project_root):
    try:
        router_path = project_root / ".agent" / "scripts" / "domain-skill-router.py"
        if not router_path.exists():
            return True, []
            
        result = subprocess.run(
            ["python3", str(router_path), "--context-file", str(transcript_path)],
            capture_output=True, text=True, check=True
        )
        data = json.loads(result.stdout)
        mandatory_skills = data.get("mandatory_skills", [])
        
        if not mandatory_skills:
            return True, []
            
        viewed_files = set()
        for call in tool_calls:
            if call.get("name") in ["view_file", "run_command"]:
                args = call.get("args") or call.get("arguments") or {}
                path = args.get("AbsolutePath") or args.get("CommandLine", "")
                viewed_files.add(path)
                
        # Requirements per skill for Category A enforcement
        SKILL_MODULE_REQUIREMENTS = {
            "llm-engineering-skill": {"min_modules": 1, "requires_cldm": True},
            "ai-native-architecture": {"min_modules": 2, "requires_cldm": True},
            "llmops-finetuning-serving-skill": {"min_modules": 1, "requires_cldm": False},
        }

        missing_skills = []
        for skill in mandatory_skills:
            # Check 1: SKILL.md loaded
            if not any(f"skills/{skill}/SKILL.md" in vf for vf in viewed_files):
                missing_skills.append(f"{skill} (SKILL.md not loaded)")
                continue
            # Check 2: Modules loaded (if configured)
            reqs = SKILL_MODULE_REQUIREMENTS.get(skill)
            if reqs:
                module_count = sum(1 for vf in viewed_files if f"skills/{skill}/modules/" in vf)
                if module_count < reqs["min_modules"]:
                    missing_skills.append(f"{skill} (loaded {module_count}/{reqs['min_modules']} modules)")
                if reqs.get("requires_cldm"):
                    if not any(f"skills/{skill}/references/cross-layer-dependency-map.md" in vf for vf in viewed_files):
                        missing_skills.append(f"{skill} (Cross-Layer Dependency Map not loaded)")
                
        return len(missing_skills) == 0, missing_skills
    except Exception as e:
        print(f"Warning: Failed to check domain skills: {e}")
        return True, []

def check_file_ownership(transcript_path, base_dir):
    # Ensure it's a regular file
    if not transcript_path.is_file():
        return False
        
    try:
        real_path = os.path.realpath(transcript_path)
        real_base = os.path.realpath(base_dir)
        if os.path.commonpath([real_path, real_base]) == real_base:
            return True
    except ValueError:
        pass
    return False

def get_workflow_gates(workflow_name, project_root):
    # Try to find workflow file
    wf_file = project_root / ".agent" / "workflows" / f"{workflow_name}.md"
    if not wf_file.exists():
        wf_file = project_root / ".agent" / "workflows" / workflow_name
        if not wf_file.exists():
            # If not a standard workflow, it might be a skill
            wf_file = project_root / ".agent" / "skills" / workflow_name / "SKILL.md"
            if not wf_file.exists():
                return []
            
    content = wf_file.read_text(encoding="utf-8")
    
    gates = []
    # Simple extraction of scripts that must be run
    # Looking for Python or Node scripts executed in the workflow
    for line in content.splitlines():
        if "python3" in line and ".agent/scripts" in line:
            match = re.search(r'\.agent/scripts/([\w\-]+\.py)', line)
            if match:
                gates.append(match.group(1))
        elif "node" in line and "scripts/" in line:
            match = re.search(r'scripts/([\w\-]+\.js)', line)
            if match:
                gates.append(match.group(1))
    
    # Also parse Gate Classification table if present
    in_table = False
    for line in content.splitlines():
        if "## Gate Classification" in line:
            in_table = True
            continue
        if in_table:
            if line.startswith("|") and "---" not in line and "Gate Name" not in line:
                parts = [p.strip() for p in line.split("|") if p.strip()]
                if len(parts) >= 3 and parts[1].upper() == "A":
                    # Extract script name from mechanism
                    match = re.search(r'([\w\-\./]+\.(?:py|js|sh))\b', parts[2])
                    if match:
                        script_name = Path(match.group(1)).name
                        if script_name not in gates:
                            gates.append(script_name)
            elif line.strip() == "" and in_table:
                in_table = False
            elif line.startswith("## ") and in_table:
                in_table = False
                
    # Deduplicate
    return list(dict.fromkeys(gates))

def main():
    parser = argparse.ArgumentParser(description="Watchmen Mode 3: Session Compliance Audit")
    parser.add_argument("--transcript", help="Path to transcript.jsonl")
    parser.add_argument("--workflow", help="Name of the workflow to audit against")
    parser.add_argument("--history-report", action="store_true", help="Generate report from history")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[2]
    history_dir = project_root / "_iwish-output" / "adhoc-workspace" / "compliance-history"
    archive_dir = history_dir / "archive"
    
    if args.history_report:
        if not history_dir.exists():
            print("No compliance history found.")
            sys.exit(0)
            
        print("📊 Cross-Session Pattern Detection Report")
        workflows = {}
        now = datetime.now(timezone.utc)
        
        # Auto-archive older than 90 days
        archive_dir.mkdir(parents=True, exist_ok=True)
        
        for fpath in history_dir.glob("session-*.json"):
            try:
                # Check file age for archiving
                mtime = fpath.stat().st_mtime
                file_time = datetime.fromtimestamp(mtime, tz=timezone.utc)
                if (now - file_time).days > 90:
                    fpath.rename(archive_dir / fpath.name)
                    continue

                with open(fpath, 'r') as f:
                    data = json.load(f)
                    wf = data.get("workflow", "unknown")
                    scs = data.get("scs", 0)
                    if wf not in workflows:
                        workflows[wf] = []
                    workflows[wf].append(scs)
            except:
                continue
                
        for wf, scores in workflows.items():
            fail_count = sum(1 for s in scores if s < 70)
            total_count = len(scores)
            print(f"- {wf}: {fail_count}/{total_count} sessions failed (SCS < 70%)")
            if fail_count >= 3:
                print(f"  ⚠️ Repeat Offender detected! Consider upgrading gates to Category A.")
        sys.exit(0)

    if not args.transcript or not args.workflow:
        print("❌ Error: --transcript and --workflow are required unless --history-report is used.")
        sys.exit(1)
        
    transcript_path = Path(args.transcript)
    # EC-P4-001: Auto-promote to transcript_full.jsonl if sibling exists to prevent truncation blindspot
    if transcript_path.name == "transcript.jsonl":
        full_transcript = transcript_path.parent / "transcript_full.jsonl"
        if full_transcript.exists():
            transcript_path = full_transcript

    if not transcript_path.exists():
        print(f"❌ Error: Transcript {transcript_path} not found.")
        sys.exit(1)
        
    # Strictly enforce that the transcript belongs to the valid system brain directory
    # using commonpath to prevent path traversal bypasses
    brain_dir = Path.home() / ".gemini" / "antigravity" / "brain"
    if not check_file_ownership(transcript_path, brain_dir):
        print("❌ Error: Transcript must be within the secure brain directory.")
        sys.exit(1)

    tool_calls, has_key_extraction, has_zero_trust_evasion = extract_tool_calls(transcript_path)
    
    if has_key_extraction:
        print("❌ CRITICAL SECURITY VIOLATION: Agent attempted to extract OOB_SIGNING_KEY.")
        sys.exit(1)
        
    if has_zero_trust_evasion:
        print("❌ CRITICAL SECURITY VIOLATION: Agent manually bypassed pipeline to forge index/status file.")
        sys.exit(1)
        
    
    domain_compliant, missing_skills = check_domain_skills(transcript_path, tool_calls, project_root)
    if not domain_compliant:
        print("❌ CRITICAL COMPLIANCE VIOLATION: Agent failed to load mandatory domain skills.")
        print(f"Missing skills: {', '.join(missing_skills)}")
        sys.exit(1)

    # Check for Epic/Story Drift (Failure to sync)
    try:
        sync_check = subprocess.run(
            [sys.executable, str(project_root / ".agent" / "scripts" / "sync_all_statuses.py"), "--check-only"],
            capture_output=True, text=True, check=False, timeout=30
        )
        if sync_check.returncode != 0:
            print("❌ CRITICAL COMPLIANCE VIOLATION: Drift detected between Story and Sprint Status. Agent modified story status but failed to sync!")
            print(sync_check.stdout)
            if sync_check.stderr:
                print(sync_check.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"❌ CRITICAL COMPLIANCE VIOLATION: Auditor failed to execute drift check. Subprocess error: {e}")
        sys.exit(1)

    mandatory_gates = get_workflow_gates(args.workflow, project_root)
    
    executed_gates = set()
    for call in tool_calls:
        if call.get("name") == "run_command":
            # the arguments key is 'args' or 'arguments' depending on the transcript format
            tool_args = call.get("args") or call.get("arguments")
            if not isinstance(tool_args, dict):
                tool_args = {}
            cmd = tool_args.get("CommandLine", "")
            
            try:
                cmd_parts = shlex.split(cmd)
            except ValueError:
                cmd_parts = []
                
            if not cmd_parts or cmd_parts[0] in ("echo", "print", "printf", "cat", "ls", "grep"):
                continue
                
            for gate in mandatory_gates:
                if any(gate == os.path.basename(part) for part in cmd_parts):
                    executed_gates.add(gate)
                    
    total = len(mandatory_gates)
    executed = len(executed_gates)
    
    scs = (executed / total * 100) if total > 0 else 100
    
    print(f"╔══════════════════════════════════════╗")
    print(f"║   SESSION COMPLIANCE REPORT         ║")
    print(f"║   Workflow: {args.workflow:<24}║")
    print(f"║   Score: {scs:.0f}% ({'PASS' if scs>=70 else 'FAIL'}){'':<17}║")
    print(f"╠══════════════════════════════════════╣")
    
    if total == 0:
        print(f"║ No mandatory Category A gates found. ║")
    else:
        for gate in mandatory_gates:
            status = "EXECUTED" if gate in executed_gates else "SKIPPED "
            mark = "✅" if gate in executed_gates else "❌"
            print(f"║ {mark} {gate[:28]:<28} {status}  ║")
            
    print(f"╠══════════════════════════════════════╣")
    if scs < 70:
        print(f"║ 🔧 Đề xuất: Chạy /skill để nâng      ║")
        print(f"║    cấp gates bị skip thành Cat A     ║")
    print(f"╚══════════════════════════════════════╝")
    
    # Save to history
    history_dir.mkdir(parents=True, exist_ok=True)
    history_file = history_dir / f"session-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.json"
    
    with open(history_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "workflow": args.workflow,
            "scs": scs,
            "total_gates": total,
            "executed_gates": executed
        }, f, indent=2)

if __name__ == "__main__":
    main()
