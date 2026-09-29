---
name: cli-linter
description: "Executes the CLI linter in a secure, sandboxed environment to prevent RCE."
inputs:
  - "Target directory"
outputs:
  - "Sanitized lint report"
tags: ["linter", "security", "sandbox"]
---

# CLI Linter Sandbox

To run the design.md linter, execute the `lint-sandbox.sh` wrapper script located in the plugin's `scripts/` directory.

## Security Constraints Enforced

This skill wraps an external linter that uses potentially unsafe JS patterns (`new Function`). The wrapper enforces the following constraints:
1. **Network Isolation:** No internet access during execution.
2. **File System Bounds:** Read-only access restricted to the target directory.
3. **Resource Limits:** Execution timeouts and memory limits to prevent DoS.
4. **Sanitization:** ANSI sequences and control characters are stripped from stdout/stderr.
