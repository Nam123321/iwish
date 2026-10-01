---
name: absorb-stage-4-integration
description: Stage 4 of the Repo Absorption Protocol (Integration & Validation). Covers Tiered Integration Routing and the Final Understanding Gate.
---

# 🌀 `/absorb-stage-4-integration` (Stage 4: Integration & Validation)

## 📌 OVERVIEW
This is the final execution stage. It maps the approved classification funnel decisions into physical codebase changes via Tiered Integration, and validates the Agent's comprehension of the newly absorbed asset.

---

## 🛠️ THE PIPELINE

### Phase 6: INTEGRATE & CLASSIFY ⚙️ (Agent: dev-agent)
- **Action:** Implement approved suggestions and establish Routing Triggers.
- **Steps:**
  1. **Tiered Integration Routing:**
     - **Tier 1 (Native Merge):**
       - Applies to simple logic with 0 dependencies. Absorb code directly.
       - MUST call the Universal Intake Gateway (`/skill`) to register the logic natively.
     - **Tier 2 (Adapter-Bundle Pattern):**
       - Applies to complex logic with dependencies.
       - **Action:** Bundle dependencies into `.agent/skills/{skill-name}/bundle/`.
       - **Adapter:** Write a `.agent/skills/{skill-name}/SKILL.md` file as an interface mapping. NEVER modify the original external source code.
       - **[Mitigation EC-P6-001 - RCE via Bundle]:** You MUST disable post-install execution of malicious hooks when bundling (e.g., `npm install --ignore-scripts`).
       - **[Mitigation EC-P11-001 - Interface Hallucination]:** MUST run `grep_search` on the bundle's exported functions before generating the Adapter.
     - **Tier 3 (Tournament Plugin):**
       - Applies to high-risk systems. Isolate into `.agent/plugins/tournament/{repo-name}-sandbox/` for A/B testing.
     - **If `USER_SPACE`:** 
       - Activate **Zero-Story Flow**. Do not create Epics/Stories. Inject data from Phase 4 directly into the Memory/Context of the current project.

- 🛑 **HUMAN CHECKPOINT 2 (Iterative):** (Applies to `SYSTEM_SKILL` integrations).
  - For *each* implementation change and trigger injection, present the diff/code to the user.
  - **Wait for Input:** User must approve or skip *each* change independently.
  - Do not write into canonical `.agent/` paths until approved.

### Phase 7: VALIDATE 🧠 (Agent: review-agent)
- **Action:** The Understanding Gate. Verify the agent actually comprehends the repo.
- **Steps:** Answer the following 5 questions based on the DNA and Context:
  1. What problem does this repo solve?
  2. How does the core logic work? (Execution flow)
  3. What is the state management pattern? (Data flow)
  4. What edge cases exist and how are they handled?
  5. Why did the author choose this approach? (Trade-offs)
- **Scoring:** Mark each as PASS (correct), PARTIAL (incomplete), FAIL (wrong).
- 🛑 **HUMAN CHECKPOINT 3:** Present the Q&A and scores to the user for validation.
  - **Zero-Trust Grading:** Scoring MUST be performed by the User or an independent `/qa-agent`. The generating agent CANNOT grade itself.
  - **Gate:** Must score ≥ 4 PASS and ≤ 1 PARTIAL.
  - If Failed → HALT and recommend looping back to Stage 2.
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/validation-report.md`.

---

## 🚫 ZERO-TRUST PHYSICAL GATE
To prove the successful conclusion of the `/absorb-repo` Decomposed SDLC pipeline, you MUST run:
```bash
python3 .agent/scripts/session-compliance-auditor.py --workflow absorb-integration
```
**If the script returns an error, the absorption is considered NON-COMPLIANT.**
