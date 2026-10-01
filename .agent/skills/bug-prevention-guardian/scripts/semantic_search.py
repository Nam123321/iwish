#!/usr/bin/env python3
import sys
import os
import glob
import re

def main():
    if len(sys.argv) < 2:
        print("Usage: python semantic_search.py <keywords>")
        sys.exit(1)
        
    keywords = sys.argv[1].lower().split()
    knowledge_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "references")
    
    print(f"🔍 Searching local knowledge base for: {', '.join(keywords)}...\n")
    
    found = False
    for filepath in glob.glob(os.path.join(knowledge_dir, "*.md")):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # Basic exact-word search for MVP
                # A real implementation would use Model2Vec or BM25
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if any(kw in line.lower() for kw in keywords):
                        print(f"📄 Found match in {os.path.basename(filepath)} (Line {i+1}):")
                        # Print context window of 2 lines
                        start = max(0, i-2)
                        end = min(len(lines), i+3)
                        print("----------------------------------------")
                        for j in range(start, end):
                            prefix = ">>" if j == i else "  "
                            print(f"{prefix} {lines[j]}")
                        print("----------------------------------------\n")
                        found = True
        except Exception as e:
            pass
            
    if not found:
        print("✅ No historical anti-patterns found for these keywords.")

if __name__ == "__main__":
    main()
