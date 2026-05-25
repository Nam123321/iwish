---
name: "create-dashboard-spec"
description: "Design BI dashboard UI specification — chart types, drill-down paths, filters, refresh intervals, and data sources"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Dashboard Specification

## Pre-requisites
- BI Metrics Validator SKILL at `{project-root}/.agent/skills/bi-metrics-validator/SKILL.md`
- BI Pipeline design (if exists) from `{output_folder}/data-specs/*-bi-pipeline.md`
- Story file or dashboard requirements

## Workflow Steps

### Step 1: Context Loading
1. Load the BI Metrics Validator SKILL
2. Load the RACI matrix from `{project-root}/_bmad/bmm/config/data-raci.md`
3. Load existing BI Pipeline design for this feature (if available)
4. Load the story/feature description

### Step 2: Dashboard Purpose & Audience
Define who uses this dashboard and why:

| Property | Value |
|----------|-------|
| **Dashboard Name** | [e.g., Sales Performance Dashboard] |
| **Primary Audience** | [e.g., Tenant Admin, Sales Manager] |
| **Key Question** | [e.g., "How are my sales performing this month?"] |
| **Refresh Frequency** | [e.g., Near-real-time (5 min)] |
| **Device Target** | [e.g., Desktop primary, Mobile responsive] |

### Step 3: Metric Cards (KPI Section)
Define the top-level KPIs displayed as cards:

| KPI | Calculation | Source | Trend |
|-----|------------|--------|-------|
| Total Revenue | SUM(Order.totalAmount) WHERE status=completed | BI Cache (Redis) | vs. previous period (↑↓) |
| Active Customers | COUNT(DISTINCT customers with orders in period) | BI Cache | vs. previous period |
| Conversion Rate | Orders / Total Chat Sessions × 100 | Computed | vs. previous period |

### Step 4: Chart Specifications
For each chart/visualization:

| Chart | Type | X-Axis | Y-Axis | Drill-Down | Data Source |
|-------|------|--------|--------|------------|-------------|
| Revenue Trend | Line Chart | Date (day/week/month) | Revenue amount | Click day → hourly breakdown | BI summary table |
| Top Products | Horizontal Bar | Product name | Units sold | Click product → order list | Prisma query (cached) |
| Sales by Region | Map / Donut | Region | Revenue % | Click region → sales rep list | BI summary table |

**Chart type decision rules:**
- Trend over time → Line Chart
- Comparison between categories → Bar Chart (Horizontal for >5 categories)
- Proportion/composition → Donut/Pie Chart
- Geographic data → Map visualization
- Ranking → Horizontal Bar (sorted)
- Distribution → Histogram

### Step 5: Filter & Control Design
Define interactive controls:

| Filter | Type | Options | Default | Scope |
|--------|------|---------|---------|-------|
| Date Range | Date Picker | Today/7D/30D/Custom | Last 30 days | Global |
| Sales Rep | Multi-select | All active reps | All | Per-chart |
| Product Category | Dropdown | All categories | All | Per-chart |
| Status | Toggle | Active/Completed/All | All | Global |

**Rules:**
- Global filters affect ALL charts simultaneously
- Per-chart filters only affect their specific chart
- Filter state should persist in URL params (shareable links)

### Step 6: Refresh Strategy
| Component | Strategy | Interval |
|-----------|----------|----------|
| KPI Cards | Auto-refresh (polling) | 5 minutes |
| Charts | Refresh on filter change + manual button | On interaction |
| Data Tables | Pagination + lazy load | On scroll/page |

### Step 7: Export & Sharing
- **PDF Export:** Full dashboard snapshot with current filter state
- **CSV Export:** Per-chart data export
- **Shareable Link:** URL with encoded filter params
- **Scheduled Email:** Weekly digest with KPI summary

### Step 8: UI Spec Output
Generate a component hierarchy for the dev team:

```
DashboardPage
├── FilterBar (global filters)
├── KPISection
│   ├── KPICard (Revenue)
│   ├── KPICard (Active Customers)
│   └── KPICard (Conversion Rate)
├── ChartGrid (2-col responsive)
│   ├── RevenueTrendChart
│   ├── TopProductsChart
│   └── SalesByRegionChart
└── ActionBar
    ├── ExportPDFButton
    ├── ExportCSVButton
    └── RefreshButton
```

### Step 9: Validation
Run BI Metrics Validator SKILL (B1-B5) on the dashboard spec.

### Step 10: Output
Save to `{output_folder}/data-specs/{feature-key}-dashboard-spec.md` with:
- Dashboard purpose & audience
- KPI card definitions
- Chart specifications with drill-down paths
- Filter & control design
- Refresh strategy
- Export capabilities
- Component hierarchy (UI Spec)
- BI Metrics Validator results

Present to user for review. Flag "⚡ UX Designer review recommended" for layout decisions.
