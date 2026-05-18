---
epic: EPIC-OPS-03
storyId: STORY-OPS-3.1
status: "Completed"
priority: "P1"
assignee: "Krillin"
phase: "forge"

---
# Story 3.1: Build setup-monitoring & incident-response workflows [FLOW-OUT: ops.monitoring.configured]

## 1. TL;DR

Create two day-2 workflows assigned to Krillin: `setup-monitoring.md` to bootstrap Prometheus/Datadog dashboards, and `incident-response.md` to trigger AIOps for diagnosing crashes and formulating blameless post-mortems via the 5-Whys framework.

## 2. Context & Problem

Once a system is in production (Day 2), alerts can become overwhelming (alert fatigue). When an incident occurs, SREs waste time grepping through logs instead of fixing the root cause. We need Krillin to instantly ingest the alert logs, correlate errors, and output a structured Root Cause Analysis (RCA).

## 3. Technical Requirements & Architectural Constraints

1. **Workflow File Targets**: `templates/library/ops-pack/workflows/day-2/setup-monitoring.md` and `incident-response.md`.
2. **Setup Logic**: Instructions must require Krillin to output Infrastructure-as-Code for monitoring (e.g. Datadog agent daemonset or PromQL queries).
3. **AIOps RCA Logic**: The incident response workflow MUST instruct the AI to ingest log strings, correlate events, identify Root Cause, and format a Blameless Post-Mortem using the strict 5-Whys methodology.
4. **Instinct Evolution System (Whis Hook)**: Explicitly require Krillin to append discovered root causes to the Dense JSONL memory (`instincts.jsonl`) so the system learns from its mistakes.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Bootstrapping Observability**

- **Given** an environment lacks monitoring
- **When** Krillin runs `setup-monitoring`
- **Then** Krillin outputs a deployable manifest for Datadog or Prometheus.

**Scenario 2: Automated Incident Triage (AIOps)**

- **Given** a production crash resulting in a stack trace
- **When** Krillin is provided the logs via `incident-response`
- **Then** Krillin outputs a 5-Whys Post-Mortem
- **And** updates the JSONL memory file.

**Scenario 3: Alert Storm Handling (Edge Case Mitigation)**

- `[EDGE-CASE]` **Given** Krillin is fed 10,000+ lines of redundant error logs (Alert Storm)
- **When** executing the incident response
- **Then** Krillin must first execute log deduplication logic before attempting RCA, to avoid token limit exhaustion.

## 5. Tri-Agent LITE Scan & Edge Case Scan Summary

- **Edge Cases Detected (Hit):** LLM context token overflow during Alert Storms (Mitigated via deduplication directive).
- **Data Impact (Kira Lite):** Appends to `instincts.jsonl`.
- **Flow Impact (Shinji Lite):** Produces `ops.monitoring.configured` and `ops.incident.analyzed`.
- **Testability Check (Quinn Lite):** 2/3 ACs Automatable (Unit testing the workflow logic against mock logs).

## 6. Development Execution Steps (For Whis/Vegeta)

1. Initialize `setup-monitoring.md` and `incident-response.md` in `day-2/`.
2. Emphasize the Blameless Post-Mortem format and memory hook logic in the directives.
3. Mark story as `COMPLETED`.

---

> **Status:** READY FOR WHIS FORGE (`/Vegeta-story` or `/create-capability`)
