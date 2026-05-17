# I-Wish Graph Backend Options

Generated: 2026-05-16

## Why this matters

I-Wish uses graph-backed context for more than one surface:

- `codebasegraph`
- `featuregraph`
- `knowledgegraph`
- `skillgraph`
- `memorygraph`

These are not all the same shape of data.

In practice, there are two big graph-format pressures:

1. **Code / feature dependency graphs**
   - dense structural traversal
   - path queries
   - impact analysis
   - implementation reasoning

2. **Knowledge / skill / memory graphs**
   - semantic relationships
   - capability routing
   - human-governed context
   - optionally vector-assisted retrieval

Because of that, graph backend choice should be explicit from the start of a project.

## Recommended default

### `falkordb-full`

Recommended when:

- you want the current strongest default for codebase + feature graph work
- you are willing to prepare a graph database from the beginning
- Orch and code intelligence depth matter

Current I-Wish default stance:

- `codebasegraph` → `falkordb-full`
- `featuregraph` → `falkordb-full`
- `knowledgegraph` / `skillgraph` / `memorygraph` can still degrade to lighter surfaces if needed

## Additional researched options

### Option 1: `neo4j`

Good fit when:

- you want a mature property graph platform
- you want native vector indexes
- you want multiple databases managed in one DBMS
- you are comfortable with a heavier operational footprint

Potential I-Wish fit:

- one DBMS
- separate databases or logical partitions for:
  - codebasegraph
  - featuregraph
  - knowledgegraph / skillgraph / memorygraph

Tradeoffs:

- stronger enterprise/maturity story
- heavier setup than lightweight options
- more operational overhead than `lite-static`

### Option 2: `memgraph`

Good fit when:

- you want native graph + vector search in one engine
- you care about fast traversal and hybrid retrieval
- you want a strong option for graph-backed AI workloads

Potential I-Wish fit:

- use Memgraph as the unified graph engine
- or combine it with an existing vector store if needed

Tradeoffs:

- multi-tenant story exists, but operational choices may differ by edition and deployment style
- still needs explicit usage-pack and graph-ops patterns to become a first-class Orch surface

## Lightweight fallback

### `lite-static`

Good fit when:

- the team does not want to run a graph database yet
- graph evidence is helpful but not mission-critical
- the project is small or early-stage

Tradeoff:

- easier setup
- weaker graph reasoning depth
- less powerful for codegraph / featuregraph / memorygraph workflows

## Custom option

### `custom-adapter`

Good fit when:

- the team already has an internal graph backend
- they want to integrate a proprietary solution
- they are willing to build the corresponding usage pack

## Tool selection rule

When the project starts, I-Wish should ask the user to choose a graph backend early.

Why early:

- graph is part of the “brain” of Orch
- it affects routing quality
- it affects code intelligence depth
- it affects feature / knowledge / skill / memory surfaces

## Suggested user-facing options

1. `falkordb-full` (Recommended)
2. `neo4j`
3. `memgraph`
4. `lite-static`
5. `custom-adapter`

## Current design rule

If the user has not selected a graph backend yet:

- I-Wish should not silently assume the graph setup is complete
- it should surface the question early
- it should explain the default and the alternatives
