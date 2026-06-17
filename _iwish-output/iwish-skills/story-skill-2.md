# User Story: story-skill-2
**Epic:** EPIC-2 (Utility Reliability)
**Title:** Implement Throttled Cooldown for External API Checks
**Status:** Ready

---

## Story Description
As an I-Wish user,
I want network-dependent skills to throttle their external requests,
So that the agent avoids exceeding external API rate limits (such as GitHub or HuggingFace) during frequent runs.

---

## Acceptance Criteria
- [ ] Save timestamps of external queries locally to check cooldown state.
- [ ] Block queries that occur within the cooldown window (default 24h) and return cached data or skip.
