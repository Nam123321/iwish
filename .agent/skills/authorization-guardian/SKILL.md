# authorization-guardian

## Description
Provides specialized capabilities to scan and enforce missing authentication and authorization gates on new endpoints.

## Purpose
To ensure that all API endpoints, especially new or modified ones, are properly secured with appropriate authentication checks (e.g., verifying user identity) and authorization rules (e.g., role-based access control, PBAC).

## Capabilities
1. **Endpoint Scanning**: Analyzes routing layers, controller definitions, and API specifications to detect endpoints missing standard security middlewares.
2. **Context Verification**: Checks if the endpoint accesses sensitive data or performs mutations, increasing the urgency of adding missing authorization gates.
3. **Enforcement Generation**: Generates code patches to inject standard auth/authz middleware or decorators into vulnerable endpoint declarations.
4. **Policy Auditing**: Compares endpoint access patterns against domain security policies to highlight insufficient privilege checks.

## Usage
Trigger this skill during code reviews, security audits, or continuous integration pipelines whenever backend routing or controller code is modified. Provide the skill with the relevant route and controller files.

## Guidelines
- Avoid blocking non-sensitive public endpoints (e.g., health checks).
- Align with the project's standard authentication patterns and authorization frameworks.
- Emphasize principle of least privilege in generated patches.
