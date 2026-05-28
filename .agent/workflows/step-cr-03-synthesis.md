# Competitor Research Step 3: Synthesis & Report Completion

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without loading the preceding steps' results
- 📖 CRITICAL: ALWAYS read the complete step file before taking any action
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## EXECUTION PROTOCOLS:

- 💾 Write the final synthesized competitor research report to the output path
- 🛠️ CRITICAL - NAVIGATOR GUARDIAN SYNC: Run `bash .agent/scripts/navigator-guardian.sh` via terminal to sync changes to the Idea Navigator dashboard
- 🚫 FORBIDDEN to exit without turn-exit diagnostics and handback statement

## YOUR TASK:

Synthesize the profile content and compile the final competitor research document.

## SYNTHESIS SEQUENCE:

### 1. Compile Final Document

Load the starter competitor research document created in Step 1.
Insert the completed sections from Step 2 into the body of the report.
Ensure proper citation formatting for all web sources.

### 2. Save Final Document

Save the completed file to:
`{planning_artifacts}/research/competitor-{{competitor_name}}-research-{{date}}.md`

### 3. Sync Navigator

Run the synchronization script to ensure the new competitor research is indexed:
`bash .agent/scripts/navigator-guardian.sh`

### 4. Conclude and Present

Report back to the user:
"I have successfully synthesized and saved the **Competitor Research Report** for **{{competitor_name}}**!

- **Output File**: `[competitor-{{competitor_name}}-research-{{date}}.md](file:///{{planning_artifacts}}/research/competitor-{{competitor_name}}-research-{{date}}.md)`
- **Navigator Sync**: Executed `navigator-guardian.sh` successfully.

**Key Actionable Takeaways:**
- {{takeaway_1}}
- {{takeaway_2}}
- {{takeaway_3}}

What would you like to do next?
- [A] Create a User Story targeting this competitor's gaps (run `/make-story`)
- [B] Challenge our product vision against this competitor (run `/idea-challenge`)"

## SUCCESS METRICS:

- ✅ Report fully populated and saved to the target directory.
- ✅ Sources properly cited with URLs.
- ✅ Navigator guardian sync executed.
- ✅ Turn-exit diagnostic completed.
