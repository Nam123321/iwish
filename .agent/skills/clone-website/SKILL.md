---
name: clone-website-skill
description: Use when instructed to extract DOM structure, design tokens, or
  interaction specs from a provided URL.
---

# Clone Website — Skill Suite

This skill suite provides three specialized sub-tools for website analysis and cloning. Each can be used independently or as part of the full clone pipeline.

## Sub-Skills

### 1. DOM Extractor (`dom-extractor.md`)
**Purpose:** Inject JavaScript into a browser page to recursively extract computed CSS styles from any DOM container.
**Used by:** absorber-agent (full clone), dev-agent (component reference), architect-agent (UI spec enrichment)
**Output:** JSON tree of elements with exact `getComputedStyle()` values
**Usage:** Load and follow `{project-root}/.agent/skills/clone-website/dom-extractor.md`

### 2. Token Extractor (`token-extractor.md`)
**Purpose:** Extract the Design System tokens (colors, fonts, spacing, shadows, radius) from a target website.
**Used by:** absorber-agent (full clone), architect-agent (Design Token initialization), analyst-agent (competitive analysis)
**Output:** Structured Design Token document (Markdown)
**Usage:** Load and follow `{project-root}/.agent/skills/clone-website/token-extractor.md`

### 3. Interaction Analyzer (`interaction-analyzer.md`)
**Purpose:** Sweep a page for interactive behaviors — scroll-driven, click-driven, hover states, animations, responsive breakpoints.
**Used by:** absorber-agent (full clone), qa-agent (QA test case generation)
**Output:** Behavioral specification document (BEHAVIORS.md)
**Usage:** Load and follow `{project-root}/.agent/skills/clone-website/interaction-analyzer.md`

### 4. Design DNA Extractor (`design-dna-extraction.md`)
**Purpose:** Extract the design visual DNA (layout, typography pairings, colors, and rhythm) instead of raw pixels, using URL/Image modes.
**Used by:** ux-agent (UI spec design), cloner-agent (cloning prep)
**Output:** Natural language visual skeleton specs.
**Usage:** Load and follow `{project-root}/.agent/skills/clone-website/design-dna-extraction.md`

### 5. Hybrid Cloner (`hybrid-cloner.md`)
**Purpose:** Crawl and download static assets locally while rebuilding components with clean Design DNA Tailwind tokens.
**Used by:** cloner-agent (hybrid cloning pipeline), dev-agent (component rendering)
**Output:** stand-alone HTML + clean CSS + downloaded local asset directories.
**Usage:** Load and follow `{project-root}/.agent/skills/clone-website/hybrid-cloner.md`

## Integration Points

| Agent | When to Invoke | Which Sub-Skill |
|-------|---------------|----------------|
| **absorber-agent** | `/clone-website` full pipeline | All three |
| **architect-agent** | `/create-ui-spec` when PRD references a URL | `token-extractor` |
| **dev-agent** | Coding a UI component with external reference | `dom-extractor` |
| **qa-agent** | Generating interaction test cases | `interaction-analyzer` |
| **analyst-agent** | Competitive UI/UX benchmarking | `token-extractor` |

## Prerequisites
- The `browser_subagent` tool must be available in the current environment
- Target URLs must be publicly accessible (no auth-walled pages)

## Output Locations
All extraction outputs are saved under the project's `docs/research/cloned-specs/` directory:
- `design-tokens.md` — Global design tokens
- `PAGE_TOPOLOGY.md` — Section map
- `BEHAVIORS.md` — Interaction analysis
- `components/*.spec.md` — Individual component specifications

## Fallback Protocol (When MCP Unavailable)

> ⚠️ **CRITICAL:** Only invoke this fallback AFTER `browser_subagent` or `chrome-devtools-mcp` has been attempted and failed.

If `chrome-devtools-mcp` fails due to Captcha, timeout, connection error, or the browser environment is not available:

### Step 1: HTTP Header Check
```bash
curl -sI "<TARGET_URL>" | head -20
```
Verify HTTP status (200 OK), content-type (text/html), and follow redirects if needed.

### Step 2: Static Content Fetch
Use the built-in `read_url_content` tool (zero-dependency, converts HTML → Markdown):
```
read_url_content(Url: "<TARGET_URL>")
```
This provides the page content as clean Markdown without JavaScript execution.

### Step 3: Manual Token Extraction
From the Markdown output, manually identify:
- **Colors:** Search for hex codes (`#xxx`, `#xxxxxx`), `rgb()`, `hsl()` patterns.
- **Fonts:** Search for font-family names in `<style>` blocks or inline styles.
- **Layout patterns:** Identify grid/flex references from class names.

### Limitations
- ❌ No JavaScript execution — dynamic content will be missing.
- ❌ No computed styles — only inline/embedded CSS is captured.
- ❌ No interaction analysis — hover states, animations are not observable.
- ✅ Document all gaps in the output file header under a `## Fallback Limitations` section.

