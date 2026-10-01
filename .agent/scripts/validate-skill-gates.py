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
    import sys
    print("❌ [Zero-Trust] CRITICAL: watchmen_core.py is missing or hijacked!")
    sys.exit(1)
# ---------------------------------
from watchmen_client import call_daemon, sign_evidence, verify_evidence

import sys
import os
import argparse
import json
import hashlib
import hmac
import base64
import re
from datetime import datetime, timezone
from pathlib import Path

SECRET_KEY = os.environ.get("OOB_SIGNING_KEY", "").encode("utf-8")

def calculate_wis(content):
    score = 0
    
    # 1. Has >= 3 sequential steps
    steps = len(re.findall(r'(?i)^(?:###|##) *(?:Step|Bước|Phase) *\d+', content, re.MULTILINE))
    if steps >= 3:
        score += 2
        
    # 2. Clear final output file
    if re.search(r'(?i)(output|generate|write.*file|save.*to)', content):
        score += 3
        
    # 3. Touches core specs
    if re.search(r'(?i)(architecture|database-spec|prd|sprint-status)', content):
        score += 3
        
    # 4. Declares zero-trust gates
    if re.search(r'(?i)(ZERO-TRUST|MANDATORY|MUST\s+run|MUST\s+execute)', content):
        score += 1
        
    # 5. References validation scripts
    if re.search(r'\.py|\.js|\.sh', content):
        score += 1
        
    return score

def check_watchmen_hook(content):
    return "session-compliance-auditor.py" in content

def extract_gate_classification(content):
    gates = []
    in_table = False
    for line in content.splitlines():
        if "## Gate Classification" in line:
            in_table = True
            continue
        if in_table:
            if line.startswith("|") and "---" not in line and "Gate Name" not in line:
                parts = [p.strip() for p in line.split("|") if p.strip()]
                if len(parts) >= 3:
                    gates.append({
                        "name": parts[0],
                        "category": parts[1],
                        "mechanism": parts[2]
                    })
            elif line.strip() == "" and len(gates) > 0:
                break
            elif line.startswith("## ") and len(gates) > 0:
                break
    return gates

def main():
    parser = argparse.ArgumentParser(description="Watchmen Mode 2: Capability Audit")
    parser.add_argument("target", help="Path to SKILL.md or workflow.md")
    parser.add_argument("--assess-injection", action="store_true", help="Perform Watchmen Injection Assessment")
    args = parser.parse_args()

    target_path = Path(args.target)
    if not target_path.exists():
        print(f"❌ Error: Target file {args.target} not found.")
        sys.exit(1)

    content = target_path.read_text(encoding="utf-8")
    
    gates = extract_gate_classification(content)
    if not gates:
        print("⚠️ Warning: No '## Gate Classification' table found.")
    
    cat_a_count = 0
    total_gates = len(gates)
    missing_scripts = []
    
    project_root = Path(__file__).resolve().parents[2]
    scripts_dir = project_root / ".agent" / "scripts"
    
    for gate in gates:
        if gate["category"].upper() == "A":
            cat_a_count += 1
            # Check script refs
            match = re.search(r'([\w\-\./]+\.(?:py|js|sh))\b', gate["mechanism"])
            if match:
                script_name = Path(match.group(1)).name
                # Look in .agent/scripts/
                script_path = scripts_dir / script_name
                if not script_path.exists():
                    missing_scripts.append(script_name)

    maturity = (cat_a_count / total_gates * 100) if total_gates > 0 else 0
    print(f"📊 Enforcement Maturity: {maturity:.1f}% ({cat_a_count}/{total_gates} Category A gates)")
    
    if missing_scripts:
        print(f"❌ Anti-Hallucination Failure: The following scripts referenced in Category A gates do not physically exist:")
        for script in missing_scripts:
            print(f"  - {script}")
        sys.exit(1)

    wis_score = calculate_wis(content)
    print(f"🧩 Watchmen Injection Score (WIS): {wis_score}/10")
    
    if args.assess_injection:
        has_hook = check_watchmen_hook(content)
        if wis_score >= 6:
            if not has_hook:
                print("❌ BLOCKER: WIS >= 6 requires Layer 1 Firewall hook (session-compliance-auditor.py) in the workflow.")
                sys.exit(1)
            else:
                print("✅ Layer 1 Firewall hook found.")
        elif wis_score >= 3:
            print("ℹ️ WIS 3-5: Layer 2 (AGENTS.md epilogue) is sufficient.")
        else:
            print("ℹ️ WIS < 3: Workflow is exempt from mandatory auditing.")

    evidence = {
        "target": str(target_path),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "enforcement_maturity": maturity,
        "wis_score": wis_score,
        "gates": gates
    }

    evidence_str = json.dumps(evidence, sort_keys=True)
    evidence["evidence_hash"] = hashlib.sha256(evidence_str.encode('utf-8')).hexdigest()
    
    try:
        evidence["hmac_signature"] = sign_evidence(evidence)
    except SystemExit:
        # If OOB_SIGNING_KEY is missing, sign_evidence calls sys.exit(1)
        pass

    target_name = target_path.parent.name if target_path.name == "SKILL.md" else target_path.stem
    evidence_file = target_path.parent / f"capability-evidence-{target_name}.json"
    
    with open(evidence_file, 'w') as f:
        json.dump(evidence, f, indent=2)

    print(f"✅ Capability Audit PASSED. Evidence written to {evidence_file}")

if __name__ == "__main__":
    main()
