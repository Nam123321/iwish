---
type: I-Wish UI Spec
title: "UI Spec: Story {{story_key}} — {{story_title}}"
description: "UI and UX specification for Story {{story_key}}"
resource: "file://{project-root}/_iwish-output/2. Product Planning/2.3. ui-ux-spec.md"
tags: ["ui-spec", "ux"]
timestamp: "{{date}}"
links_to: ["_iwish-output/3. Development/1. Epic & Story/story-{{story_key}}.md"]
---

# UI Spec: Story {{story_key}} — {{story_title}}

**Status:** {{status}}
**Portal(s):** {{target_portals}}
**Date:** {{date}}
**Approved By:** {{approved_by}}

---

## 1. Screen Inventory

| # | Screen | Route | Type | Portal | AC Refs |
|:-:|--------|-------|------|--------|---------|
| 1 | {{screen_name}} | {{route}} | {{type}} | {{portal}} | {{ac_refs}} |

---

## 2. Navigation, Routing & Menu Placement

| Screen | Target Route (URL) | Parent Menu / Tab | Child / Sub-tab | Navigation Flow / Access Path | Menu Icon / Label |
|:------:|--------------------|-------------------|-----------------|------------------------------|-------------------|
| {{screen_name}} | {{route}} | {{parent_menu}} | {{child_tab}} | {{access_path}} | {{menu_icon_label}} |

**Navigation Behavior:**
- **Access Flow**: [Describe step-by-step how the user navigates to this screen from the landing or home view]
- **Sidebar/Menu Highlight**: [Specify which menu item or sidebar item is active and highlighted when viewing this screen]
- **Breadcrumbs**: [Define breadcrumb path, e.g. Home > Settings > Security]
- **Redirects & Gating**: [Describe any auto-redirects, e.g. redirect to login if unauthenticated, or redirect to onboarding if workspace is new]
- **Navigation State**: [Specify if any query params or state are passed during navigation, e.g. `?workspaceId=123`]

---

## 3. Component Hierarchy

### Screen: {{screen_name}} (`{{route}}`)

```
{{screen_name}}Page
├── {{SectionComponent}}
│   ├── {{Component}} [props: {{props}}]
│   │   ├── {{Element}}
│   │   └── {{Element}}
│   └── {{Component}}
└── {{SectionComponent}}
    └── {{Component}}
```

**Component Details:**

| Component | Props | States | Variants | Accessibility |
|-----------|-------|--------|----------|---------------|
| {{name}} | {{props_list}} | loading, empty, error, active | {{variants}} | {{aria_role}}, {{keyboard}} |

---

## 4. Responsive Layout

### Breakpoints for {{target_portal}}

| Breakpoint | Width | Layout | Key Changes |
|-----------|-------|--------|-------------|
| {{name}} | {{range}} | {{layout_description}} | {{changes}} |

### Screen: {{screen_name}} — Layout per Breakpoint

**Desktop (≥{{desktop_width}}):**
```
┌─────────────────────────────────────────────┐
│ {{layout_ascii_desktop}}                    │
└─────────────────────────────────────────────┘
```

**Tablet ({{tablet_range}}):**
```
┌─────────────────────────────┐
│ {{layout_ascii_tablet}}     │
└─────────────────────────────┘
```

**Mobile ({{mobile_range}}):**
```
┌──────────────┐
│ {{layout_ascii_mobile}}
└──────────────┘
```

---

## 5. Design Tokens

### Colors (from UX Spec)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | {{value}} | Primary actions, links |
| `--color-surface` | {{value}} | Card backgrounds |
| `--color-text` | {{value}} | Body text |
| `--color-text-muted` | {{value}} | Secondary text |
| `--color-border` | {{value}} | Dividers, card borders |
| `--color-error` | {{value}} | Validation errors |
| `--color-success` | {{value}} | Success states |

