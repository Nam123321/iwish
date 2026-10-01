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
import yaml
import json
import os
import sys
import fnmatch
import re
from filelock import FileLock

REGISTRY_PATH = ".agent/config/domain-skill-registry.yaml"
LOCK_PATH = ".agent/config/domain-skill-registry.yaml.lock"

def get_registry():
    if not os.path.exists(REGISTRY_PATH):
        return {"domains": {}}
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f) or {"domains": {}}

def save_registry(data):
    # Ensure directory exists
    os.makedirs(os.path.dirname(REGISTRY_PATH), exist_ok=True)
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def scan_context(context_text):
    registry = get_registry()
    domains = registry.get("domains", {})
    
    matched_domains = []
    mandatory_skills = set()
    
    # Simple case-insensitive matching
    text_lower = context_text.lower()
    
    for domain_name, config in domains.items():
        tags = config.get("tags", [])
        keywords = config.get("keywords", [])
        
        # Check tags first (exact substring match)
        matched = False
        for tag in tags:
            if tag.lower() in text_lower:
                matched = True
                break
                
        # If no tag matched, check keywords with regex word boundaries (\b)
        if not matched:
            for kw in keywords:
                pattern = r'\b' + re.escape(kw.lower()) + r'\b'
                if re.search(pattern, text_lower):
                    matched = True
                    break
                    
        if matched:
            matched_domains.append(domain_name)
            for skill in config.get("mandatory_skills", []):
                mandatory_skills.add(skill)
                
    return {
        "matched_domains": matched_domains,
        "mandatory_skills": list(mandatory_skills)
    }

def add_skill_to_domain(domain, skill, tags=None, keywords=None):
    with FileLock(LOCK_PATH):
        registry = get_registry()
        if "domains" not in registry:
            registry["domains"] = {}
            
        if domain not in registry["domains"]:
            registry["domains"][domain] = {
                "tags": tags or [f"[DOMAIN: {domain}]"],
                "keywords": keywords or [],
                "mandatory_skills": []
            }
            
        domain_config = registry["domains"][domain]
        if "mandatory_skills" not in domain_config:
            domain_config["mandatory_skills"] = []
            
        if skill not in domain_config["mandatory_skills"]:
            domain_config["mandatory_skills"].append(skill)
            
        # Update tags/keywords if provided
        if tags:
            current_tags = set(domain_config.get("tags", []))
            for t in tags:
                current_tags.add(t)
            domain_config["tags"] = list(current_tags)
            
        if keywords:
            current_kw = set(domain_config.get("keywords", []))
            for kw in keywords:
                current_kw.add(kw)
            domain_config["keywords"] = list(current_kw)
            
        save_registry(registry)
        return True

def parse_mdc_frontmatter(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if content.startswith('---'):
                end_idx = content.find('---', 3)
                if end_idx != -1:
                    frontmatter = content[3:end_idx]
                    return yaml.safe_load(frontmatter) or {}
    except Exception:
        pass
    return {}

def resolve_mdc_rules(target_file):
    rules_dir = ".agents/rules"
    global_core = os.path.join(rules_dir, "global-core.mdc")
    catch_all = os.path.join(rules_dir, "catch-all.mdc")
    
    # 1. Startup Integrity Check (Fail-Closed)
    if not os.path.exists(global_core):
        print(json.dumps({"status": "error", "message": "CRITICAL: global-core.mdc is missing. Halting pipeline to prevent Zero-Trust bypass."}))
        sys.exit(1)
        
    # 2. Path Traversal Shield
    real_target = os.path.realpath(target_file)
    rel_target = os.path.relpath(real_target, start=os.path.realpath(os.getcwd()))
    if rel_target.startswith(".."):
        rel_target = target_file # fallback if outside workspace
        
    matched_rules = []
    
    if os.path.exists(rules_dir):
        for filename in os.listdir(rules_dir):
            if filename.endswith(".mdc") and filename not in ["global-core.mdc", "catch-all.mdc"]:
                filepath = os.path.join(rules_dir, filename)
                frontmatter = parse_mdc_frontmatter(filepath)
                globs = frontmatter.get("globs", [])
                
                # Glob matching
                for g in globs:
                    is_exclude = g.startswith("!")
                    match_pattern = g[1:] if is_exclude else g
                    
                    # Convert standard glob ** to recursive match, though fnmatch handles * well enough for simple cases
                    # For a robust implementation, checking path parts or using advanced glob is better, 
                    # but simple fnmatch over path segments works for most standard rules.
                    if fnmatch.fnmatch(rel_target, match_pattern) or fnmatch.fnmatch(os.path.basename(rel_target), match_pattern):
                        if is_exclude:
                            if filepath in matched_rules:
                                matched_rules.remove(filepath)
                        else:
                            if filepath not in matched_rules:
                                matched_rules.append(filepath)

    # 3. Catch-all mitigation
    if not matched_rules and os.path.exists(catch_all):
        matched_rules.append(catch_all)
        
    # 4. Precedence Dilution Mitigation
    # The Context Builder MUST append global-core.mdc at the VERY END.
    matched_rules.append(global_core)
    
    return matched_rules

def main():
    parser = argparse.ArgumentParser(description="Domain-Skill Router")
    parser.add_argument("--context-file", help="Path to context file to scan")
    parser.add_argument("--text", help="Raw text to scan")
    parser.add_argument("--add-skill", help="Skill name to add to registry")
    parser.add_argument("--domain", help="Domain to add the skill to")
    parser.add_argument("--tags", help="Comma-separated tags for the domain")
    parser.add_argument("--keywords", help="Comma-separated keywords for the domain")
    parser.add_argument("--target-file", help="Path to target file for MDC glob resolution")
    
    args = parser.parse_args()
    
    if args.add_skill and args.domain:
        tags = args.tags.split(",") if args.tags else None
        keywords = args.keywords.split(",") if args.keywords else None
        
        try:
            add_skill_to_domain(args.domain, args.add_skill, tags, keywords)
            print(json.dumps({"status": "success", "message": f"Added {args.add_skill} to {args.domain}"}))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))
            sys.exit(1)
            
    elif args.context_file or args.text:
        text_to_scan = ""
        if args.text:
            text_to_scan = args.text
        elif args.context_file:
            if os.path.exists(args.context_file):
                with open(args.context_file, 'r', encoding='utf-8', errors='ignore') as f:
                    text_to_scan = f.read()
            else:
                print(json.dumps({"status": "error", "message": f"File not found: {args.context_file}"}))
                sys.exit(1)
                
        result = scan_context(text_to_scan)
        
        # If this is called from a bash script hook, we want to output something easy to parse
        # But JSON is safer for programmatic reading by Python scripts
        print(json.dumps({
            "status": "success", 
            "matched_domains": result["matched_domains"],
            "mandatory_skills": result["mandatory_skills"]
        }))
        
    elif args.target_file:
        matched_mdc = resolve_mdc_rules(args.target_file)
        # Format the output so Orchestrator can wrap global-core in XML
        print(json.dumps({
            "status": "success",
            "mdc_files": matched_mdc,
            "precedence_guarantee": "global-core.mdc is appended last. Wrap it in <CRITICAL_SYSTEM_INSTRUCTIONS>."
        }))
        
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
