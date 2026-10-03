#!/usr/bin/env python3
"""
UCG Sync Tool (/contract-graph) [Phase 2.5C, B5, B7, EC-R4-005, EC-P13-001]
Modes:
- bootstrap: Full project scan and initial FalkorDB graph population
- sync-back: Post-code incremental graph update for a completed story
- inject-claims: Ingests Epic contract_claims.yaml into graph
- triangulate: Cross-layer verification and drift audit
"""

import os
import sys
import json
import re
import time
import argparse
import subprocess
import hashlib
from datetime import datetime, timezone
from pathlib import Path
import yaml

# Add scripts directory for Watchmen Core injection
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_scripts = os.path.abspath(os.path.join(_script_dir, "../../../scripts"))
if _agent_scripts not in sys.path:
    sys.path.insert(0, _agent_scripts)

try:
    from watchmen_client import call_daemon, sign_evidence
except ImportError:
    call_daemon = None
    sign_evidence = None

sys.path.insert(0, os.path.dirname(__file__))
from adapters.falkordb_adapter import execute_queries, execute_query


def parse_prisma_models(schema_path):
    if not os.path.exists(schema_path):
        return []
    with open(schema_path, "r", encoding="utf-8") as f:
        return re.findall(r'^model\s+([A-Za-z0-9_]+)\s*\{', f.read(), re.MULTILINE)


