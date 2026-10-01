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

import argparse
import json
import os
import re
import sys
import datetime

import yaml

def parse_frontmatter(filepath):
    if not os.path.exists(filepath):
        print(f"WARN: Context file missing: {filepath}", file=sys.stderr)
        return {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Find the first occurrences of ---
            # To handle leading whitespace or newlines, we strip first
            content = content.lstrip()
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    fm_yaml = parts[1]
                    data = yaml.safe_load(fm_yaml)
                    if isinstance(data, dict):
                        return {
                            'dependencies': data.get('dependencies', []),
                            'tags': data.get('tags', []),
                            'title': data.get('title', ''),
                            'description': data.get('description', '')
                        }
        return {}
    except yaml.YAMLError as e:
        print(f"ERROR: YAML parsing failed for {filepath}: {e}", file=sys.stderr)
        return {}
    except OSError as e:
        print(f"ERROR: I/O error for {filepath}: {e}", file=sys.stderr)
        return {}

def parse_registry(filepath):
    if not os.path.exists(filepath):
        print(f"WARN: Registry file missing: {filepath}", file=sys.stderr)
        return []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f) or {}
            return data.get('notebooks', [])
    except yaml.YAMLError as e:
        print(f"ERROR: YAML parsing failed for registry {filepath}: {e}", file=sys.stderr)
        return []
    except OSError as e:
        print(f"ERROR: I/O error reading registry {filepath}: {e}", file=sys.stderr)
        return []

