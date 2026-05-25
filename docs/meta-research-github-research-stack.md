# Meta-Research: GitHub Repo Research Stack for Story 1.16

## Purpose

This report applies the `research-solution-sources` concept to itself:

- which repos, tools, and skills can help I-Wish produce better GitHub solution research
- which candidates should become benchmarks, supportive tools, or later absorption targets
- which stack composition gives Orch the best chance of returning strong GitHub research results with evidence, speed, and low noise

This report follows the council memo in [party-mode-github-solution-search-council-review.md](/Users/hatrang20061988/Desktop/AI%20Project/BMAD-DragonBall/docs/party-mode-github-solution-search-council-review.md).

## Problem-to-Solve

When a user asks I-Wish to research solutions on GitHub, the system needs to do more than:

- read README files
- return stars-based lists
- compare repos shallowly

The stack should improve:

- candidate discovery
- fast repo triage
- architecture extraction
- issue / release / maintenance diagnostics
- final recommendation quality for:
  - `enhance-skill`
  - `create-skill`
  - `register-skill-pack`
  - `absorb-repo`
  - `reference only`
  - composed solution recommendations

## Broad Scan Pool

The broad scan focused on tools with primary-source evidence on GitHub:

1. `github-deep-research` (internal I-Wish skill)
2. [`yamadashy/repomix`](https://github.com/yamadashy/repomix)
3. [`coderamp-labs/gitingest`](https://github.com/coderamp-labs/gitingest)
4. [`probelabs/probe`](https://github.com/probelabs/probe)
5. [`sourcebot-dev/sourcebot`](https://github.com/sourcebot-dev/sourcebot)
6. [`firecrawl/cli`](https://github.com/firecrawl/cli)
7. [`firecrawl/firecrawl`](https://github.com/firecrawl/firecrawl)
8. [`cased/kit`](https://github.com/cased/kit)

## Shortlist Verdict

### Top 3 primary candidates

1. `repomix`
2. `probe`
3. `gitingest`

### Alternates

1. `sourcebot`
2. `firecrawl/cli`

### Internal benchmark / mandatory protocol

- `github-deep-research`

## Why this shortlist

- `repomix` is the best `boring but reliable` benchmark.
- `probe` is the best semantic local interrogation layer after candidate selection.
- `gitingest` is the best lightweight rapid triage layer for remote GitHub repos and subdirectories.
- `sourcebot` is powerful, but heavier to adopt than needed for the first canonical stack.
- `firecrawl/cli` is highly relevant as a complementary evidence harvester for releases, docs, and issue/discussion pages, but it is not the best first-line GitHub repo triage tool by itself.

## Scoring Rubric

Scores are raw `1-5` per axis.

- `Problem fit`
- `Capability fit`
- `Integration cost`
- `Architecture quality`
- `Maintenance signal`
- `Trust / license fit`
- `Docs / learnability`
- `Customization surface`

Total possible score: `40`

## Raw Scores

| Candidate | Type | Problem fit | Capability fit | Integration cost | Architecture quality | Maintenance | Trust/license | Docs | Customization | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `github-deep-research` | Internal skill | 5.0 | 5.0 | 5.0 | 4.0 | 4.0 | 5.0 | 4.0 | 4.0 | 36.0 |
| `repomix` | Repo / CLI / MCP / skill | 4.5 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.5 | 38.5 |
| `probe` | Repo / CLI / MCP | 4.5 | 4.5 | 4.0 | 4.5 | 4.5 | 5.0 | 4.0 | 4.5 | 35.5 |
| `gitingest` | Repo / CLI / web | 4.5 | 4.5 | 5.0 | 3.5 | 3.0 | 5.0 | 4.5 | 3.5 | 33.5 |
| `sourcebot` | Repo / self-hosted app | 4.5 | 4.0 | 2.5 | 4.5 | 5.0 | 3.5 | 4.5 | 4.0 | 32.5 |
| `firecrawl/cli` | Repo / CLI / skill installer | 3.5 | 4.0 | 4.0 | 4.0 | 4.5 | 3.5 | 4.5 | 4.5 | 32.5 |
| `firecrawl` | Repo / platform | 3.5 | 3.5 | 3.0 | 4.0 | 4.5 | 3.0 | 4.0 | 4.5 | 30.0 |
| `cased/kit` | Repo / toolkit | 4.0 | 4.0 | 3.5 | 4.5 | 4.0 | 4.5 | 4.0 | 4.5 | 33.0 |

## Candidate Notes

### 1. `github-deep-research`

Role in the stack:

- mandatory deep-evidence protocol
- not the search engine by itself
- should sit after shortlist selection

Why it matters:

- it already enforces a 3-layer method:
  - architecture context
  - directory scanning
  - raw source extraction
- it directly fights the README-only anti-pattern

Recommended verdict:

- `keep and enhance`

### 2. `repomix`

Primary fit:

- best benchmark for turning repos into AI-friendly context
- strongest ready-to-use bridge between repository content and downstream agent workflows
- unusually aligned with I-Wish because it supports:
  - MCP mode
  - skill generation
  - agent-skill installation paths

Primary-source signals:

- repo page shows `24.9k stars`, `1.3k forks`, `95 releases`, latest `v1.14.0` on `Apr 26, 2026`  
  Source: [repo page](https://github.com/yamadashy/repomix)
- README exposes `--skill-generate` and an installable `repomix-explorer` skill  
  Source: [repo lines for skill generation](https://github.com/yamadashy/repomix)
- README exposes MCP server setup across assistants  
  Source: [repo lines for MCP setup](https://github.com/yamadashy/repomix)

90-day diagnostics:

- latest release in the last 90 days focused on:
  - major performance overhaul
  - monorepo-aware tech stack detection
  - startup and remote-download optimizations  
  Source: [v1.14.0 release](https://github.com/yamadashy/repomix/releases)
- open-issue signal includes:
  - remote/local config breakage
  - large-output limits
  - ignore-pattern correctness  
  Source: [issues listing](https://github.com/yamadashy/repomix/issues)

Praise / complaint pattern:

- praise signal is indirect but strong through ecosystem packaging:
  - MCP server support
  - ready-made explorer skill
  - skill generation support
- complaint pattern clusters around:
  - large repo limits
  - config edge cases
  - ignore behavior

Recommended verdict:

- `register-skill-pack` or `absorb-repo`
- also use as the default benchmark in future repo-research comparisons

### 3. `probe`

Primary fit:

- strong semantic interrogation layer after candidate selection
- useful when I-Wish needs higher-precision local search than flat packing can give

Primary-source signals:

- repo page describes:
  - tree-sitter AST parsing
  - semantic search
  - complete function/class returns
  - zero indexing  
  Source: [repo feature lines](https://github.com/probelabs/probe)
- repo supports both:
  - MCP agent mode
  - raw MCP tools mode  
  Source: [repo MCP lines](https://github.com/probelabs/probe)
- repo page shows `556 stars`, `58 forks`, `375 releases`, latest `v0.6.0-rc315` on `Apr 6, 2026`  
  Source: [repo page](https://github.com/probelabs/probe)

90-day diagnostics:

- release activity exists within the last 90 days
- product positioning is very explicit around semantic code understanding and MCP usage
- available public snippets show active packaging around MCP and agent usage

Praise / complaint pattern:

- positive signal:
  - very clear problem statement
  - agent + raw tool modes
  - no-vector-db / zero-indexing positioning reduces setup friction
- caution:
  - smaller adoption footprint than `repomix` or `gitingest`
  - newer/fast-moving release train may imply more churn

Recommended verdict:

- `reference only` short-term
- likely `register-skill-pack` later if we want a semantic-local-search add-on

### 4. `gitingest`

Primary fit:

- best fast triage layer for remote GitHub repos
- particularly good for:
  - repo URL -> prompt-friendly digest
  - subdirectory ingestion
  - private repo access with token

Primary-source signals:

- repo page shows:
  - URL or local directory ingestion
  - subdirectory support
  - private repo token support
  - browser extension surface  
  Source: [repo page](https://github.com/coderamp-labs/gitingest)
- repo page shows `14.7k stars`, `1.1k forks`, latest `v0.3.1` on `Jul 31, 2025`  
  Source: [repo page](https://github.com/coderamp-labs/gitingest)

90-day diagnostics:

- no release in the last 90 days from the public repo page
- that lowers maintenance confidence relative to `repomix`, `probe`, and `sourcebot`

Praise / complaint pattern:

- praise signal:
  - extremely low-friction mental model
  - direct repo and subdirectory ingest
  - private repo token flow
- caution:
  - weaker recent release cadence
  - architecture seems intentionally simpler, so depth may be limited compared with richer code-intelligence systems

Recommended verdict:

- `reference only` immediately
- possible `register-skill-pack` or wrapper integration as a fast triage companion

### 5. `sourcebot`

Primary fit:

- strong multi-repo, self-hosted search and code-navigation platform
- strongest candidate if I-Wish later wants a persistent indexed search workspace

Primary-source signals:

- repo page highlights:
  - ask-with-citations
  - code search
  - code navigation
  - built-in file explorer  
  Source: [repo page](https://github.com/sourcebot-dev/sourcebot)
- repo page shows `3.4k stars`, `275 forks`, `144 releases`, latest `v4.17.2` on `May 16, 2026`  
  Source: [repo page](https://github.com/sourcebot-dev/sourcebot)
- release snippets show recent work on:
  - streaming code search results
  - search UX
  - GitHub app token fixes  
  Source: [releases snippets](https://github.com/sourcebot-dev/sourcebot/releases)

90-day diagnostics:

- very active release cadence within 90 days
- multiple GitHub integration and search-flow fixes surfaced publicly

Praise / complaint pattern:

- praise signal:
  - clear self-host story
  - broad code search + navigation + citations
- complaint signal:
  - self-hosted/private GitLab integration issues exist in public issue history  
  Source: [issue #206](https://github.com/sourcebot-dev/sourcebot/issues/206)
- legal/trust caveat:
  - fair-source positioning is less clean than MIT/Apache candidates for immediate absorb decisions

Recommended verdict:

- `reference only` now
- later `deeper explore` if I-Wish wants a persistent code intelligence backend beyond ad-hoc repo research

### 6. `firecrawl/cli`

Primary fit:

- not a pure GitHub repo-analysis tool
- valuable complementary layer for:
  - issue page scraping
  - release page scraping
  - docs harvesting
  - multi-format extraction

Primary-source signals:

- CLI supports:
  - search
  - scrape
  - interact
  - skills/workflows/MCP setup  
  Source: [CLI repo page](https://github.com/firecrawl/cli)
- it can install skills and workflows into coding agents  
  Source: [skills lines](https://github.com/firecrawl/cli)
- repo page shows `394 stars`, `50 forks`, `17 releases`, latest `v1.17.1` on `May 15, 2026`  
  Source: [CLI repo page](https://github.com/firecrawl/cli)
- parent Firecrawl repo shows active search features and latest release in the last 90 days  
  Source: [Firecrawl repo page](https://github.com/firecrawl/firecrawl)

90-day diagnostics:

- active releases inside 90 days
- parent repo highlights search performance, CLI, parallel agents, and skills packaging  
  Source: [Firecrawl release snippet](https://github.com/firecrawl/firecrawl/releases)
- public issue signal shows open bugs around search ordering and self-host/search behavior  
  Sources:
  - [issues listing](https://github.com/firecrawl/firecrawl/issues)
  - [self-host issue example](https://github.com/firecrawl/firecrawl/issues/2139)

Recommended verdict:

- `reference only`
- high-value complementary tool for harvesting GitHub page evidence after candidate selection

## Recommended Composed Stack

### Phase 1: Candidate discovery

- GitHub native search
- I-Wish internal inventory
- `research-solution-sources`

### Phase 2: Fast repo triage

- `gitingest` for quick URL/subdirectory digests
- `repomix` as the benchmark packer

### Phase 3: Deep repo interrogation

- `github-deep-research` as mandatory protocol
- `probe` for semantic local interrogation of shortlisted repos

### Phase 4: Evidence harvesting beyond code

- `firecrawl/cli` for release, docs, issue, and discussion page capture when GitHub snippets are not enough

### Phase 5: Heavy persistent search, if needed

- `sourcebot` for future persistent multi-repo code intelligence

## Proposed I-Wish Verdicts

### Immediate

- keep `github-deep-research` as required supportive skill
- add `repomix` as the benchmark external candidate in Story 1.16 examples
- treat `gitingest` as a fast-triage companion candidate
- treat `probe` as the most promising semantic-search add-on candidate

### Near-term follow-up

1. `research-solution-sources` should explicitly allow a composed-tool verdict:
   - `repomix + probe`
   - `gitingest + github-deep-research`
   - `repomix + firecrawl/cli + github-deep-research`
2. create a dedicated evaluation artifact shape for external repo research:
   - shortlist cards
   - raw score table
   - 90-day diagnostics
   - rejection reasons
3. consider a later story to test:
   - `register-skill-pack` for `repomix-explorer`
   - deeper research on `probe`

## Recommendation for Story 1.16

For the first production-quality version of `research-solution-sources`, the recommended default meta-research stack is:

- `github-deep-research`
- `repomix`
- `gitingest`
- `probe`
- optional `firecrawl/cli`

This gives I-Wish:

- one reliable benchmark
- one fast remote triage tool
- one semantic deep-search layer
- one mandatory anti-shallow protocol
- one optional evidence-harvesting companion

That combination is strong enough to materially improve GitHub research quality without prematurely committing to a heavy self-hosted platform.
