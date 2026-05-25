# MKT Material Capture Pipeline

## Purpose

Every time a design option is approved (in any UX/UI workflow), this pipeline MUST be executed to capture screenshots, rationale, and marketing stories for future use.

## Trigger Conditions

This pipeline is triggered when:
1. User approves a design option in the **5-Option Framework** (Steps 00, 00b, 09, or create-ui-spec)
2. A Design System category is finalized
3. A story UI spec is approved
4. A Creative Intelligence session produces approved visual designs

## Pipeline Steps

### Step 1: Capture Visual Assets

**For Stitch-generated designs:**
1. Get screen details via `mcp_StitchMCP_get_screen` for the approved screen
2. Save thumbnail URL and screen metadata
3. Log Stitch project ID and screen ID for future reference

**For generated images:**
1. Copy approved image to MKT materials directory

**For HTML prototypes:**
1. Use `browser_subagent` to capture screenshot of the prototype
2. Save screenshot to MKT materials directory

**Output Location:** `{output_folder}/mkt-materials/screenshots/{portal}/{feature}/`

### Step 2: Extract Design Rationale

From the 5-option comparison:
1. Extract the comparison table (all 5 options with scores)
2. Extract the selection reason (why this option was chosen)
3. Extract rejected options and their weaknesses
4. Include user quotes from the discussion

**Output Location:** `{output_folder}/mkt-materials/design-rationale/{feature-slug}.md`

**Template:**
```markdown
# Design Rationale: {Feature Name}

**Date:** {date}
**Portal:** {portal_name}
**Approved Option:** Option {N} — {option_description}

## Options Evaluated

| Option | Method | Score | Status |
|--------|--------|-------|--------|
| 1 | {method} | {score}/25 | {approved/rejected} |
| ...    | ...    | ...   | ...    |

## Why This Option

{rationale}

## Key Design Decisions

- {decision_1}: {reason}
- {decision_2}: {reason}

## Rejected Alternatives

{why_others_were_rejected}
```

### Step 3: Create MKT Story

Generate a marketing-ready story for the feature:

**Output Location:** `{output_folder}/mkt-materials/stories/{feature-slug}-story.md`

**Template:**
```markdown
# {Feature Name} — Câu Chuyện Thiết Kế

## Hero Visual
![{feature} UI]({screenshot_path})

## Tại Sao Thiết Kế Này

{benefit_statement_in_vietnamese}

## Điểm Nổi Bật
- {highlight_1}
- {highlight_2}
- {highlight_3}

## Trải Nghiệm Người Dùng
{user_experience_narrative}

## Thông Tin Kỹ Thuật
- Portal: {portal}
- Style: {style_name}
- Design System: {design_system_version}
- Stitch Project: {stitch_project_link}

## Tags
portal: {portal}, feature: {feature}, style: {style}, date: {date}
```

### Step 4: Update Knowledge Base

Update the project's knowledge base with the design decision:
1. If Knowledge Item `design-decisions` exists: append new entry
2. If not: create new KI with design decision summary
3. Include: approved option, rationale, visual reference path, Stitch project link

### Step 5: Update Feature Hierarchy

In `{planning_artifacts}/feature-hierarchy.md`:
1. Find the feature node matching this design
2. Add or update `visual_spec_url` field with the screenshot path
3. Add `mkt_story_url` field with the MKT story path

## Directory Structure

```
_bmad-output/mkt-materials/
├── screenshots/
│   ├── admin-portal/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── pricing/
│   │   └── wizard/
│   ├── webstore/
│   ├── sales-app/
│   └── saas-dashboard/
├── design-rationale/
│   ├── admin-dashboard.md
│   ├── admin-products.md
│   └── ...
├── stories/
│   ├── admin-dashboard-story.md
│   ├── admin-products-story.md
│   └── ...
└── index.md  ← Master index of all MKT materials
```

## Success Criteria

✅ Visual asset captured and saved to correct directory
✅ Design rationale extracted with comparison table
✅ MKT story generated in Vietnamese
✅ Knowledge base updated with design decision
✅ Feature hierarchy updated with visual_spec_url