def main():
    parser = argparse.ArgumentParser(description='Calculate Context Enrichment Need Score (CENS)')
    parser.add_argument('--context-type', required=True)
    parser.add_argument('--context-file', required=True)
    parser.add_argument('--registry', default='_iwish-output/notebooks/notebook-registry.yaml')
    parser.add_argument('--taxonomy', default='_iwish-output/notebooks/domain-taxonomy.yaml')
    parser.add_argument('--unknowns-ledger', default='_iwish-output/unknowns/unknowns-ledger.yaml')
    parser.add_argument('--macro-risks', default='_iwish-output/unknowns/macro-risks.yaml')
    parser.add_argument('--output-json')
    args = parser.parse_args()

    base_dir = os.getcwd()
    
    # 1. Parse Frontmatter
    fm = parse_frontmatter(args.context_file)
    deps = fm.get('dependencies', [])
    tags = fm.get('tags', [])
    title = fm.get('title', '')
    description = fm.get('description', '')
    
    # DIMENSION 1: DEPENDENCY_BREADTH (weight: 0.25)
    unique_epics = set()
    for dep in deps:
        if dep.startswith('Story-'):
            parts = dep.replace('Story-', '').split('.')
            if len(parts) > 0:
                unique_epics.add(parts[0])
        elif dep.startswith('Epic-'):
            unique_epics.add(dep.replace('Epic-', ''))
            
    dep_count = len(unique_epics)
    if dep_count == 0:
        dep_raw = 0
    elif 1 <= dep_count <= 2:
        dep_raw = 3
    elif 3 <= dep_count <= 5:
        dep_raw = 6
    else:
        dep_raw = 9
        
    # Simplify crossing feature groups check - just bump by 1 if there are deps
    if dep_count > 1:
        dep_raw = min(10, dep_raw + 1)
        
    # DIMENSION 2: TOPIC_DIMENSIONALITY (weight: 0.25)
    keywords = set(tags)
    for word in title.split() + description.split():
        if len(word) > 4:
            keywords.add(word.lower().strip(',.'))
            
    kw_count = len(keywords)
    if kw_count <= 3:
        topic_raw = 2
    elif kw_count <= 6:
        topic_raw = 4
    elif kw_count <= 9:
        topic_raw = 6
    else:
        topic_raw = 9
        
    # DIMENSION 3: NOVELTY_INDEX (weight: 0.20)
    registry_path = os.path.join(base_dir, args.registry)
    notebooks = parse_registry(registry_path)
    
    overlap_count = 0
    for kw in keywords:
        for nb in notebooks:
            if kw in nb.get('name', '').lower():
                overlap_count += 1
                break
                
    overlap_pct = (overlap_count / max(1, len(keywords))) * 100
    if overlap_pct > 60:
        novelty_raw = 2
    elif overlap_pct >= 30:
        novelty_raw = 5
    elif overlap_pct > 0:
        novelty_raw = 8
    else:
        novelty_raw = 10
        
    # DIMENSION 4: RESEARCH_DEBT (weight: 0.15)
    research_debt_raw = 7 # Default to 7
    has_synced = False
    max_debt = 0
    
    # Calculate simplistic date difference if last_synced exists
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    now_local = datetime.datetime.now()
    for nb in notebooks:
        if 'last_synced' in nb:
            has_synced = True
            try:
                # Handle ISO 8601 format
                last_synced_str = nb['last_synced'].strip()
                if last_synced_str.endswith('Z'):
                    last_synced_str = last_synced_str[:-1] + '+00:00'
                dt = datetime.datetime.fromisoformat(last_synced_str)
                
                current_time = now_utc if dt.tzinfo is not None else now_local
                days = (current_time - dt).days
                
                if days < 1: debt = 1
                elif days <= 7: debt = 4
                elif days <= 30: debt = 7
                else: debt = 10
                max_debt = max(max_debt, debt)
            except (ValueError, TypeError):
                pass
                
    if has_synced and max_debt > 0:
        research_debt_raw = max_debt

    # DIMENSION 5: RISK_AMPLIFIER (weight: 0.15)
    # Simple check for existence of risk files, default to 3
    risk_raw = 3
    ledger_path = os.path.join(base_dir, args.unknowns_ledger)
    macro_path = os.path.join(base_dir, args.macro_risks)
    
    if os.path.exists(ledger_path) or os.path.exists(macro_path):
        risk_raw = 6 # Arbitrary assumption for demonstration if files exist

    # Calculate Total Score
    dimensions = {
        "dependency_breadth": {"raw": dep_raw, "weighted": round(dep_raw * 0.25, 2)},
        "topic_dimensionality": {"raw": topic_raw, "weighted": round(topic_raw * 0.25, 2)},
        "novelty_index": {"raw": novelty_raw, "weighted": round(novelty_raw * 0.20, 2)},
        "research_debt": {"raw": research_debt_raw, "weighted": round(research_debt_raw * 0.15, 2)},
        "risk_amplifier": {"raw": risk_raw, "weighted": round(risk_raw * 0.15, 2)}
    }
    
    cens_score = sum(d["weighted"] for d in dimensions.values())
    cens_score = round(cens_score, 2)
    
    if cens_score <= 3.0:
        mode = "SKIP"
    elif cens_score <= 5.5:
        mode = "LIGHT"
    elif cens_score <= 7.5:
        mode = "STANDARD"
    else:
        mode = "DEEP"
        
    output = {
        "cens_score": cens_score,
        "activation_mode": mode,
        "dimensions": dimensions,
        "activation_modes": {
            "SKIP": "0 - 3.0",
            "LIGHT": "3.1 - 5.5",
            "STANDARD": "5.6 - 7.5",
            "DEEP": "7.6 - 10.0"
        },
        "recommendation": f"Activate ae-notebook-orchestrator with {mode} mode."
    }
    
    try:
        json_str = json.dumps(output, indent=2)
        print(json_str)
        if args.output_json:
            out_path = os.path.realpath(args.output_json)
            base_real = os.path.realpath(base_dir)
            allowed_dir1 = os.path.realpath(os.path.join(base_dir, '_iwish-output'))
            allowed_dir2 = os.path.realpath(os.path.join(base_dir, '.agent'))
            
            is_valid = False
            for allowed in [allowed_dir1, allowed_dir2]:
                if os.path.commonpath([allowed, out_path]) == allowed:
                    is_valid = True
                    break
                    
            if not is_valid:
                raise ValueError("Output path traversal detected: must be in _iwish-output or .agent directories")
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(json_str)
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
