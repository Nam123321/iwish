---
name: 3d-visualize
description: Autonomous 3D Visualization Generator using 3dviz-pro-max skill suite
category: frontend-specialty
roles:
  - dev-agent
  - ux-agent
steps:
  - id: 3d-01-preflight
    description: "Verify dependencies in package.json (three, @react-three/fiber, @react-three/drei). Auto-install if missing."
  - id: 3d-02-recipe-selection
    description: "Select 3D recipe from .agent/skills/3dviz-pro-max/data/ matching target style and component requirements."
  - id: 3d-03-scaffold
    description: "Generate Next.js / React Three.js component with SSR-safe dynamic loading and WebGL disposal hooks."
  - id: 3d-04-verify
    description: "Run TypeScript check and syntax verification on the generated 3D component."
---

# /3d-visualize

This workflow enables autonomous generation of interactive, high-fidelity 3D visualizations, data charts, and canvas components leveraging the standalone `3dviz-pro-max` skill suite.

## Prerequisites & Pre-Flight (EC-P5-02)

Before generating 3D code, inspect `package.json`:
1. Check if `three` and `@react-three/fiber` exist in dependencies.
2. If missing, automatically run:
   ```bash
   pnpm add three @types/three @react-three/fiber @react-three/drei
   ```

## Execution Protocol

### Step 1: Input Analysis
Accept user arguments or story requirements:
- `--target <ComponentName>`: Target component name (e.g., `ProductShowcase3D`, `AnalyticsGlobe3D`).
- `--style <StyleName>`: Rendering style (e.g., `glassmorphism`, `cyberpunk`, `minimalist-wireframe`, `particles`).
- `--output <FilePath>`: Target source path (default: `src/components/ui/3d/<ComponentName>.tsx`).

### Step 2: Recipe Matching
Load recipes and guidelines from `.agent/skills/3dviz-pro-max/`:
- Consult `.agent/skills/3dviz-pro-max/SKILL.md` for performance optimizations, camera setups, and lighting defaults.
- Select matching recipe templates from `.agent/skills/3dviz-pro-max/data/`.

### Step 3: Scaffold Component
Generate the component following strict Next.js and Three.js best practices:
1. **SSR-Safe Export:** Use Next.js dynamic import with `ssr: false` or wrap canvas in client-only checks (`"use client"`).
2. **WebGL Context Memory Cleanup (Zero Memory Leak):**
   Ensure all geometries, materials, and textures call `.dispose()` on component unmount:
   ```tsx
   useEffect(() => {
     return () => {
       geometry?.dispose();
       material?.dispose();
     };
   }, []);
   ```
3. **Accessibility & Fallback:** Provide a 2D HTML/CSS fallback in case WebGL context fails to initialize.

### Step 4: Quality & Compilation Gate
Run linter and TypeScript compiler to ensure 0 type errors:
```bash
npx tsc --noEmit
```
