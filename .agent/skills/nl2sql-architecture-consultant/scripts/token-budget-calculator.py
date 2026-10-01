#!/usr/bin/env python3
import os
import sys
import argparse

def estimate_tokens(text: str) -> int:
    """Approximate token count using length / 4 (deterministic, no external deps)."""
    return len(text) // 4

def main():
    parser = argparse.ArgumentParser(description="NL2SQL Token Budget Calculator")
    parser.add_argument('--schema-file', required=True, help="Path to the DDL/Schema file")
    parser.add_argument('--model-context-limit', type=int, default=128000, help="Maximum context window of the model")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.schema_file):
        print(f"Error: Schema file not found at {args.schema_file}")
        sys.exit(1)
        
    with open(args.schema_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    token_estimate = estimate_tokens(content)
    # The rule is: Schema must not exceed 50% of context window to leave room for RAG and reasoning.
    safe_limit = args.model_context_limit * 0.5
    
    print(f"📊 Token Budget Analysis:")
    print(f"- Model Context Limit: {args.model_context_limit}")
    print(f"- Safe Schema Limit (50%): {int(safe_limit)}")
    print(f"- Estimated Schema Tokens: {token_estimate}")
    
    if token_estimate > safe_limit:
        print("\n🔴 REJECTED: Vượt quá Token Budget an toàn.")
        print("The database schema is too large to be directly injected into the prompt (Dump DDL Anti-pattern).")
        print("You MUST implement a Schema Linking module (Vector DB / BM25) to filter tables and columns before prompting the LLM.")
        sys.exit(1)
    else:
        print("\n✅ APPROVED: Schema size is within safe limits for direct injection.")
        sys.exit(0)

if __name__ == "__main__":
    main()
