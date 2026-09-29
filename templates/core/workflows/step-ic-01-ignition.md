# Step IC-01: Ignition

## Goal

Get the raw concept onto the table and make sure the workflow is solving a real problem, not just polishing vague ambition.

> [!IMPORTANT]
> **DOUBLE-LOCK CONTEXT INJECTION:**
> Before proceeding, you MUST use the `view_file` tool to load and read `/.agent/fragments/idea-discovery-framework.md`. You must structure the customer conversation around its **5 Lenses of Idea Discovery** to clarify the idea and push back on broad/vague assumptions.
>
> **RESEARCH CONTEXT INJECTION:**
> You MUST also load all available research files from `_iwish-output/1. Idea Discovery/1.4. research/` including: market-research.md, competitor-research.md, domain-research.md, technical-research.md. Reference these during ignition questioning to ground the conversation in evidence. If these files do not exist, STOP and inform the user that `/research` must run first.

## Inputs to Capture

Structure your questionnaire using `/.agent/fragments/idea-discovery-framework.md` to elicit:
- target user/persona (specifically defined)
- concrete problem & pain point
- stakes and urgency (emotional/financial cost)
- current workarounds (how they solve it today)
- rough solution direction & primary value proposition
- why now
- concept type: commercial, internal tool, OSS, or community/nonprofit

## Use These Add-Ons

- `idea-hardening` for 2-3 options and YAGNI pressure
- `socratic-review` in `discovery` mode for hard questions
- `/.agent/fragments/idea-discovery-framework.md` for structured elicitation

## Exit Criteria

- the user/problem/stakes/solution are clear enough to draft a believable announcement
- if not, recommend lighter ideation support instead of forcing the rest of the workflow
- append a `<!-- coaching-notes-stage-1 -->` block to preserve what was challenged or clarified
