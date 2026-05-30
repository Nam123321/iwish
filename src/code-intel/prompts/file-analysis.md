# File Analysis Prompt

Analyze the following source file and return structured metadata as JSON.

## File: {{FILE_NAME}}

### Source Code

```
{{FILE_CONTENT}}
```

### Detected Imports

{{IMPORTS}}

### Detected Exports

{{EXPORTS}}

## Instructions

Return a JSON object with the following fields:

- **summary** (string): A concise 1-2 sentence description of what this file does.
- **tags** (string[]): 3-7 descriptive tags (e.g. "authentication", "api-client", "utility", "react-component").
- **layer** (string): Classify into exactly one of: `presentation`, `business`, `data`, `infrastructure`, `config`, `unknown`.
  - `presentation` — UI components, views, templates, styles
  - `business` — Domain logic, services, use cases
  - `data` — Models, schemas, repositories, migrations, queries
  - `infrastructure` — Build tools, CI/CD, deployment, logging, monitoring
  - `config` — Configuration files, environment setup, constants
  - `unknown` — Cannot be determined
- **complexity** (string): Exactly one of: `low`, `medium`, `high`, `unknown`.
  - `low` — Simple declarations, configs, straightforward utilities
  - `medium` — Moderate logic, some branching, typical business logic
  - `high` — Complex algorithms, heavy state management, deep nesting

```json
{
  "summary": "...",
  "tags": ["..."],
  "layer": "...",
  "complexity": "..."
}
```
