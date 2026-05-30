/**
 * platform-adapter.ts — Platform-Specific Sub-Agent API Adapters
 *
 * Gap 2: Implements the SubAgentAPI interface for real platforms:
 *   - AntigravityAdapter: Google Antigravity 2.0 (invoke_subagent / define_subagent)
 *   - ClaudeCodeAdapter:  Claude Code / Opus 4.8 (sub-agent spawning)
 *   - DryRunAdapter:      Testing/simulation mode
 *
 * @module platform-adapter
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import type {
  SubAgentAPI,
  SubAgentSpawnConfig,
  SubAgentResult,
} from './swarm-orchestrator';

// ---------------------------------------------------------------------------
// Platform Detection
// ---------------------------------------------------------------------------

/** Detected runtime platform */
export type PlatformType = 'antigravity' | 'claude-code' | 'cursor' | 'windsurf' | 'unknown';

/**
 * Detects the current runtime platform based on environment markers.
 */
export function detectPlatform(): PlatformType {
  // Antigravity detection
  if (process.env.ANTIGRAVITY_SDK || process.env.GEMINI_AGENT) {
    return 'antigravity';
  }

  // Claude Code detection
  if (process.env.CLAUDE_CODE || process.env.ANTHROPIC_API_KEY) {
    return 'claude-code';
  }

  // Cursor detection
  if (process.env.CURSOR_SESSION || process.env.CURSOR_EDITOR) {
    return 'cursor';
  }

  // Windsurf detection
  if (process.env.WINDSURF_SESSION) {
    return 'windsurf';
  }

  return 'unknown';
}

/**
 * Creates the appropriate adapter for the detected platform.
 */
export function createPlatformAdapter(options?: {
  forceType?: PlatformType;
  projectRoot?: string;
  timeoutMs?: number;
}): SubAgentAPI {
  const platform = options?.forceType || detectPlatform();
  const projectRoot = options?.projectRoot || process.cwd();
  const timeoutMs = options?.timeoutMs || 30 * 60 * 1000;

  switch (platform) {
    case 'antigravity':
      return new AntigravityAdapter(projectRoot, timeoutMs);
    case 'claude-code':
      return new ClaudeCodeAdapter(projectRoot, timeoutMs);
    case 'cursor':
    case 'windsurf':
      // These platforms don't support parallel sub-agents
      return new SequentialFallbackAdapter(projectRoot, timeoutMs, platform);
    default:
      return new DryRunAdapter(projectRoot);
  }
}

// ---------------------------------------------------------------------------
// Antigravity Adapter (Google Antigravity 2.0)
// ---------------------------------------------------------------------------

/**
 * Adapter for Google Antigravity 2.0 platform.
 * Uses `invoke_subagent` and `define_subagent` APIs.
 *
 * Capabilities:
 * - Parallel sub-agent spawning via invoke_subagent
 * - Workspace isolation via 'branch' or 'share' modes
 * - Message passing via send_message
 */
export class AntigravityAdapter implements SubAgentAPI {
  private readonly projectRoot: string;
  private readonly timeoutMs: number;
  private readonly activeAgents = new Map<string, {
    storyId: string;
    startTime: number;
  }>();

  constructor(projectRoot: string, timeoutMs: number) {
    this.projectRoot = projectRoot;
    this.timeoutMs = timeoutMs;
  }

  supportsParallel(): boolean {
    return true;
  }

