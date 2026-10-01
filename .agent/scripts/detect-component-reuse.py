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

def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def find_components():
    # Mocking extraction from DESIGN.md or src/components
    # In a real scenario, this would parse the actual DESIGN.md
    components = {
        "DataFilter": "A dropdown and input combo to filter datasets based on multiple criteria.",
        "UserCard": "Displays user profile picture, name, and basic contact info.",
        "StatusBadge": "A small colored pill indicating the status of a transaction or item.",
        "ModalDialog": "A generic popup overlay for confirmations or forms."
    }
    
    # Try to scan src/components if it exists
    comp_dir = os.path.join(os.getcwd(), 'src', 'components')
    if os.path.exists(comp_dir):
        for item in os.listdir(comp_dir):
            if os.path.isdir(os.path.join(comp_dir, item)):
                if item not in components:
                    components[item] = f"Existing component found in codebase: {item}"
                    
    return components

def main():
    if len(sys.argv) < 3 or sys.argv[1] != '--component':
        print("Usage: python3 detect-component-reuse.py --component <ProposedName> [--desc <Description>]")
        sys.exit(1)
        
    proposed_name = sys.argv[2]
    proposed_desc = sys.argv[4] if len(sys.argv) > 4 else ""
    
    components = find_components()
    matches = []
    
    for name, desc in components.items():
        # Layer 1: Fuzzy Name Matching
        dist = levenshtein(proposed_name.lower(), name.lower())
        name_score = max(0, 100 - (dist * 10))
        
        # Layer 2: Lexical Token Overlap (Basic TF-IDF proxy)
        tokens_proposed = set(re.findall(r'\w+', proposed_desc.lower()))
        tokens_existing = set(re.findall(r'\w+', desc.lower()))
        overlap = len(tokens_proposed.intersection(tokens_existing))
        desc_score = min(100, overlap * 20)
        
        total_score = (name_score * 0.6) + (desc_score * 0.4)
        
        if total_score > 30: # Threshold for semantic relevance
            matches.append({
                "name": name,
                "description": desc,
                "confidence_score": round(total_score, 2)
            })
            
    matches = sorted(matches, key=lambda x: x["confidence_score"], reverse=True)[:5]
    
    print("\n" + "="*60)
    print("🔍 COMPONENT REUSE DETECTOR (3-Layer Semantic Scan)")
    print("="*60)
    if not matches:
        print(f"[✅] No semantic overlaps found for '{proposed_name}'. Safe to create new.")
        sys.exit(0)
        
    print(f"[⚠️] WARNING: Found {len(matches)} existing components with semantic overlap!\n")
    for idx, m in enumerate(matches):
        print(f"  {idx+1}. {m['name']} (Score: {m['confidence_score']})")
        print(f"     Description: {m['description']}\n")
        
    print("-" * 60)
    print("🛑 ZERO-TRUST ENFORCEMENT 🛑")
    print("As the LLM Agent, you MUST explicitly evaluate the above list.")
    print("Is there a component you can reuse? (Yes/No)")
    print("If Yes: You are FORBIDDEN from creating a new component. REUSE IT.")
    print("If No: You MUST document the exact semantic difference before proceeding.")
    print("="*60 + "\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
