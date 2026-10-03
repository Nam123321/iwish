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
import re
import json
import math
import yaml
import fcntl
from collections import Counter
from pathlib import Path

def get_words(text):
    if not isinstance(text, str):
        text = str(text)
    return re.findall(r'\w+', text.lower())

def cosine_similarity(words1, words2):
    vec1 = Counter(words1)
    vec2 = Counter(words2)
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])
    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    if not denominator:
        return 0.0
    return float(numerator) / denominator

def scan_soi(query, project_root, skills_dir, workflows_dir):
    query_words = get_words(query)
    if not query_words:
        return 0.0, ""

    try:
        from yaml import CLoader as Loader
    except ImportError:
        from yaml import SafeLoader as Loader

    candidates = []

    # Phase 1: Scan Skills via Knowledge Graph
    graph_file = os.path.join(project_root, ".agent", "knowledge-graph.yaml")
    try:
        with open(graph_file, 'r', encoding='utf-8') as f:
            # Optional Shared Lock to prevent reading during atomic write replacements
            try:
                fcntl.flock(f, fcntl.LOCK_SH)
            except Exception:
                pass
            graph_data = yaml.load(f, Loader=Loader) or {"nodes": []}
            try:
                fcntl.flock(f, fcntl.LOCK_UN)
            except Exception:
                pass
                
        for node in graph_data.get("nodes", []):
            if not isinstance(node, dict) or node.get("type") != "skill":
                continue
                
            # Exclude private skills
            if str(node.get("graph_visibility", "public")).lower() == "private":
                continue
                
            rel_path = node.get("path", "")
            if rel_path.startswith("/"):
                rel_path = rel_path[1:]
            full_path = os.path.join(project_root, rel_path)
            
            # Compute SOI using Graph metadata instead of raw file reading (Faster & Structured)
            content = f"{node.get('title', '')} {node.get('description', '')} {' '.join(node.get('tags', []))}"
            content_words = get_words(content)
            sim = cosine_similarity(query_words, content_words)
            if sim > 0:
                candidates.append((sim, full_path))
    except FileNotFoundError:
        print("Warning: knowledge-graph.yaml not found. Please run batch-ingest-skills.py to bootstrap the Knowledge Graph.", file=sys.stderr)
    except Exception as e:
        pass # Fallback to ignore graph errors

    # Phase 2: Scan Workflows via Raw Files (Phase 1 does not ingest workflows yet)
    if os.path.isdir(workflows_dir):
        for root, _, files in os.walk(workflows_dir):
            for file in files:
                if file.endswith('.md'):
                    filepath = os.path.join(root, file)
                    abs_path = os.path.abspath(filepath)
                    if not abs_path.startswith(os.path.abspath(workflows_dir)):
                        continue
                        
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            content_words = get_words(content)
                            sim = cosine_similarity(query_words, content_words)
                            if sim > 0:
                                candidates.append((sim, filepath))
                    except Exception:
                        pass

    # Sort candidates by score descending
    candidates.sort(key=lambda x: x[0], reverse=True)
    
    # Check Top N (e.g. 5) for Ghost Skill trap (O(1) checks)
    max_soi = 0.0
    best_match = ""
    for score, path in candidates[:5]:
        if os.path.exists(path):
            max_soi = score
            best_match = path
            break

    return round(max_soi * 100, 2), best_match

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing payload"}))
        sys.exit(1)
        
    payload = sys.argv[1]
    
    # EC-P6-001: Path traversal mitigation and sanitization
    if ".." in payload or ";" in payload or "&" in payload:
        print(json.dumps({"error": "Invalid payload format (shell characters detected)"}))
        sys.exit(1)
        
    try:
        data = json.loads(payload)
        query = data.get('query', '')
        headless = data.get('headless', False)
    except json.JSONDecodeError:
        query = payload
        headless = False

    if headless and not query:
        # EC-P2-001: Return error immediately instead of prompting if headless
        print(json.dumps({"error": "Headless mode requires a valid query in payload"}))
        sys.exit(1)

    # Enforce boundary lock
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    skills_dir = os.path.join(project_root, '.agent', 'skills')
    workflows_dir = os.path.join(project_root, '.agent', 'workflows')
    
    # EC-P7-001: Handle missing directories
    if not os.path.exists(skills_dir):
        os.makedirs(skills_dir, exist_ok=True)
    if not os.path.exists(workflows_dir):
        os.makedirs(workflows_dir, exist_ok=True)

    score, match = scan_soi(query, project_root, skills_dir, workflows_dir)
    
    print(json.dumps({
        "soi_score": score,
        "best_match": match
    }))
