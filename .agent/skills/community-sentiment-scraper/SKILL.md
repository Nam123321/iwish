---
name: community-sentiment-scraper
description: Scrapes GitHub issues, discussions, and Reddit to extract community sentiment (bugs, praise, real-world usage) automatically.
---
# Community Sentiment Scraper

Triggered in `/rd-evaluate` Step 4 to gather evidence of real-world friction.

## Execution via GitHub MCP (Preferred)
1. If the user has approved GitHub MCP connection, use `github-mcp-server`.
2. Call `search_issues` with query: `repo:{owner}/{repo} state:open sort:comments-desc` to find top 10 most discussed open issues.
3. Call `search_issues` with query: `repo:{owner}/{repo} state:closed sort:comments-desc` to find top 10 most discussed closed issues (usually resolved bugs or rejected features).
4. Extract common themes: frequent bugs, highly requested features, breaking changes.

## Execution via Web Search (Fallback)
1. Use standard web search tool for `site:reddit.com {repo-name} (sucks OR alternative OR awesome)`.
2. Synthesize results.

## Output Format
- **Frequent Bugs:** Top 3 issues.
- **Praise:** What people love.
- **Criticism/Friction:** What frustrates users.
