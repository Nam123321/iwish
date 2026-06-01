# Predict Personas — Multi-Persona Pre-Analysis Fragment

> Injected by `socratic-review` for Story-level+ gates. Five expert personas independently analyze proposed changes, then debate conflicts to produce a consensus verdict.

## Attribution & Lineage

- **Source:** `vc:predict` from [vibecode-pro-max-kit](https://github.com/withkynam/vibecode-pro-max-kit) (MIT)
- **Adapted by:** I-Wish RAP (Repo Absorption Protocol)
- **Version:** 1.0.0

---

## The 5 Personas

| Persona | Focus | Core Questions | STOP Triggers |
|---------|-------|----------------|---------------|
| **Architect** | System design, scalability, coupling, module boundaries | Does this fit the architecture? Will it scale? What new coupling does it introduce? Does it violate existing ADRs? | Fundamental design incompatibility requiring significant rework |
| **Security** | Attack surface, data protection, auth boundaries, secrets | What can be abused? Where is data exposed? Are auth boundaries respected? Any secret leakage? | Auth bypass or data exposure with no viable mitigation |
| **Performance** | Latency, memory, N+1 queries, bundle size, load time | What is the latency impact? N+1 queries? Memory leaks? Bundle bloat? Cold-start regression? | Unacceptable latency or query explosion with no workaround |
| **UX** | User experience, accessibility, error states, mobile | Is this intuitive? What does the error state look like? Accessible on mobile? Does loading feel responsive? | Critical accessibility violation with no remediation path |
| **Devil's Advocate** | Hidden assumptions, simpler alternatives, YAGNI | Why not do nothing? What is the simplest alternative? Which assumption could be wrong? Is this premature optimization? | False assumption that invalidates the entire approach |

---

## Debate Protocol (7 Steps)

1. **Read** the proposed change/feature description from the context
2. **Read relevant code** if file paths are provided (use `code-search` or `grep_search` for affected areas)
3. **Each persona analyzes independently** — do NOT let personas influence each other during this phase. Write each persona's analysis in a separate mental block.
4. **Identify agreements** — points where all (or 4+) personas align
5. **Identify conflicts** — points where personas meaningfully disagree
6. **Weigh tradeoffs** — for each conflict, evaluate which concern has higher impact using the project's risk matrix (reference `@.agent/fragments/risk-matrix-template.md` if available)
7. **Produce verdict** — GO / CAUTION / STOP with actionable recommendations

---

## Verdict Levels

| Verdict | Meaning | Action |
|---------|---------|--------|
| **GO** | All personas aligned, no critical risks, proceed with confidence | Continue to implementation |
| **CAUTION** | Concerns exist but are manageable — mitigations identified | Proceed carefully, add mitigations as AC items |
| **STOP** | Critical unresolved issue found — needs redesign or more information | Escalate to user, halt implementation |

### STOP Triggers (Any ONE Is Sufficient)
- Security persona identifies auth bypass or data exposure with no viable mitigation
- Architect persona identifies fundamental design incompatibility requiring significant rework
- Performance persona identifies unacceptable latency or query explosion with no workaround
- Devil's Advocate exposes a false assumption that invalidates the entire approach
- UX persona identifies critical accessibility violation with no remediation path

---

## Output Format: Prediction Report

```markdown
## Prediction Report: [proposal title]

## Verdict: GO | CAUTION | STOP

### Agreements (all personas align)
- [Point 1 — what they all agree on]
- [Point 2]

### Conflicts & Resolutions

| Topic | Architect | Security | Performance | UX | Devil's Advocate | Resolution |
|-------|-----------|----------|-------------|-----|-----------------|------------|
| [Issue] | [View] | [View] | [View] | [View] | [View] | [Recommendation] |

### Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| [Risk description] | Critical/High/Medium/Low | [Concrete action] |

### Recommendations
1. [Action item — rationale]
2. [Action item — rationale]
3. [Action item — rationale]
```

---

## Integration with I-Wish Gates

| Gate | When Activated | How Personas Participate |
|------|---------------|--------------------------|
| Gate 0: Discovery | `/brainstorm`, `/create-prd` | Full 5-persona debate on strategy |
| Gate 1: Business | `/create-story` | Focus Architect + UX + Devil's Advocate |
| Gate 2: Technical | `/dev-agent-story` | Focus Architect + Security + Performance |
| Gate 3: Drift | Implementation Plan | Focus Devil's Advocate + Architect for scope creep |

---

## When to Use

- Before implementing a major or high-risk feature
- Before a significant refactor or architecture change
- Evaluating competing technical approaches
- Stress-testing assumptions in a proposed design

## When NOT to Use

- Trivial or low-risk changes (CS ≤ 2)
- Already-approved work with no open design questions
- Pure dependency upgrades with no API changes
- Quick bug fixes with known root cause
