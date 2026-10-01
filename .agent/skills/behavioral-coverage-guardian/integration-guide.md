# Integration Guide: behavioral-coverage-guardian

To integrate this skill into your workflow:

1. **Review Pipeline:** Open `.agent/workflows/references/code-review-protocol.md`.
2. **Inject Step:** Under Layer 1.5 or 1.8, add the following requirement:
   - "Standards Guardian Agent BẮT BUỘC phải thực thi cổng kiểm tra `behavioral-coverage-guardian` để xác minh test coverage cho các file business logic."
3. **Execution Command:** The agent must run:
   ```bash
   npm run test:coverage
   python3 .agent/skills/behavioral-coverage-guardian/scripts/runner.py --story <story_id>
   ```
4. **Enforcement:** If `runner.py` fails (exit code 1), the review MUST be REJECTED.

This ensures test execution is verified via a Category A gate.
