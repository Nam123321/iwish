# Step 1: Data Spec Initialization

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate the data spec without loading all required inputs first
- 📖 CRITICAL: Load the FULL SKILL file from `{skill_path}` — this contains all validation rules
- ✅ ALWAYS load the complete Prisma schema — partial understanding leads to missed gaps
- 💬 ASK the user for the story file path if not provided

## YOUR TASK:

Initialize the data spec workflow by loading all required inputs and discovering the story context.

## INITIALIZATION SEQUENCE:

### 1. Load the Data Integrity Guardian SKILL

Read fully: `{project-root}/.agent/skills/data-integrity-guardian/SKILL.md`
This SKILL contains all naming conventions, required columns, financial rules, and validation checklists that MUST be applied.

### 2. Load the Prisma Schema

Read fully: `{project-root}/distro/prisma/schema.prisma`
Extract:
- All model names and their columns
- All enums
- All indexes and unique constraints
- All relationships (FK references)

### 3. Get the Story File

If user provided a story path, load it. Otherwise ask:
"Which story file should Kira create a data spec for? Please provide the path or story ID (e.g., 2-8b)"

Then discover the story file using smart search:
- `{output_folder}/implementation-artifacts/{story-id}*.md`
- `{output_folder}/stories/{story-id}*.md`

### 4. Load Cross-Reference Documents (Optional)

Try to discover:
- Architecture doc: `{output_folder}/*architecture*.md`
- PRD: `{output_folder}/*prd*.md`
- Existing data specs: `{output_folder}/data-specs/*.md`
- Existing seed files: `{project-root}/distro/prisma/seeds/*.ts`

### 5. Report and Continue

Report to user:
"🗄️ Kira has loaded:
- ✅ SKILL: Data Integrity Guardian v1.1
- ✅ Schema: {model_count} models, {enum_count} enums
- ✅ Story: {story_name}
- {optional docs status}

[C] Continue to data analysis"

## NEXT STEP:

After user selects [C], load `./step-02-analyze.md`.
