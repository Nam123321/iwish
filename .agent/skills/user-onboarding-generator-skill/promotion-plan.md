# Promotion Plan: user-onboarding-generator-skill

## Target
Canonical Path: `.agent/skills/user-onboarding-generator-skill/SKILL.md`

## Reviewer Checklist
- [ ] Validates Zod schema enforcement.
- [ ] Validates role resolution to most restrictive profile.
- [ ] Validates sanitization and prompt injection mitigations.

## Rollback/Recovery Note
If promoted and fails, remove `.agent/skills/user-onboarding-generator-skill` and fallback to static onboarding documentation.
