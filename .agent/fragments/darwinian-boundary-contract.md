# Darwinian Boundary Contract

## 1. Objective
This fragment defines the strict compliance, execution, and UX boundaries for utilizing the Darwinian Evolver engine within the I-Wish Evolution Lab. This contract serves as the source of truth for downstream trial runners (e.g., HSEA-3.2) when enforcing execution paths and scorecard generation.

## 2. Execution Boundary

### 2.1 CLI / Subprocess Adapter Requirement
**I-Wish MUST invoke the Darwinian Evolver via a strict shell subprocess command.** 
- **FORBIDDEN:** Direct inline importing, copying, or linking of any AGPL source code into the I-Wish repository.
- **FORBIDDEN:** Managing a persistent local REST background daemon for Darwinian Evolver within the I-Wish runtime.
- **Data Exchange:** All communication across this boundary MUST occur via serialized JSON payloads or directory paths containing the `current_state` and task definitions.
- **Result Parsing:** I-Wish agents must capture execution results by reading the standard output (`stdout`/`stderr`) and parsing the resulting output files from the sandboxed environment. Execution success MUST be determined by checking for a `0` exit code, not just the presence of output.

## 3. Installation Prompt & UX Logic

### 3.1 Missing Dependency Detection
When a user explicitly enables the Evolution Lab dual-run scope, the downstream runner MUST verify the presence of the `darwinian` CLI tool.
- **Verification Mechanism:** The runner MUST use `npx --no-install darwinian --version` or an equivalent local dependency check before assuming it is missing.

If the dependency is **missing**, the runner MUST halt the automated execution and present the user with an interactive prompt.

### 3.2 Interactive Prompt Options
The prompt MUST provide the following options to the user:
1. **Manual Installation:** Provide the exact npm command (e.g., `npm install -D darwinian-evolver` to pin as a devDependency) and a reference link to the documentation.
2. **Auto-Install:** Ask: *"Do you want the agent to auto-install it as a devDependency for you?"* (Must NOT install globally without explicit user consent).
3. **Opt-Out (Clean Bypass):** Ask: *"Do you want to skip the Darwinian external reference and run Native only?"*

## 4. Scorecard Branching Rules

### 4.1 Clean Bypass Condition
If the user selects the **Opt-Out** option during the installation prompt (choosing to run Native only):
- The trial proceeds strictly with internal I-Wish skills.
- **Scorecard Rule:** The final generated scorecard MUST NOT display a "Darwinian failed/missing" warning. It must cleanly reflect an asymmetrical trial (Native only) without penalizing the result for missing the Darwinian branch.

### 4.2 Runtime Error Warning Condition
If the user **Opted-In** (or the tool was already installed) but the Darwinian subprocess fails to execute:
- **Failure Definition:** A failure is defined strictly as a non-zero exit code or an unhandled exception in the subprocess, NOT merely an empty output (which may be a valid "no-op" evolution).
- The trial recovers gracefully and proceeds with Native skills only.
- **Scorecard Rule:** The final generated scorecard MUST display a prominent warning indicating a Darwinian execution failure, explicitly logging the fallback behavior and the exit code/stderr.
