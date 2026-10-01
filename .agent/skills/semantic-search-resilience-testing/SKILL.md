---
name: semantic-search-resilience-testing
description: >-
  Simulates embedding API outages and validates graceful degradation to FTS keyword search.
---

# Semantic Search Resilience Testing

## Overview
This skill simulates an outage in the embedding service during query vector generation and verifies that the search system gracefully degrades to Full-Text Search (FTS) using keyword matching. This ensures the application remains usable even when upstream AI dependencies are unavailable.

## Quick Start
```bash
uv run .agent/skills/semantic-search-resilience-testing/semantic_search_resilience_testing.py test \
  --url http://localhost:3000 \
  --query "test search" \
  --output test-report.json
```

## Utility Scripts
The script provides a single subcommand `test`.

```bash
uv run .agent/skills/semantic-search-resilience-testing/semantic_search_resilience_testing.py test \
  --url <BASE_URL> \
  --query <QUERY> \
  --token <OPTIONAL_BEARER_TOKEN> \
  --tenant-id <OPTIONAL_TENANT_ID> \
  --output <OUTPUT_JSON_FILE>
```

**Arguments:**
- `--url`: The base URL of the API (e.g., http://localhost:3000)
- `--query`: The search query to run the test against.
- `--token` (optional): JWT or Bearer token for protected endpoints.
- `--tenant-id` (optional): `x-tenant-id` header value if the API requires tenant scoping.
- `--output`: File path to write the JSON results of the test.

**Output:**
The command writes a JSON report containing:
- `success`: Boolean indicating if the test passed.
- `status_code`: HTTP status code returned by the API (expected: 200).
- `metadata_degraded`: Boolean verifying if the API response correctly indicated degraded mode (expected: true).
- `results_count`: The number of search results returned by the FTS fallback.

## Rate Limiting
No explicit external rate limiting is necessary for this tool since it typically targets the local development or staging environments. If targeting production, follow standard test execution cadence to avoid overloading the service.

## Common Mistakes
- **Missing Authentication**: If the search endpoint requires a valid session, ensure you provide `--token` and `--tenant-id`.
- **Assuming Vector Search Details**: The results returned under degraded mode will NOT have vector scores. Do not expect vector-based relevancy in the output.
