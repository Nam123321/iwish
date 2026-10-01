# Stratified Data Sampler - Integration Guide

## Overview
This skill provides robust data stratification, ensuring that sampled datasets preserve the original distribution of `language` and `intent`. 

## Quick Start
1. Ensure your dataset has `language` and `intent` columns.
2. Run the skill using the Python runner:
   `python3 ~/.iwish/generated-skills/stratified-data-sampler/scripts/runner.py --input data.csv --output sampled.csv --frac 0.1`

## Edge Cases
- Nulls in `language` or `intent` will be imputed to `unknown` so they aren't silently dropped.
