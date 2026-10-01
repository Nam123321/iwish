# Integration Guide: esm-ast-analyzer

## Framework Placement
Phase: Implement & Validate

## Use Cases
1. Optimizing frontend bundles by analyzing standard static assets.
2. Generating dynamic tree-shaking manifests for third-party plugin integrations.
3. Reducing initial payload sizes on mobile-web views.

## Edge Cases
- Dynamic `import()` statements where paths are calculated at runtime.
- Complex CommonJS interop in legacy third-party dependencies.

## Stress Cases
- Processing deeply nested component trees with thousands of imports.
- Analyzing large bundles with heavily obfuscated plugin boundaries.

## Constraints
- Requires the ability to perform AST parsing (cannot rely on simple text or regex-based extraction).
- Only applicable to ESM modules (does not natively resolve CJS require trees).

## Routing Hints for Orch
- Use this skill whenever a request involves analyzing bundle size, generating tree-shaking manifests, optimizing frontend payloads, or structuring plugins for dynamic loading.

## Review Questions for the User
- Should the manifest format conform to a specific bundler's schema (e.g., Rollup, Webpack, Vite)?
- Do you need an explicit schema validation tool added to this skill to verify the generated manifest?
