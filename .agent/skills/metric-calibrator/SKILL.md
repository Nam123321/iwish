---
name: "metric-calibrator"
description: "Enforce bounded scales (e.g. 0-1) on new AI outcome metric fields and validate formulas. Triggers when addressing AI outcome evaluation, effectivenessScore, telemetry scoring, metric calibration, scoring bounds, confidence scores, score tuning, or penalizing AI outcomes."
version: "1.2.0"
author: "Antigravity Data Architect"
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# Metric Calibrator Skill

## Overview
This skill defines the standardization and calibration rules for any AI-driven `effectivenessScore`, `confidenceScore`, or outcome evaluation metric in the Cowok-ai system.

## 1. When to Use This Skill
- When designing or modifying AI scoring logic.
- When validating telemetry payloads from AI experiments.
- When you see terms like: `effectivenessScore`, `telemetry scoring`, `AI outcome evaluation`, `metric calibration`, `adjust confidence scores`, `score tuning`, `evaluate thresholds`, `RecommendationEffectiveness`.

## 2. Core Rules
1. **Bounded Scales:** Enforce strictly bounded scales (e.g., 0.0 to 1.0 or -1.0 to 1.0) on new AI outcome metric fields.
2. **Formula Validation:** Validate formulas computing the metric to ensure they cannot produce values outside the intended bounds.
3. **Strict Validation:** Reject telemetry or database writes that attempt to store values outside the bounded scale. Throw a validation error immediately.

## 3. Anti-Patterns
- ❌ NEVER use unbounded scales for AI evaluation metrics (e.g., integers 0-100 without a rigid bound, or unlimited maximum values).
- ❌ NEVER skip bounds checking on AI metric formulas.

## 4. Best Practices
- ✅ ALWAYS use standardized bounds like `[0.0, 1.0]` or `[-1.0, 1.0]`.
- ✅ ALWAYS write explicit formula validation steps when computing `effectivenessScore` or `confidenceScore`.
