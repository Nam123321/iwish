---
type: I-Wish Epic Breakdown
title: "{{project_name}} - Epic Breakdown"
description: "Epic and story breakdown for {{project_name}}"
resource: "file:///Users/hatrang20061988/Desktop/AI Project/iwish/_iwish-output/2. Product Planning/2.4. epics-and-stories.md"
tags: ["epics", "planning"]
timestamp: "{{date}}"
links_to: []
stepsCompleted: []
inputDocuments: []
---

# {{project_name}} - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for {{project_name}}, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

{{fr_list}}

### NonFunctional Requirements

{{nfr_list}}

### Additional Requirements

{{additional_requirements}}

### FR Coverage Map

{{requirements_coverage_map}}

## Epic List

{{epics_list}}

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->

### Story {{N}}.{{M}}: {{story_title_N_M}}

**Epic:** Epic {{N}}: {{epic_title_N}}
**Story Title:** {{story_title_N_M}}
**FR Covered:** {{fr_covered_N_M}}
**Goal:** {{story_goal_N_M}}

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

**Acceptance Criteria:**

<!-- for each AC on this story -->

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}
**And** {{additional_criteria}}

<!-- End story repeat -->
