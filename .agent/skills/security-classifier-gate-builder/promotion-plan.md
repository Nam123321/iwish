# Promotion Plan: security-classifier-gate-builder

## Canonical Target
`.agent/skills/security-classifier-gate-builder`

## Reviewer Checklist
- [ ] Are the triggers well-defined and pushy?
- [ ] Does it avoid using operational context for evaluation?
- [ ] Is the fail-closed mechanism explicitly stated?

## Rollback/Recovery
- Delete `.agent/skills/security-classifier-gate-builder` if it introduces unacceptable latency or false positives.
