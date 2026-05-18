# Distro MASTER Design — Original UI/UX Pro Max V2

## Identity

- Product: `Distro`
- Category interpretation:
  - inventory and stock management
  - real-time operations landing
  - feature-rich showcase for operational SaaS
- Audience:
  - operators
  - warehouse teams
  - field reps
  - business decision makers

## Retrieved Design Direction

This version is based on original UI/UX Pro Max retrieval plus stronger prompt constraints.

### Retrieved Pattern Signals

- `Real-Time / Operations Landing`
- `Feature-Rich Showcase`
- `Hero + Features + CTA`

### Retrieved Style Signals

- `Flat Design Mobile (Touch-First)`
- supporting recovery from raw drift:
  - `Swiss Modernism 2.0`
  - `Minimalism & Swiss Style`
  - `Flat Design`

### Retrieved Product Signals

- `Inventory & Stock Management`
- `Real-Time Monitoring + Data-Dense`

## Brand Layer Applied

To fit Distro, this version keeps:

- `Lexend Deca` for high-signal headlines
- `Inter` for operational UI
- `Neon Mint #00DF9A`
- `Deep Navy #0A1128`
- `Action Orange #FF6B35`
- `Soft Cloud #F8FAFC`

## Color System

### Core Tokens

- `--color-primary`: `#334155`
- `--color-secondary`: `#475569`
- `--color-accent`: `#059669`
- `--color-background`: `#F8FAFC`
- `--color-foreground`: `#0F172A`
- `--color-muted`: `#F2F3F4`
- `--color-border`: `#E6E8EA`
- `--color-destructive`: `#DC2626`

### Brand Alignment Override

- Use Distro Mint as the visible AI and positive-action accent where possible.
- Keep Navy as the trusted structural anchor.
- Use Orange only for business-critical CTA moments.

## Typography

### Retrieved Typography Tendency

- Original engine V2 leaned toward `Inter`-only because of its flat/system bias.

### Adjusted Typography

- Headline: `Lexend Deca`
- Body: `Inter`

### Typography Principle

- Maintain operational readability first.
- Use Lexend only where product identity and section distinction need extra force.

## Layout System

- `12-column grid`
- light background
- structured feature blocks
- metrics before CTA where useful
- sticky CTA acceptable in public website surface

## Interaction Direction

### General Behavior

- flat / touch-first interaction language
- immediate press feedback
- low animation dependency
- strong clarity for cross-platform use

### Recommended Effects

- minimal shadow usage
- solid action regions
- direct hover / press shifts
- no ornamental 3D effects

## UX Construction Rules

### Website Layer

- hero with product statement and proof
- metrics / operational signal section early
- feature blocks grouped by workflow
- CTA repeated after evidence

### Product Layer

- information-dense but scannable
- table and dashboard friendly
- mobile-aware states for touch-first flows

## AI UX Rules

- AI features should be visible but not hidden
- AI should support:
  - stock warnings
  - substitute item suggestions
  - debt or risk signals
  - workflow acceleration

### AI Presentation Pattern

- visible badge
- highlighted suggestion card
- status color use where needed

## Component Priorities

### High Priority

- metrics tiles
- feature cards
- alert blocks
- CTA sections
- dashboard preview panels

### Product-Relevant UX Signals

- stock status
- debt warning
- order progress
- suggestion modules
- trusted navigation

## Mobile Guidance

Original repo UX retrieval surfaced these operationally relevant rules:

- show correct keyboard by input type
- design mobile-first
- avoid accidental pull-to-refresh
- handle tables safely on mobile
- preserve back-button behavior

These are valuable and should be carried into implementation.

## Anti-Patterns

- excessive decoration
- complex shadows
- 3D effects
- poor mobile handling
- low contrast

## Strengths of This MASTER Design

- broad and reusable first-pass system skeleton
- good section and component coverage
- stronger retrieval-backed pattern vocabulary
- useful operational/mobile reminders

## Weaknesses of This MASTER Design

- more pattern-driven than brand-native
- still needs human or I-Wish governance to prevent drift
- weaker at explicitly encoding Distro’s emotional UX tone:
  - calm
  - low-pressure
  - operator-trust-first

## Source-of-Truth Readiness

This `MASTER design` is useful as:

- a strong input artifact
- a pattern expansion source
- a retrieval-backed design scaffold

But it is less safe than the absorb-current version to promote directly into governed I-Wish source of truth without review and trimming.
