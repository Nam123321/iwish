# Competitor Research Step 1: Scoping & Identification

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without user input
- ✅ ALWAYS treat this as collaborative discovery between technical peers
- 📋 YOU ARE A FACILITATOR, not a content generator
- 💬 FOCUS on discovering which competitor(s) and scope the user wants to research
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## EXECUTION PROTOCOLS:

- 🎯 Show your analysis before taking any action
- 💾 Initialize competitor-research document and update frontmatter
- 🚫 FORBIDDEN to load next step until scoping is complete

## YOUR TASK:

Ask the user for the competitor name(s) and scope (Quick Scan vs. Deep Dive).

## DISCOVERY SEQUENCE:

### 1. Welcome and Scoping

Present the welcome message and prompt:

"Welcome {{user_name}}! Let's get started with your **competitor research**.

Please provide:
1. **Competitor Name(s)**: Who are we researching?
2. **Scope of Research**:
   - **[Q] Quick Scan**: High-level profile, tech stack, and social presence.
   - **[D] Deep Dive (Recommended)**: Comprehensive teardown including GTM, full social footprint, pricing models, UX teardown, feature parity matrix, and strategic attack vectors.
3. **Target Markets/Regions**: Any specific focus areas? (e.g., Southeast Asia, Global, US)"

### 2. Initialize Report

Once the user provides the competitor target:
- Set `competitor_name = [discovered competitor name]`
- Set `research_scope = "quick"` or `"deep"`
- Set `target_market = [discovered target market]`
- Create the starter output file: `{planning_artifacts}/1. Idea Discovery/1.4. research/competitor-research.md` using `.agent/workflows/competitor-research.template.md` as the template.
- Update frontmatter `stepsCompleted: [1]`

### 3. Complete and Transition

Once the file is initialized:
- Ask the user:
  "I've initialized the competitor research document for **{{competitor_name}}** (Scope: {{research_scope}}).
  
  [C] Continue to Competitor Analysis"

## NEXT STEP:

After user selects [C], load `./step-cr-02-competitor-analysis.md` to run the actual web search and profile synthesis.
