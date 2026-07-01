---
name: 'design-localization'
description: 'Interactive workflow to design and configure Localization & Regional Settings (i18n, timezone, currency, units) for SaaS applications.'
disable-model-invocation: true
---

# /design-localization

## Overview
This workflow evaluates the SaaS product's requirements for global scaling and configures the foundational architecture for Localization (i18n) and Regional Settings.

## Prerequisites
- A target domain or feature set requiring multi-language or multi-region support.
- Existing PRD or Architecture docs (optional but recommended).

## Execution Steps

### Step 1: Analyze Localization Needs
1. Evaluate the PRD to determine the target markets and supported locales.
2. Identify areas requiring translation (UI text, dynamic database content, notification templates).

### Step 2: Regional Formatting Configuration
Ensure the architecture accounts for the following variations:
- **Timezones & Dates:** Storing dates in UTC, formatting in user's local timezone.
- **Currency & Pricing:** Multi-currency support, precision, placement of currency symbols.
- **Numbers:** Decimal and thousand separators (e.g. `1,234.56` vs `1.234,56`).
- **Measurement Units:** Metric vs. Imperial systems for weight, length, and volume.

### Step 3: Present User Gate (Options)
**[CRITICAL USER GATE] MUST STOP AND WAIT FOR EXPLICIT APPROVAL.**
Present the following standard options to the user:
1. **Single Region (Locked):** Hardcoded timezone, currency, and language (Fastest to build).
2. **Multi-Language UI Only:** User can switch UI language, but core business logic and currency are locked to one region.
3. **Full Global SaaS (Enterprise Standard):** Full i18n, dynamic timezone resolution, multi-currency support, and unit conversion engines.

### Step 4: Finalize & Inject
Once the user selects an option:
1. Define the Global Localization Strategy.
2. Output injection references for `epics-and-stories.md` to ensure the correct features (like a Localization Context Provider or Currency Formatter Service) are prioritized.
