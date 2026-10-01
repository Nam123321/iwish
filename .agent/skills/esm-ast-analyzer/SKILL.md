---
name: "esm-ast-analyzer"
description: "Use when optimizing frontend bundles, analyzing ESM imports, or generating tree-shaking manifests for dynamic module loading to reduce payload size."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# ESM AST Analyzer

## When to Use This Skill
- Analyzing static vs dynamic ESM imports.
- Generating a tree-shaking manifest for third-party plugin integrations.
- Optimizing frontend bundles for size reduction (e.g., mobile-web views).
- Resolving module tree restructuring where tree-shaking is a limitation.

## Core Rules
1. Always parse files into an Abstract Syntax Tree (AST) to reliably identify imports and exports.
2. Generate a structured tree-shaking manifest explicitly detailing what can be pruned safely.
3. Ensure dynamic loading boundaries are respected for plugin systems.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I can just use regex to find all import statements instead of building an AST," STOP. This is a Silent Bypass rationalization.
- If you find yourself thinking "I'll just assume everything is used because the module is imported," STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just use regex to extract imports because it's faster and usually works." | Regex fails on edge cases and dynamic imports; full AST parsing is mandatory for correct tree-shaking manifests. |
| "Since the plugin is third-party, I can't know what it uses, so I'll bundle it all." | The manifest must explicitly define safe boundaries and dynamically tree-shake where supported by the plugin integration API. |

## Anti-Patterns
- ❌ NEVER guess which modules are used without analyzing the AST of the files.
- ❌ NEVER modify original source code before verifying tree-shaking manifest safety.
- ❌ NEVER assume CommonJS behavior for standard ESM modules.

## Best Practices
- ✅ ALWAYS use robust AST parsing for ESM import/export statements.
- ✅ ALWAYS structure the manifest clearly so compilers/bundlers can consume it safely.

## Version Notes
- Initial Draft (v1.0)
