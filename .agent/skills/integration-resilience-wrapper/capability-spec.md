# Capability Spec: integration-resilience-wrapper

## Type: SKILL
## Status: Draft
## Created: 2026-08-09

### Problem Statement
Automates the injection of timeout, retry, and circuit breaker patterns into external HTTP/SMTP integration code to ensure system resilience and fault tolerance.

### Core Concepts
1. **Timeout**: Restricting the maximum time allowed for an external HTTP/SMTP request to respond.
2. **Retry**: Automatically retrying failed requests (e.g., 50x errors or network failures) with exponential backoff and jitter.
3. **Circuit Breaker**: Halting requests to a failing service after a threshold of failures, allowing it to recover before resuming traffic.

### Anti-Patterns
- ❌ Hardcoding arbitrary timeout values instead of context-driven ones.
- ❌ Retrying non-idempotent operations (like POST requests) without caution.
- ❌ Missing fallback mechanisms when the circuit breaker is open.

### Best Practices  
- ✅ Use established resilience libraries (e.g., resilience4j, Polly, or equivalent node libraries).
- ✅ Configure retries with exponential backoff and jitter to prevent thundering herd problems.
- ✅ Log all resilience events (retries exhausted, circuit breaker open/close) for observability.

### Deliverables
- [ ] File 1: `.agent/skills/integration-resilience-wrapper/SKILL.md`
