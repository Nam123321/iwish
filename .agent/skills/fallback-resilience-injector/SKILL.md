# fallback-resilience-injector

## Description
Injects standardized fallback strategies and circuit breaker logic into integrations that lack graceful degradation capabilities.

## Purpose
To improve system reliability and uptime by ensuring that failures in external integrations (APIs, third-party services, secondary databases) do not cascade and cause widespread application outages.

## Capabilities
1. **Integration Discovery**: Scans the codebase for external service calls, HTTP clients, and potentially flaky remote integrations.
2. **Resilience Gap Analysis**: Identifies integration points that lack timeouts, retries, circuit breakers, or fallback mechanisms.
3. **Logic Injection**: Automatically patches code to wrap fragile calls in standard resilience patterns (e.g., using project-standard circuit breaker wrappers).
4. **Fallback Scaffolding**: Generates boilerplate for fallback responses (e.g., serving stale cache data, default values, or friendly error messages) when primary services fail.

## Usage
Invoke this skill when hardening a service, adding new external dependencies, or responding to stability issues (e.g., after an outage caused by a third-party API timeout). Provide the skill with the service layer or integration code.

## Guidelines
- Follow the project's established resilience framework or standard libraries.
- Ensure timeouts are configured appropriately based on upstream SLAs.
- Fallback logic should never compromise data integrity or security (e.g., do not bypass authorization in a fallback path).
