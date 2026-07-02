#!/usr/bin/env python3
import sys
import os
import re
import json
import math
from collections import Counter

def get_words(text):
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

def scan_soi(query, base_dirs):
    query_words = get_words(query)
    if not query_words:
        return 0.0, ""

    max_soi = 0.0
    best_match = ""

    for d in base_dirs:
        if not os.path.isdir(d):
            continue
        for root, _, files in os.walk(d):
            for file in files:
                if file.endswith('.md'):
                    filepath = os.path.join(root, file)
                    # EC-P6-001: Strict absolute path resolution lock
                    abs_path = os.path.abspath(filepath)
                    if not any(abs_path.startswith(os.path.abspath(bd)) for bd in base_dirs):
                        continue
                        
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            content_words = get_words(content)
                            sim = cosine_similarity(query_words, content_words)
                            if sim > max_soi:
                                max_soi = sim
                                best_match = filepath
                    except Exception as e:
                        pass
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

    score, match = scan_soi(query, [skills_dir, workflows_dir])
    
    print(json.dumps({
        "soi_score": score,
        "best_match": match
    }))
