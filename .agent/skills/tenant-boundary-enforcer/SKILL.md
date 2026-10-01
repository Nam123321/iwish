---
name: "tenant-boundary-enforcer"
description: "Use when validating tenant isolation boundaries or verifying cryptographic identity during multi-tenant data dispatch."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# tenant-boundary-enforcer

## When to Use This Skill
Use this skill whenever building, auditing, or executing data dispatch operations in a multi-tenant environment. It ensures that tenant identities are cryptographically verified and boundaries are strictly enforced to prevent cross-tenant data leakage.

## Core Rules
1. **Cryptographic Verification**: Every multi-tenant data dispatch MUST cryptographically verify the caller's identity (e.g., via JWT signature) before accessing data.
2. **Payload Filtering**: Queries to vector databases or relational databases MUST include a hardcoded `tenant_id` filter derived from the verified identity token. Never trust the client or LLM to supply the `tenant_id` safely.
3. **No Global State**: State MUST NOT be shared across tenants without row-level security (RLS) enforcement.
4. **Boundary Validation**: API endpoints and data pipelines MUST validate the boundary contexts on ingress and egress.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-TBE-1 | JWT Signature Verification | Category A | Cryptographic library check | JWT parse log / exception |
| G-TBE-2 | Hardcoded `tenant_id` Filter Injection | Category A | Query interceptor / RLS policy | Database query log showing filter |
| G-TBE-3 | Cross-Tenant Data Access Review | Category B | Static Code Analysis / Peer Review | `view_file` of DB query logic |

## Red Flags — STOP and Reconsider
- ❌ **Shared Vector Database without Payload Filters**: If a vector DB collection does not enforce a `tenant_id` filter on every query.
- ❌ **Logical-Only Isolation**: Relying solely on application-layer logic without database-level RLS.
- ❌ **Dynamic Schema Scrambling**: Using dynamic `search_path` changes in connection poolers without strict transaction binding.
- If you find yourself thinking "I can just pass the tenant_id in the prompt or request body and trust it", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The LLM prompt instructs the agent to only return data for this tenant." | The LLM cannot enforce security boundaries. Filters must be at the infrastructure layer (e.g., DB RLS or hardcoded API filters). |
| "Row-Level Security is too slow; app-level checks are fine." | App-level checks are prone to bypass bugs. DB RLS guarantees zero cross-tenant leakage at scale. |

## Industry Standards & Best Practices
- **PostgreSQL Row-Level Security (RLS)**: Enforce boundaries at the database kernel level.
- **Single Collection Partitioning**: In vector databases (e.g., Qdrant), use one collection with a `tenant_id` payload filter for scale.
- **Zero-Trust**: Never trust client-provided tenant IDs; always extract from the verified JWT token on the backend.
