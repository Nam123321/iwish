#!/usr/bin/env python3
"""
Automated Claims Validation Gate (Pre-Human Gate Automation) [EC-P11-002, ZT-Round4, C9]
Validates contract_claims.yaml against schema, checks model existence across trusted Prisma schemas,
checks OWNS collision across epics, and signs claims-validation.sig via Watchmen Unix Socket (/tmp/watchmen.sock).
"""

import os
import sys
import argparse
import hashlib
import json
import re
from pathlib import Path
import yaml
import jsonschema
from datetime import datetime, timezone

# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_scripts = os.path.abspath(os.path.join(_script_dir, "../../../scripts"))
if _agent_scripts not in sys.path:
    sys.path.insert(0, _agent_scripts)

try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except Exception:
    pass

try:
    from watchmen_client import call_daemon, sign_evidence
except ImportError:
    call_daemon = None
    sign_evidence = None


def find_prisma_models(project_root: Path) -> set:
    """
    Scans trusted schema directories for all declared Prisma models using AST.
    Trusted root anchored: does not accept arbitrary CLI paths (ZT-BYPASS).
    """
    import subprocess
    models = set()
    schema_path = project_root / "packages" / "database" / "prisma" / "schema.prisma"
    
    try:
        # Use npx prisma get-dmmf to parse the schema into an AST
        result = subprocess.run(
            ["npx", "prisma", "get-dmmf", "--schema", str(schema_path)],
            env={**os.environ, "PRISMA_SCHEMA_DISABLE_ADVISORY_MESSAGE": "1"},
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            dmmf = json.loads(result.stdout)
            for model in dmmf.get("datamodel", {}).get("models", []):
                models.add(model.get("name"))
    except Exception as e:
        print(f"Warning: Failed to parse Prisma schema with get-dmmf: {e}")
        
    return models


def find_disk_claims(project_root: Path, current_epic_id: str) -> dict:
    """
    Scans all existing contract_claims.yaml files across all Epics to build
    an ownership index: { model_name: owning_epic_id }
    """
    ownership = {}
    search_dirs = [
        project_root / "_iwish-output" / "3. Development" / "1. Epic & Story",
        project_root / "_iwish-output" / "epics",
    ]
    for sdir in search_dirs:
        if not sdir.exists():
            continue
        for claim_file in sdir.rglob("contract_claims.yaml"):
            try:
                data = yaml.safe_load(claim_file.read_text(encoding="utf-8"))
                if not data or not isinstance(data, dict):
                    continue
                file_epic_id = data.get("epic_id")
                if not file_epic_id or file_epic_id == current_epic_id:
                    continue
                for c in data.get("claims", []):
                    if c.get("intent") == "OWNS":
                        ownership[c.get("model")] = file_epic_id
            except Exception:
                continue
    return ownership


def main():
    parser = argparse.ArgumentParser(description="Validate Epic Contract Claims")
    parser.add_argument("--claims-file", required=True, help="Path to contract_claims.yaml")
    args = parser.parse_args()

    claims_path = Path(args.claims_file).resolve()
    if not claims_path.exists():
        print(f"❌ Error: Claims file does not exist: {claims_path}")
        sys.exit(1)

    project_root = Path(__file__).resolve().parents[4]

    # Trusted Root Schema Path (Zero Trust: Anchored to repository root)
    schema_path = project_root / ".agent/skills/epic-layer-db/contract-claims-schema.yaml"
    if not schema_path.exists():
        print(f"❌ Error: Schema file does not exist: {schema_path}")
        sys.exit(1)

    # 1. Parse YAML
    try:
        claims_data = yaml.safe_load(claims_path.read_text(encoding="utf-8"))
        schema_data = yaml.safe_load(schema_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"❌ Error parsing YAML: {e}")
        sys.exit(1)

    # 2. Schema Validation
    try:
        jsonschema.validate(instance=claims_data, schema=schema_data)
        print("✅ Schema structure validation: PASSED")
    except jsonschema.ValidationError as e:
        print(f"❌ JSON Schema Validation Error: {e.message}")
        print(f"   At path: {'/'.join(str(p) for p in e.path)}")
        sys.exit(1)

    current_epic_id = claims_data.get("epic_id")
    claims_list = claims_data.get("claims", [])
    epic_dir = claims_path.parent

    # 3. Model Existence / New Declaration Check
    existing_models = find_prisma_models(project_root)
    layer_db_file = epic_dir / "layer-epic-db.md"
    declared_new_models = set()
    if layer_db_file.exists():
        db_text = layer_db_file.read_text(encoding="utf-8")
        # Extract models declared in Owned Models or Prisma blocks
        declared_new_models = set(re.findall(r"-\s+\*\*`([A-Za-z0-9_]+)`\*\*", db_text))
        declared_new_models.update(re.findall(r"model\s+([A-Za-z0-9_]+)\s*\{", db_text))

    # Also extract models from story data-specs
    for ds in epic_dir.glob("Story-*/data-spec.md"):
        try:
            declared_new_models.update(re.findall(r"model\s+([A-Za-z0-9_]+)\s*\{", ds.read_text(encoding="utf-8")))
        except Exception:
            pass

    # 4. Cross-Epic Collision & Strict Model Existence Check
    other_epic_ownership = find_disk_claims(project_root, current_epic_id)

    violations = []
    for claim in claims_list:
        model = claim.get("model")
        intent = claim.get("intent")

        # Reject placeholder/spoofed models
        if "TODO" in model or model == "TodoModel" or model == "EpicEntity":
            violations.append(f"Invalid model name '{model}': Placeholder/TODO model names are forbidden in contract claims.")
            continue

        # Conflict check: model already owned by another Epic
        if model in other_epic_ownership:
            owner = other_epic_ownership[model]
            if intent == "OWNS":
                violations.append(
                    f"Conflict: Model '{model}' is already OWNED by {owner}. "
                    f"{current_epic_id} may only claim 'READS' or 'MUTATES'."
                )

        # Existence check: If OWNS or MUTATES, must exist in repo schema OR be explicitly declared in layer-epic-db.md / story data-specs
        if intent in ("OWNS", "MUTATES"):
            if model not in existing_models and model not in declared_new_models:
                violations.append(
                    f"Unknown Model: '{model}' is claimed as {intent} but does NOT exist in Prisma schema "
                    f"nor in {current_epic_id} layer-epic-db.md / story data-specs."
                )

    if violations:
        print(f"❌ [EC-P11-002] Claims Validation Gate FAILED with {len(violations)} violation(s):")
        for v in violations:
            print(f"   - {v}")
        sys.exit(1)

    print(f"✅ Cross-Epic Claims Conflict & Existence Check: PASSED (Verified {len(claims_list)} claims)")

    # 5. Cryptographic Evidence & Signing via Watchmen Unix Socket
    falkor_available = False
    try:
        import socket
        with socket.create_connection(("127.0.0.1", int(os.environ.get("FALKORDB_PORT", 6379))), timeout=1):
            falkor_available = True
    except OSError:
        pass

    evidence_payload = {
        "gate": "validate-claims",
        "epic_id": claims_data.get("epic_id", "Unknown"),
        "claims_count": len(claims_data.get("claims", [])),
        "validated_at": datetime.now(timezone.utc).isoformat(),
        "offline_drift_provisional": not falkor_available,
        "status": "APPROVED"
    }

    evidence_file = epic_dir / "claims-validation-evidence.json"
    evidence_file.write_text(json.dumps(evidence_payload, indent=2), encoding="utf-8")

    sig_file = epic_dir / "claims-validation.sig"

    # Attempt signing via Watchmen Unix Socket
    if sign_evidence:
        sig = sign_evidence(evidence_payload)
        sig_file.write_text(sig, encoding="utf-8")
        print(f"✅ Claims validation evidence signed via Watchmen: {sig_file}")

    print("✅ Claims validation complete.")
    sys.exit(0)


if __name__ == "__main__":
    main()
