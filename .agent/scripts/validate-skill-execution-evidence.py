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

import argparse
import json
import re
from pathlib import Path
from datetime import datetime, timezone

# Requirements per skill for Category A enforcement
SKILL_REQUIREMENTS = {
    "llm-engineering-skill": {
        "requires_cldm": True,
        "cldm_path": "references/cross-layer-dependency-map.md",
        "min_modules": 1,
        "module_prefix": ".agent/skills/llm-engineering-skill/modules/"
    },
    "ai-native-architecture": {
        "requires_cldm": True,
        "cldm_path": "references/cross-layer-dependency-map.md",
        "min_modules": 2,
        "module_prefix": ".agent/skills/ai-native-architecture/modules/"
    },
    "llmops-finetuning-serving-skill": {
        "requires_cldm": False,
        "requires_architecture_context": True,
        "min_modules": 1,
        "module_prefix": ".agent/skills/llmops-finetuning-serving-skill/modules/"
    },
    "ai-engineering-knowledge-consultant": {
        "requires_cldm": False,
        "requires_architecture_context": True,
        "min_modules": 1,
        "module_prefix": "ai-engineering-from-scratch"
    },
    "ai-agent-persona": {
        "requires_cldm": False,
        "requires_architecture_context": True,
        "min_modules": 0,
        "module_prefix": ""
    }
}

def verify_skill_execution(conversation_id, skill_name, evidence_file):
    """
    EC-P4-001: Reads transcript_full.jsonl to find tool_calls with name='view_file',
    checking if required modules and references were actually loaded by the agent.
    Zero Regex on text output - strictly physical AST/JSON parsing of execution log.
    """
    if skill_name not in SKILL_REQUIREMENTS:
        print(f"⚠️ [INFO] Skill '{skill_name}' has no custom module requirements. Auto-passing.")
        return True

    reqs = SKILL_REQUIREMENTS[skill_name]

    if not conversation_id or not re.match(r"^[a-zA-Z0-9-]+$", conversation_id):
        print(f"❌ [ZERO-TRUST GATE FAIL] Invalid or missing conversation-id: '{conversation_id}'")
        return False

    brain_dir = os.path.expanduser("~/.gemini/antigravity/brain")
    log_file = os.path.join(brain_dir, conversation_id, ".system_generated", "logs", "transcript_full.jsonl")
    if not os.path.exists(log_file):
        log_file = os.path.join(brain_dir, conversation_id, ".system_generated", "logs", "transcript.jsonl")

    if not os.path.exists(log_file):
        print(f"❌ [ZERO-TRUST GATE FAIL] Transcript log not found for conversation {conversation_id}.")
        return False

    viewed_files = set()
    try:
        with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    step = json.loads(line)
                    if step.get("type") == "PLANNER_RESPONSE":
                        for tc in step.get("tool_calls", []):
                            if tc.get("name") in ["view_file", "run_command"]:
                                args = tc.get("arguments") or tc.get("args") or {}
                                path = args.get("AbsolutePath") or args.get("CommandLine", "")
                                viewed_files.add(path)
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"❌ [ZERO-TRUST GATE FAIL] Failed to parse transcript log: {e}")
        return False

    missing = []
    loaded_modules = []

    # 1. Check CLDM if required
    if reqs.get("requires_cldm"):
        cldm = reqs["cldm_path"]
        if not any(cldm in vf for vf in viewed_files):
            missing.append(f"Cross-Layer Dependency Map ({cldm})")

    # 2. Check modules loaded (deduplicated by module filename)
    mod_prefix = reqs.get("module_prefix")
    unique_module_names = set()
    for vf in viewed_files:
        if mod_prefix in vf or (skill_name in vf and "/modules/" in vf):
            loaded_modules.append(vf)
            unique_module_names.add(os.path.basename(vf))

    if len(unique_module_names) < reqs.get("min_modules", 0):
        missing.append(f"Skill Modules: Loaded {len(unique_module_names)}/{reqs['min_modules']} unique required modules")

    # 3. Check architecture context if required
    if reqs.get("requires_architecture_context"):
        arch_found = any("architecture.md" in vf or "project-context.md" in vf for vf in viewed_files)
        if not arch_found:
            missing.append("Architecture Context (2.5. architecture.md)")

    evidence = {
        "skill_name": skill_name,
        "conversation_id": conversation_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "loaded_modules": list(set(loaded_modules)),
        "missing_items": missing,
        "verdict": "FAIL" if missing else "PASS"
    }

    if evidence_file:
        out_path = Path(evidence_file).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(evidence, indent=2, ensure_ascii=False), encoding="utf-8")

    if missing:
        print(f"❌ [ZERO-TRUST GATE FAIL] Agent skipped mandatory skill modules for '{skill_name}':")
        for m in missing:
            print(f"   - {m}")
        print("\nACTION REQUIRED: You MUST use 'view_file' to thoroughly read the required modules before proceeding.")
        return False

    print(f"✅ [ZERO-TRUST GATE PASS] Physical verification passed for skill '{skill_name}'.")
    return True

def main():
    parser = argparse.ArgumentParser(description="Unified Skill Execution Evidence Validator (Category A)")
    parser.add_argument("--conversation-id", required=True, help="Agent conversation ID")
    parser.add_argument("--skill-name", required=True, help="Name of the skill being validated")
    parser.add_argument("--evidence-file", required=False, help="Output evidence JSON path")
    args = parser.parse_args()

    success = verify_skill_execution(args.conversation_id, args.skill_name, args.evidence_file)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
