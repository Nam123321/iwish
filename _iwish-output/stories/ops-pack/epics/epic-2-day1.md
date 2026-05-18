---
epicId: EPIC-OPS-02
title: "Day 1: Deployment & Delivery"
status: "To Do"
priority: "P0"
phase: "origin"

---
# Epic 2: Day 1 - Deployment & Delivery

## Business Value
Ensures that code reaches staging and production environments accurately, idempotently, and safely via the integration of Human-on-the-Loop (HOTL) Veto protocols and rigorous pre-flight checks.

## Scope
- F-05: `pre-deployment-checklist` (Tích hợp Android 17 Policy)
- F-06: `deploy-staging` workflow (Intent-to-Infrastructure)
- F-07: `deploy-production` workflow (Veto Protocol)

## Acceptance Criteria
- [ ] Staging deployment script correctly targets a simulated environment based on text intent.
- [ ] Production deployment halts execution and asks user for Veto approval.
- [ ] Pre-deployment checklist fails if Android 17 detects missing environment variables.

## Stories
- STORY-OPS-2.1: Build pre-deployment-checklist workflow
- STORY-OPS-2.2: Build deploy-staging workflow
- STORY-OPS-2.3: Build deploy-production workflow with Veto Protocol
