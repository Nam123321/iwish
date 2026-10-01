---
name: "db_backed_token_revocation"
description: "Use when you need to implement stateful JWT session revocation, invalidation of magic links, or single-session concurrency without using Redis."
inputs: ["target_service", "database_schema"]
outputs: ["revocation_implementation", "database_migration"]
mcp_tools_required: []
subagent_triggers: []
---

# DB-Backed Token Revocation

## When to Use This Skill
- A workspace admin needs to forcefully revoke user sessions.
- A user onboarding process needs to invalidate one-time magic links.
- An API Gateway must enforce single-session concurrency limits without a caching layer like Redis.

## Core Rules
1. **No External Cache Dependency (Category A):** The implementation MUST NOT introduce Redis, Memcached, or other external caching systems for session state. All state must be verified against the primary database.
2. **Version-Based Revocation (Category A):** The JWT payload MUST include a `token_version` (integer or UUID) claim. The database `users` or `sessions` table MUST store the `current_token_version`.
3. **Validation Strategy (Category A):** On every protected API request, the gateway/middleware MUST extract the `token_version` from the JWT and compare it to the database's `current_token_version`. If they do not match, the token is rejected (401 Unauthorized).
4. **Revocation Execution:** To revoke a session or all sessions for a user, the system MUST increment or rotate the `current_token_version` in the database. Existing JWTs will immediately fail the validation check.
5. **Magic Link Invalidation:** Magic links must embed a specific `nonce` or `link_version`. Upon use, the database record must mark the `nonce` as consumed or increment the `link_version` to prevent replay attacks.
6. **Concurrency Control:** For single-session concurrency, successful login MUST rotate the `current_token_version`, naturally invalidating any previously issued tokens for that user.

## Red Flags — STOP and Reconsider
- "We should just use Redis because it's faster for session checks." -> STOP. This violates the core constraint of this skill.
- "We can just maintain a blocklist of revoked JWT signatures in the database." -> STOP. Blocklists grow unbounded and are harder to maintain than a simple `token_version` integer comparison.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| We can just use short-lived JWTs and ignore explicit revocation. | Security requirements for admin revocation or single-session concurrency mandate explicit stateful checks. |
| A database query on every request will kill performance. | A simple indexed integer comparison on the user table is highly performant and can be optimized with read replicas if needed. |

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| DB-REV-01 | No Redis Dependency | A | Code scanner ensuring no redis client imports | `grep` or AST scan output |
| DB-REV-02 | Token Version Claim | A | Schema/AST scanner ensuring `token_version` claim in JWT payload | Code analysis output |

## Boilerplate / Snippets

### JWT Payload Generation
```javascript
const payload = {
  userId: user.id,
  token_version: user.current_token_version
};
const token = jwt.sign(payload, SECRET_KEY);
```

### Middleware Validation
```javascript
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  
  const user = await db.users.findUnique({ select: { current_token_version: true }, where: { id: decoded.userId } });
  if (!user || user.current_token_version !== decoded.token_version) {
    return res.status(401).json({ error: "Token revoked" });
  }
  next();
}
```

### Session Revocation
```javascript
async function revokeSessions(userId) {
  await db.users.update({
    where: { id: userId },
    data: { current_token_version: { increment: 1 } }
  });
}
```
