import argparse
import json
import re

def predict_complexity(query: str) -> dict:
    complexity_score = 0
    words = query.split()
    
    # Heuristic 1: Length (Category A)
    if len(words) > 50:
        complexity_score += 30
    elif len(words) > 20:
        complexity_score += 10
        
    # Heuristic 2: Keyword matching (Category A)
    complex_keywords = ["analyze", "evaluate", "compare", "synthesize", "architect", "refactor", "debug"]
    for keyword in complex_keywords:
        if keyword in query.lower():
            complexity_score += 15
            
    # Heuristic 3: Pattern matching (Category A)
    if re.search(r'(error|exception|traceback|failed)', query, re.IGNORECASE):
        complexity_score += 25
        
    # Bounding score
    complexity_score = min(100, complexity_score)
    
    # Routing decision
    if complexity_score < 30:
        route = "fast-path"
    elif complexity_score < 70:
        route = "slm"
    else:
        route = "llm"
        
    return {
        "complexity_score": complexity_score,
        "route": route,
        "heuristics_used": ["length", "keyword", "pattern"]
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", type=str, required=True, help="The query string to predict")
    args = parser.parse_args()
    
    result = predict_complexity(args.query)
    print(json.dumps(result))
