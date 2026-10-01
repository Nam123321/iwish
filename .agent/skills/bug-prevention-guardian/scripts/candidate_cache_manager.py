import argparse
import json
import os
import hashlib
from datetime import datetime, timezone

CACHE_FILE = "_iwish/runtime/bug_patterns_candidate_cache.json"
OFFICIAL_KNOWLEDGE_FILE = ".agent/skills/bug-prevention-guardian/references/bug_patterns.md"
THRESHOLD = 2

def load_cache():
    if not os.path.exists(CACHE_FILE):
        return {"candidates": {}}
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {"candidates": {}}

def save_cache(data):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def generate_id(title, rca):
    unique_string = f"{title}_{rca}".encode('utf-8')
    return hashlib.md5(unique_string).hexdigest()[:8]

def add_candidate(title, rca, lesson, category):
    data = load_cache()
    candidates = data.get("candidates", {})
    
    found_id = None
    for cid, cand in candidates.items():
        if cand['category'] == category:
            found_id = cid
            break
            
    if found_id:
        candidates[found_id]['frequency'] += 1
        candidates[found_id]['last_seen'] = datetime.now(timezone.utc).isoformat()
        candidates[found_id]['occurrences'].append({"title": title, "rca": rca, "lesson": lesson})
        freq = candidates[found_id]['frequency']
        print(f"Updated existing candidate '{found_id}' (Category: {category}). Frequency is now {freq}.")
        
        if freq > THRESHOLD and candidates[found_id].get('status') != 'promoted':
            candidates[found_id]['status'] = 'pending_approval'
            print(f"🔥 Candidate '{found_id}' has reached the frequency threshold (> {THRESHOLD}). It is now pending HITL approval.")
    else:
        new_id = generate_id(title, rca)
        candidates[new_id] = {
            "category": category,
            "frequency": 1,
            "status": "candidate",
            "first_seen": datetime.now(timezone.utc).isoformat(),
            "last_seen": datetime.now(timezone.utc).isoformat(),
            "occurrences": [{"title": title, "rca": rca, "lesson": lesson}]
        }
        print(f"Added new candidate '{new_id}' (Category: {category}). Frequency is 1.")

    data["candidates"] = candidates
    save_cache(data)

def review_candidates():
    data = load_cache()
    candidates = data.get("candidates", {})
    pending = {k: v for k, v in candidates.items() if v['status'] == 'pending_approval'}
    
    if not pending:
        print("No candidates pending approval.")
        return

    print("=== CANDIDATES PENDING HITL APPROVAL ===")
    for cid, cand in pending.items():
        print(f"\nID: {cid} | Category: {cand['category']} | Frequency: {cand['frequency']}")
        print("Occurrences:")
        for idx, occ in enumerate(cand['occurrences'], 1):
            print(f"  {idx}. {occ['title']}")
        print(f"Suggested Action: run `python3 candidate_cache_manager.py approve --id {cid}` to promote to official knowledge.")

def promote_candidate(cid):
    data = load_cache()
    candidates = data.get("candidates", {})
    
    if cid not in candidates:
        print(f"Error: Candidate '{cid}' not found.")
        return
        
    cand = candidates[cid]
    if cand['status'] == 'promoted':
        print(f"Candidate '{cid}' is already promoted.")
        return

    os.makedirs(os.path.dirname(OFFICIAL_KNOWLEDGE_FILE), exist_ok=True)
    
    with open(OFFICIAL_KNOWLEDGE_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n## [PROMOTED] Category: {cand['category']}\n")
        f.write(f"- **Frequency before promotion:** {cand['frequency']}\n")
        for idx, occ in enumerate(cand['occurrences'], 1):
            f.write(f"### Occurrence {idx}: {occ['title']}\n")
            f.write(f"**RCA:** {occ['rca']}\n")
            f.write(f"**Lesson:** {occ['lesson']}\n\n")
            
    cand['status'] = 'promoted'
    data["candidates"] = candidates
    save_cache(data)
    
    print(f"✅ Candidate '{cid}' successfully promoted to Official Knowledge ({OFFICIAL_KNOWLEDGE_FILE}).")

def main():
    parser = argparse.ArgumentParser(description="Manage Bug Patterns Candidate Cache (Closed-Loop Learning Protocol)")
    subparsers = parser.add_subparsers(dest="action", help="Action to perform")

    parser_add = subparsers.add_parser("add", help="Add a new bug pattern to the candidate cache")
    parser_add.add_argument("--title", required=True, help="Bug title or brief description")
    parser_add.add_argument("--rca", required=True, help="Root Cause Analysis")
    parser_add.add_argument("--lesson", required=True, help="Lesson Learned / Fix directive")
    parser_add.add_argument("--category", required=True, help="Category of the bug (e.g., RBAC, UI_STATE, DB_CONSTRAINT)")

    parser_review = subparsers.add_parser("review", help="Review candidates pending HITL approval")

    parser_approve = subparsers.add_parser("approve", help="Approve and promote a candidate to official knowledge")
    parser_approve.add_argument("--id", required=True, help="ID of the candidate to approve")

    args = parser.parse_args()

    if args.action == "add":
        add_candidate(args.title, args.rca, args.lesson, args.category)
    elif args.action == "review":
        review_candidates()
    elif args.action == "approve":
        promote_candidate(args.id)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
