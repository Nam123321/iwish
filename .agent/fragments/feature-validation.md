# Feature Validation Checklist — User Simulation Gate

> 🚨 **This checklist BLOCKS feature approval if any FAIL item is not resolved.**
> Load this checklist via: `{project-root}/.agent/skills/user-simulation-guardian/checklists/feature-validation.md`

## Gate Check Protocol

### Step 1: Verify Simulation Was Done
```
□ PASS/FAIL: ≥3 personas were simulated with documented findings
□ PASS/FAIL: ≥2 scenarios were cross-tested
□ PASS/FAIL: User Simulation Report is attached to UI spec
```

### Step 2: Business Context Verified
```
□ PASS/FAIL: Business context (R-dimension) explicitly documented
  - Ngành hàng identified
  - B2B/B2C/hybrid channel identified
  - Per-portal user type identified
□ PASS/FAIL: Persona selection matches portal being designed
```

### Step 3: Non-Linear Paths
```
□ PASS/FAIL: At least 1 non-linear user path identified and designed
  Examples: jump between pages, abandon + return, interrupt + resume
□ PASS/FAIL: Copy-paste path designed (not just click/type path)
  - Copy-paste of external context (e.g., text, code, message, or file imports)
□ PASS/FAIL: Voice/shortcut/quick-action path considered (if applicable)
```

### Step 4: Repeat & Reorder
```
□ PASS/FAIL: "Reorder/repeat/history" path designed for applicable features
□ PASS/N/A: Quick re-use/template/duplicate flow exists for transactional/form-heavy features
```

### Step 5: Edge Behaviors
```
□ PASS/FAIL: Very large input (100+ items, long text, bulk upload) tested
□ PASS/FAIL: Very small input (1 item, 1 word, blank state) tested
□ PASS/FAIL: Interrupted flow (app kill, network drop, tab switch) handled
□ PASS/FAIL: Error recovery does NOT require restart from beginning
```

### Step 6: Language & Accessibility
```
□ PASS/FAIL: Domain-specific abbreviations handled (e.g. CR/HD for coworking, HH/NC/CK for retail)
□ PASS/FAIL: Emoji/non-standard chars in input handled gracefully (🍜, ❌, ✅)
□ PASS/FAIL: Regional language variants and typos considered
□ PASS/FAIL: Vague/ambiguous input has a clarification or autocomplete flow
```

### Step 7: Domain & Industry-Specific (if applicable)
```
□ PASS/N/A: Domain-specific integration rules followed (e.g., meal-planning for food, room-booking for real estate)
□ PASS/N/A: Customer preferences or restriction handling (budget, diet, room size, auth level)
□ PASS/N/A: Quick-filter and batch-update capabilities tailored to the target customer segment
```

## Gate Result

```
ALL PASS → ✅ APPROVED — Feature/UI Spec can proceed
ANY FAIL → ❌ BLOCKED — Must resolve FAIL items before proceeding
```

## Quick Assessment (For inline use — 30 seconds)

> When you don't have time for full validation, at minimum check these 4:

```
1. □ Was it designed for a REAL person in a REAL context? (not "generic user")
2. □ Is there a non-click path? (paste, voice, reorder)
3. □ Does it handle interruption? (app kill → resume)
4. □ Can a first-timer figure it out without training?
```
