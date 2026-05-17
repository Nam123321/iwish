---
name: 'Fix-First Review'
description: 'Proactive auto-fixing and confidence calibration for code reviews.'
---

# Fix-First Review Methodology

1. **Fix-First Heuristic**: Do not just report mechanical or trivial issues (e.g., typos, lint errors, simple logic bugs)—auto-fix them. 
2. **Flag Architectural Issues**: Flag complex architectural flaws or high-risk issues for user decision. Do not auto-fix if it requires a significant design pivot.
3. **Confidence Calibration**: Every review finding or proposed fix must include a Confidence Score [1-10]. If your Confidence is < 7, explicitly state your assumptions and ask for confirmation.
4. **No Hallucinated Hand-waving**: Do not assume a dependency "likely handles" an edge case. Verify it using search tools before asserting that the code is safe. "Claim Verification" is mandatory.