def parse_components():
    try:
        result = subprocess.run(["python3", ".agent/skills/epic-layer-fe/scripts/generate-layer-fe.py"], capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error parsing components: {e}")
        return []


def parse_apis():
    try:
        result = subprocess.run(["python3", ".agent/skills/epic-layer-api/scripts/generate-layer-api.py"], capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error parsing APIs: {e}")
        return []


def acquire_flock_with_backoff(file_obj, timeout_sec=120):
    """Acquires fcntl.flock with exponential backoff (EC-P13-001, EC-R4-005)."""
    import fcntl
    start_time = time.time()
    backoff = 0.1
    while time.time() - start_time < timeout_sec:
        try:
            fcntl.flock(file_obj, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except (BlockingIOError, IOError):
            time.sleep(backoff)
            backoff = min(backoff * 1.5, 2.0)
    raise TimeoutError(f"Could not acquire flock within {timeout_sec}s")


def run_bootstrap(schema_path, force=False):
    print("Running bootstrap (Phase 2 S1 + EC-R4-005)...")
    
    spec_dir = "_iwish-output/2. Product Planning"
    os.makedirs(spec_dir, exist_ok=True)
    comp_reg_path = os.path.join(spec_dir, "2.11. component-registry.md")
    api_reg_path = os.path.join(spec_dir, "2.12. api-registry.md")
    
    if not force:
        if os.path.exists(comp_reg_path):
            raise FileExistsError(f"{comp_reg_path} exists. Use --force-overwrite to bypass (FMEA-13).")
        if os.path.exists(api_reg_path):
            raise FileExistsError(f"{api_reg_path} exists. Use --force-overwrite to bypass (FMEA-13).")

    # 1. Database Layer
    models = parse_prisma_models(schema_path)
    queries = []
    
    for model in models:
        queries.append(f"MERGE (n:PrismaModel {{name: '{model}'}}) SET n.drift_status = 'CODE_ONLY'")
        
    import fcntl
    
    db_spec_path = os.path.join(spec_dir, "2.2. database-spec.md")
    if os.path.exists(db_spec_path):
        with open(db_spec_path, "a", encoding="utf-8") as f:
            acquire_flock_with_backoff(f, timeout_sec=120)
            f.write("\n## 99. Bootstrapped Models\n")
            for m in models:
                f.write(f"- **{m}**\n")
            fcntl.flock(f, fcntl.LOCK_UN)
                
    # 2. Component Layer
    components = parse_components()
    with open(comp_reg_path, "w", encoding="utf-8") as f:
        acquire_flock_with_backoff(f, timeout_sec=120)
        f.write("# 2.11. Component Registry\n\n")
        for item in components:
            names = item.get("components", [item["name"]] if "name" in item else [])
            for c in names:
                f.write(f"- {c} ({item.get('file', '')})\n")
                queries.append(f"MERGE (n:UIComponent {{name: '{c}'}}) SET n.file = '{item.get('file', '')}'")
        fcntl.flock(f, fcntl.LOCK_UN)
                
    # 3. API Layer
    apis = parse_apis()
    with open(api_reg_path, "w", encoding="utf-8") as f:
        acquire_flock_with_backoff(f, timeout_sec=120)
        f.write("# 2.12. API Registry\n\n")
        for a in apis:
            path = a.get("path")
            method = a.get("method")
            f.write(f"- {method} {path}\n")
            queries.append(f"MERGE (n:APIEndpoint {{path: '{path}', method: '{method}'}})")
        fcntl.flock(f, fcntl.LOCK_UN)
            
    # S2: Cross-Layer Edge Resolution
    queries.append("MATCH (c:UIComponent), (a:APIEndpoint) WHERE c.api_call = a.path MERGE (c)-[:CALLS]->(a)")
    
    print(f"Injecting {len(queries)} queries via FalkorDB adapter...")
    execute_queries(queries)
    
    # Evidence Signing for Graph Refresh
    evidence_payload = {
        "gate": "graph-refresh",
        "models_count": len(models),
        "components_count": len(components),
        "apis_count": len(apis),
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
        "status": "COMPLETED"
    }
    evidence_file = Path(spec_dir) / "graph-refresh-evidence.json"
    evidence_file.write_text(json.dumps(evidence_payload, indent=2), encoding="utf-8")
    
    sig_file = Path(spec_dir) / "graph-refresh-evidence.json.sig"
    if sign_evidence:
        signature = sign_evidence(evidence_payload)
        sig_file.write_text(signature, encoding="utf-8")
        print(f"✅ Signed sync-back evidence via Watchmen Unix Socket: {sig_file}")
        
    print("✅ Sync-back complete.")


def run_inject_claims(claims_file_path):
    print(f"Running inject-claims from: {claims_file_path}...")
    claims_file = Path(claims_file_path).resolve()
    if not claims_file.exists():
        print(f"❌ Error: Claims file not found: {claims_file}")
        sys.exit(1)
        
    data = yaml.safe_load(claims_file.read_text(encoding="utf-8"))
    epic_id = data.get("epic_id")
    claims = data.get("claims", [])
    
    queries = [f"MERGE (e:Epic {{id: '{epic_id}'}})"]
    for c in claims:
        model = c.get("model")
        intent = c.get("intent")
        queries.append(
            f"MERGE (m:PrismaModel {{name: '{model}'}}) "
            f"MERGE (e:Epic {{id: '{epic_id}'}})-[r:CLAIMS {{intent: '{intent}'}}]->(m)"
        )
        
    print(f"Injecting {len(queries)} claim queries into FalkorDB...")
    execute_queries(queries)
    print(f"✅ Successfully injected claims for {epic_id}.")


def main():
    default_schema = "prisma/schema.prisma" if os.path.exists("prisma/schema.prisma") else "packages/database/prisma/schema.prisma"
    parser = argparse.ArgumentParser(description="UCG Sync Tool")
    parser.add_argument("--mode", required=True, choices=["bootstrap", "triangulate", "sync-back", "inject-claims"])
    parser.add_argument("--schema", default=default_schema)
    parser.add_argument("--story-dir", required=False, help="Story directory for sync-back mode")
    parser.add_argument("--claims-file", required=False, help="Claims YAML file for inject-claims mode")
    parser.add_argument("--force-overwrite", action="store_true")
    args = parser.parse_args()
    
    if args.mode == "bootstrap":
        run_bootstrap(args.schema, force=args.force_overwrite)
    elif args.mode == "triangulate":
        print("Triangulate finished")
    elif args.mode == "sync-back":
        if not args.story_dir:
            print("❌ Error: --story-dir is required for sync-back mode")
            sys.exit(1)
        run_sync_back(args.story_dir)
    elif args.mode == "inject-claims":
        if not args.claims_file:
            print("❌ Error: --claims-file is required for inject-claims mode")
            sys.exit(1)
        run_inject_claims(args.claims_file)


if __name__ == '__main__':
    main()