### Typography

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `heading-1` | {{font}} | {{size}} | {{weight}} | Page title |
| `heading-2` | {{font}} | {{size}} | {{weight}} | Section title |
| `body` | {{font}} | {{size}} | {{weight}} | Body text |
| `caption` | {{font}} | {{size}} | {{weight}} | Labels, hints |

### Spacing & Grid

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight spacing |
| `--space-delivery-manager-agent` | 8px | Component internal |
| `--space-md` | 16px | Between components |
| `--space-lg` | 24px | Between sections |
| `--space-xl` | 32px | Page margins |
| `--grid-gap` | {{value}} | Grid gap |
| `--grid-columns` | {{value}} | Column count |

### Elevation & Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-card` | {{value}} | Card elevation |
| `shadow-modal` | {{value}} | Modal/dialog |
| `shadow-dropdown` | {{value}} | Dropdown menus |
| `border-radius` | {{value}} | Corner rounding |

---

## 6. Interaction Patterns

| # | Component | User Action | System Response | Loading | Error | Animation |
|:-:|-----------|------------|-----------------|---------|-------|-----------|
| 1 | {{component}} | {{action}} | {{response}} | {{loading_type}} | {{error_handling}} | {{animation}} |

### Micro-Animations

| Trigger | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| {{trigger}} | {{animation_desc}} | {{duration}} | {{easing}} |

---

## 7. Data Contracts (API ↔ Component)

### {{Component}} → `{{API_ENDPOINT}}`

**Request:**
```typescript
// {{method}} {{endpoint}}
interface {{RequestType}} {
  {{field}}: {{type}};
}
```

**Response:**
```typescript
interface {{ResponseType}} {
  {{field}}: {{type}};
}
```

**Mapping:**
| API Field | Component Prop | Transform |
|-----------|---------------|-----------|
| `{{api_field}}` | `{{prop}}` | {{transform}} |

---

## 8. Accessibility Requirements

| Requirement | Implementation | WCAG |
|-------------|---------------|------|
| Keyboard navigation | {{implementation}} | 2.1.1 |
| Screen reader | {{implementation}} | 1.3.1 |
| Color contrast | Min 4.5:1 for text, 3:1 for large text | 1.4.3 |
| Touch targets | Min 44×44px on mobile | 2.5.8 |
| Focus indicators | Visible focus ring on all interactive elements | 2.4.7 |
| Reduced motion | Respect `prefers-reduced-motion` | 2.3.3 |

---

## 9. Visual References

### Design System Source
- **Style:** {{style_name}} (from ui-ux)
- **Color Palette:** {{palette_name}}
- **Typography:** {{font_pairing}}
- **UX Spec Section:** {{ux_spec_reference}}
- **Feature Hierarchy:** {{feature_hierarchy_reference}}

### Anti-Patterns to Avoid
- {{anti_pattern_1}}
- {{anti_pattern_2}}
- {{anti_pattern_3}}

---

## 10. [STITCH_PROMPT_INJECTION]

> **For Stitch MCP Generation:** Copy and paste the block below into your Stitch tool.
```
{{stitch_prompt_injection}}
```

---

## 11. [POST_STITCH_ENRICHMENT_LOGIC]

> **For Vegeta Implementation (Vegeta-agent):** This section contains dynamic behaviors, animations, or observers that Stitch cannot generate. **MUST BE IMPLEMENTED.**
```javascript
{{post_stitch_enrichment_logic}}
```

---

## Vegeta-agent Agent Notes

> This UI spec was generated by the `create-ui-spec` workflow and approved by {{approved_by}}.
> The Vegeta-agent agent should load this file as context when implementing `[FE]` tasks for story {{story_key}}.
> **GATE:** If `Enrichment_Required` is true, the `[POST_STITCH_ENRICHMENT_LOGIC]` section MUST NOT be empty. Vegeta-agent must HALT if it is missing, unless `APPROVE_OVERRIDE` is provided.
> All component names, design tokens, and responsive breakpoints in this spec are authoritative for implementation.
