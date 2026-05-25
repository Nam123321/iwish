# I-Wish GitHub Launch Plan

## Goal

Package I-Wish as a public-facing GitHub project and npm CLI without breaking the current local runtime model.

## Current Snapshot

As of the current packaging pass:

- public repo direction is locked to **Option A**
- CLI/package name is `iwish`
- compatibility alias `bmad-db` is still present for migration safety
- install no longer silently defaults to a named terminal host
- current supported install targets are:
  - `claude-code`
  - `local-terminal`
  - `cursor`
  - `windsurf`
  - `opencode`
  - `google antigravity`
  - `openai`
- latest allowlist slimming pass reduced the publish surface materially, but the package still needs explicit review before publish

## Recommended Launch Shape

### Option A: New clean public repo

Recommended default.

- create a new GitHub repo named `iwish`
- publish only the I-Wish surface
- keep BMAD-DragonBall legacy history in the current private/internal repo if needed

Why:

- public branding becomes clean immediately
- avoids confusing repo history and old DragonBall persona framing
- easier to position the project around the current canonical model

### Option B: Rename current repo and clean in place

Use only if preserving current git history in the public repo matters more than presentation clarity.

Risks:

- public readers will still encounter older BMAD/DragonBall assets in history and file paths
- cleanup scope is larger
- launch messaging becomes harder

## Pre-Launch Packaging Checklist

### 1. CLI/package correctness

- `package.json` uses `iwish`
- runtime dependencies are in `dependencies`, not `devDependencies`
- `files` is set for npm publish
- `README.md` reflects I-Wish branding
- `LICENSE` exists
- `prepare` does not fail outside a writable git repo
- `npm pack --dry-run` is reviewed
- `iwish list-install-targets` reflects the public support matrix

### 2. Public surface cleanup

- review public-facing docs for stale `BMAD-DragonBall` language
- review top-level docs for accidental internal references
- confirm legacy aliases remain supported but are documented as compatibility only
- decide whether to keep all legacy persona/workflow files in the public package or trim some from distribution later
- ensure obviously internal assets are excluded from npm publish:
  - `.agent/evolution-lab`
  - `.agent/memory`
  - `.agent/learnings`
  - non-launch docs and ad hoc research scratch artifacts

### 3. Runtime validation

- `npm run build`
- fresh `iwish install`
- `iwish status`
- `iwish doctor`
- `iwish list-install-targets`
- `iwish route "..."` for representative flows
- smoke test at least:
  - `/idea-challenge`
  - `/research-solution-sources`
  - `/bootstrap-existing-project`
  - `/pivot-project`
- smoke test install targets:
  - `local-terminal`
  - `cursor`
  - `windsurf`
  - `opencode`
  - `google antigravity`
  - `openai`

### 4. Docs bundle

Minimum docs to highlight in launch:

- `docs/iwish-introduction.md`
- `docs/iwish-runtime-substrate.md`
- `docs/iwish-capability-system-framework.md`
- `docs/iwish-routing-profile-standard.md`
- `docs/iwish-brownfield-bootstrap.md`

## Recommended GitHub Publish Sequence

### Phase 1: Prep branch

- create a release-prep branch
- finish package correctness and README
- run build + packaging smoke tests
- capture `npm pack --dry-run` output
- record support matrix and known compatibility notes in release notes draft

### Phase 2: Public repo setup

- create GitHub repo
- push I-Wish branch
- configure:
  - description
  - topics
  - default branch
  - issue templates
  - discussion categories if wanted

Suggested topics:

- `ai-agents`
- `workflow-orchestration`
- `developer-tools`
- `cli`
- `product-delivery`
- `prompt-engineering`

### Phase 3: First GitHub release

- tag `v1.0.0` only after public README and docs are stable
- create release notes with:
  - what I-Wish is
  - install
  - install target matrix
  - core workflows
  - compatibility alias note
  - known limitations

### Phase 4: npm publish

- run final `npm pack --dry-run`
- publish `iwish`
- verify:
  - global install
  - `npx iwish`
  - legacy `bmad-db` alias still resolves

Until Phase 4 is complete, installation docs should point to the GitHub package spec:

```bash
npm install -g github:Nam123321/iwish
npx --yes github:Nam123321/iwish install
```

## Known Risks

### 1. Package size

Because I-Wish currently ships runtime assets from:

- `.agent/`
- `templates/`
- `docs/`

the npm package may be larger than a normal CLI.

Current dry-run snapshot after allowlist slimming:

- tarball size: about `800 kB`
- unpacked size: about `2.7 MB`
- total files: about `566`

Observation:

- the earlier `.npmignore`-only trim pass did **not** materially reduce the tarball
- switching to a curated `files` allowlist reduced package size and file count substantially
- the package is still asset-heavy because runtime behavior depends on `.agent/`, `templates/library`, `templates/iwish`, and compatibility-backed workflow assets

Short-term stance:

- acceptable for now

Later optimization:

- split runtime assets
- create a slimmer public dist package
- consider separating public runtime assets from internal/legacy compatibility assets
- consider replacing the broad `files` surface with a curated publish bundle or prepublish staging directory

### 2. Legacy surface noise

The package still includes legacy compatibility surfaces.

Short-term stance:

- keep them for migration safety

Later cleanup:

- trim or isolate legacy assets into a compatibility layer
- de-legacy canonical execution flows such as `/make-story`, `/code`, `/review`, `/plan`, `/make-ui-spec`

### 3. Public docs inconsistency

Some docs still contain BMAD/DragonBall historical language.

Action:

- treat docs cleanup as an explicit pre-launch review item

### 4. Hybrid execution contracts

Some canonical workflows still route through legacy BMAD wrappers.

Short-term stance:

- acceptable for launch if documented as compatibility-backed execution

Later cleanup:

- replace thin wrapper canonical workflows with native I-Wish step-based execution

## Suggested Next Stories / Tasks

1. `Package polish and npm dry-run validation`
2. `Public docs cleanup for I-Wish branding`
3. `GitHub repo bootstrap and release templates`
4. `npm publish rehearsal`
5. `De-legacy canonical workflow execution`

## Definition of Ready for GitHub Launch

I-Wish is ready to push publicly when:

- package builds cleanly
- packaging smoke tests pass
- README and top-level docs present I-Wish, not BMAD-DragonBall
- support matrix is accurate in CLI and docs
- launch repo decision is made
- first release notes draft exists
