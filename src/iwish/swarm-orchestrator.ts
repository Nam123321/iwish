/**
 * swarm-orchestrator.ts — Parallel Sub-Agent Spawning Engine
 *
 * Story 10.3: Core engine that spawns and manages the lifecycle of multiple
 * sub-agents running in parallel on isolated workspaces, with correct persona
 * injection, workflow binding, write-locking, and automatic dependency unblocking.
 *
 * Depends on:
 *   - Story 10.1 (dependency-mapper.ts) — DAG with execution waves
 *   - Story 10.2 (interface-lock.ts) — Write-lock enforcement
 *   - Story 10.5 (compliance-protocol.ts) — Persona & workflow binding
 *
 * @module swarm-orchestrator
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { getCompressedContextURIs } from './graph-db';
import { formatOKFUri } from './okf-helper';

// Re-use types from dependency-mapper
import type { DAGResult, DAGNode } from './dependency-mapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Execution status of a story within the swarm */
export type SwarmStoryStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'TIMEOUT'
  | 'INTEGRATION-PASSED';

/** Platform capability for sub-agent parallelism */
export type PlatformCapability = 'PARALLEL' | 'SEQUENTIAL_FALLBACK';

/** A single entry in the Swarm State Board */
export interface SwarmStateEntry {
  storyId: string;
  storyTitle: string;
  agentConversationId: string | null;
  status: SwarmStoryStatus;
  wave: number;
  startTime: string | null;
  endTime: string | null;
  assignedAgent: string;
  workspaceBranch: string | null;
  errorMessage: string | null;
}

/** The complete Swarm State Board */
export interface SwarmStateBoard {
  epicId: string;
  platform: PlatformCapability;
  startedAt: string;
  lastUpdated: string;
  currentWave: number;
  totalWaves: number;
  stories: SwarmStateEntry[];
  summary: SwarmSummary;
}

/** Summary statistics */
export interface SwarmSummary {
  total: number;
  pending: number;
  running: number;
  passed: number;
  failed: number;
  blocked: number;
  timedOut: number;
}

/** Configuration for spawning a sub-agent */
export interface SubAgentSpawnConfig {
  storyId: string;
  storyTitle: string;
  typeName: string;
  role: string;
  prompt: string;
  workspace: 'branch' | 'share' | 'inherit';
  wave: number;
  timeoutMs: number;
}

/** Result from a sub-agent invocation */
export interface SubAgentResult {
  storyId: string;
  conversationId: string;
  status: 'PASS' | 'FAIL' | 'TIMEOUT';
  duration: number;
  tokens?: number;
  output?: string;
  error?: string;
}

/** Options for the Swarm Orchestrator */
export interface SwarmOrchestratorOptions {
  projectRoot?: string;
  dagJsonPath?: string;
  /** Max time per story in milliseconds (default: 30 min) */
  storyTimeoutMs?: number;
  /** Force sequential execution even on parallel-capable platforms */
  forceSequential?: boolean;
  /** Skip actual sub-agent invocation (dry run) */
  dryRun?: boolean;
  /** Custom output directory */
  outputDir?: string;
}

