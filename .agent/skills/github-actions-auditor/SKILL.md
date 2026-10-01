---
name: github-actions-auditor
description: Parses and audits GitHub Actions YAML workflows for security issues, enforcing least privilege and safe execution practices.
---

# GitHub Actions Auditor Skill

This skill audits GitHub Actions workflows for security and execution issues. It ensures:
1. Least Privilege: Workflows must have explicitly defined `permissions`.
2. Safe Execution: No arbitrary script injection vulnerabilities (e.g. `$GITHUB_ENV` or user input in `run:` without escaping).
3. No Race Conditions: Background processes should be managed properly, or jobs must have explicit dependencies (using `needs:`).

## Usage

Agents using this skill should:
1. Scan `.github/workflows/*.yml` for `permissions:` block at the top-level or job-level. If missing, it must be added (e.g., `permissions: contents: read`).
2. Identify missing `needs:` dependencies between jobs that interact with shared resources (like databases or test environments) to prevent race conditions.
3. If database seeding is overlapping with tests across jobs, enforce sequential execution with `needs:`.
4. Ensure robust integration testing: If testing relies on background processes or shared services, ensure they are awaited properly.

## Instructions to Fix Race Conditions

If you find a race condition in a YAML file where tests might be overlapping with database seeding or setup, you should add the necessary `needs:` or restructure the steps so they execute in the correct order or isolate the environments.
