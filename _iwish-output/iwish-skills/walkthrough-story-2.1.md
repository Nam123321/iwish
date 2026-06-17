# Walkthrough: Story 2.1 (Secure XML ActionNode Parser)

## Implementation Details
The story requires a safe extraction mechanism for MetaGPT LLM outputs.
We created the `.agent/skills/safe-xml-parser/SKILL.md` skill containing a python reference implementation.

## How it works
1. **Regex Extraction**: We use `re.compile(r'<([^>]+)>(.*?)</\1>', re.DOTALL)` to locate XML nodes. This ensures we extract node contents regardless of LLM extra verbiage.
2. **Safe Evaluation**: We parse the captured content using `ast.literal_eval`. This guarantees no code execution can occur if the LLM hallucinates `os.system` or similar malicious calls.
3. **Fallback**: If `literal_eval` fails (e.g. for pure text), we fall back to the raw string.

## QA Validation
- `eval()` is avoided.
- Standard `xml` libraries that are vulnerable to attacks are avoided.
- Simple, maintainable string matching.
