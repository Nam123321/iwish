# Promotion Plan: db_backed_token_revocation

## Objective
Promote the draft skill `db_backed_token_revocation` from `${IWISH_HOME}/generated-skills/` to the canonical repository `.agent/skills/`.

## Adoption Checklist
- [ ] Review the `SKILL.md` rules with the security team to ensure the `token_version` integer comparison meets enterprise requirements.
- [ ] Verify that the boilerplate snippets correctly integrate with the project's actual ORM (e.g., Prisma).
- [ ] Move the approved folder to `.agent/skills/db_backed_token_revocation/`.
- [ ] Ensure the routing profile is registered with the Orchestrator agent.
