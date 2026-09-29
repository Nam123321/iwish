# Product Requirements Document (PRD): goclone & hybrid cloner upgrade

## 1. Goal Description
The objective is to combine Hallmark's semantic Visual DNA study with GoClone's asset crawling and link rewriting logic. This will upgrade I-Wish's `clone-website` skill into a **Hybrid Cloner** that downloads brand-specific assets (logos, icons, SVGs) locally while generating clean, responsive, tokenized component code.

---

## 2. Functional Requirements (FR)

### FR1: Asset Scraper & Extractor
- Implement Node-based asset crawling to parse HTML, identify static resources (`img[src]`, `link[rel="stylesheet"]`, custom SVGs).
- Download files asynchronously and organize them into standard `css/` and `imgs/` directories.

### FR2: HTML Link Re-writing
- Implement a parser (using `cheerio`) to replace remote resource URLs with relative local paths (`css/[filename]`, `imgs/[filename]`).

### FR3: Hybrid Re-linked Synthesis
- Expose rules for linking downloaded local brand assets (logos, icons) into generated code.
- Apply Hallmark's design system tokens (colors, font pairing roles) to style the layout structure.

---

## 3. Non-Functional Requirements (NFR)

### NFR1: Runtime Native Compatibility
- Implement the asset crawler and parser natively in TypeScript/JavaScript to avoid binary dependencies.

### NFR2: Anti-Bot Resiliency
- Fall back gracefully to browser-based rendering or screenshot-based DNA extraction when standard HTTP fetches are blocked.
