# Scout Rules — Context-Efficient Exclusion Patterns

> Prevent token waste by excluding irrelevant files from code scanning, analysis, and context loading.

## Attribution & Lineage

- **Source:** `scout-block` patterns from [vibecode-pro-max-kit](https://github.com/withkynam/vibecode-pro-max-kit) (MIT)
- **Adapted by:** I-Wish RAP (Repo Absorption Protocol)
- **Version:** 1.0.0

---

## Standard Exclusion Rules

### Always Exclude — Directories

| Pattern | Reason |
|---------|--------|
| `node_modules/` | Dependencies — too large, not project code |
| `.git/` | Version control metadata |
| `dist/` | Build output |
| `build/` | Build output |
| `.next/` | Next.js build cache |
| `.nuxt/` | Nuxt build cache |
| `.output/` | Nitro/Nuxt output |
| `coverage/` | Test coverage reports |
| `.nyc_output/` | NYC coverage output |
| `.cache/` | Generic cache |
| `.turbo/` | Turbo repo cache |
| `.vercel/` | Vercel config/cache |
| `.netlify/` | Netlify config/cache |
| `__pycache__/` | Python bytecode |
| `.pytest_cache/` | Pytest cache |
| `vendor/` | Go/PHP vendor dependencies |
| `.venv/` | Python virtual environment |
| `venv/` | Python virtual environment |
| `.tox/` | Python tox environments |
| `.eggs/` | Python eggs |
| `.terraform/` | Terraform state/providers |

### Always Exclude — Files

| Pattern | Reason |
|---------|--------|
| `*.lock` | Lock files (package-lock.json, yarn.lock, pnpm-lock.yaml) |
| `*.min.js` | Minified JS — unreadable, no analysis value |
| `*.min.css` | Minified CSS |
| `*.map` | Source maps — binary-like, large |
| `*.chunk.js` | Webpack chunks |
| `*.bundle.js` | Bundled output |
| `*.d.ts` | TypeScript declaration files (usually auto-generated) |

### Always Exclude — Binary & Media

| Pattern | Reason |
|---------|--------|
| `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp`, `*.avif` | Images — not code |
| `*.svg` | SVG can be huge, rarely analysis-relevant |
| `*.ico`, `*.icns` | Icons |
| `*.woff`, `*.woff2`, `*.ttf`, `*.eot`, `*.otf` | Fonts |
| `*.mp4`, `*.webm`, `*.mov`, `*.avi` | Video |
| `*.mp3`, `*.wav`, `*.ogg`, `*.flac` | Audio |
| `*.pdf`, `*.doc`, `*.docx`, `*.xls`, `*.xlsx` | Documents |
| `*.zip`, `*.tar`, `*.gz`, `*.rar`, `*.7z` | Archives |
| `*.wasm` | WebAssembly binaries |
| `*.pyc`, `*.pyo` | Python compiled |
| `*.class`, `*.jar` | Java compiled |
| `*.o`, `*.so`, `*.dylib`, `*.dll`, `*.exe` | Native compiled |

### Conditional Exclude — Large Auto-Generated

| Pattern | When to Exclude |
|---------|-----------------|
| `*.generated.ts` | Always (auto-generated from schema) |
| `prisma/migrations/` | Exclude from search, include for schema review |
| `graphql.generated.tsx` | Always (codegen output) |
| `openapi.json` | Exclude from search, include for API review |
| `swagger.json` | Same as openapi.json |

---

## Usage: Double-Lock Injection

Inject this fragment into any skill/workflow that performs code scanning:

```markdown
## Prerequisites
- This skill ASSUMES the agent has the `@.agent/fragments/scout-rules.md` fragment injected.
- Apply exclusion patterns when using `grep_search`, `code-search`, `list_dir`, or any file traversal.
```

### grep_search Example

When using `grep_search`, apply exclusions via the `Includes` parameter:

```json
{
  "Includes": [
    "*.ts", "*.tsx", "*.js", "*.jsx", "*.py", "*.go",
    "!**/node_modules/**", "!**/dist/**", "!**/build/**",
    "!**/*.min.js", "!**/*.lock", "!**/*.map"
  ]
}
```

### Repomix Example

When packing a repo for analysis, use `.repomixignore`:

```
node_modules/
dist/
build/
.git/
*.lock
*.min.js
*.map
*.png
*.jpg
*.svg
*.woff
*.woff2
coverage/
__pycache__/
.next/
```

---

## When to Override

- **Include `*.d.ts`** when reviewing library API surfaces
- **Include `prisma/migrations/`** when auditing database schema changes
- **Include `*.svg`** when working on icon systems
- **Include `dist/`** when debugging build output issues

Override by explicitly specifying the file/directory in the search command, which takes precedence over fragment exclusions.
