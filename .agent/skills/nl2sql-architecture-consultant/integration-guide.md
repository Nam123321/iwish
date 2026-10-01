# Integration Guide: NL2SQL Architecture Consultant

## Overview
This skill acts as a specialized AI consultant to review and optimize Text-to-SQL system architectures. It enforces the 3-stage lifecycle and guards against common pitfalls like token blowouts and raw schema dumping.

## Use Cases
- Evaluating a new project's Architecture Decision Records (ADR) for Text-to-SQL integration.
- Troubleshooting existing NL2SQL workflows that suffer from high latency or semantic errors.
- Designing an agentic workflow for multi-database query generation.

## Edge Cases & Constraints
- The consultant must have access to project ADRs or Epic documentation. Without context, its advice will be overly generic.
- Large schemas may require the integration of a vector database for schema linking, which this consultant will recommend but cannot physically build.

## Review Questions
- Has the project context been clearly defined before invoking the consultant?
- Are the recommendations regarding schema linking feasible within the current infrastructure?
