---
phase: "origin"
title: "Webstore / Career-Ops Design System (MASTER)"
description: "Master design system and architectural constraints."
---
# Webstore / Career-Ops Design System (MASTER)

## 🎨 Theme: "Warm Earth Tones" & "Liquid Glass"

### 1. Typography
- **Primary Font:** Inter or Roboto (Modern sleek sans-serif).
- **Secondary/Display Font:** Playfair Display (For headings and document styling like CV generation anchor).

### 2. Color Palette (Tailwind Safelist Enforced)
- **Primary/Action:** `text-amber-700`, `bg-amber-100` (Warm earthy orange/brown indicating progress/neutral-action)
- **Success/Safe:** `text-emerald-700`, `bg-emerald-100` (For High Admiralty Match Scores)
- **Danger/Red-Flag:** `text-red-600`, `bg-red-50/20` (For toxic Job Description elements)
- **Surfaces:** Soft Neutrals (`gray-50` to `gray-900`)

### 3. Materials & Effects (Liquid Glass)
- Focus on extensive use of `backdrop-blur-md` and semi-transparent backgrounds like `bg-white/40` and `bg-white/60` to create a feeling of premium depth and glass UI over varied backgrounds.
- High-fidelity soft shadows: `shadow-xl shadow-amber-900/5`

### 4. Core Component Libraries
- **Base Components:** Shadcn/UI (Radix primitives)
- **Animations & Gestures:** Framer Motion (Swipe panels, Modals, State Transitions)
- **Icons:** Lucide React

### 5. Architectural UI Contracts
- The system MUST be built as a strictly frontend SPA with a static build out directory (Vite).
- All visual alerts representing LLM decisions (e.g., Red-Flags) MUST use the exact defined Tailwind tokens.
- Keep components composable to support easy modification and responsive 60/40 Split Views and mobile Bottom Sheets.
