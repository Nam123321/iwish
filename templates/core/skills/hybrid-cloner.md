---
name: hybrid-cloner
description: Dual-track website cloner that harvests local brand assets and applies Visual DNA tokens to generate clean, responsive components.
inputs: [target_url, output_dir]
outputs: [cloned_html_path, asset_directory_path]
mcp_tools_required: [chrome-devtools-mcp]
subagent_triggers: []
---

# Hybrid Cloner: Asset Harvesting & Visual DNA Synthesis

This skill outlines the process for cloning web pages using a hybrid approach: harvesting static assets (logos, SVGs, icons) while rewriting layouts using clean semantic tokens derived from Visual DNA analysis.

---

## 1. Execution Workflow

### Track A: Static Asset Harvesting (GoClone Model)
1.  **Parse HTML**: Fetch the target URL and load the DOM structure.
2.  **Asset Identification**: Locate all `img[src]`, `link[rel="stylesheet"]`, `script[src]`, and custom inline `svg` nodes.
3.  **Local Download**:
    *   Images/SVGs -> `imgs/`
    *   Stylesheets -> `css/`
    *   Scripts -> `js/`
4.  **Relative Path Re-linking**: Rewrite HTML source attributes (`src`, `href`) to point to local relative folder paths.
5.  **Safe-JS Cloner Protocol Sandbox Enforcement**:
    *   **Layer 1 (Outbound CSP):** Inject a strict CSP meta tag in the cloned HTML's `<head>` to block outbound requests (`connect-src 'none'`).
    *   **Layer 2 (Network API Shim):** Prepend `safe-shim.js` to block and warning-log calls to `fetch`, `XMLHttpRequest`, and `WebSocket`.
    *   **Layer 3 (Obfuscation Check & User Approval Gate):** Scan downloaded scripts. If obfuscation or heavy minification is detected:
        *   Prompt the User with a warning warning of risks.
        *   Ask the User to verify if the file is a trusted standard framework library (e.g., React, jQuery).
        *   Halt cloner execution and wait for explicit **User Approval** to continue with the file, otherwise fallback to disabling it.

### Track B: Aesthetic Visual DNA Analysis (Hallmark Model)
1.  **5-Step DNA Audit**:
    *   *Surface*: Settle color palettes and accent footprints.
    *   *Type*: Determine pairing roles (Display, Body, Label).
    *   *Structure*: Match layout to archetypes (Bento Grid, split screens).
    *   *Motion*: Detect animate triggers.
    *   *Rhythm*: Gauge density/spacing.
2.  **Aesthetic Tien-Shinhan**: Filter out AI tells (poor contrast, transition-all, zero-chroma neutrals).

---

## 2. Re-linked Layout Synthesis
1.  **Structure Rebuild**: Rebuild the main layout wrapper using semantic, clean, responsive CSS/Tailwind tokens.
2.  **Asset Injection**: Replace placeholder image cards with the harvested local files (e.g. `<img src="imgs/logo.svg" />` and `<img src="imgs/hero-pattern.png" />`).
3.  **Validation**: Verify that the synthesized page passes the 69-Gate Slop Test and displays all 8 interactive states.