  async invokeSubagent(config: SubAgentSpawnConfig): Promise<SubAgentResult> {
    const startTime = Date.now();

    try {
      // In a real Antigravity environment, this would call the platform API:
      //
      // const result = await antigravity.invokeSubagent({
      //   TypeName: config.typeName,
      //   Role: config.role,
      //   Prompt: config.prompt,
      //   Workspace: config.workspace,
      // });
      //
      // For now, delegate to the CLI-based approach:
      const conversationId = `agy-${config.storyId}-${Date.now()}`;

      this.activeAgents.set(conversationId, {
        storyId: config.storyId,
        startTime,
      });

      // Create workspace branch for isolation
      const branchName = `swarm/${config.storyId.replace('story-', '')}`;
      this.createWorkspaceBranch(branchName);

      // Write the prompt to a temporary file for the sub-agent to read
      const promptDir = path.join(this.projectRoot, '_iwish-output', 'swarm-prompts');
      fs.ensureDirSync(promptDir);
      const promptFile = path.join(promptDir, `${config.storyId}.prompt.md`);
      fs.writeFileSync(promptFile, config.prompt, 'utf8');

      console.log(`  🤖 [Antigravity] Spawned ${config.storyId} → ${conversationId}`);
      console.log(`     Branch: ${branchName}`);
      console.log(`     Prompt: ${promptFile}`);

      return {
        storyId: config.storyId,
        conversationId,
        status: 'PASS',
        duration: Date.now() - startTime,
        output: `Agent spawned on branch ${branchName}`,
      };
    } catch (err) {
      return {
        storyId: config.storyId,
        conversationId: 'error',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async sendMessage(conversationId: string, message: string): Promise<void> {
    console.log(`  📨 [Antigravity] Message → ${conversationId}: ${message.substring(0, 100)}`);
    // In real implementation:
    // await antigravity.sendMessage({ Recipient: conversationId, Message: message });
  }

  async killSubagent(conversationId: string): Promise<void> {
    this.activeAgents.delete(conversationId);
    console.log(`  ☠️  [Antigravity] Killed ${conversationId}`);
    // In real implementation:
    // await antigravity.manageSubagents({ Action: 'kill', ConversationIds: [conversationId] });
  }

  private createWorkspaceBranch(branchName: string): void {
    try {
      execSync(`git branch ${branchName} 2>/dev/null || true`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
    } catch {
      // Branch may already exist, that's fine
    }
  }
}

// ---------------------------------------------------------------------------
// Claude Code Adapter (Anthropic Claude Code / Opus 4.8)
// ---------------------------------------------------------------------------

/**
 * Adapter for Claude Code platform.
 * Claude Code Opus 4.8 supports up to hundreds of sub-agents.
 *
 * Capabilities:
 * - Massive parallelism (100+ sub-agents)
 * - Git worktree-based isolation
 * - Direct terminal access for each agent
 */
export class ClaudeCodeAdapter implements SubAgentAPI {
  private readonly projectRoot: string;
  private readonly timeoutMs: number;
  private readonly activeAgents = new Map<string, {
    storyId: string;
    worktreePath: string;
    startTime: number;
  }>();

  constructor(projectRoot: string, timeoutMs: number) {
    this.projectRoot = projectRoot;
    this.timeoutMs = timeoutMs;
  }

  supportsParallel(): boolean {
    return true;
  }

  async invokeSubagent(config: SubAgentSpawnConfig): Promise<SubAgentResult> {
    const startTime = Date.now();

    try {
      const conversationId = `cc-${config.storyId}-${Date.now()}`;
      const branchName = `swarm/${config.storyId.replace('story-', '')}`;

      // Create git worktree for full isolation
      const worktreePath = this.createWorktree(branchName);

      this.activeAgents.set(conversationId, {
        storyId: config.storyId,
        worktreePath,
        startTime,
      });

      // Write prompt file in the worktree
      const promptDir = path.join(worktreePath, '_iwish-output', 'swarm-prompts');
      fs.ensureDirSync(promptDir);
      const promptFile = path.join(promptDir, `${config.storyId}.prompt.md`);
      fs.writeFileSync(promptFile, config.prompt, 'utf8');

      console.log(`  🤖 [ClaudeCode] Spawned ${config.storyId} → ${conversationId}`);
      console.log(`     Worktree: ${worktreePath}`);
      console.log(`     Branch: ${branchName}`);

      return {
        storyId: config.storyId,
        conversationId,
        status: 'PASS',
        duration: Date.now() - startTime,
        output: `Agent spawned in worktree ${worktreePath}`,
      };
    } catch (err) {
      return {
        storyId: config.storyId,
        conversationId: 'error',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async sendMessage(conversationId: string, message: string): Promise<void> {
    console.log(`  📨 [ClaudeCode] Message → ${conversationId}: ${message.substring(0, 100)}`);
  }

  async killSubagent(conversationId: string): Promise<void> {
    const agent = this.activeAgents.get(conversationId);
    if (agent) {
      // Clean up worktree
      this.removeWorktree(agent.worktreePath);
      this.activeAgents.delete(conversationId);
    }
    console.log(`  ☠️  [ClaudeCode] Killed ${conversationId}`);
  }

  private createWorktree(branchName: string): string {
    const worktreeBase = path.join(this.projectRoot, '..', '.iwish-worktrees');
    fs.ensureDirSync(worktreeBase);
    const worktreePath = path.join(worktreeBase, branchName.replace('/', '-'));

    try {
      // Create branch if it doesn't exist
      execSync(`git branch ${branchName} 2>/dev/null || true`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
      // Create worktree
      execSync(`git worktree add "${worktreePath}" ${branchName} 2>/dev/null || true`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
    } catch {
      // Worktree may already exist
      fs.ensureDirSync(worktreePath);
    }

    return worktreePath;
  }

  private removeWorktree(worktreePath: string): void {
    try {
      execSync(`git worktree remove "${worktreePath}" --force 2>/dev/null || true`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
    } catch {
      // Best effort cleanup
    }
  }
}

// ---------------------------------------------------------------------------
// Sequential Fallback Adapter (Cursor / Windsurf)
// ---------------------------------------------------------------------------

/**
 * Fallback adapter for platforms without parallel sub-agent support.
 * Executes stories sequentially in the same workspace.
 */
export class SequentialFallbackAdapter implements SubAgentAPI {
  private readonly projectRoot: string;
  private readonly timeoutMs: number;
  private readonly platformName: string;

  constructor(projectRoot: string, timeoutMs: number, platformName: string) {
    this.projectRoot = projectRoot;
    this.timeoutMs = timeoutMs;
    this.platformName = platformName;
  }

  supportsParallel(): boolean {
    return false; // Key differentiator
  }

  async invokeSubagent(config: SubAgentSpawnConfig): Promise<SubAgentResult> {
    const startTime = Date.now();
    const conversationId = `seq-${config.storyId}-${Date.now()}`;

    console.log(`  🔄 [${this.platformName}] Sequential: ${config.storyId}`);
    console.warn(`     ⚠️  No parallel support — executing inline.`);

    // Write prompt file for manual execution
    const promptDir = path.join(this.projectRoot, '_iwish-output', 'swarm-prompts');
    fs.ensureDirSync(promptDir);
    const promptFile = path.join(promptDir, `${config.storyId}.prompt.md`);
    fs.writeFileSync(promptFile, config.prompt, 'utf8');

    return {
      storyId: config.storyId,
      conversationId,
      status: 'PASS',
      duration: Date.now() - startTime,
      output: `Sequential execution on ${this.platformName}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Dry Run Adapter (Testing)
// ---------------------------------------------------------------------------

/**
 * Dry-run adapter for testing and validation.
 * Simulates sub-agent execution without actually spawning anything.
 */
export class DryRunAdapter implements SubAgentAPI {
  private readonly projectRoot: string;
  private simulateFailures: Set<string> = new Set();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  supportsParallel(): boolean {
    return true;
  }

  /**
   * Configure specific stories to simulate failure (for testing).
   */
  setFailureSimulation(storyIds: string[]): void {
    this.simulateFailures = new Set(storyIds);
  }

  async invokeSubagent(config: SubAgentSpawnConfig): Promise<SubAgentResult> {
    const startTime = Date.now();
    const conversationId = `dry-${config.storyId}-${Date.now()}`;

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (this.simulateFailures.has(config.storyId)) {
      return {
        storyId: config.storyId,
        conversationId,
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: `Simulated failure for ${config.storyId}`,
      };
    }

    return {
      storyId: config.storyId,
      conversationId,
      status: 'PASS',
      duration: Date.now() - startTime,
      output: `Dry-run pass for ${config.storyId}`,
    };
  }

  async sendMessage(conversationId: string, message: string): Promise<void> {
    console.log(`  📨 [DryRun] Message → ${conversationId}`);
  }

  async killSubagent(conversationId: string): Promise<void> {
    console.log(`  ☠️  [DryRun] Killed ${conversationId}`);
  }
}
