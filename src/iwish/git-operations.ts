/**
 * git-operations.ts — Real Git Operations for Swarm Orchestration
 *
 * Gap 3: Replaces simulated git operations with actual git commands.
 * Provides worktree management, branch operations, merge with conflict
 * detection, diff analysis, and blame/bisect for regression identification.
 *
 * @module git-operations
 */

import { execSync, ExecSyncOptions } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of a git merge operation */
export interface GitMergeResult {
  success: boolean;
  conflictFiles: string[];
  mergedFiles: string[];
  commitHash?: string;
  error?: string;
}

/** Result of a git diff analysis */
export interface GitDiffResult {
  filesChanged: string[];
  insertions: number;
  deletions: number;
  renames: string[];
}

/** Result of a git blame analysis */
export interface GitBlameResult {
  file: string;
  lines: GitBlameLine[];
}

/** A single blamed line */
export interface GitBlameLine {
  commitHash: string;
  author: string;
  lineNumber: number;
  content: string;
}

/** Git worktree info */
export interface WorktreeInfo {
  path: string;
  branch: string;
  commitHash: string;
  isLocked: boolean;
}

// ---------------------------------------------------------------------------
// Git Command Executor
// ---------------------------------------------------------------------------

const EXEC_OPTIONS: ExecSyncOptions = {
  encoding: 'utf8' as BufferEncoding,
  stdio: 'pipe',
  timeout: 60000, // 60 second timeout per git command
};

/**
 * Executes a git command and returns stdout.
 * Returns null on failure instead of throwing.
 */
function gitExec(command: string, cwd: string): string | null {
  try {
    const result = execSync(`git ${command}`, {
      ...EXEC_OPTIONS,
      cwd,
    });
    return (result as string).trim();
  } catch (err) {
    const error = err as { stderr?: Buffer | string; message?: string };
    const stderr = error.stderr
      ? (typeof error.stderr === 'string' ? error.stderr : error.stderr.toString())
      : error.message || '';
    console.warn(`⚠️  git ${command.split(' ')[0]} failed: ${stderr.substring(0, 200)}`);
    return null;
  }
}

/**
 * Executes a git command, throws on failure.
 */
