# Capability Spec: esm-ast-analyzer

## Type: SKILL
## Status: Draft
## Created: 2026-08-01

### Problem Statement
Component tree restructuring failed to account for tree-shaking limitations in current Kit Compiler (FIX-64-01). We need a skill that parses ESM module imports and generates a tree-shaking manifest to support dynamic module loading.

### Knowledge Sources
- Source 1: User Request — 3 Generalization Gate use cases (frontend bundles, third-party plugin integrations in Marketplace Epic, mobile-web view payload reduction).

### Core Concepts
1. **ESM Imports/Exports Analysis**: Identifying static vs dynamic imports and stripping unused exports.
2. **Tree-Shaking Manifest Generation**: Producing a structured output detailing what can be pruned safely.
3. **Payload Optimization**: Aggressive reduction of bundle size for mobile-web view constraints and standard static assets.
4. **Third-Party Integration Safety**: Dynamic loading boundaries for plugin systems.

### Anti-Patterns
- ❌ Guessing which modules are used without analyzing the AST of the files.
- ❌ Modifying original source code before verifying tree-shaking manifest safety.
- ❌ Assuming CommonJS behavior for standard ESM modules.

### Red Flags — STOP and Reconsider
- If you find yourself thinking "I can just use regex to find all import statements instead of building an AST," STOP. Regex is brittle for nested modules and dynamic imports.
- If you find yourself thinking "I'll just assume everything is used because the module is imported," STOP. Tree-shaking requires deep export usage analysis.

### Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just use regex to extract imports because it's faster and usually works." | Regex fails on edge cases and dynamic imports; full AST parsing is mandatory for correct tree-shaking manifests. |
| "Since the plugin is third-party, I can't know what it uses, so I'll bundle it all." | The manifest must explicitly define safe boundaries and dynamically tree-shake where supported by the plugin integration API. |
