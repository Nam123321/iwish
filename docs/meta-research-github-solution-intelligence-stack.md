# Meta-Research v2: GitHub Solution Intelligence Stack for Story 1.16

## Why this replaces the earlier draft

The earlier meta-research draft leaned too heavily toward tools that help an agent understand a **chosen codebase**.

That is useful later, but it is **not** the core requirement here.

The real requirement for Story 1.16 is:

- when a user asks I-Wish to research solutions on GitHub
- especially repos, frameworks, tools, skills, or workflows
- what stack helps Orch discover, triage, compare, and evaluate those candidates quickly and accurately

So this version focuses on:

- discovery
- repo intelligence
- release / issue / contributor diagnostics
- trust / license screening
- comparison evidence

## Problem-to-Solve

To research GitHub solutions well, Orch needs more than a single “deep dive” skill.

It needs a composed stack that can answer:

- what candidates exist
- which repos are active or stale
- what has changed recently
- what users complain about
- what trust or security risks exist
- how two or more candidates compare
- when the answer is “compose multiple tools” rather than “pick one repo”

## Broad Scan Pool

This scan focused on tools and services that directly improve GitHub-solution research.

1. `github-deep-research` (internal I-Wish skill)
2. [`cli/cli`](https://github.com/cli/cli)
3. [`pingcap/ossinsight`](https://github.com/pingcap/ossinsight)
4. [`ecosyste-ms/repos`](https://github.com/ecosyste-ms/repos)
5. [`ecosyste-ms/issues`](https://github.com/orgs/ecosyste-ms/repositories)
6. [`librariesio/libraries.io`](https://github.com/librariesio/libraries.io)
7. [`ossf/scorecard`](https://github.com/ossf/scorecard)
8. [`emanuelef/daily-stars-explorer`](https://github.com/emanuelef/daily-stars-explorer)
9. [`chaoss/augur`](https://github.com/chaoss/augur)
10. [`firecrawl/cli`](https://github.com/firecrawl/cli)

## What each candidate is actually good for

### `gh` / GitHub CLI

Best at:

- first-party search
- issues / PR / release retrieval
- structured JSON output
- repeatable query recipes

Primary signals:

- official GitHub command-line tool  
  Source: [cli/cli](https://github.com/cli/cli)
- active releases within the last 90 days  
  Source: [cli releases](https://github.com/cli/cli/releases)
- search and issue APIs are part of the normal CLI surface, but rate-limit concerns exist at large scale  
  Sources:
  - [search issues doc snippet](https://github.com/cli/cli/issues/6945)
  - [rate limit issue example](https://github.com/cli/cli/issues/10426)

Role in the stack:

- canonical baseline tool

### `OSSInsight`

Best at:

- ecosystem-level discovery
- repo trends
- comparison and ranking
- contributor and activity analytics

Primary signals:

- analyzes 10+ billion GitHub events
- supports repo analytics, trends, rankings, collections, and natural-language insight  
  Source: [pingcap/ossinsight](https://github.com/pingcap/ossinsight)

Role in the stack:

- best external analytics layer for discovery and comparison

### `ecosyste.ms`

Best at:

- open metadata APIs
- repository metadata
- issue / PR metadata
- commit and timeline datasets
- dependency / package context

Primary signals:

- `repos` provides repository metadata API  
  Source: [ecosyste-ms/repos](https://github.com/ecosyste-ms/repos)
- org overview explicitly references:
  - repository metadata
  - issue metadata
  - commit metadata
  - timeline of billions of GitHub events
  - package and dependency metadata  
  Source: [ecosyste.ms org overview](https://github.com/ecosyste-ms)

Role in the stack:

- best open-data metadata layer

### `Libraries.io`

Best at:

- package/library discovery
- cross-ecosystem dependency and package intelligence
- finding alternatives by package/domain rather than by repo name alone

Primary signals:

- explicitly positions itself as “The Open Source Discovery Service”  
  Source: [librariesio/libraries.io](https://github.com/librariesio/libraries.io)

Role in the stack:

- best package-discovery layer when the user asks for framework/library alternatives

### `OpenSSF Scorecard`

Best at:

- trust/security posture
- supply-chain quality checks
- security-aware comparison

Primary signals:

- automates security-health heuristics for open source projects
- offers CLI, Action, REST API, and public scores  
  Source: [ossf/scorecard](https://github.com/ossf/scorecard)

Role in the stack:

- best trust / security scoring layer

### `daily-stars-explorer`

Best at:

- star history and growth pattern analysis
- timeline comparisons between repos
- identifying hype spikes versus steadier adoption

Primary signals:

- supports full star history, commits, PRs, issues, forks, contributors, and repo comparison  
  Source: [daily-stars-explorer](https://github.com/emanuelef/daily-stars-explorer)

Role in the stack:

- specialized popularity / momentum diagnostics

### `Augur`

Best at:

- OSS health and sustainability metrics
- richer long-horizon community analysis

Primary signals:

- positions itself as a data-engineering and community-health platform for OSS metrics  
  Source: [chaoss/augur](https://github.com/chaoss/augur)

Role in the stack:

- deeper community-health analysis, but heavier than phase-1 needs

### `firecrawl/cli`

Best at:

- scraping release pages, issue pages, docs, discussions, and other web surfaces when GitHub snippets or APIs are not enough

Primary signals:

- supports search, scrape, interact, and workflow/skill setup  
  Source: [firecrawl/cli](https://github.com/firecrawl/cli)

Role in the stack:

- optional evidence-harvesting companion

### `github-deep-research`

Best at:

- turning shortlisted candidates into evidence-backed repo deep dives
- extracting architecture and implementation truth beyond README-level claims

Role in the stack:

- mandatory deep-evidence layer after shortlist selection

## Scoring Rubric

Raw scores are `1-5` on each axis:

- `Discovery power`
- `Repo intelligence`
- `Release / issue diagnostics`
- `Trust / security signal`
- `Integration cost`
- `Repeatability`
- `Output structure`
- `Fit for Orch`

Total possible score: `40`

## Raw Scores

| Candidate | Discovery | Repo intelligence | Release/issue diagnostics | Trust/security | Integration | Repeatability | Structured output | Orch fit | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `gh` | 4.5 | 4.5 | 4.5 | 3.0 | 5.0 | 5.0 | 5.0 | 5.0 | 36.5 |
| `OSSInsight` | 4.5 | 4.5 | 4.5 | 3.5 | 4.0 | 4.5 | 4.5 | 4.5 | 34.0 |
| `ecosyste.ms` | 4.0 | 4.5 | 4.5 | 3.5 | 4.0 | 4.5 | 4.5 | 4.5 | 33.5 |
| `Libraries.io` | 4.5 | 3.5 | 2.5 | 3.5 | 4.0 | 4.0 | 4.0 | 4.0 | 30.0 |
| `OpenSSF Scorecard` | 2.0 | 3.0 | 2.5 | 5.0 | 4.0 | 4.5 | 4.0 | 4.0 | 29.0 |
| `github-deep-research` | 2.0 | 5.0 | 3.0 | 3.5 | 5.0 | 4.0 | 4.0 | 5.0 | 31.5 |
| `daily-stars-explorer` | 3.0 | 3.5 | 4.0 | 2.0 | 3.5 | 4.0 | 4.0 | 3.5 | 27.5 |
| `Augur` | 3.0 | 4.0 | 4.5 | 3.0 | 2.0 | 4.0 | 4.0 | 2.5 | 27.0 |
| `firecrawl/cli` | 2.5 | 3.0 | 4.0 | 2.5 | 4.0 | 4.0 | 4.0 | 3.5 | 27.5 |

## Corrected Shortlist

### Top 3 primary candidates

1. `gh`
2. `OSSInsight`
3. `ecosyste.ms`

### Alternates

1. `Libraries.io`
2. `OpenSSF Scorecard`

### Mandatory internal follow-up

- `github-deep-research`

### Optional companion

- `firecrawl/cli`

## Why this shortlist is better

This shortlist is aligned to the actual research task:

- `gh` gives Orch a first-party, scriptable GitHub search and retrieval baseline.
- `OSSInsight` gives ecosystem analytics and comparison.
- `ecosyste.ms` gives open metadata APIs for repos, issues, commits, timelines, and packages.
- `Libraries.io` improves discovery when the problem is framed as package/library alternatives.
- `OpenSSF Scorecard` adds trust/security signal.
- `github-deep-research` deep-dives finalists after the shortlist exists.

This is different from “understand a codebase fast” tools, which are useful only after candidate selection.

## Recommended Composed Stack

### Phase 1: discovery

- `gh`
- `OSSInsight`
- `Libraries.io`

### Phase 2: metadata enrichment

- `ecosyste.ms`

### Phase 3: trust and risk

- `OpenSSF Scorecard`

### Phase 4: deep finalist inspection

- `github-deep-research`

### Phase 5: web evidence fallback

- `firecrawl/cli`

## 90-day diagnostics notes

### `gh`

- active releases in the last 90 days  
  Source: [cli releases](https://github.com/cli/cli/releases)
- public issue history shows search and API edge cases like rate limits, which is useful for setting realistic workflow guardrails  
  Source: [rate-limit issue](https://github.com/cli/cli/issues/10426)

### `OSSInsight`

- strong ecosystem positioning and active issue surface
- useful for ranking and trend signals, but not a direct repo deep-dive tool  
  Source: [ossinsight repo](https://github.com/pingcap/ossinsight)

### `ecosyste.ms`

- org surfaces multiple active metadata services updated recently
- strongest value is openness and composability, not UI polish  
  Source: [ecosyste.ms org](https://github.com/ecosyste-ms)

### `Libraries.io`

- very strong for discovery, but weaker for GitHub-native issue/release diagnostics than `gh` + `ecosyste.ms`

### `OpenSSF Scorecard`

- excellent trust signal, but it should not dominate ranking when the user’s problem is functional fit

## Verdict for Story 1.16

The canonical research stack for GitHub solution discovery should be:

- `gh` as the baseline query and retrieval tool
- `OSSInsight` for analytics and comparison
- `ecosyste.ms` for metadata enrichment
- `Libraries.io` for discovery of framework/library alternatives
- `OpenSSF Scorecard` for trust and security screening
- `github-deep-research` for finalist deep dives
- `firecrawl/cli` only when GitHub snippets/API data are not enough

## Recommended next implementation change

`research-solution-sources` should explicitly split its external research into these stages:

1. `discover`
2. `enrich`
3. `trust-check`
4. `deep-dive`
5. `recommend`

And the default tool binding should prefer:

- `discover` -> `gh`, `OSSInsight`, `Libraries.io`
- `enrich` -> `ecosyste.ms`
- `trust-check` -> `OpenSSF Scorecard`
- `deep-dive` -> `github-deep-research`
- `fallback evidence` -> `firecrawl/cli`
