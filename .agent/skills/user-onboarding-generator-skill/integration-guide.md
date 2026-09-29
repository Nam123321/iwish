# Integration Guide: user-onboarding-generator-skill

## Overview
Generates contextual onboarding documentation safely.

## Use Cases
- Generating dynamic markdown onboarding for new project members based on their role.

## Constraints & Edge Cases
- Must handle prompt injection attempts (EC-P1-001).
- Must validate LLM JSON with Zod (EC-P4-001).
- Must restrict conflicting roles to lowest privilege (EC-P8-001).

## Routing Hints
- Call this skill when a new user registers or is assigned to a project.
