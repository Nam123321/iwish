# Learning Context Loop Protocol

> **Purpose:** Enables cross-session learning for BMAD agents. Agents log operational learnings at the end of each session and retrieve relevant prior learnings at the start of the next session, breaking the "fresh start every time" anti-pattern.

---

## 1. LOAD Protocol (Step 00 — Session Start)

Execute this protocol **before** beginning any substantive work:

```
STEP 1: Query the Knowledge Graph
  → Use `grep_search` on `/.agent/knowledge-graph.yaml`
  → Search for keywords related to the current task/workflow
  → Filter results where `type: learning`

STEP 2: Check tag overlap
  → Compare returned node `tags` with current task context
  → Prioritize learnings with `confidence` >= 7

STEP 3: Load relevant learnings
  → Use `view_file` on the `path` of each matched learning node
  → Maximum 3 learnings per session to avoid context bloat

STEP 4: Summarize
  → State in 1-2 sentences what prior learnings you loaded
  → Example: "Loaded 2 prior learnings: (1) Double-Lock syntax must use
    exact `> [!IMPORTANT]` format, (2) YAML edits must use add-to-kg.sh
    not manual append."
```

---

## 2. SAVE Protocol (Final Step — Session End)

Execute this protocol **after** completing all substantive work, before finalizing:

```
STEP 0: Run Memory Admission
  → Load `/.agent/fragments/memory-admission-protocol.md`
  → Load `/.agent/fragments/background-review-learning-log-governance.md`
  → Score each candidate learning before creating files or KG nodes
  → If Source Confidence = 0, do not save to durable memory or KG
  → If the candidate is Skill/Workflow/Agent/Compound-shaped, route to
    create-skill/enhance-skill instead of saving as loose memory
  → If the candidate needs audit history but is not ready for durable memory,
    route it as an append-only `.agent/memory/learning-log.jsonl` entry or
    background-review recommendation before creating KG learning files

STEP 1: Identify new learnings
  → What went wrong that should be avoided next time?
  → What pattern worked well that should be repeated?
  → What assumption was proven wrong?

STEP 2: Create learning file
  → Create `.md` file in `/.agent/learnings/`
  → Filename format: `YYYY-MM-DD-<kebab-case-topic>.md`
  → Content format:

    # Learning: <Title>
    **Date:** <YYYY-MM-DD>
    **Confidence:** <1-10>
    **Context:** <What workflow/story triggered this>
    **Learning:** <What was learned>
    **Evidence:** <What happened that proved this>
    **Action:** <What to do differently next time>

STEP 3: Register in Knowledge Graph
  → Use `/.agent/scripts/add-to-kg.sh` to append node
  → Required fields:
    - id: "learning-<kebab-case-topic>"
    - type: "learning"
    - path: "/.agent/learnings/<filename>.md"
    - description: "<one-line summary>"
    - tags: [<relevant keywords>]
    - confidence: <1-10>
    - session_date: "<YYYY-MM-DD>"

STEP 3b: Example CLI invocation
  → bash /.agent/scripts/add-to-kg.sh \
      --id "learning-yaml-format" \
      --type "learning" \
      --path "/.agent/learnings/2026-05-09-yaml-format.md" \
      --description "Manual YAML append causes corruption — always use add-to-kg.sh" \
      --tags "yaml,formatting,add-to-kg" \
      --confidence 8 \
      --session-date "2026-05-09"
```

---

## 3. Prune Rules

To prevent Knowledge Graph bloat, apply these rules periodically:

| Rule | Condition | Action |
|------|-----------|--------|
| **Staleness** | Learning > 90 days without reconfirmation | Flag as `STALE` in description |
| **Contradiction** | Newer learning contradicts older one | Mark older as `SUPERSEDED`, link to newer |
| **Low Confidence** | `confidence` < 3 AND age > 30 days | Remove node from KG and delete file |
| **Volume Cap** | Total learnings > 50 | Prune lowest-confidence entries first |

---

## 4. Search Template

Agents should use this pattern when searching for prior learnings:

```
# Search for learnings related to a topic
grep_search(
  query: "<keyword>",
  path: "/.agent/knowledge-graph.yaml",
  match_per_line: true
)

# Then filter results:
# 1. Look for lines containing "type: learning" nearby
# 2. Read the "description" and "tags" fields
# 3. Use view_file on the "path" of matching nodes
```

---

## 5. When NOT to Save

Do not create a learning entry for:
- Trivial observations that are already documented
- Session-specific state that has no future value
- Speculative hunches without evidence (confidence < 2)
- Information that belongs in a Fragment or Skill instead
- Any candidate blocked by `memory-admission-protocol.md`
