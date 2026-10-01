---
name: 'generate-data-factory'
description: 'Generate deterministic Fishery data factories from DB Schema and API Logic for FE/BE testing.'
---

# Generate Data Factory Workflow

## Purpose
Automate the generation of Fishery factories for deterministic mock data to be used by both Frontend MSW and Backend DB Seeders.

## Execution Steps

<agent-instruction>
You must follow these steps precisely to guarantee Zero-Trust compliance.

### Step 1: Context Ingestion (AST Extraction)
1. Read the target model name from the user input.
2. Use AST parsers (or precise `grep_search`) to extract the exact schema block from `schema.prisma` corresponding to the model. Do not dump the entire 10k line file into context.
3. Identify related tables (Foreign Keys) and extract their blocks.
4. Scan tRPC routers / API controllers to extract business validation rules (Zod schemas) associated with this model.

### Step 2: Factory Forging (AI Generation)
1. Generate the TypeScript code for the Fishery factory using `faker.js` to populate data.
2. **Determinism**: You MUST use `faker.seed(123)` at the top of the file.
3. **Relations**: You MUST implement relational linking using Fishery `associations` (e.g., `associations.userId || userFactory.build().id`).
4. **Inheritance**: You MUST define `traits` for distinct business states found in the tRPC logic (e.g., `.trait('active')`).
5. **Safe Resolution**: Use lazy evaluation `() => ({ ... })` to prevent Circular Dependency crashes.
6. **Output Format**: The generated code must be strictly wrapped inside a ````typescript ... ```` markdown block.

### Step 3: Fail-Safe Validation Loop
1. Extract the generated TypeScript code and write it to `packages/shared/src/factories/[model].factory.ts`.
2. Run the validation script:
   `python3 .agent/scripts/validate-data-factory.py packages/shared/src/factories/[model].factory.ts`
3. If the script exits with code 1 (Fail), read the stdout/stderr, correct the TypeScript code based on the DB constraints (e.g., PostgreSQL Enum violations), and retry Step 3. (Max 3 iterations).
4. If it passes (Exit code 0), proceed to Step 4.

### Step 4: Publish with Safety Locks
1. **Concurrency Lock**: Create a `.lock` file in `packages/shared/src/factories/` before the final write.
2. Write the validated factory code to the target file.
3. Remove the `.lock` file.
4. Notify the user that the factory is ready for consumption by MSW and Backend seeders.
</agent-instruction>