function gitExecStrict(command: string, cwd: string): string {
  const result = gitExec(command, cwd);
  if (result === null) {
    throw new Error(`Git command failed: git ${command}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Branch Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new branch from the current HEAD.
 */
export function createBranch(branchName: string, cwd: string, startPoint?: string): boolean {
  const cmd = startPoint
    ? `checkout -b ${branchName} ${startPoint}`
    : `checkout -b ${branchName}`;
  return gitExec(cmd, cwd) !== null;
}

/**
 * Checks out an existing branch.
 */
export function checkoutBranch(branchName: string, cwd: string): boolean {
  return gitExec(`checkout ${branchName}`, cwd) !== null;
}

/**
 * Lists all local branches.
 */
export function listBranches(cwd: string): string[] {
  const result = gitExec('branch --format="%(refname:short)"', cwd);
  if (!result) return [];
  return result.split('\n').filter(Boolean).map((b) => b.replace(/"/g, ''));
}

/**
 * Gets the current branch name.
 */
export function getCurrentBranch(cwd: string): string | null {
  return gitExec('rev-parse --abbrev-ref HEAD', cwd);
}

/**
 * Deletes a branch (force).
 */
export function deleteBranch(branchName: string, cwd: string): boolean {
  return gitExec(`branch -D ${branchName}`, cwd) !== null;
}

// ---------------------------------------------------------------------------
// Worktree Operations (for Claude Code adapter)
// ---------------------------------------------------------------------------

/**
 * Creates a git worktree for isolated sub-agent execution.
 *
 * @param branchName - The branch for the worktree
 * @param worktreeBase - Base directory for worktrees
 * @param cwd - The main repository directory
 * @returns The created worktree path, or null on failure
 */
export function createWorktree(
  branchName: string,
  worktreeBase: string,
  cwd: string,
): string | null {
  const safeName = branchName.replace(/\//g, '-');
  const worktreePath = path.join(worktreeBase, safeName);

  // Create branch if it doesn't exist
  const branches = listBranches(cwd);
  if (!branches.includes(branchName)) {
    gitExec(`branch ${branchName}`, cwd);
  }

  // Remove existing worktree if present
  if (fs.existsSync(worktreePath)) {
    gitExec(`worktree remove "${worktreePath}" --force`, cwd);
    // Fallback: remove directory if git worktree remove failed
    if (fs.existsSync(worktreePath)) {
      fs.removeSync(worktreePath);
    }
  }

  // Create new worktree
  const result = gitExec(`worktree add "${worktreePath}" ${branchName}`, cwd);
  if (result === null) return null;

  return worktreePath;
}

/**
 * Removes a git worktree.
 */
export function removeWorktree(worktreePath: string, cwd: string): boolean {
  return gitExec(`worktree remove "${worktreePath}" --force`, cwd) !== null;
}

/**
 * Lists all git worktrees.
 */
export function listWorktrees(cwd: string): WorktreeInfo[] {
  const result = gitExec('worktree list --porcelain', cwd);
  if (!result) return [];

  const worktrees: WorktreeInfo[] = [];
  const blocks = result.split('\n\n').filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n');
    const info: Partial<WorktreeInfo> = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) info.path = line.replace('worktree ', '');
      if (line.startsWith('HEAD ')) info.commitHash = line.replace('HEAD ', '');
      if (line.startsWith('branch ')) info.branch = line.replace('branch refs/heads/', '');
      if (line === 'locked') info.isLocked = true;
    }

    if (info.path) {
      worktrees.push({
        path: info.path,
        branch: info.branch || 'detached',
        commitHash: info.commitHash || '',
        isLocked: info.isLocked || false,
      });
    }
  }

  return worktrees;
}

/**
 * Cleans up all swarm worktrees.
 */
export function cleanupSwarmWorktrees(cwd: string): number {
  const worktrees = listWorktrees(cwd);
  let cleaned = 0;

  for (const wt of worktrees) {
    if (wt.branch.startsWith('swarm/')) {
      if (removeWorktree(wt.path, cwd)) {
        deleteBranch(wt.branch, cwd);
        cleaned++;
      }
    }
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Merge Operations
// ---------------------------------------------------------------------------

/**
 * Merges a branch into the current branch.
 * Detects and reports merge conflicts.
 *
 * @param branchToMerge - The source branch to merge
 * @param cwd - Working directory
 * @param noCommit - If true, stages but doesn't commit (for inspection)
 * @returns GitMergeResult with success status and conflict details
 */
export function mergeBranch(
  branchToMerge: string,
  cwd: string,
  noCommit: boolean = false,
): GitMergeResult {
  const cmd = noCommit
    ? `merge --no-commit --no-ff ${branchToMerge}`
    : `merge --no-ff ${branchToMerge} -m "merge: integrate ${branchToMerge}"`;

  const result = gitExec(cmd, cwd);

  if (result !== null && !result.includes('CONFLICT')) {
    // Clean merge
    const mergedFiles = getLastMergeFiles(cwd);
    return {
      success: true,
      conflictFiles: [],
      mergedFiles,
      commitHash: gitExec('rev-parse HEAD', cwd) || undefined,
    };
  }

  // Merge failed or has conflicts — get conflict details
  const conflictFiles = getConflictFiles(cwd);

  if (conflictFiles.length > 0) {
    return {
      success: false,
      conflictFiles,
      mergedFiles: [],
      error: `Merge conflict in: ${conflictFiles.join(', ')}`,
    };
  }

  return {
    success: false,
    conflictFiles: [],
    mergedFiles: [],
    error: result || 'Unknown merge error',
  };
}

/**
 * Gets list of files with merge conflicts.
 */
function getConflictFiles(cwd: string): string[] {
  const result = gitExec('diff --name-only --diff-filter=U', cwd);
  if (!result) return [];
  return result.split('\n').filter(Boolean);
}

/**
 * Gets files from the last merge commit.
 */
function getLastMergeFiles(cwd: string): string[] {
  const result = gitExec('diff-tree --no-commit-id --name-only -r HEAD', cwd);
  if (!result) return [];
  return result.split('\n').filter(Boolean);
}

/**
 * Aborts a merge in progress.
 */
export function abortMerge(cwd: string): boolean {
  return gitExec('merge --abort', cwd) !== null;
}

/**
 * Creates an integration branch for the epic.
 */
export function createIntegrationBranch(
  epicId: string,
  baseBranch: string,
  cwd: string,
): string {
  const integrationBranch = `epic-${epicId}-integration`;
  const branches = listBranches(cwd);

  if (branches.includes(integrationBranch)) {
    // Already exists, check it out
    checkoutBranch(integrationBranch, cwd);
  } else {
    // Create from base
    createBranch(integrationBranch, cwd, baseBranch);
  }

  return integrationBranch;
}

// ---------------------------------------------------------------------------
// Diff & Analysis Operations
// ---------------------------------------------------------------------------

/**
 * Gets the diff between two branches.
 */
export function diffBranches(
  branchA: string,
  branchB: string,
  cwd: string,
): GitDiffResult {
  const nameOnly = gitExec(`diff --name-only ${branchA}...${branchB}`, cwd);
  const stat = gitExec(`diff --stat ${branchA}...${branchB}`, cwd);

  const filesChanged = nameOnly ? nameOnly.split('\n').filter(Boolean) : [];

  // Parse insertions/deletions from stat output
  let insertions = 0;
  let deletions = 0;
  if (stat) {
    const summaryMatch = stat.match(/(\d+) insertions?/);
    if (summaryMatch) insertions = parseInt(summaryMatch[1], 10);
    const delMatch = stat.match(/(\d+) deletions?/);
    if (delMatch) deletions = parseInt(delMatch[1], 10);
  }

  return {
    filesChanged,
    insertions,
    deletions,
    renames: [],
  };
}

/**
 * Gets files changed by a specific branch compared to main.
 */
export function getFilesChangedByBranch(
  branch: string,
  baseBranch: string,
  cwd: string,
): string[] {
  const result = gitExec(`diff --name-only ${baseBranch}...${branch}`, cwd);
  if (!result) return [];
  return result.split('\n').filter(Boolean);
}

/**
 * Checks if two branches modify the same files (architectural drift detection).
 */
export function detectFileOverlap(
  branchA: string,
  branchB: string,
  baseBranch: string,
  cwd: string,
): string[] {
  const filesA = new Set(getFilesChangedByBranch(branchA, baseBranch, cwd));
  const filesB = getFilesChangedByBranch(branchB, baseBranch, cwd);

  return filesB.filter((f) => filesA.has(f));
}

// ---------------------------------------------------------------------------
// Blame & Bisect Operations (for AC9 regression identification)
// ---------------------------------------------------------------------------

/**
 * Runs git blame on a file to identify who last modified each line.
 */
export function blameFile(filePath: string, cwd: string): GitBlameResult {
  const result = gitExec(`blame --porcelain "${filePath}"`, cwd);
  if (!result) return { file: filePath, lines: [] };

  const lines: GitBlameLine[] = [];
  const entries = result.split('\n');

  let currentHash = '';
  let currentAuthor = '';
  let lineNum = 0;

  for (const entry of entries) {
    const hashMatch = entry.match(/^([a-f0-9]{40})\s+\d+\s+(\d+)/);
    if (hashMatch) {
      currentHash = hashMatch[1];
      lineNum = parseInt(hashMatch[2], 10);
    }
    if (entry.startsWith('author ')) {
      currentAuthor = entry.replace('author ', '');
    }
    if (entry.startsWith('\t')) {
      lines.push({
        commitHash: currentHash,
        author: currentAuthor,
        lineNumber: lineNum,
        content: entry.substring(1),
      });
    }
  }

  return { file: filePath, lines };
}

/**
 * Identifies which commit introduced a regression by analyzing recent commits.
 * A lightweight alternative to full git bisect.
 *
 * @param testCommand - Command to run to test for regression
 * @param goodCommit - Last known good commit
 * @param badCommit - First known bad commit (default: HEAD)
 * @param cwd - Working directory
 * @returns The commit hash that introduced the regression, or null
 */
export function findRegressionCommit(
  testCommand: string,
  goodCommit: string,
  badCommit: string = 'HEAD',
  cwd: string,
): string | null {
  // Get commits between good and bad
  const log = gitExec(`log --oneline ${goodCommit}..${badCommit}`, cwd);
  if (!log) return null;

  const commits = log.split('\n').filter(Boolean).map((l) => l.split(' ')[0]);

  // Linear search from newest to oldest (most likely the latest commit)
  for (const commit of commits) {
    try {
      execSync(`git checkout ${commit} --quiet`, { cwd, stdio: 'pipe' });
      const testResult = execSync(testCommand, { cwd, stdio: 'pipe', timeout: 60000 });
      // If test passes, the regression was introduced after this commit
      execSync(`git checkout - --quiet`, { cwd, stdio: 'pipe' });
      return commits[commits.indexOf(commit) - 1] || commit;
    } catch {
      // Test failed on this commit, continue checking older commits
      try {
        execSync(`git checkout - --quiet`, { cwd, stdio: 'pipe' });
      } catch {
        // Already on the right branch
      }
    }
  }

  return commits[0] || null;
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Checks if the current directory is a git repository.
 */
export function isGitRepo(cwd: string): boolean {
  return gitExec('rev-parse --is-inside-work-tree', cwd) === 'true';
}

/**
 * Gets the repository root directory.
 */
export function getRepoRoot(cwd: string): string | null {
  return gitExec('rev-parse --show-toplevel', cwd);
}

/**
 * Stages all changes and creates a commit.
 */
export function commitAll(message: string, cwd: string): string | null {
  gitExec('add -A', cwd);
  return gitExec(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
}

/**
 * Gets the current HEAD commit hash.
 */
export function getHeadHash(cwd: string): string | null {
  return gitExec('rev-parse HEAD', cwd);
}

/**
 * Gets the short log of recent commits.
 */
export function getRecentCommits(cwd: string, count: number = 10): string[] {
  const result = gitExec(`log --oneline -n ${count}`, cwd);
  if (!result) return [];
  return result.split('\n').filter(Boolean);
}
