# Story 2.1: Secure ActionNode XML Parser

## 1. Tracer Bullet
The vertical slice for this story involves parsing a raw LLM output string containing MetaGPT ActionNode XML formats, securely extracting the nodes using `re` and `ast.literal_eval`, and returning structured data to the caller without evaluating arbitrary code or being vulnerable to XML parsing attacks.

## 2. Socratic Review Synthesis
- **Are there security vulnerabilities?** Using standard XML parsers could expose the system to XML External Entity (XXE) or XML bomb attacks. Using `eval()` exposes to remote code execution. 
- **Solution:** A custom, constrained parser using regex (`re`) to locate nodes and `ast.literal_eval` to safely evaluate strings to basic Python data types, avoiding any execution of arbitrary functions.
- **AC Constraints:** The code must not use `eval()` under any circumstances.

## 3. Acceptance Criteria
1. The parser successfully extracts all `<ActionNode>` elements from a string.
2. The parser uses `ast.literal_eval` to safely cast data inside XML tags to Python objects (lists, dicts, strings).
3. The parser handles missing tags gracefully.
4. No use of standard `xml.etree` without strict defusedxml configurations, but preferably a custom regex approach.
5. No use of `eval()` or `exec()`.

## 4. Traceability Matrix
| AC ID | Description | Tasks |
| --- | --- | --- |
| AC1 | Extract nodes via Regex | Task 1: Write regex extractor |
| AC2 | Safe Type Casting | Task 2: Implement `ast.literal_eval` wrapper |
| AC3 | Graceful Degradation | Task 3: Error handling for malformed nodes |
| AC4 | Secure Parsing Rule | Task 1, Task 2 |
| AC5 | No RCE | Task 2 |

## 5. QA Simulator Scorecard
- **Axis 1 (Edge Cases):** 9/10 (Handles malformed XML well via regex constraints)
- **Axis 2 (Security):** 10/10 (No `eval`, no XXE)
- **Axis 3 (Performance):** 9/10 (Regex is fast for LLM outputs)
- **Axis 4 (Testability):** 10/10 (Unit tests can cover all paths)
- **Axis 5 (Maintainability):** 8/10 (Regex can be hard to read, but `ast.literal_eval` is standard)
- **Axis 6 (UX Empathy):** 9/10 (Returns clean Python objects for downstream dev UX)
- **TOTAL AVERAGE:** 9.1/10 (PASS)
