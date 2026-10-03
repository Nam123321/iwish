#!/usr/bin/env python3
"""
AI Contract Compiler for I-Wish SDLC Anti-Drift Architecture (V3)
Compiles a bounded, machine-enforceable contract-context.json for Stage 3B (Code Execution).
Enforces:
- ADR 2: Risk-Tiered Manifests (Embedded frontmatter or Sidecar contract-manifest.yaml).
- ADR 3: Dual-Input Boundary (Provides strict DB/API boundary while agent reads impl-plan.md for logic).
- FMEA EC-P5-01: 5-second fast-fail timeout for FalkorDB queries.
- EC-P6-01: Safe YAML loading with yaml.safe_load.
- Deterministic SHA-256 digest calculation.
"""

import os
import sys
import re
import json
import socket
import hashlib
import argparse
from typing import Dict, Any, List, Optional, Set, Tuple

try:
    import yaml
except ImportError:
    print("[FATAL] pyyaml is required. Please install pyyaml.", file=sys.stderr)
    sys.exit(1)

# Import Prisma adapter dynamically (handles hyphens in file name)
script_dir = os.path.dirname(os.path.abspath(__file__))
adapters_dir = os.path.join(script_dir, "adapters")
adapter_path = os.path.join(adapters_dir, "prisma-contract-adapter.py")
if not os.path.exists(adapter_path):
    adapter_path = os.path.join(os.getcwd(), ".agent", "scripts", "adapters", "prisma-contract-adapter.py")

import importlib.util
spec = importlib.util.spec_from_file_location("prisma_contract_adapter", adapter_path)
prisma_contract_adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prisma_contract_adapter)
generate_contract_ir = prisma_contract_adapter.generate_contract_ir
compute_canonical_digest = prisma_contract_adapter.compute_canonical_digest


FALKORDB_HOST = os.environ.get("FALKORDB_HOST", "127.0.0.1")
FALKORDB_PORT = int(os.environ.get("FALKORDB_PORT", "6379"))


