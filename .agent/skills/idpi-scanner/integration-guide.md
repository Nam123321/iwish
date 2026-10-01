# Integration Guide: idpi-scanner

## Overview
This skill provides guidelines and procedures for evaluating external web content and user payloads for Indirect Prompt Injection (IDPI) signatures. It prevents malicious external instructions from bypassing the Planner or agent guardrails.

## Use Cases
- Ingesting untrusted external documentation or websites.
- Processing large user-provided text payloads.

## Edge Cases
- Content that legitimately contains the words "ignore previous instructions" (e.g., an article about prompt injection).

## Stress Cases
- Massive payloads that exceed context limits where IDPI signatures might be hidden at the very end.

## Constraints
- This is a static analysis and prompting guideline skill; it does not dynamically execute a malware scanner binary.

## Orch Routing Hints
- Route to this skill during the `pre-processing` and `ingestion` phases whenever external data is fetched via `read_url_content` or `search_web`.

## Review Questions
- Are there specific domains that should be implicitly trusted and bypass this scanner?
- How should the agent respond if an IDPI is detected (e.g., silent drop vs user notification)?
