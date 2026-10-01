# tenant-dataflow-analyzer

## Purpose
Statically traces tenant identity across dataflow paths in knowledge ingestion pipelines to ensure isolation and prevent cross-tenant data bleed.

## Instructions
This skill analyzes source code in data ingestion pipelines to ensure that tenant boundaries are maintained and isolation contexts are explicitly verified, preventing cross-tenant data contamination.

### Prerequisites
- Python 3.9+
- Standard library `ast`

### Usage
Run the analyzer on a target file or directory containing pipeline code:
```bash
python .agent/skills/tenant-dataflow-analyzer/scripts/analyze_boundaries.py --target <path-to-code>
```
The script will return non-zero exit codes if dataflow handlers lack explicit tenant context.
