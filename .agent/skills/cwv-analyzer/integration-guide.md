# Integration Guide: cwv-analyzer

## Framework Placement
- **Phase:** Operate/Learn, Validate/Deliver
- **Role:** process-primary / supportive

## Core Use Cases
- Identifying performance regressions in CI/CD via Lighthouse reports.
- Extracting LCP, CLS, INP trends from CrUX data.

## Edge Cases
- Missing INP data (fallback to FID or note absence).
- Comparing Lab vs. Field data (must strictly separate them).

## Review Questions
- Are there specific performance budget thresholds in this project different from Google defaults?
