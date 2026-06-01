#!/usr/bin/env python3
"""
Prompt Density & Token Telemetry Utility

This script computes character-level Shannon entropy over prompt text files,
parses token usage statistics from LLM API response JSON logs,
detects prompt size bloat (>20% size increase compared to baseline),
and appends telemetry metrics to a TSV log file.
"""

import os
import sys
import math
import json
import time
import argparse
from collections import Counter
from typing import Dict, Tuple, Optional

# On POSIX systems, import fcntl for thread/process-safe file locking.
try:
    import fcntl
except ImportError:
    fcntl = None


def compute_shannon_entropy(text: str) -> float:
    """
    Computes character-level Shannon entropy of the given text string.
    Formula: H(X) = -sum( P(xi) * log2(P(xi)) )
    Returns entropy in bits per character. Returns 0.0 for empty strings.
    """
    if not text:
        return 0.0
    
    char_counts = Counter(text)
    total_chars = len(text)
    
    entropy = 0.0
    for count in char_counts.values():
        p = count / total_chars
        entropy -= p * math.log2(p)
        
    return entropy


def extract_token_stats(response_data: dict) -> Dict[str, int]:
    """
    Recursively parses token stats from LLM JSON response dictionaries.
    Standardizes key variations across OpenAI, Anthropic, Gemini, etc.
    Keys extracted: prompt_tokens, completion_tokens, cached_tokens.
    """
    stats = {
        'prompt_tokens': 0,
        'completion_tokens': 0,
        'cached_tokens': 0
    }
    
    def find_keys(d):
        if not isinstance(d, dict):
            return
        
        # Check for prompt/input tokens
        for k in ['prompt_tokens', 'input_tokens', 'prompt_token_count', 'input_token_count']:
            if k in d and isinstance(d[k], (int, float)):
                stats['prompt_tokens'] = int(d[k])
                break
        
        # Check for completion/output tokens
        for k in ['completion_tokens', 'output_tokens', 'candidates_token_count', 'output_token_count']:
            if k in d and isinstance(d[k], (int, float)):
                stats['completion_tokens'] = int(d[k])
                break
        
        # Check for cached/cache-read tokens
        for k in ['cached_tokens', 'cached_prompt_tokens', 'cache_read_input_tokens', 'cached_content_token_count']:
            if k in d and isinstance(d[k], (int, float)):
                stats['cached_tokens'] = int(d[k])
                break
                
        # Recurse into children dicts to find nested structures (e.g. usage, usage_metadata)
        for _, v in d.items():
            if isinstance(v, dict):
                find_keys(v)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict):
                        find_keys(item)
                        
    find_keys(response_data)
    return stats


def check_bloat(
    baseline_size: int,
    current_size: int,
    baseline_success: float,
    current_success: float
) -> Tuple[str, bool]:
    """
    Checks if current prompt is bloated (>20% size increase compared to baseline).
    Rejects the evolution as "BLOATED" unless the validation success rate increases.
    Returns:
        (status_str, approved_bool)
    """
    if baseline_size <= 0:
        return "OK", True
        
    size_increase_ratio = (current_size - baseline_size) / baseline_size
    
    if size_increase_ratio > 0.20:
        # Prompt size grew by more than 20%
        # Reject unless validation success rate increased
        if current_success > baseline_success:
            return "OK", True
        else:
            return "BLOATED", False
            
    return "OK", True


