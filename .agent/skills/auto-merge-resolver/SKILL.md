---
name: "auto-merge-resolver"
description: "Use when performing structural merges on JSON configuration files or resolving non-overlapping configuration tree changes. Use to safely merge deeply nested objects, arrays, and structural data without losing keys."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# auto-merge-resolver

## When to Use This Skill
- When merging JSON configuration files where multiple actors or tools might have made changes.
- When resolving non-overlapping tree changes in complex nested objects.
- When you need to ensure structural integrity and prevent key loss during config updates.

## Core Rules
1. ALWAYS parse the existing JSON and the incoming JSON strictly before merging.
2. For objects, perform a deep recursive merge. Do not overwrite whole nested objects if only specific inner keys changed.
3. For arrays, determine the merge strategy based on context (append, replace, or merge by key).
4. NEVER use naive string concatenation or regex to modify JSON files.
5. If overlapping changes exist, raise an alert or halt merge to avoid silent data loss.

## Red Flags — STOP and Reconsider
- ❌ Using text-based find-and-replace to modify JSON properties.
- ❌ Blindly overwriting top-level keys without checking nested structures.
- If you find yourself thinking "I can just regex replace this value", STOP. This is a Silent Bypass rationalization. Use a proper JSON parser.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| I'll just regex the value. | Regex cannot guarantee valid JSON output or handle nested keys properly. |
| Overwriting the whole key is fine since it's just one config. | This wipes out unrelated settings within that sub-tree. Perform deep merge. |

## Anti-Patterns
- ❌ NEVER use string replacement tools (`sed`, `awk`) for modifying JSON.
- ❌ NEVER assume arrays always append (sometimes they replace, sometimes they merge by an ID field).

## Best Practices
- ✅ ALWAYS load JSON into memory (e.g. using Python's `json` module), manipulate the object, and dump back with correct indentation.
- ✅ ALWAYS backup the original JSON file before writing the merged output.
- ✅ ALWAYS format the output JSON consistently with the original file (e.g., indent=2).

## Boilerplate / Snippets
```python
import json
import os

def deep_merge(dict1, dict2):
    for key, value in dict2.items():
        if isinstance(value, dict) and key in dict1 and isinstance(dict1[key], dict):
            deep_merge(dict1[key], value)
        else:
            dict1[key] = value
    return dict1

def merge_json_files(file_path, new_data_dict):
    with open(file_path, 'r') as f:
        original = json.load(f)
    
    # Backup
    with open(f"{file_path}.bak", 'w') as f:
        json.dump(original, f, indent=2)
    
    merged = deep_merge(original, new_data_dict)
    
    with open(file_path, 'w') as f:
        json.dump(merged, f, indent=2)
```