/** Callback interface for integrating with actual sub-agent APIs */
export interface SubAgentAPI {
  /** Invoke a sub-agent (platform-specific) */
  invokeSubagent: (config: SubAgentSpawnConfig) => Promise<SubAgentResult>;
  /** Check if platform supports parallel sub-agents */
  supportsParallel: () => boolean;
  /** Send message to a running sub-agent */
  sendMessage?: (conversationId: string, message: string) => Promise<void>;
  /** Kill a running sub-agent */
  killSubagent?: (conversationId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const STATUS_FILE_PREFIX = 'swarm-status-epic-';
const STATUS_PENDING: SwarmStoryStatus = 'PENDING';


// ---------------------------------------------------------------------------
// Task 5: SwarmStateBoard — State Tracking (AC5)
// ---------------------------------------------------------------------------

/**
 * Manages the state board for tracking all sub-agent stories within a swarm.
 * Persists state to `_iwish-output/swarm-status-epic-{N}.json`.
 */
export class SwarmStateBoardManager {
  private state: SwarmStateBoard;
  private readonly outputPath: string;

  constructor(
    epicId: string,
    dag: DAGResult,
    platform: PlatformCapability,
    projectRoot: string,
    outputDir?: string,
  ) {
    const baseDir = outputDir || path.join(projectRoot, '_iwish-output');
    fs.ensureDirSync(baseDir);
    this.outputPath = path.join(baseDir, `${STATUS_FILE_PREFIX}${epicId}.json`);

    // Initialize state from DAG
    const stories: SwarmStateEntry[] = [];

    for (let waveIdx = 0; waveIdx < dag.execution_waves.length; waveIdx++) {
      const wave = dag.execution_waves[waveIdx];
      for (const storyId of wave) {
        const node = dag.nodes.find((n) => n.id === storyId);
        stories.push({
          storyId,
          storyTitle: node?.title || storyId,
          agentConversationId: null,
          status: STATUS_PENDING,
          wave: waveIdx + 1,
          startTime: null,
          endTime: null,
          assignedAgent: resolveAgentName(storyId),
          workspaceBranch: null,
          errorMessage: null,
        });
      }
    }

    this.state = {
      epicId,
      platform,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      currentWave: 1,
      totalWaves: dag.execution_waves.length,
      stories,
      summary: this.computeSummary(stories),
    };

    this.persist();
  }

  /** Get the current state board */
  getState(): SwarmStateBoard {
    return { ...this.state };
  }

  /** Get a specific story entry */
  getStory(storyId: string): SwarmStateEntry | undefined {
    return this.state.stories.find((s) => s.storyId === storyId);
  }

  /** Get all stories in a specific wave */
  getWaveStories(wave: number): SwarmStateEntry[] {
    return this.state.stories.filter((s) => s.wave === wave);
  }

  /** Get all stories ready to run (PENDING with all deps satisfied) */
  getReadyStories(dag: DAGResult): SwarmStateEntry[] {
    return this.state.stories.filter((entry) => {
      if (entry.status !== 'PENDING') return false;

      // Find the DAG node and check if all dependencies are PASS
      const node = dag.nodes.find((n) => n.id === entry.storyId);
      if (!node) return false;

      // A story is ready if all its depends_on are PASS
      return node.depends_on.every((depId) => {
        const depEntry = this.state.stories.find((s) => s.storyId === depId);
        return depEntry?.status === 'PASS' || depEntry?.status === 'INTEGRATION-PASSED';
      });
    });
  }

  /**
   * Mark a story as RUNNING with its assigned agent.
   */
  markRunning(storyId: string, conversationId: string, branch?: string): void {
    const entry = this.state.stories.find((s) => s.storyId === storyId);
    if (entry) {
      entry.status = 'RUNNING';
      entry.agentConversationId = conversationId;
      entry.startTime = new Date().toISOString();
      entry.workspaceBranch = branch || `story-${storyId.replace('story-', '')}`;
      this.updateAndPersist();
    }
  }

  /**
   * Mark a story as completed (PASS or FAIL).
   */
  markCompleted(storyId: string, status: 'PASS' | 'FAIL' | 'TIMEOUT', error?: string): void {
    const entry = this.state.stories.find((s) => s.storyId === storyId);
    if (entry) {
      entry.status = status;
      entry.endTime = new Date().toISOString();
      if (error) entry.errorMessage = error;
      this.updateAndPersist();
    }
  }

  /**
   * Mark a story as BLOCKED (dependency failed).
   */
  markBlocked(storyId: string, reason: string): void {
    const entry = this.state.stories.find((s) => s.storyId === storyId);
    if (entry) {
      entry.status = 'BLOCKED';
      entry.errorMessage = reason;
      this.updateAndPersist();
    }
  }

  /**
   * Mark all stories as INTEGRATION-PASSED after successful merge.
   */
  markAllIntegrationPassed(): void {
    for (const entry of this.state.stories) {
      if (entry.status === 'PASS') {
        entry.status = 'INTEGRATION-PASSED';
      }
    }
    this.updateAndPersist();
  }

  /**
   * Advance to the next wave.
   */
  advanceWave(): void {
    if (this.state.currentWave < this.state.totalWaves) {
      this.state.currentWave++;
      this.updateAndPersist();
    }
  }

  /**
   * Check if all stories are complete (PASS, FAIL, BLOCKED, or TIMEOUT).
   */
  isComplete(): boolean {
    return this.state.stories.every(
      (s) => ['PASS', 'FAIL', 'BLOCKED', 'TIMEOUT', 'INTEGRATION-PASSED'].includes(s.status),
    );
  }

  /**
   * Check if all stories passed.
   */
  isAllPassed(): boolean {
    return this.state.stories.every(
      (s) => s.status === 'PASS' || s.status === 'INTEGRATION-PASSED',
    );
  }

  private computeSummary(stories: SwarmStateEntry[]): SwarmSummary {
    return {
      total: stories.length,
      pending: stories.filter((s) => s.status === 'PENDING').length,
      running: stories.filter((s) => s.status === 'RUNNING').length,
      passed: stories.filter((s) => s.status === 'PASS' || s.status === 'INTEGRATION-PASSED').length,
      failed: stories.filter((s) => s.status === 'FAIL').length,
      blocked: stories.filter((s) => s.status === 'BLOCKED').length,
      timedOut: stories.filter((s) => s.status === 'TIMEOUT').length,
    };
  }

  private updateAndPersist(): void {
    this.state.lastUpdated = new Date().toISOString();
    this.state.summary = this.computeSummary(this.state.stories);
    this.persist();
  }

  private persist(): void {
    fs.writeJsonSync(this.outputPath, this.state, { spaces: 2 });
  }
}

/**
 * Helper to recursively find a DESIGN.md file in the workspace
 */
function findDesignMdRecursive(dir: string, depth = 0): string | null {
  if (depth > 4) return null;
  if (!fs.existsSync(dir)) return null;
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const found = findDesignMdRecursive(fullPath, depth + 1);
        if (found) return found;
      } else if (entry.toLowerCase() === 'design.md') {
        return fullPath;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Extracts design token snippet from a DESIGN.md file
 */
function getDesignTokensSnippet(designMdPath: string): string {
  try {
    const content = fs.readFileSync(designMdPath, 'utf8');
    const colorSectionMatch = content.match(/## 🎨[\s\S]*?(?:##|$)/i);
    if (colorSectionMatch) {
      return colorSectionMatch[0].trim();
    }
    return content.substring(0, 2000).trim();
  } catch (e) {
    return 'Could not read Design System tokens.';
  }
}

// ---------------------------------------------------------------------------
// Task 2: buildSubagentPrompt — Persona & Workflow Injection (AC2)
// ---------------------------------------------------------------------------

/**
 * Builds a compliant sub-agent prompt with persona injection and workflow binding.
 * Delegates to the Compliance Protocol (Story 10.5) patterns.
 *
 * @param storyId - The story ID (e.g., "story-10.1")
 * @param epicId - The epic ID
 * @param projectRoot - Project root path
 * @returns The constructed prompt for the sub-agent
 */
export async function buildSubagentPrompt(
  storyId: string,
  epicId: string,
  projectRoot: string,
): Promise<SubAgentSpawnConfig> {
  const storyNum = storyId.replace('story-', '');
  const storyPath = path.join(projectRoot, '_iwish-output', 'stories', `story-${storyNum}.md`);

  // Read story content
  let storyContent = '';
  let storyTitle = storyId;
  if (fs.existsSync(storyPath)) {
    storyContent = fs.readFileSync(storyPath, 'utf8');
    const titleMatch = storyContent.match(/^#\s+(?:Story\s+[\d.]+:\s*)?(.+)$/m);
    if (titleMatch) storyTitle = titleMatch[1].trim();
  }

  // Read agent persona (dev-agent by default for implementation stories)
  const agentName = resolveAgentName(storyId);
  const personaPath = path.join(projectRoot, '.agent', 'agents', `${agentName}.md`);
  let personaContent = '';
  if (fs.existsSync(personaPath)) {
    personaContent = fs.readFileSync(personaPath, 'utf8');
  }

  // Find Design System constraints
  const designMdPath = findDesignMdRecursive(projectRoot);
  let designConstraintSection = '';
  if (designMdPath) {
    const relativeDesignPath = path.relative(projectRoot, designMdPath);
    const designSnippet = getDesignTokensSnippet(designMdPath);
    designConstraintSection = `
### Active Design System Constraints (MANDATORY)
You MUST strictly follow the design guidelines and color tokens defined in the project's Master Design System at: \`${relativeDesignPath}\`.
Using default I-Wish colors (such as Electric Violet \`#7C3AED\`) is strictly prohibited unless specifically permitted.
Here is the design system specification:

\`\`\`markdown
${designSnippet}
\`\`\`
`;
  }

  // Perform dynamic context compression using depth-2 graph traversal
  let contextSection = '';
  try {
    const storyUri = formatOKFUri(storyPath, projectRoot);
    const { getCompressedContextURIs } = await import('./graph-db');
    const adjacentUris = await getCompressedContextURIs(storyUri, projectRoot);
    if (adjacentUris && adjacentUris.length > 0) {
      contextSection = `\n### Dynamic Context Compression (Related Graph Nodes within Depth-2)\n`;
      for (const uri of adjacentUris) {
        if (uri.startsWith('file:///')) {
          let resolvedPath = decodeURIComponent(uri.replace('file://', ''));
          if (process.platform === 'win32' && resolvedPath.startsWith('/')) {
            resolvedPath = resolvedPath.substring(1);
          }
          if (fs.existsSync(resolvedPath)) {
            const fileContent = fs.readFileSync(resolvedPath, 'utf8');
            const relativePath = path.relative(projectRoot, resolvedPath);
            contextSection += `\n#### File: ${relativePath}\n\`\`\`markdown\n${fileContent.substring(0, 1500)}\n\`\`\`\n`;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn(`[Context Compression] Warning: Failed to load depth-2 context: ${err.message}`);
  }

  // Construct compliant prompt (follows Compliance Protocol patterns)
  const prompt = `## Mission: Implement Story ${storyNum} — ${storyTitle}

### Persona
${personaContent ? `You are operating as ${agentName}. Follow the persona defined below:\n${personaContent.substring(0, 500)}` : `You are operating as ${agentName}.`}

### Workflow Binding
You MUST follow the I-Wish development workflow:
1. Read the story spec at: \`${storyPath}\`
2. Execute /code workflow (iwish-feature-dev-story.md)
3. Run Socratic Review Gates (auto-resolve where possible)
4. Implement all tasks from the story spec
5. Verify compilation: \`npx tsc --noEmit\`
6. Self-review against all ACs
7. Generate QA Simulator Guardian Scorecard
${designConstraintSection}
${contextSection}

### Write-Lock Rules
- You may ONLY write to files in your assigned module scope
- Files in \`_iwish-output/interface-lock-epic-${epicId}/\` are READ-ONLY
- Check \`lock-manifest.json\` before writing to shared files

### Story Content
${storyContent.substring(0, 3000)}

### Report Back
Send a structured completion report with:
- Files created/modified
- Compilation result
- AC coverage matrix
- QA Scorecard (7 rows)
- Trust Score`;

  return {
    storyId,
    storyTitle,
    typeName: 'story_developer',
    role: `Story ${storyNum} Developer`,
    prompt,
    workspace: 'branch',
    wave: 0, // Will be set by spawnWave
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Resolves the appropriate agent name for a story based on its content/tags.
 */
function resolveAgentName(storyId: string): string {
  // Default to dev-agent for implementation stories
  // In a full implementation, this would read routing profiles
  return 'dev-agent';
}

// ---------------------------------------------------------------------------
// Task 3: validateWritePermission — Write-Lock Enforcement (AC3)
// ---------------------------------------------------------------------------

/**
 * Validates whether a sub-agent has permission to write to a specific file.
 * Checks against the lock-manifest and module partitioning.
 *
 * @param agentStoryId - The story ID of the requesting agent
 * @param filePath - The target file path (relative to project root)
 * @param epicId - The epic identifier
 * @param projectRoot - Project root path
 * @returns Object with allowed flag and reason
 */
export function validateWritePermission(
  agentStoryId: string,
  filePath: string,
  epicId: string,
  projectRoot: string,
): { allowed: boolean; reason: string } {
  // Import checkWriteLock from interface-lock dynamically to avoid circular deps
  const lockManifestPath = path.join(
    projectRoot, '_iwish-output',
    `interface-lock-epic-${epicId}`,
    'lock-manifest.json',
  );

  if (!fs.existsSync(lockManifestPath)) {
    return { allowed: true, reason: 'No lock manifest found — writes unrestricted.' };
  }

  let manifest: { files: Array<{ filePath: string }> };
  try {
    manifest = fs.readJsonSync(lockManifestPath);
  } catch {
    return { allowed: true, reason: 'Could not read lock manifest.' };
  }

  const normalizedTarget = filePath.replace(/\\/g, '/');

  // Check against locked files
  for (const entry of manifest.files) {
    const normalizedLocked = entry.filePath.replace(/\\/g, '/');
    if (normalizedTarget === normalizedLocked ||
        normalizedTarget.endsWith(normalizedLocked)) {
      return {
        allowed: false,
        reason: `Write BLOCKED: "${filePath}" is locked by Interface Lock Gate. ` +
                `Agent ${agentStoryId} cannot modify locked contracts.`,
      };
    }
  }

  // Check if writing inside lock directory
  const lockDir = `_iwish-output/interface-lock-epic-${epicId}/`;
  if (normalizedTarget.includes(lockDir)) {
    return {
      allowed: false,
      reason: `Write BLOCKED: "${filePath}" is inside the Interface Lock directory.`,
    };
  }

  return { allowed: true, reason: 'File is not locked.' };
}

// ---------------------------------------------------------------------------
// Task 4: onStoryComplete — Dependency Cascade & Error Recovery (AC4, AC7)
// ---------------------------------------------------------------------------

/**
 * Handles the completion of a story, updating the state board and
 * triggering dependency cascade for the next wave.
 *
 * - On PASS: Unblock dependent stories, check if next wave is ready
 * - On FAIL/TIMEOUT: Mark dependent stories as BLOCKED
 *
 * @param storyId - The completed story ID
 * @param result - The completion result
 * @param stateBoard - The swarm state board manager
 * @param dag - The DAG for dependency analysis
 * @returns Array of story IDs that are now ready to run
 */
export function onStoryComplete(
  storyId: string,
  result: SubAgentResult,
  stateBoard: SwarmStateBoardManager,
  dag: DAGResult,
): string[] {
  const newlyReady: string[] = [];

  if (result.status === 'PASS') {
    // Mark story as passed
    stateBoard.markCompleted(storyId, 'PASS');
    console.log(`✅ Story ${storyId} completed successfully.`);

    // Check if any dependent stories are now unblocked
    const readyStories = stateBoard.getReadyStories(dag);
    for (const entry of readyStories) {
      newlyReady.push(entry.storyId);
      console.log(`🔓 Story ${entry.storyId} unblocked — all dependencies satisfied.`);
    }
  } else {
    // Mark story as FAIL or TIMEOUT
    stateBoard.markCompleted(storyId, result.status, result.error);
    console.log(`❌ Story ${storyId} ${result.status}: ${result.error || 'Unknown error'}`);

    // AC7: Mark dependent stories as BLOCKED
    const dependents = findDependentStories(storyId, dag);
    for (const depId of dependents) {
      const depEntry = stateBoard.getStory(depId);
      if (depEntry && depEntry.status === 'PENDING') {
        stateBoard.markBlocked(
          depId,
          `Blocked: dependency ${storyId} ${result.status.toLowerCase()}.`,
        );
        console.log(`🚫 Story ${depId} BLOCKED — depends on failed ${storyId}.`);

        // Transitively block downstream dependents
        const transitiveDeps = findDependentStories(depId, dag);
        for (const transId of transitiveDeps) {
          const transEntry = stateBoard.getStory(transId);
          if (transEntry && transEntry.status === 'PENDING') {
            stateBoard.markBlocked(
              transId,
              `Transitively blocked: upstream dependency ${storyId} ${result.status.toLowerCase()}.`,
            );
          }
        }
      }
    }
  }

  // Check if current wave is complete
  const currentWave = stateBoard.getState().currentWave;
  const waveStories = stateBoard.getWaveStories(currentWave);
  const waveComplete = waveStories.every(
    (s) => ['PASS', 'FAIL', 'BLOCKED', 'TIMEOUT', 'INTEGRATION-PASSED'].includes(s.status),
  );

  if (waveComplete) {
    console.log(`📊 Wave ${currentWave} complete.`);
    stateBoard.advanceWave();
  }

  return newlyReady;
}

/**
 * Finds all stories that directly depend on the given story.
 */
function findDependentStories(storyId: string, dag: DAGResult): string[] {
  const dependents: string[] = [];
  for (const node of dag.nodes) {
    if (node.depends_on.includes(storyId)) {
      dependents.push(node.id);
    }
  }
  return dependents;
}

// ---------------------------------------------------------------------------
// Task 1: spawnWave — Parallel Sub-Agent Spawning (AC1)
// Task 6: Graceful Degrade (AC6)
// ---------------------------------------------------------------------------

/**
 * Spawns sub-agents for all stories in a wave. If the platform supports
 * parallel execution, spawns all at once. Otherwise, falls back to
 * sequential execution (AC6 graceful degrade).
 *
 * @param waveStories - Story IDs in this wave
 * @param epicId - The epic identifier
 * @param dag - The DAG result
 * @param stateBoard - The state board manager
 * @param api - Sub-agent API implementation
 * @param projectRoot - Project root path
 * @returns Array of sub-agent results
 */
export async function spawnWave(
  waveStories: string[],
  epicId: string,
  dag: DAGResult,
  stateBoard: SwarmStateBoardManager,
  api: SubAgentAPI,
  projectRoot: string,
): Promise<SubAgentResult[]> {
  const results: SubAgentResult[] = [];
  const waveNum = stateBoard.getState().currentWave;

  // Build spawn configs for each story
  const configs: SubAgentSpawnConfig[] = await Promise.all(
    waveStories.map(async (storyId) => {
      const config = await buildSubagentPrompt(storyId, epicId, projectRoot);
      config.wave = waveNum;
      return config;
    })
  );

  // AC6: Platform capability check
  const isParallel = api.supportsParallel();

  if (isParallel) {
    // Parallel execution — spawn all stories simultaneously
    console.log(`\n🚀 Wave ${waveNum}: Spawning ${configs.length} sub-agents in PARALLEL`);

    const promises = configs.map(async (config) => {
      stateBoard.markRunning(config.storyId, 'pending', config.storyId.replace('story-', 'branch-'));

      try {
        const result = await api.invokeSubagent(config);
        stateBoard.markRunning(config.storyId, result.conversationId);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          storyId: config.storyId,
          conversationId: 'error',
          status: 'FAIL' as const,
          duration: 0,
          error: errorMsg,
        };
      }
    });

    const waveResults = await Promise.allSettled(promises);
    for (const settled of waveResults) {
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      }
    }
  } else {
    // AC6: Sequential fallback — execute stories one at a time
    console.warn(`⚠️  Platform does not support parallel sub-agents.`);
    console.warn(`⚠️  Falling back to SEQUENTIAL execution (AC6 graceful degrade).`);
    console.log(`\n🔄 Wave ${waveNum}: Executing ${configs.length} stories SEQUENTIALLY`);

    for (const config of configs) {
      console.log(`  → Starting ${config.storyId}...`);
      stateBoard.markRunning(config.storyId, 'sequential', config.storyId.replace('story-', 'branch-'));

      try {
        const result = await api.invokeSubagent(config);
        stateBoard.markRunning(config.storyId, result.conversationId);
        results.push(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({
          storyId: config.storyId,
          conversationId: 'error',
          status: 'FAIL',
          duration: 0,
          error: errorMsg,
        });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Helper: Agent Trace Logging
// ---------------------------------------------------------------------------

function updateAgentTrace(
  projectRoot: string,
  id: string,
  label: string,
  duration: number,
  tokens: number,
  parentId: string | null = null
): void {
  const tracePath = path.join(projectRoot, '.iwish', 'runtime', 'workflows', 'agent-trace.json');
  fs.ensureDirSync(path.dirname(tracePath));
  let trace: any[] = [];
  if (fs.existsSync(tracePath)) {
    try {
      trace = fs.readJsonSync(tracePath);
    } catch (e) {}
  }

  const existingIndex = trace.findIndex((t: any) => t.id === id);
  const entry = {
    id,
    label,
    group: 'agent',
    duration: duration,
    tokens: tokens,
    parent: parentId
  };

  if (existingIndex >= 0) {
    trace[existingIndex] = entry;
  } else {
    trace.push(entry);
  }

  fs.writeJsonSync(tracePath, trace, { spaces: 2 });
}

// ---------------------------------------------------------------------------
// Main Entry Point — executeSwarmOrchestration
// ---------------------------------------------------------------------------

/**
 * Main entry point: Executes the full Swarm Orchestration pipeline.
 *
 * 1. Loads DAG from dependency-mapper output
 * 2. Detects platform capability (parallel vs sequential)
 * 3. Initializes state board
 * 4. Processes waves: spawn → wait → cascade → next wave
 *
 * @param epicId - The epic identifier (e.g., "10")
 * @param api - Platform-specific sub-agent API
 * @param options - Configuration options
 * @returns The final swarm state board
 */
export async function executeSwarmOrchestration(
  epicId: string,
  api: SubAgentAPI,
  options: SwarmOrchestratorOptions = {},
): Promise<SwarmStateBoard> {
  const orchStartTime = Date.now();
  const projectRoot = options.projectRoot
    ? path.resolve(options.projectRoot)
    : process.cwd();

  const orchId = `orch-epic-${epicId}`;
  // Initialize trace for this orchestration
  updateAgentTrace(projectRoot, orchId, 'orch-agent', 0, 0, null);

  const timeoutMs = options.storyTimeoutMs || DEFAULT_TIMEOUT_MS;

  // Step 1: Load DAG
  const dagPath = options.dagJsonPath ||
    path.join(projectRoot, '_iwish-output', `dependency-map-epic-${epicId}.json`);

  if (!fs.existsSync(dagPath)) {
    throw new Error(
      `No dependency map found at ${dagPath}. ` +
      `Run Story 10.1 (dependency-mapper) first: analyzeDependencies('${epicId}')`,
    );
  }

  const dag: DAGResult = fs.readJsonSync(dagPath);
  console.log(`📋 Loaded DAG for Epic ${epicId}: ${dag.nodes.length} stories, ${dag.execution_waves.length} waves`);

  // Step 2: Detect platform capability
  const platform: PlatformCapability = (options.forceSequential || !api.supportsParallel())
    ? 'SEQUENTIAL_FALLBACK'
    : 'PARALLEL';

  if (platform === 'SEQUENTIAL_FALLBACK') {
    console.warn(`\n⚠️  SEQUENTIAL FALLBACK MODE (AC6)`);
    console.warn(`   Platform does not support parallel sub-agents or --forceSequential is set.`);
    console.warn(`   Stories will execute one at a time in topological order.\n`);
  } else {
    console.log(`\n🚀 PARALLEL MODE — Max parallelism: ${dag.summary.max_parallelism}\n`);
  }

  // Step 3: Initialize state board
  const stateBoard = new SwarmStateBoardManager(
    epicId, dag, platform, projectRoot, options.outputDir,
  );

  // Step 4: Dry run check
  if (options.dryRun) {
    console.log(`\n🧪 DRY RUN — No sub-agents will be spawned.`);
    printExecutionPlan(dag, stateBoard);
    return stateBoard.getState();
  }

  // Step 5: Process waves
  for (let waveIdx = 0; waveIdx < dag.execution_waves.length; waveIdx++) {
    const waveStories = dag.execution_waves[waveIdx];
    const waveNum = waveIdx + 1;

    // Filter to only PENDING stories (some may be BLOCKED from earlier failures)
    const pendingStories = waveStories.filter((sid) => {
      const entry = stateBoard.getStory(sid);
      return entry?.status === 'PENDING';
    });

    if (pendingStories.length === 0) {
      console.log(`\n⏭️  Wave ${waveNum}: No pending stories — skipping.`);
      stateBoard.advanceWave();
      continue;
    }

    // Spawn wave
    const results = await spawnWave(
      pendingStories, epicId, dag, stateBoard, api, projectRoot,
    );

    // Process results
    for (const result of results) {
      // Log trace data
      const entry = stateBoard.getStory(result.storyId);
      if (entry) {
        // Calculate duration in seconds (1 decimal place) assuming result.duration is in ms
        const durationSec = Math.round((result.duration || 0) / 100) / 10;
        // Fallback to ~150 tokens/sec if result.tokens is missing (0.15 tokens per ms)
        const estTokens = result.tokens ?? Math.floor((result.duration || 0) * 0.15);
        // Using result.storyId as the id since conversationId might be mock/error
        const agentTraceId = result.conversationId && result.conversationId !== 'error' 
          ? result.conversationId 
          : `conv-${result.storyId}-${Date.now()}`;
        updateAgentTrace(projectRoot, agentTraceId, entry.assignedAgent, durationSec, estTokens, orchId);
      }

      const newlyReady = onStoryComplete(result.storyId, result, stateBoard, dag);

      // If new stories are unblocked, they'll be picked up in their wave
      if (newlyReady.length > 0) {
        console.log(`   → ${newlyReady.length} stories newly unblocked.`);
      }
    }
  }

  // Final summary
  const finalState = stateBoard.getState();
  printFinalSummary(finalState);

  // Update orchestrator trace duration
  const orchDurationMs = Date.now() - orchStartTime;
  const orchDurationSec = Math.round(orchDurationMs / 100) / 10;
  const orchTokens = Math.floor(orchDurationMs * 0.05); // Rough token estimate for orch
  updateAgentTrace(projectRoot, orchId, 'orch-agent', orchDurationSec, orchTokens, null);

  return finalState;
}

/**
 * Prints the execution plan for dry-run mode.
 */
function printExecutionPlan(dag: DAGResult, stateBoard: SwarmStateBoardManager): void {
  console.log(`\n📋 Execution Plan:`);
  for (let i = 0; i < dag.execution_waves.length; i++) {
    const wave = dag.execution_waves[i];
    const mode = wave.length > 1 ? 'parallel' : 'sequential';
    console.log(`  Wave ${i + 1} (${mode}):`);
    for (const storyId of wave) {
      const entry = stateBoard.getStory(storyId);
      console.log(`    → ${storyId}: ${entry?.storyTitle || 'Unknown'} [${entry?.assignedAgent}]`);
    }
  }
}

/**
 * Prints the final execution summary.
 */
function printFinalSummary(state: SwarmStateBoard): void {
  const s = state.summary;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🏁 Swarm Orchestration Complete — Epic ${state.epicId}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Platform: ${state.platform}`);
  console.log(`   Waves: ${state.totalWaves}`);
  console.log(`   Total Stories: ${s.total}`);
  console.log(`   ✅ Passed: ${s.passed}`);
  console.log(`   ❌ Failed: ${s.failed}`);
  console.log(`   🚫 Blocked: ${s.blocked}`);
  console.log(`   ⏰ Timed Out: ${s.timedOut}`);
  console.log(`${'═'.repeat(60)}\n`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const epicId = process.argv[2];
  if (!epicId) {
    console.error('Usage: swarm-orchestrator <epicId> [projectRoot] [--dry-run] [--sequential]');
    process.exit(1);
  }

  const projectRoot = process.argv[3] || process.cwd();
  const dryRun = process.argv.includes('--dry-run');
  const forceSequential = process.argv.includes('--sequential');

  // Default API stub for CLI — uses dry-run mode
  const cliApi: SubAgentAPI = {
    invokeSubagent: async (config) => ({
      storyId: config.storyId,
      conversationId: `cli-stub-${Date.now()}`,
      status: 'PASS' as const,
      duration: 0,
      output: 'CLI stub — use programmatic API for real execution.',
    }),
    supportsParallel: () => !forceSequential,
  };

  executeSwarmOrchestration(epicId, cliApi, { projectRoot, dryRun, forceSequential })
    .then(() => process.exit(0))
    .catch((err: Error) => {
      console.error(`\n❌ Swarm Orchestration failed: ${err.message}`);
      process.exit(1);
    });
}
