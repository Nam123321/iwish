import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import os

pillars = {
    'p1-input-boundary.md': '''
### ER-08-40: Wildcard to Regex Translation Spillage
- **Context**: Story-08.21 (CORS policy per environment)
- **Edge Case**: Naive conversion of wildcards like `*.cowok.ai` to `.*.cowok.ai` without escaping dots or anchoring (`^...$`) matches `evilcowok.ai` or `https://cowok.ai.evil.com`.
- **RPN**: 108 (Critical)
- **Mitigation**: Implement strict wildcard string conversion. Escape literals and anchor matching to the start and end of the string.
''',
    'p5-integration-failure.md': '''
### ER-08-43: `Origin: null` handling causing crash or security bypass
- **Context**: Story-08.21 (CORS policy per environment)
- **Edge Case**: Browsers send `Origin: null` for redirects or sandboxed iframes. If the validator runs string methods on a null type it crashes, or if evaluated loosely, it might bypass CORS.
- **RPN**: 60 (Critical)
- **Mitigation**: Handle `Origin: null` properly and explicitly reject it in staging/production unless a specific route permits it.
''',
    'p6-permission-security.md': '''
### ER-08-42: Unrestricted Preview Patterns in Staging
- **Context**: Story-08.21 (CORS policy per environment)
- **Edge Case**: `CORS_PREVIEW_PATTERN` misconfigured as empty or `.*` allows any origin to match in staging, creating an open CORS policy.
- **RPN**: 84 (Critical)
- **Mitigation**: Validate the environment variable string format. Fallback to deny-all dynamic origins if the pattern is deemed unsafe or empty.
''',
    'p7-infrastructure-environment.md': '''
### ER-08-41: Regex Denial of Service (ReDoS) via Origin Header
- **Context**: Story-08.21 (CORS policy per environment)
- **Edge Case**: A maliciously crafted, extremely long `Origin` header evaluated against a complex CORS preview pattern regex can cause event loop blocking (ReDoS).
- **RPN**: 120 (Critical)
- **Mitigation**: Truncate or strictly limit the length of the `Origin` header (e.g., max 256 characters) before passing it to any regex engine.
'''
}

base_dir = '_iwish-output/edge-case-knowledge/pillars/'
for filename, content in pillars.items():
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'a') as f:
        f.write('\n' + content.strip() + '\n')
print('Updated pillar files.')
