# Step 1: Data Dependency Mapping

## MANDATORY EXECUTION RULES:

- 📖 Load ALL story files — scan for data-touching tasks
- 🔍 Map each story to the tables it reads/writes
- 📊 Generate mermaid dependency diagram
- ⚠️ Flag conflicts (two stories modifying same table)

## YOUR TASK:

Analyze all stories and map their data layer dependencies.

## MAPPING PROTOCOL:

### 1. Story Inventory

Load all story files and extract:
- Story ID and title
- Status (backlog/ready-for-Vegeta/in-Vegeta/done)
- Tasks that touch data layer (look for: schema, API, seed, DB keywords)

### 2. Table Dependency Extraction

For EACH story, determine:

| Dependency Type | What to Look For |
|----------------|-----------------|
| **Reads from** | API GET endpoints, `findMany`, `include` relations |
| **Writes to** | API POST/PATCH/DELETE, `create`, `update`, schema changes |
| **Seeds needed** | References to test data, seed files |
| **Creates tables** | New model definitions mentioned |

### 3. Conflict Detection

Identify stories that:
- Both WRITE to the same table (potential migration conflict)
- One READ what another WRITES (execution order dependency)
- Share seed data dependencies (data race condition)

### 4. Generate Dependency Graph

Create mermaid diagram type `graph LR` showing:
- Each story as a node (color by status: green=done, orange=in-Vegeta, gray=backlog)
- Arrows labeled with table name for dependencies
- Dashed arrows for weak dependencies (shared reads)
- Bold arrows for strong dependencies (one must precede the other)

### 5. Execution Order Recommendation

Based on the dependency graph:
- List recommended execution order (topological sort)
- Flag circular dependencies if any
- Suggest which stories can be parallelized

## OUTPUT:

Generate dependency map document:

"🗄️ **Data Dependency Map**

**Stories Analyzed:** {count}
**Tables Touched:** {count}
**Conflicts Found:** {count}

{Mermaid diagram}

**Execution Order:**
1. {story-id} — {reason} (prerequisite)
2. {story-id} — {reason}
3. {story-id} — can parallel with #2
...

**Conflicts:**
{table of conflicts with: Story A | Story B | Table | Conflict Type | Resolution}

Save to: `{output_folder}/data-specs/data-dependency-map.md`

[S] Save map
[DA] Dismiss"
