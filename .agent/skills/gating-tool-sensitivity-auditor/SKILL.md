---
name: gating-tool-sensitivity-auditor
description: Audits gating tools (e.g., drift-detector, fmea-scanner) to ensure they are not failing silently and are properly calibrated for high sensitivity.
---

# Gating Tool Sensitivity Auditor

This skill audits system gating tools (like drift-detector, fmea-scanner, etc.) to ensure they are not silently failing, skipping checks, or running with overly permissive thresholds. It guarantees high sensitivity and enforcement for critical safety checks.

## Core Directives

1. **Zero-Trust Calibration Check**: Ensure all gating tools have strict, non-permissive thresholds configured. Default-allow or "silent continue on error" behaviors MUST be flagged and blocked.
2. **Execution Integrity**: Verify that gating tools execute fully and do not exit early or bypass logic due to missing arguments or environmental errors.
3. **Telemetry & Alerting**: Confirm that any bypassed gate or failed gate immediately triggers an explicit audit event.

## Execution Steps

1. Identify the target gating tool configuration or script.
2. Review the tool's error handling and threshold logic.
3. Validate that the tool blocks execution or fails closed when encountering undefined states.
4. Report the calibration status and sensitivity levels.
