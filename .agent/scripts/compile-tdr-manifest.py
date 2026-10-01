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

"""
Compile TDR Manifest
Reads tech-decision-registry.yaml and generates a pre-computed JSON manifest
for use by architecture-coherence-checker.py to avoid runtime YAML parsing.
"""

import os
import yaml
import json
import re
from pathlib import Path

# --- Legacy Tech Pattern Overrides (for complex regexes) ---
# For simple names, the compiler will generate \bname\b automatically.
TECH_PATTERNS_OVERRIDE = {
    "temporal": r'temporal\.io|temporal\s+sdk|temporal\s+client|temporal\s+worker|temporal\s+server|temporal\s+activity|temporal\s+workflow',
    "bullmq": r'bullmq|bull\s+queue|bull\s+mq',
    "eventbridge": r'eventbridge|event\s+bridge|aws\s+eventbridge',
    "redis": r'\bredis\b|ioredis',
    "kafka": r'\bkafka\b|confluent',
    "rabbitmq": r'rabbitmq|amqp',
    "langgraph": r'langgraph|lang\s*graph',
    "langchain": r'langchain|lang\s*chain',
    "prisma": r'\bprisma\b',
    "drizzle": r'\bdrizzle\b',
    "postgresql": r'postgresql|postgres\b',
    "mongodb": r'mongodb|mongoose',
    "elasticsearch": r'elasticsearch|opensearch|elastic\s+search',
    "firebase": r'\bfirebase\b',
    "supabase": r'\bsupabase\b',
    "stripe": r'\bstripe\b',
    "xstate": r'\bxstate\b|x\s*state',
    "celery": r'\bcelery\b',
}

def _normalize_tdr_chosen(chosen: str) -> str:
    """Normalize TDR 'chosen' field to a base technology key."""
    chosen_lower = chosen.lower().strip()
    # If the chosen name contains one of our known keys, use it
    for tech_key in TECH_PATTERNS_OVERRIDE.keys():
        if tech_key in chosen_lower:
            return tech_key
    # Otherwise strip suffixes and normalize
    return re.sub(r'[-_\s]+', '', chosen_lower)

def compile_manifest(tdr_path: str, output_path: str):
    if not os.path.exists(tdr_path):
        print(f"ERROR: {tdr_path} not found.")
        return False
        
    with open(tdr_path, 'r', encoding='utf-8') as f:
        tdr_data = yaml.safe_load(f)
        
    registry = []
    rejected_map = {}
    tech_patterns = {}
    
    for d in tdr_data.get("decisions", []):
        chosen_raw = d.get("chosen", "")
        tech_key = _normalize_tdr_chosen(chosen_raw)
        category = d.get("category", "unknown")
        status = d.get("status", "active")
        phase = d.get("phase", "all")
        adr_ref = d.get("adr_ref", "TDR")
        rationale = d.get("rationale", "")[:120]
        alternatives = d.get("alternatives_rejected", [])
        
        # Determine pattern
        pattern = TECH_PATTERNS_OVERRIDE.get(tech_key, rf'\b{re.escape(tech_key)}\b')
        tech_patterns[tech_key] = pattern
        
        registry.append({
            "adr_id": adr_ref,
            "category": category,
            "technology": tech_key,
            "chosen_raw": chosen_raw,
            "chosen_text": rationale,
            "status": status,
            "phase": phase,
        })
        
        for alt in alternatives:
            alt_key = _normalize_tdr_chosen(str(alt))
            alt_pattern = TECH_PATTERNS_OVERRIDE.get(alt_key, rf'\b{re.escape(alt_key)}\b')
            tech_patterns[alt_key] = alt_pattern
            
            if alt_key not in rejected_map:
                rejected_map[alt_key] = []
            rejected_map[alt_key].append({
                "adr_id": adr_ref,
                "category": category,
                "rejected_in_favor_of": chosen_raw,
            })
            
    for alt_key, rejections in rejected_map.items():
        existing = [r for r in registry if r["technology"] == alt_key and r["status"] in ("active", "future")]
        if not existing:
            for rej in rejections:
                registry.append({
                    "adr_id": rej["adr_id"],
                    "category": rej["category"],
                    "technology": alt_key,
                    "chosen_raw": alt_key,
                    "chosen_text": f"Rejected in favor of {rej['rejected_in_favor_of']}",
                    "status": "deprecated",
                    "phase": "none",
                })
                
    # Build epic restrictions (static for now, could be in YAML later)
    epic_restrictions = {}
                
    manifest = {
        "registry": registry,
        "tech_patterns": tech_patterns,
        "epic_restrictions": epic_restrictions
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
        
    print(f"Successfully compiled TDR manifest with {len(registry)} entries to {output_path}")
    return True

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--tdr", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    
    success = compile_manifest(args.tdr, args.output)
    import sys
    sys.exit(0 if success else 1)
