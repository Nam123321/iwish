#!/usr/bin/env python3
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone

DEFAULT_CACHE = Path.home() / ".config" / "iwish" / "cooldown-cache.json"

def load_cache(cache_path: Path) -> dict:
    if cache_path.is_file():
        try:
            return json.loads(cache_path.read_text())
        except Exception:
            pass
    return {}

def save_cache(cache_path: Path, data: dict):
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(data, indent=2))

def check_cooldown(key: str, cooldown: int, cache_path: Path) -> dict:
    cache = load_cache(cache_path)
    now = int(datetime.now(timezone.utc).timestamp())
    
    last_check = cache.get(key, {}).get("last_check", 0)
    elapsed = now - last_check
    
    expired = elapsed >= cooldown
    
    return {
        "ok": True,
        "key": key,
        "now": now,
        "last_check": last_check,
        "elapsed": elapsed,
        "cooldown": cooldown,
        "expired": expired
    }

def update_cooldown(key: str, cache_path: Path):
    cache = load_cache(cache_path)
    now = int(datetime.now(timezone.utc).timestamp())
    
    if key not in cache:
        cache[key] = {}
        
    cache[key]["last_check"] = now
    save_cache(cache_path, cache)
    
    return {
        "ok": True,
        "key": key,
        "last_check": now
    }

def main():
    parser = argparse.ArgumentParser(description="I-Wish Throttled Cooldown API Check Helper")
    parser.add_argument("--key", required=True, help="Unique identifier for the API check")
    parser.add_argument("--cooldown", type=int, default=86400, help="Cooldown period in seconds (default: 86400 / 24h)")
    parser.add_argument("--cache", default=str(DEFAULT_CACHE), help="Path to cache file")
    parser.add_argument("--update", action="store_true", help="Update timestamp instead of checking")
    
    args = parser.parse_args()
    
    cache_path = Path(args.cache)
    
    if args.update:
        res = update_cooldown(args.key, cache_path)
    else:
        res = check_cooldown(args.key, args.cooldown, cache_path)
        
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