def check_falkordb_liveness(timeout_sec: float = 5.0) -> bool:
    """Checks if FalkorDB is responding within timeout_sec (FMEA EC-P5-01)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout_sec)
        s.connect((FALKORDB_HOST, FALKORDB_PORT))
        s.send(b"PING\r\n")
        resp = s.recv(1024)
        s.close()
        return b"+PONG" in resp
    except Exception:
        return False


def extract_manifest_from_markdown(content: str) -> Optional[Dict[str, Any]]:
    """Extracts contract_manifest from YAML frontmatter or codeblock in data-spec.md."""
    # 1. Try frontmatter
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if fm_match:
        try:
            fm_data = yaml.safe_load(fm_match.group(1))
            if isinstance(fm_data, dict) and "contract_manifest" in fm_data:
                return fm_data["contract_manifest"]
            # Check if frontmatter itself is manifest-like
            if isinstance(fm_data, dict) and any(k in fm_data for k in ["consumes", "mutates", "provides"]):
                return fm_data
        except Exception:
            pass

    # 2. Try ```yaml contract-manifest block
    block_match = re.search(r"```yaml\s+contract-manifest\s*\n(.*?)\n```", content, re.DOTALL)
    if block_match:
        try:
            return yaml.safe_load(block_match.group(1))
        except Exception:
            pass

    # 3. Fallback: extract models mentioned in prisma codeblocks
    models = set()
    prisma_blocks = re.findall(r"```prisma\s*\n(.*?)\n```", content, re.DOTALL)
    for pb in prisma_blocks:
        found = re.findall(r"model\s+([a-zA-Z0-9_]+)\s*\{", pb)
        models.update(found)

    if models:
        return {
            "status": "UNVERIFIED",
            "mutates": [{"entity": m} for m in sorted(models)],
            "consumes": [],
            "provides": []
        }

    return None


def load_story_manifest(story_dir: str) -> Tuple[Dict[str, Any], str]:
    """
    Loads contract manifest from sidecar file or embedded data-spec.md.
    Returns (manifest_dict, source_type).
    """
    sidecar_path = os.path.join(story_dir, "contract-manifest.yaml")
    if os.path.exists(sidecar_path):
        with open(sidecar_path, "r", encoding="utf-8") as f:
            manifest = yaml.safe_load(f)
            if isinstance(manifest, dict):
                return manifest, "sidecar"

    data_spec_path = os.path.join(story_dir, "data-spec.md")
    if os.path.exists(data_spec_path):
        with open(data_spec_path, "r", encoding="utf-8") as f:
            content = f.read()
        manifest = extract_manifest_from_markdown(content)
        if manifest:
            return manifest, "embedded"

    raise FileNotFoundError(
        f"No contract manifest found in story directory: {story_dir}. "
        "Expected contract-manifest.yaml or data-spec.md with contract_manifest block."
    )


def normalize_entity_names(items: Any) -> Set[str]:
    """Helper to extract set of entity names from manifest list."""
    res = set()
    if not items:
        return res
    if isinstance(items, list):
        for item in items:
            if isinstance(item, str):
                res.add(item.strip())
            elif isinstance(item, dict) and "entity" in item:
                res.add(item["entity"].strip())
    return res


def compile_contract_context(
    story_dir: str,
    prisma_path: str,
    strict_graph: bool = False
) -> Dict[str, Any]:
    """
    Compiles bounded contract-context.json for the story.
    """
    manifest, source_mode = load_story_manifest(story_dir)
    story_id = os.path.basename(story_dir)

    mutates_entities = normalize_entity_names(manifest.get("mutates", []))
    consumes_entities = normalize_entity_names(manifest.get("consumes", []))

    # Graph liveness check (FMEA EC-P5-01)
    graph_alive = check_falkordb_liveness(timeout_sec=5.0)
    if not graph_alive:
        msg = f"[WARN] FalkorDB at {FALKORDB_HOST}:{FALKORDB_PORT} is unreachable or timed out (5s)."
        if strict_graph:
            raise ConnectionError(f"GRAPH_UNAVAILABLE: {msg}")
        else:
            print(f"{msg} Continuing with Git/Prisma schema baseline.", file=sys.stderr)

    # Generate baseline IR from schema.prisma
    full_ir = generate_contract_ir(prisma_path)
    all_entities = full_ir.get("entities", {})
    all_enums = full_ir.get("enums", {})

    # Build bounded entities slice
    bounded_entities: Dict[str, Any] = {}
    needed_enums: Set[str] = set()

    relevant_models = mutates_entities.union(consumes_entities)

    for model_name in relevant_models:
        if model_name in all_entities:
            entity_def = all_entities[model_name]
            bounded_entities[model_name] = entity_def

            # Check fields for enum references or relation targets
            for field_name, field_def in entity_def.get("fields", {}).items():
                f_type = field_def.get("type")
                if f_type in all_enums:
                    needed_enums.add(f_type)
                # If field relates to another entity, include foreign model shell for typing
                if "relation" in field_def and field_def["relation"].get("targetEntity"):
                    target = field_def["relation"]["targetEntity"]
                    if target in all_entities and target not in bounded_entities:
                        # Include shallow shell (id and unique fields only)
                        target_fields = all_entities[target].get("fields", {})
                        shallow_fields = {
                            k: v for k, v in target_fields.items()
                            if v.get("isId") or v.get("isUnique")
                        }
                        bounded_entities[target] = {
                            "description": f"Shallow dependency for relation from {model_name}.{field_name}",
                            "fields": shallow_fields,
                            "attributes": []
                        }
        else:
            # New model being created in mutates
            if model_name in mutates_entities:
                bounded_entities[model_name] = {
                    "description": "New model to be created in this story",
                    "fields": {},
                    "attributes": []
                }

    bounded_enums = {
        name: all_enums[name] for name in needed_enums if name in all_enums
    }

    operations = manifest.get("provides", [])

    contract_context = {
        "storyId": story_id,
        "manifestStatus": manifest.get("status", "UNVERIFIED"),
        "manifestSource": source_mode,
        "baselinePrismaDigest": full_ir["digest"],
        "fmea": {
        "ttl_seconds": 3600,
        "require_sig_verification": True
    },
    "boundaries": {
            "allowedMutations": sorted(list(mutates_entities)),
            "allowedConsumes": sorted(list(consumes_entities))
        },
        "entities": bounded_entities,
        "enums": bounded_enums,
        "operations": operations,
        "metadata": {
            "compiler": "ai-contract-compiler.py",
            "graphStatus": "ONLINE" if graph_alive else "OFFLINE_FALLBACK"
        }
    }

    # Deterministic SHA-256 Digest of bounded context
    clean_for_hash = {
        "storyId": contract_context["storyId"],
        "boundaries": contract_context["boundaries"],
        "entities": contract_context["entities"],
        "enums": contract_context["enums"],
        "operations": contract_context["operations"]
    }
    canonical_json = json.dumps(clean_for_hash, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    contract_context["contextDigest"] = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

    return contract_context


def main():
    parser = argparse.ArgumentParser(description="AI Contract Compiler: Compile contract-context.json for Code Agents")
    parser.add_argument("--story-dir", "-s", required=True, help="Path to story directory")
    parser.add_argument("--prisma-file", "-p", default="prisma/schema.prisma", help="Path to schema.prisma")
    parser.add_argument("--out", "-o", help="Path to write contract-context.json (default: {story_dir}/contract-context.json)")
    parser.add_argument("--strict-graph", action="store_true", help="Fail if FalkorDB is unavailable (FMEA EC-P5-01)")
    
    args = parser.parse_args()

    if not os.path.exists(args.story_dir):
        print(f"[FATAL] Story directory not found: {args.story_dir}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(args.prisma_file):
        print(f"[FATAL] Prisma file not found: {args.prisma_file}", file=sys.stderr)
        sys.exit(1)

    try:
        context = compile_contract_context(
            story_dir=args.story_dir,
            prisma_path=args.prisma_file,
            strict_graph=args.strict_graph
        )

        out_path = args.out or os.path.join(args.story_dir, "contract-context.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(context, f, indent=2, ensure_ascii=False)

        print(f"[SUCCESS] Compiled contract context to {out_path}", file=sys.stderr)
        print(f"  - Story: {context['storyId']}", file=sys.stderr)
        print(f"  - Manifest Status: {context['manifestStatus']} ({context['manifestSource']})", file=sys.stderr)
        print(f"  - Allowed Mutations: {context['boundaries']['allowedMutations']}", file=sys.stderr)
        print(f"  - Allowed Consumes: {context['boundaries']['allowedConsumes']}", file=sys.stderr)
        print(f"  - Context Digest: {context['contextDigest'][:16]}...", file=sys.stderr)
        print(f"  - Graph Status: {context['metadata']['graphStatus']}", file=sys.stderr)

    except Exception as e:
        print(f"[FATAL] AI Contract Compiler failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