def log_telemetry_tsv(
    tsv_path: str,
    prompt_file: str,
    entropy: float,
    prompt_tokens: int,
    completion_tokens: int,
    cached_tokens: int,
    size_bytes: int,
    status: str,
    approved: bool
) -> None:
    """
    Safely appends telemetry metrics to a TSV file using file locks.
    """
    headers = [
        "timestamp", "prompt_file", "entropy", 
        "prompt_tokens", "completion_tokens", "cached_tokens", 
        "size_bytes", "status", "approved"
    ]
    
    # Generate standard ISO 8601 timestamp with local time offset
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    if not timestamp.endswith('Z') and len(timestamp) > 19:
        offset = timestamp[-5:]
        if (offset.startswith('+') or offset.startswith('-')) and ':' not in offset:
            timestamp = timestamp[:-5] + offset[:3] + ':' + offset[3:]
            
    row = [
        timestamp,
        prompt_file,
        f"{entropy:.4f}",
        str(prompt_tokens),
        str(completion_tokens),
        str(cached_tokens),
        str(size_bytes),
        status,
        str(approved).upper()
    ]
    
    # Check if file exists and has size > 0
    file_exists = os.path.exists(tsv_path) and os.path.getsize(tsv_path) > 0
    
    # Ensure directory exists
    dir_name = os.path.dirname(tsv_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
        
    with open(tsv_path, 'a', encoding='utf-8') as f:
        # Apply exclusive lock if fcntl is available
        if fcntl:
            try:
                fcntl.flock(f, fcntl.LOCK_EX)
                if not file_exists:
                    f.write('\t'.join(headers) + '\n')
                f.write('\t'.join(row) + '\n')
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        else:
            # Fallback for systems without fcntl (e.g. Windows)
            if not file_exists:
                f.write('\t'.join(headers) + '\n')
            f.write('\t'.join(row) + '\n')


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Calculate prompt density, parse token usage telemetry, and enforce size budgets."
    )
    parser.add_argument(
        "--prompt-file",
        type=str,
        help="Path to the current prompt markdown/text file."
    )
    parser.add_argument(
        "--baseline-prompt-file",
        type=str,
        help="Path to the baseline prompt markdown/text file (optional, for size calculation)."
    )
    parser.add_argument(
        "--log-json",
        type=str,
        help="Path to the LLM response JSON log file containing token usage."
    )
    parser.add_argument(
        "--baseline-success",
        type=float,
        default=0.0,
        help="Baseline success rate (e.g. 0.85 or 85.0)."
    )
    parser.add_argument(
        "--current-success",
        type=float,
        default=0.0,
        help="Current success rate (e.g. 0.90 or 90.0)."
    )
    parser.add_argument(
        "--baseline-size",
        type=int,
        help="Explicit baseline size in bytes (ignored if --baseline-prompt-file is provided)."
    )
    parser.add_argument(
        "--current-size",
        type=int,
        help="Explicit current size in bytes (ignored if --prompt-file is provided)."
    )
    parser.add_argument(
        "--tsv-log-path",
        type=str,
        default="results.tsv",
        help="Path to the TSV file where telemetry will be appended."
    )
    
    args = parser.parse_args()
    
    # 1. Compute entropy and current size
    entropy = 0.0
    current_size = 0
    prompt_file_name = "N/A"
    

    # Python argparse converts dashes to underscores automatically for attributes
    args_prompt_file = getattr(args, 'prompt_file', None)
    args_baseline_prompt_file = getattr(args, 'baseline_prompt_file', None)
    args_log_json = getattr(args, 'log_json', None)
    args_baseline_success = getattr(args, 'baseline_success', 0.0)
    args_current_success = getattr(args, 'current_success', 0.0)
    args_baseline_size = getattr(args, 'baseline_size', None)
    args_current_size = getattr(args, 'current_size', None)
    args_tsv_log_path = getattr(args, 'tsv_log_path', "results.tsv")

    if args_prompt_file:
        if not os.path.exists(args_prompt_file):
            print(f"Error: Prompt file not found: {args_prompt_file}", file=sys.stderr)
            return 1
        with open(args_prompt_file, 'r', encoding='utf-8') as f:
            content = f.read()
        entropy = compute_shannon_entropy(content)
        current_size = len(content.encode('utf-8'))
        prompt_file_name = os.path.basename(args_prompt_file)
    elif args_current_size is not None:
        current_size = args_current_size
        
    # 2. Get baseline size
    baseline_size = 0
    if args_baseline_prompt_file:
        if not os.path.exists(args_baseline_prompt_file):
            print(f"Error: Baseline prompt file not found: {args_baseline_prompt_file}", file=sys.stderr)
            return 1
        with open(args_baseline_prompt_file, 'r', encoding='utf-8') as f:
            baseline_content = f.read()
        baseline_size = len(baseline_content.encode('utf-8'))
    elif args_baseline_size is not None:
        baseline_size = args_baseline_size
        
    # 3. Extract tokens
    prompt_tokens = 0
    completion_tokens = 0
    cached_tokens = 0
    
    if args_log_json:
        if not os.path.exists(args_log_json):
            print(f"Error: Log JSON file not found: {args_log_json}", file=sys.stderr)
            return 1
        try:
            with open(args_log_json, 'r', encoding='utf-8') as f:
                log_data = json.load(f)
            stats = extract_token_stats(log_data)
            prompt_tokens = stats['prompt_tokens']
            completion_tokens = stats['completion_tokens']
            cached_tokens = stats['cached_tokens']
        except json.JSONDecodeError as e:
            print(f"Error: Failed to parse JSON log: {e}", file=sys.stderr)
            return 1
            
    # 4. Check size bloat and decide approval
    status, approved = check_bloat(
        baseline_size=baseline_size,
        current_size=current_size,
        baseline_success=args_baseline_success,
        current_success=args_current_success
    )
    
    # 5. Log telemetry
    log_telemetry_tsv(
        tsv_path=args_tsv_log_path,
        prompt_file=prompt_file_name,
        entropy=entropy,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        cached_tokens=cached_tokens,
        size_bytes=current_size,
        status=status,
        approved=approved
    )
    
    # 6. Output result JSON
    result = {
        "prompt_file": prompt_file_name,
        "entropy_bits_per_char": round(entropy, 4),
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cached_tokens": cached_tokens,
        "size_bytes": current_size,
        "baseline_size_bytes": baseline_size,
        "status": status,
        "approved": approved
    }
    
    print(json.dumps(result, indent=2))
    return 0 if approved else 2  # Return 0 if approved, 2 if rejected (bloated)


if __name__ == '__main__':
    sys.exit(main())
