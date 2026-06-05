# Step IC-06: Distillate and Handoff

## Goal

Convert the challenge outcome into planning-ready context and decide the next workflow.

## Required Outputs

- finalize `idea-challenge-{project}.md`
- create `idea-challenge-{project}-distillate.md`
- create `biz-stack.md` if strategic work was substantial

## Final Verdict Categories

- `forged`
- `needs-heat`
- `cracked`

## Handoff Logic

- if verdict is `forged` → route to `/product-strategy` (via `/unique-advantage` if not yet completed)
- if verdict is `needs-heat` → route to `/research` for targeted evidence gathering on weak areas
- if verdict is `cracked` → route to `/pivot-project` or recommend `/idea-discover` restart
- if evidence gaps dominate → route to `/research` for specific missing data

> [!IMPORTANT]
> **Do NOT route directly to `/plan`.** The mandatory pipeline is:
> `/idea-challenge` → `/unique-advantage` → `/product-strategy` → `/plan`
> `/product-strategy` is the synthesis gate that produces the Go/No-Go verdict before PRD creation.

