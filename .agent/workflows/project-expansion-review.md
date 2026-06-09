---
name: 'project-expansion-review'
description: 'Analyze the impact of a new feature or project expansion during development, classify pivot risks, and route back to correct planning/discovery funnel.'
---

# Project Expansion Review (PER) Workflow

**Goal:** Evaluate the architectural, UX, and market impact of adding a new feature or module to an in-flight project. Classify potential pivot indicators and route the product development cycle back to the appropriate planning, discovery, or implementation gate.

---

## PREREQUISITES

Before running this workflow:
1. The project must be actively in development (has an active PRD, backlog, or code).
2. The user has proposed a new feature, feature group, or major project expansion.

---

## EXECUTION SEQUENCE

### 1. Information Gathering
Prompt the user for details about the proposed expansion:
- Name and high-level description of the new feature/module.
- Main goal and problem it intends to solve.
- Target audience (Is it for the same personas or new ones?).

### 2. The 4 Pillars Assessment
Evaluate the proposed change against the 4 pillars by analyzing the codebase, PRD, and database schema, then discussing with the user:
- **Research & Context Alignment:** Does it shift any assumptions from past market, competitor, or domain research?
- **Pivot Likelihood:** Is this an incremental add-on, or does it trigger a potential Zoom-In/Zoom-Out/Customer/Tech pivot?
- **Technical & Architectural Impact:** Does it alter the database schema (ERD), API contracts, or require new third-party integrations/libraries?
- **UX & UI Complexity:** Does it make the primary user flows too complicated? Does it violate YAGNI?

### 3. Determine Routing Level
Based on the assessment, classify the impact into one of three routing tiers:
- **🟢 Mức 1: Tác động THẤP (Low Impact):** Incremental feature, no core flow or major DB changes. Route to `/make-story`.
- **🟡 Mức 2: Tác động TRUNG BÌNH (Medium Impact):** Large module, changes core database schema or core workflow. Route to `/plan` to update PRD/Epics. *Note: Also evaluate if these PRD changes necessitate updates to `product-strategy.md` or `project-context.md`.*
- **🔴 Mức 3: Tác động CAO / Pivot (High Impact):** Value proposition shift, customer segment change, or core tech pivot. Route to `/idea-challenge` or `/research` to explicitly update `product-strategy.md` and `project-context.md`.

### 4. Generate the Project Expansion Report
Compile the analysis into a standardized markdown file located at `_iwish-output/3. Development/project-expansion-review/PER-[feature-name].md` using the following template:

```markdown
# Project Expansion Review: [Tên tính năng/module mới]

## 1. Feature Description
- **Tên tính năng/nhóm tính năng**: [Tên]
- **Mô tả ngắn gọn**: [Mô tả]

## 2. Strategic & Pivot Assessment
- **Alignment Status**: [Khớp / Trôi lệch nhẹ / Thay đổi lớn]
- **Pivot Indicator**: [Không cần Pivot / Cần Pivot một phần / Cần Pivot toàn bộ dự án]
- **Potential Pivot Type**: [Zoom-In / Zoom-Out / Customer Segment / Technology / None]

## 3. Impact Analysis Matrix
| Vùng ảnh hưởng | Mức độ tác động (Low/Med/High) | Chi tiết tác động & Rủi ro |
| :--- | :--- | :--- |
| **Market & Competitors** | [Low/Med/High] | [Chi tiết] |
| **Technical Stack & DB** | [Low/Med/High] | [Chi tiết] |
| **UX & UI Complexity** | [Low/Med/High] | [Chi tiết] |
| **Project Roadmap** | [Low/Med/High] | [Chi tiết] |

## 4. Decision & Funnel Routing
- **Verdict**: [GO - Triển khai tiếp / RE-PLAN - Cập nhật PRD / PIVOT - Tái định hướng]
- **Next Canonical Workflow**: [/make-story | /plan | /idea-challenge]
- **Action Plan**:
  1. [Mô tả chi tiết bước đi tiếp theo]
  2. [Mô tả các file cần cập nhật (VD: PRD, Epic, product-strategy.md, project-context.md)]

<!-- coaching-notes-expansion -->
```

### 5. Regenerate Feature Hierarchy (MANDATORY)

After the expansion report is generated (regardless of routing verdict), the agent MUST regenerate `feature-hierarchy.md` to include the new feature in the correct portal sidebar position:

```
1. CHECK: Does `{planning_artifacts}/feature-hierarchy.md` exist?
2. IF EXISTS:
   - Read the current feature-hierarchy.md
   - Integrate the new feature/module from the PER into the appropriate portal's sidebar tree
   - Regenerate the full feature-hierarchy.md with the new feature correctly placed
   - Log: "✅ Feature Hierarchy regenerated to include [feature-name] in [portal-name] sidebar."
3. IF NOT EXISTS:
   - Log warning: "⚠️ feature-hierarchy.md does not exist yet. It will be created when /create-epics-and-stories runs."
   - Add a note in the PER report that feature-hierarchy.md generation is pending
```

**This step ensures new features are immediately reflected in the navigation source-of-truth.**

### 6. Present A/P/C Menu
Present the generated report to the user and request confirmation:
"I have generated the Project Expansion Review report. What would you like to do?

**[A] Advanced Elicitation** - Let's refine the impact analysis or explore alternative architectures.
**[P] Party Mode** - Call the PM, Architect, and Dev Agents to debate the routing verdict.
**[C] Continue** - Save the report to `PER-[feature-name].md` and redirect execution to the recommended next workflow."

### 7. Process Menu Selection
- **If 'A':** Load `{project-root}/_iwish/core/workflows/advanced-elicitation/workflow.xml` to deepen elicitation.
- **If 'P':** Load `{project-root}/_iwish/core/workflows/party-mode/workflow.md` to trigger multi-agent discussion.
- **If 'C':** Write the file to `_iwish-output/3. Development/project-expansion-review/PER-[feature-name].md` and handoff execution to the proposed next workflow (e.g., `/make-story`, `/plan`, or `/idea-challenge`).

---

## SUCCESS METRICS
- ✅ Proposed expansion details successfully gathered.
- ✅ All 4 pillars assessed objectively with user feedback.
- ✅ Routing level (Low/Medium/High) clearly defined.
- ✅ Standardized PER report generated and saved under the `3. Development/project-expansion-review/` directory.
- ✅ Feature Hierarchy regenerated to include the new feature/module.
- ✅ APC menu processed correctly.
