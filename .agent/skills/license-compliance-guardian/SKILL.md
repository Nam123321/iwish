---
name: license-compliance-guardian
description: Evaluates repository licenses against Cowok.ai commercial compliance standards to prevent legal and copyleft risks.
---
# License Compliance Guardian

Triggered during `/rd-evaluate` Phase 2 or when analyzing third-party dependencies.

## Standard Matrix
- **Whitelist (Approved)**: MIT, Apache 2.0, BSD (2-Clause/3-Clause), ISC, WTFPL, CC0.
- **Blacklist (BLOCK - Copyleft Risk)**: GPL (v2, v3), AGPL, SSPL, BSL (unless specific conditions met).
- **Graylist (Require Architect Review)**: LGPL, MPL, CDDL.

## Execution Steps
1. Locate `LICENSE`, `LICENSE.md`, `COPYING` in the repository root.
2. If missing, look for `license` field in `package.json`, `Cargo.toml`, or `pyproject.toml`.
3. If license is in the Blacklist, explicitly state: **"LICENSE VIOLATION DETECTED: [License Name]. This repository cannot be used in Cowok.ai commercial products without open-sourcing our code."** and halt the workflow.
4. If license is missing entirely, treat as Blacklist (All Rights Reserved) and halt.
