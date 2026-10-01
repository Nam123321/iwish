# Adoption Review Pack

## Overview
This skill (`stratified-data-sampler`) provides operations for strict stratified sampling per language and intent, ensuring that subsets maintain class proportionality and avoid data bias against low-resource languages.

## Use Cases
- Downsampling large ML datasets for fast local evaluation.
- Selecting representative subsets for manual human review.
- Creating balanced evaluation sets across all `intent` types.

## Edge Cases & Stress Cases
- **Missing Keys:** Null values in `language` or `intent` columns are gracefully imputed to `unknown` so they aren't silently dropped.
- **Micro Strata:** Strata with fewer rows than required for the sampling fraction might end up under-represented if `frac` is too small.

## Constraints
- Input dataset must be a CSV file.
- Must contain `language` and `intent` columns.

## Routing Hints
- Triggers: "stratified sampling", "prevent data bias", "sample by language and intent", "dataset stratification".
- Domain: Data Engineering / ML Ops.

## Review Questions
1. Do you want to support sampling formats other than CSV (e.g., Parquet, JSON)?
2. Should we add configurable stratification columns instead of hardcoding `language` and `intent`?
