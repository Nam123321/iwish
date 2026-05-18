# Distro MASTER Design — Absorb Current

## Identity

- Product: `Distro`
- Category: AI-Embedded Light DMS
- Primary audiences:
  - SME sellers
  - field reps
  - warehouse operators
  - coordinators
- Design posture:
  - operational calm
  - fast scanning
  - trustworthy AI assistance
  - low-ornament SaaS clarity

## Brand Foundations

### Color Tokens

- `--color-mint`: `#00DF9A`
- `--color-navy`: `#0A1128`
- `--color-orange`: `#FF6B35`
- `--color-cloud`: `#F8FAFC`
- `--color-surface`: `#FFFFFF`
- `--color-text-primary`: `#142033`
- `--color-text-muted`: `#5B6B82`
- `--color-border`: `#D9E2EC`
- `--color-success`: `#159A65`
- `--color-warning`: `#C97A12`
- `--color-danger`: `#D64545`

### Usage Rules

- Light UI is the default.
- Navy is reserved for major navigation, strong anchors, dense information headers, and trusted emphasis zones.
- Mint is not a blanket brand wash. It is used for:
  - AI cues
  - positive signals
  - active highlights
- Orange is used for decisive business actions:
  - confirm
  - submit
  - schedule
  - start trial

## Typography

- Headline / hero / high-signal product statements: `Lexend Deca`
- Body / tables / forms / dashboard / detail copy: `Inter`

### Type Scale

- H1: `48 / 1.1`
- H2: `32 / 1.2`
- H3: `24 / 1.2`
- Body: `16 / 1.5`
- Small: `13 / 1.4`

### Typography Rule

- Use Lexend to give product confidence and memorable shape.
- Use Inter everywhere operational readability matters.
- Do not introduce a third font family in core product surfaces.

## Layout System

- Base grid: `12-column SaaS grid`
- Spacing unit: `8px`
- Primary card radius: `16px`
- Secondary radius: `12px`
- Button radius: `12px`

### Layout Rule

- Prefer full-width bands or clean constrained sections over floating card stacks.
- Preserve whitespace to reduce operator pressure.
- Avoid nested card-in-card composition unless the inner card is a true module with separate action scope.

## Core UX Principles

1. Reduce stress before adding delight.
2. Show risk information in the order an operator needs it.
3. AI must always arrive with context.
4. High-frequency tasks should be scannable before they become beautiful.
5. Recovery paths matter as much as primary happy-path flow.

## AI Interaction System

### AI Marker

- AI-processed data must have a visible mint cue.
- Use a small mint dot or mint-accent badge near:
  - AI suggestions
  - AI summaries
  - AI-generated alerts
  - AI-assisted reorder logic

### AI Suggestion Module

Each AI suggestion module should contain:

- suggestion label
- why the suggestion exists
- confidence or evidence hint
- clear accept / dismiss action
- non-destructive behavior by default

### AI Rule

- AI suggestions must never obscure the base operational truth.
- The user must still be able to see:
  - actual stock
  - actual debt state
  - actual order value

## Navigation System

### Website

- Top navigation with one primary CTA
- Information architecture:
  - Product
  - Workflows
  - AI Features
  - Pricing / Contact

### App / Dashboard

- Predictable left navigation on desktop
- Bottom or tab-based simplified navigation on mobile
- Keep route history stable; back behavior must be predictable

## Component Rules

### Buttons

- One primary CTA per region
- Primary CTA can use orange
- Secondary actions stay neutral or navy-outline
- Avoid multiple high-saturation CTAs in the same visual cluster

### Forms

- Support numeric keyboards where relevant
- Minimize field count before submission
- Use inline validation where possible
- Group fields by decision timing, not database structure

### Tables

- Tables are valid for desktop operator work
- Mobile must use horizontal scroll or card conversion
- Do not allow silent overflow

### Alerts

- Danger: destructive or debt-blocking condition
- Warning: stock risk / partial availability
- Success: confirmation or AI-assisted improvement
- Informational: neutral updates

### Cards

- Cards are for repeated items or bounded modules
- Avoid marketing-card overuse on operational surfaces

## States

### Loading

- Keep skeletons calm and readable
- Avoid excessive shimmer and motion

### Empty

- Empty states should point to next action, not brand theater

### Error

- Errors must state:
  - what failed
  - what the user can do next
  - whether data is safe or unsaved

### Constraint States

For workflows like order creation:

- low stock
- out of stock
- near debt limit
- debt limit exceeded
- AI substitute available
- split delivery available

These states must be visually distinguishable and action-oriented.

## Mobile UX Rules

- Design mobile first for field reps
- Prioritize thumb reach and quick confirmation
- Keep primary actions reachable without long vertical hunting
- Avoid accidental refresh where it harms work continuity

## Website Experience Rules

- Website must communicate:
  - operational trust
  - AI support
  - real workflow competence
- Prefer:
  - live product proof
  - workflow examples
  - trust blocks
  - capability walkthroughs
- Avoid:
  - giant decorative hero
  - vague AI slogans
  - heavy dark glass aesthetic

## Anti-Patterns

- Generic startup AI landing style
- Decorative mint flood across the whole interface
- Loud hero with weak product proof
- Multi-CTA clutter
- AI suggestions without evidence
- Dense operational page with insufficient whitespace

## Source-of-Truth Readiness

This `MASTER design` is suitable as a governed I-Wish source of truth because it:

- preserves brand truth
- scales across website and product surfaces
- defines AI behavior as a system
- clarifies what to reject, not only what to create
