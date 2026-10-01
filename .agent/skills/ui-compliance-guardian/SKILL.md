---
name: ui-compliance-guardian
description: Zero-Trust Hard Gate skill for frontend code reviews to enforce DESIGN.md rules and semantic tokens, blocking forbidden Tailwind classes and hardcoded styles.
---

# `ui-compliance-guardian`

## Purpose
To enforce strict UI compliance with `DESIGN.md` rules and semantic design tokens during frontend code reviews (Layer 1.5). Acts as a Zero-Trust, Hard Gate mechanism to prevent UI regressions and unauthorized styling.

## Principles
- **Semantic Over Literal**: Reject literal utility classes (e.g., `bg-white`) in favor of semantic tokens (e.g., `bg-surface-default`).
- **Zero-Trust**: Assume all UI code changes violate design policy until proven otherwise via strict regex/pattern matching.
- **Fail Fast**: Halt the CI/CD pipeline and code review progression immediately upon detecting violations.

## Triggers
- Code Review (Layer 1.5) where the changeset includes frontend files (`.jsx`, `.tsx`, `.css`, `.scss`).
- When manually validating UI refactoring or styling changes.

## Execution Steps

### 1. Load `UI_COMPLIANCE_POLICY`
- Locate and parse `DESIGN.md` from _iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md to extract the `UI_COMPLIANCE_POLICY`.
- Identify forbidden styling patterns (e.g., `bg-white`, `text-black`, arbitrary pixel values) and required semantic replacements (e.g., `bg-surface-primary`, `var(--ink)`).

### 2. Scan Frontend Code
- Iterate over all changed lines in the target frontend files.
- Apply strict regex and pattern matching to detect:
  - Hardcoded color codes (hex, rgb, hsl).
  - Forbidden literal Tailwind utility classes.
  - Hardcoded inline styles that violate the token system.

### 3. Evaluate Hard Gate Criteria
- If ANY forbidden pattern is detected:
  - Immediately set the Subsystem Confidence Score (SCS) to `< 85%`.
  - Reject the code review.
  - Halt the review pipeline to prevent progression to Layer 2.

### 4. Output Violation Report
- Generate a precise, line-by-line remediation guide.
- Map the forbidden usage to the correct token from `DESIGN.md` (e.g., `Line 42: Forbidden class 'bg-white' detected. Remediation: Use 'bg-surface-primary'`).
