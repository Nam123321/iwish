---
name: integration-fidelity-guardian
description: "Enforces strict integration fidelity by prohibiting the use of mock settings and mock data in production code, requiring actual DB/API connections."
---

# Integration Fidelity Guardian

This skill enforces **Integration Fidelity** across all generated code. It ensures that agents do not take shortcuts by faking integrations (e.g., mock data, stubbed API responses, fake settings) in production code paths when they should be connecting to real databases, real APIs, or real configuration components.

## Core Rule: No Fake Integrations

1. **NO MOCK DATA**: You MUST NOT generate hardcoded arrays, dictionaries, or JSON objects simulating data (e.g., `mockUsers`, `dummyData`) in any file under `src/`, `app/`, `components/`, `lib/`, etc., unless it is strictly inside a `tests/` or `__tests__/` directory.
2. **NO DUMMY SETTINGS**: You MUST NOT stub out settings or environment variables with fake fallback values in business logic.
3. **WHEN BLOCKED**: If you do not have the real API schema, database contract, or proper context to write the actual integration, you MUST stop and ask the user for the missing context. Do **NOT** assume and mock it.
4. **EXCEPTIONS**: The only exceptions are unit tests, storybook stories, and explicitly requested placeholder prototypes.

## How to use this skill

This skill provides a deterministic validation script that scans code for forbidden mock-related keywords.

### Strict Mock Scanner
Run the mock scanner script to verify that no mock data or stubbed integrations have been injected into production paths.

**Command:**
```bash
python3 .agent/skills/integration-fidelity-guardian/scripts/mock_scanner.py "path/to/modified/file_or_directory"
```

**Instruction for Review Agent:**
During the code review or QA validation phase, you **MUST** run this scanner against the changed files. 
- If the scanner returns an error (`Found forbidden mock patterns`), you must **REJECT** the code. 
- You must instruct the Dev Agent to rewrite the code using the actual database connection, real API endpoint, or to ask the user for the missing contract if they don't know it.
