# Integration Guide: prisma-domain-whitelist-manager

## Purpose
This skill manages cross-domain boundaries in Prisma safely by relying on triple-slash (`///`) comments or a centralized JSON whitelist rather than illegal `@@` attributes that break the Prisma AST and CLI.

## How to Use
When evaluating a Prisma schema for cross-domain relations, invoke this skill to parse `/// @ignoreBoundary` comments or to query the central whitelist file (`prisma/domain-whitelist.json`).

## Constraints
- MUST NOT use `@@ignoreBoundary` (illegal syntax).
- MUST ONLY use `///` doc comments for models and fields.
