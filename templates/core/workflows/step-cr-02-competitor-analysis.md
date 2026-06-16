# Competitor Research Step 2: Deep Profile Gathering & Analysis

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without web search verification
- 📖 CRITICAL: ALWAYS read the complete step file before taking any action
- 🔍 WEB SEARCH REQUIRED - verify current facts against live sources
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## EXECUTION PROTOCOLS:

- 🎯 Show web search queries and search results analysis before presenting findings
- 🚫 FORBIDDEN to complete this step until competitor profile sections are populated
- 💾 Save progress sequentially to avoid context overload

## YOUR TASK:

Search the web to compile a comprehensive profile of `{{competitor_name}}` based on the chosen scope (`{{research_scope}}`).

## SEARCH AND SYNTHESIS SEQUENCE:

### 1. Perform Web Searches

Based on the scope, execute targeted searches:
- "Tech stack of {{competitor_name}}" OR "BuiltWith {{competitor_name}}"
- "{{competitor_name}} pricing tiers packages"
- "{{competitor_name}} customer reviews G2 Capterra Trustpilot"
- "{{competitor_name}} GTM strategy marketing"
- "{{competitor_name}} social media X LinkedIn Discord Reddit"
- "{{competitor_name}} active users traffic hiring trends"

### 2. Generate Content Sections

Prepare the competitor profile content. Format the sections using the markdown templates below:

```markdown
## Competitor Profile: {{competitor_name}}

### 1. History & Identity
- **Established**: [Year, founders, headquarters]
- **Market Valuation/Funding**: [If public/disclosed]
- **Target Customer Segment**: [B2B, B2C, SMBs, Enterprises, etc.]
- **Geographic/Target Market**: [Global, regional focus]

### 2. Product Flavor & Famous Features
- **Core Value Proposition**: [Main hook]
- **Famous Key Features**:
  - [Feature 1]: [Description]
  - [Feature 2]: [Description]

### 3. Tech Stack
- **Frontend/Backend**: [Languages, frameworks used]
- **Cloud Infrastructure & Tools**: [Hosting, databases, analytics]
- **Third-Party Integrations**: [Common APIs, plugins]

### 4. Marketing, Channels & Social Presence
- **Go-to-Market (GTM) Strategy**: [PLG, sales-led, inbound, community]
- **Primary Marketing Channels**: [SEO, Paid Ads, Events, Social]
- **Social Media Presence**:
  - **Facebook**: [Handle, engagement level]
  - **X (Twitter)**: [Handle, follower count, activity]
  - **LinkedIn**: [Handle, employee count, postings]
  - **Instagram/TikTok/Threads**: [Presence, style]
  - **Reddit/Discord (Niche)**: [Community size, moderator activity]
```

#### Additional Sections for Deep Dive (`research_scope == "deep"`):

```markdown
### 5. Product Traction & Health Indicators
- **Estimated Web Traffic**: [Monthly visits, traffic trends]
- **User Growth/Engagement**: [App store rankings, active users]
- **Hiring Trends**: [Roles open, company growth indicators]

### 6. Pricing & Monetization Model
- **Monetization Strategy**: [SaaS, usage-based, freemium]
- **Pricing Tiers**:
  - [Tier 1 Name]: [Price] - [Key features]
  - [Tier 2 Name]: [Price] - [Key features]
- **Sales Motion**: [Self-serve checkout vs Enterprise sales]

### 7. UX Teardown & Customer Sentiment
- **Onboarding Experience**: [Self-serve onboarding, friction points]
- **Customer Complaints (Pain Points)**: [Common complaints from G2/Trustpilot]
- **Loved Features (Appreciations)**: [What users praise most]

### 8. Feature Parity & GAP Matrix
| Feature Category | {{competitor_name}} Offering | Our Current Offering | GAP / Opportunity |
|---|---|---|---|
| [Category 1] | [Competitor feature] | [Our feature] | [Gap description] |
| [Category 2] | [Competitor feature] | [Our feature] | [Gap description] |

### 9. Strategic Attack Vectors & Counter-Measures
- **Vulnerabilities to Exploit**: [Where competitor is weak]
- **Positioning Counter-Strategy**: [How we should present our product as a superior alternative]
- **Product Enhancements Proposed**: [Actionable features to close the GAP]
```

### 3. Present Results & Complete Selection

Show a summary of findings to the user and prompt:
"I've completed the competitive profiling for **{{competitor_name}}**.

Ready to generate the final synthesized report?
[C] Continue to report synthesis"

## NEXT STEP:

After user selects [C], load `./step-cr-03-synthesis.md` to format the report, finalize the document, and run the Idea Navigator sync.
