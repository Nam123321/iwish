"""
Unified Manifest Loader (LD-11)
Absorbs duplicated parsing logic across contract verification scripts.
Supports:
- Standalone contract-manifest.yaml
- Story markdown frontmatter (YAML block)
- Embedded ```yaml contract_manifest codeblocks
- contract-bundle.json
"""

import os
import re
import json
import yaml
from typing import Dict, Any, Optional


def load_story_manifest(story_dir: str) -> Optional[Dict[str, Any]]:
    """Search story directory for contract manifest across all recognized locations."""
    if not os.path.exists(story_dir):
        return None

    # 1. Standalone contract-manifest.yaml
    standalone = os.path.join(story_dir, "contract-manifest.yaml")
    if os.path.exists(standalone):
        try:
            with open(standalone, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass

    # 2. Check data-spec.md
    for filename in ["data-spec.md", "story.md"]:
        filepath = os.path.join(story_dir, filename)
        if os.path.exists(filepath):
            manifest = extract_manifest_from_markdown(filepath)
            if manifest:
                return manifest

    return None


def extract_manifest_from_markdown(filepath: str) -> Optional[Dict[str, Any]]:
    """Extract manifest from frontmatter or codeblock inside markdown file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Check frontmatter
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                try:
                    fm = yaml.safe_load(parts[1])
                    if isinstance(fm, dict):
                        if "contract_manifest" in fm and isinstance(fm["contract_manifest"], dict):
                            return fm["contract_manifest"]
                        if "models_declared" in fm or "database_mutations" in fm:
                            return fm
                except Exception:
                    pass

        # Check embedded ```yaml contract_manifest block
        match = re.search(r"```yaml\s+contract_manifest\s*\n(.*?)\n```", content, re.DOTALL)
        if match:
            try:
                data = yaml.safe_load(match.group(1))
                if isinstance(data, dict):
                    return data
            except Exception:
                pass

        # Check standard ```yaml codeblocks for contract keys
        for block in re.findall(r"```ya?ml\s*\n(.*?)\n```", content, re.DOTALL):
            if "database_mutations:" in block or "models_declared:" in block:
                try:
                    data = yaml.safe_load(block)
                    if isinstance(data, dict):
                        return data
                except Exception:
                    pass

    except Exception:
        pass

    return None
