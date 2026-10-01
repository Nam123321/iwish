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
import argparse
import re
import yaml
from pathlib import Path

def parse_frontmatter(content):
    """Extremely basic YAML frontmatter parser for required keys."""
    frontmatter_match = re.match(r'^---\s*(.*?)\s*---', content, re.DOTALL)
    if not frontmatter_match:
        return None
    
    frontmatter_text = frontmatter_match.group(1)
    try:
        parsed = yaml.safe_load(frontmatter_text)
        if isinstance(parsed, dict):
            return list(parsed.keys())
    except Exception as e:
        print(f"⚠️ Error parsing YAML frontmatter: {e}")
    return []

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Template Compliance Validator")
    parser.add_argument("--file", required=True, help="Path to the generated file to check")
    parser.add_argument("--template", required=True, help="Path to the template file it should conform to")
    args = parser.parse_args()

    target_file = Path(args.file)
    template_file = Path(args.template)

    if not target_file.exists():
        print(f"❌ FAIL: Target file {target_file} does not exist.")
        sys.exit(1)

    if not template_file.exists():
        print(f"❌ FAIL: Template file {template_file} does not exist.")
        sys.exit(1)

    with open(target_file, 'r') as f:
        target_content = f.read()

    with open(template_file, 'r') as f:
        template_content = f.read()

    target_keys = parse_frontmatter(target_content)
    template_keys = parse_frontmatter(template_content)

    if template_keys is None:
        print(f"⚠️ Template {template_file} does not have YAML frontmatter. Skipping check.")
        sys.exit(0)

    if target_keys is None:
        print(f"❌ Zero-Trust Violation: Target file {target_file} is missing YAML frontmatter.")
        sys.exit(1)

    missing_keys = set(template_keys) - set(target_keys)
    if missing_keys:
        print(f"❌ Zero-Trust Violation: Target file {target_file} is missing required frontmatter keys defined in the template: {', '.join(missing_keys)}")
        sys.exit(1)

    print(f"✅ PASS: File {target_file} conforms to the YAML frontmatter requirements of {template_file}.")
    sys.exit(0)

if __name__ == "__main__":
    main()
