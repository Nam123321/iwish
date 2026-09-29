const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} WorktreeEntry
 * @property {string} path       - Absolute path to the worktree directory
 * @property {string} head       - HEAD commit SHA of the worktree
 * @property {string} branch     - Full ref path of the branch (e.g., refs/heads/feature-x)
 * @property {boolean} bare      - Whether this is the bare worktree
 * @property {boolean} detached  - Whether HEAD is detached (no branch)
 */

/**
 * @typedef {Object} PurgeResult
 * @property {string} path       - Worktree path that was processed
 * @property {string} branch     - Branch name associated with the worktree
 * @property {boolean} success   - Whether the purge operation succeeded
 * @property {boolean} skipped   - Whether the purge was skipped (dry-run, safety)
 * @property {string|null} error - Error message if the operation failed
 * @property {string} reason     - Human-readable reason for the outcome
 */

/**
 * @typedef {Object} PurgeOptions
 * @property {boolean} [force=false]  - Whether to use --force flag (removes dirty worktrees)
 * @property {boolean} [dryRun=false] - Whether to simulate without actual removal
 */

/** Set of branch names that must never be purged. */
const PROTECTED_BRANCHES = new Set(['main', 'master']);

/**
 * Extracts a short branch name from a full git ref path.
 * Example: "refs/heads/feature-x" → "feature-x"
 *
 * @param {string} fullRef - Full git ref string
 * @returns {string} Short branch name
 */
function shortBranchName(fullRef) {
  if (!fullRef || typeof fullRef !== 'string') return '';
  const prefix = 'refs/heads/';
  return fullRef.startsWith(prefix) ? fullRef.slice(prefix.length) : fullRef;
}

/**
 * Checks whether a branch name represents a protected branch (main/master).
 *
 * @param {string} branch - Branch name (short or full ref)
 * @returns {boolean}
 */
function isProtectedBranch(branch) {
  const short = shortBranchName(branch);
  return PROTECTED_BRANCHES.has(short);
}

/**
 * Git Worktree Purge Manager.
 *
 * Provides methods to list, analyze, purge, and report on git worktrees.
 * Designed to integrate with I-Wish's post-Consensus-Party-Mode cleanup
 * step and merge report generation.
 *
 * Safety invariants:
 * - main/master worktrees are NEVER purged (dual-layer guard)
 * - Non-existent paths produce error results, never crashes
 * - Dirty worktrees are skipped unless --force is used
 */
class WorktreePurge {
  /**
   * @param {Object} [options]
   * @param {string} [options.cwd] - Working directory for git commands (defaults to process.cwd())
   * @param {Function} [options.execFn] - Custom exec function for testing (defaults to execSync)
   */
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
    this.execFn = options.execFn || execSync;
    /** @type {PurgeResult[]} */
    this._lastResults = [];
  }

  /**
   * Lists all git worktrees by running `git worktree list --porcelain`
   * and parsing the structured output.
   *
   * Porcelain format (per worktree):
   * ```
   * worktree /path/to/worktree
   * HEAD <sha>
   * branch refs/heads/branch-name
   * ```
   * Entries are separated by blank lines.
   *
   * @returns {WorktreeEntry[]} Array of parsed worktree entries
   * @throws {Error} If git command fails (not a git repository, etc.)
   */
  listWorktrees() {
    let output;
    try {
      output = this.execFn('git worktree list --porcelain', {
        cwd: this.cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err) {
      throw new Error(`Failed to list worktrees: ${err.message}`);
    }

    return WorktreePurge.parsePorcelainOutput(output);
  }

  /**
   * Parses the porcelain output of `git worktree list --porcelain`.
   *
   * @param {string} output - Raw porcelain output string
   * @returns {WorktreeEntry[]} Parsed worktree entries
   */
  static parsePorcelainOutput(output) {
    if (!output || typeof output !== 'string' || output.trim() === '') {
      return [];
    }

    const entries = [];
    // Split on blank lines to get individual worktree blocks
    const blocks = output.trim().split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      /** @type {Partial<WorktreeEntry>} */
      const entry = {
        path: '',
        head: '',
        branch: '',
        bare: false,
        detached: false
      };

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          entry.path = line.slice('worktree '.length).trim();
        } else if (line.startsWith('HEAD ')) {
          entry.head = line.slice('HEAD '.length).trim();
        } else if (line.startsWith('branch ')) {
          entry.branch = line.slice('branch '.length).trim();
        } else if (line.trim() === 'bare') {
          entry.bare = true;
        } else if (line.trim() === 'detached') {
          entry.detached = true;
        }
      }

      // Only include entries with a valid path
      if (entry.path) {
        entries.push(/** @type {WorktreeEntry} */ (entry));
      }
    }

    return entries;
  }

  /**
   * Identifies stale worktrees by cross-referencing the worktree list
   * against a list of merged branch names.
   *
   * A worktree is considered stale if:
   * 1. Its branch name appears in the mergedBranches list
   * 2. It is NOT a protected branch (main/master)
   * 3. It is NOT bare
   * 4. It is NOT detached
   *
   * @param {WorktreeEntry[]} worktrees - All worktrees from listWorktrees()
   * @param {string[]} mergedBranches - List of branch names that have been merged
   * @returns {WorktreeEntry[]} Stale worktrees that can be safely removed
   */
  identifyStale(worktrees, mergedBranches) {
    if (!Array.isArray(worktrees) || !Array.isArray(mergedBranches)) {
      return [];
    }

    if (mergedBranches.length === 0) {
      return [];
    }

    // Normalize merged branches to short names for comparison
    const mergedSet = new Set(mergedBranches.map(b => shortBranchName(b)));

    return worktrees.filter(wt => {
      // Skip bare worktrees (the main repo itself)
      if (wt.bare) return false;

      // Skip detached HEAD worktrees (no branch to match)
      if (wt.detached) return false;

      // Skip worktrees without a branch ref
      if (!wt.branch) return false;

      const short = shortBranchName(wt.branch);

      // SAFETY: Never mark main/master as stale
      if (isProtectedBranch(short)) return false;

      // Check if this branch has been merged
      return mergedSet.has(short);
    });
  }

  /**
   * Purges (removes) a single worktree.
   *
   * Safety checks performed before removal:
   * 1. Branch must not be main/master
   * 2. Worktree path must exist on disk
   * 3. In dry-run mode, the removal is simulated
   *
   * @param {string} worktreePath - Absolute path to the worktree
   * @param {PurgeOptions} [options={}] - Purge options
   * @param {string} [branch=''] - Branch name for reporting purposes
   * @returns {PurgeResult} Result of the purge operation
   */
  purge(worktreePath, options = {}, branch = '') {
    const { force = false, dryRun = false } = options;
    const shortName = shortBranchName(branch);

    // SAFETY GUARD 1: Never purge main/master
    if (isProtectedBranch(branch)) {
      return {
        path: worktreePath,
        branch: shortName,
        success: false,
        skipped: true,
        error: null,
        reason: 'Protected branch (main/master) — purge refused'
      };
    }

    // DRY-RUN MODE: Simulate without executing (checked before path validation
    // so dry-run works for planning even when paths don't exist on disk)
    if (dryRun) {
      return {
        path: worktreePath,
        branch: shortName,
        success: true,
        skipped: true,
        error: null,
        reason: 'Dry-run: would remove this worktree'
      };
    }

    // SAFETY GUARD 2: Validate path exists (only for actual removal)
    if (!fs.existsSync(worktreePath)) {
      return {
        path: worktreePath,
        branch: shortName,
        success: false,
        skipped: false,
        error: `Worktree path does not exist: ${worktreePath}`,
        reason: 'Path not found on disk'
      };
    }

    // Build git command
    const forceFlag = force ? ' --force' : '';
    const cmd = `git worktree remove "${worktreePath}"${forceFlag}`;

    try {
      this.execFn(cmd, {
        cwd: this.cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return {
        path: worktreePath,
        branch: shortName,
        success: true,
        skipped: false,
        error: null,
        reason: force ? 'Removed (forced)' : 'Removed'
      };
    } catch (err) {
      return {
        path: worktreePath,
        branch: shortName,
        success: false,
        skipped: false,
        error: err.message || String(err),
        reason: 'git worktree remove failed'
      };
    }
  }

  /**
   * Purges all identified stale worktrees in sequence.
   * Each worktree is processed independently — a failure on one
   * does not block the others.
   *
   * @param {WorktreeEntry[]} staleWorktrees - Worktrees identified by identifyStale()
   * @param {PurgeOptions} [options={}] - Purge options applied to all
   * @returns {PurgeResult[]} Array of results, one per worktree
   */
  purgeAll(staleWorktrees, options = {}) {
    if (!Array.isArray(staleWorktrees) || staleWorktrees.length === 0) {
      this._lastResults = [];
      return [];
    }

    const results = staleWorktrees.map(wt =>
      this.purge(wt.path, options, wt.branch)
    );

    this._lastResults = results;
    return results;
  }

  /**
   * Generates a markdown-formatted cleanup report from purge results.
   *
   * Report structure:
   * - Header with timestamp
   * - Summary counts (total, succeeded, failed, skipped)
   * - Table of individual results
   *
   * @param {PurgeResult[]} purgeResults - Results from purge() or purgeAll()
   * @returns {string} Markdown-formatted report
   */
  generateReport(purgeResults) {
    const timestamp = new Date().toISOString();
    const results = Array.isArray(purgeResults) ? purgeResults : [];

    const total = results.length;
    const succeeded = results.filter(r => r.success && !r.skipped).length;
    const failed = results.filter(r => !r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;

    let report = '';
    report += `## 🧹 Git Worktree Cleanup Report\n`;
    report += `> Generated: ${timestamp}\n\n`;

    if (total === 0) {
      report += `**No worktrees were processed.** The workspace is clean.\n`;
      return report;
    }

    report += `### Summary\n`;
    report += `- **Total processed:** ${total}\n`;
    report += `- **Removed:** ${succeeded}\n`;
    report += `- **Failed:** ${failed}\n`;
    report += `- **Skipped:** ${skipped}\n\n`;

    report += `### Details\n`;
    report += `| Path | Branch | Status | Reason | Error |\n`;
    report += `|------|--------|--------|--------|-------|\n`;

    for (const r of results) {
      const status = r.success ? (r.skipped ? '⏭️ Skipped' : '✅ Removed') : (r.skipped ? '🛡️ Protected' : '❌ Failed');
      const errStr = r.error ? r.error.split('\n')[0].slice(0, 80) : '—';
      const branchStr = r.branch || '(detached)';
      const pathStr = r.path || '(unknown)';
      report += `| \`${pathStr}\` | \`${branchStr}\` | ${status} | ${r.reason} | ${errStr} |\n`;
    }

    report += `\n---\n`;
    return report;
  }

  /**
   * Returns the results from the last purgeAll() call.
   *
   * @returns {PurgeResult[]}
   */
  getLastResults() {
    return this._lastResults;
  }

  /**
   * Retrieves merged branches by running `git branch --merged`.
   * Filters out the current branch (marked with *) and trims whitespace.
   *
   * @returns {string[]} Array of merged branch names
   */
  getMergedBranches() {
    try {
      const output = this.execFn('git branch --merged', {
        cwd: this.cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('*'))
        .map(line => shortBranchName(line));
    } catch (err) {
      console.warn(`[WorktreePurge] Warning: Failed to list merged branches: ${err.message}`);
      return [];
    }
  }
}

// ─── CLI Interface ──────────────────────────────────────────────────────────

/**
 * CLI entry point. Parses arguments and dispatches to the appropriate
 * WorktreePurge method.
 *
 * Commands:
 *   list                  - Show all worktrees
 *   scan                  - Identify stale worktrees
 *   purge [--force] [--dry-run] - Remove stale worktrees
 *   report                - Show last cleanup report
 */
function runCli(args) {
  const command = args[0];
  const flags = new Set(args.slice(1));
  const purger = new WorktreePurge();

  switch (command) {
    case 'list': {
      const worktrees = purger.listWorktrees();
      if (worktrees.length === 0) {
        console.log('No worktrees found.');
        return;
      }
      console.log(`Found ${worktrees.length} worktree(s):\n`);
      for (const wt of worktrees) {
        const branch = shortBranchName(wt.branch) || '(detached)';
        const status = wt.bare ? '[bare]' : `[${branch}]`;
        console.log(`  ${status}  ${wt.path}  (${wt.head.slice(0, 8)})`);
      }
      break;
    }

    case 'scan': {
      const worktrees = purger.listWorktrees();
      const merged = purger.getMergedBranches();
      const stale = purger.identifyStale(worktrees, merged);

      if (stale.length === 0) {
        console.log('✅ No stale worktrees found. Workspace is clean.');
        return;
      }
      console.log(`⚠️  Found ${stale.length} stale worktree(s):\n`);
      for (const wt of stale) {
        console.log(`  - ${shortBranchName(wt.branch)}  →  ${wt.path}`);
      }
      console.log('\nRun `node worktree-purge.js purge` to remove them.');
      break;
    }

    case 'purge': {
      const force = flags.has('--force');
      const dryRun = flags.has('--dry-run');

      const worktrees = purger.listWorktrees();
      const merged = purger.getMergedBranches();
      const stale = purger.identifyStale(worktrees, merged);

      if (stale.length === 0) {
        console.log('✅ No stale worktrees to purge.');
        return;
      }

      const modeStr = dryRun ? ' (dry-run)' : (force ? ' (force)' : '');
      console.log(`Purging ${stale.length} stale worktree(s)${modeStr}...\n`);

      const results = purger.purgeAll(stale, { force, dryRun });
      const report = purger.generateReport(results);
      console.log(report);
      break;
    }

    case 'report': {
      const results = purger.getLastResults();
      if (results.length === 0) {
        console.log('No cleanup history available for this session.');
        console.log('Run `node worktree-purge.js purge` first.');
        return;
      }
      console.log(purger.generateReport(results));
      break;
    }

    default:
      console.log('Usage: node worktree-purge.js <command> [options]');
      console.log('');
      console.log('Commands:');
      console.log('  list                  Show all worktrees');
      console.log('  scan                  Identify stale worktrees');
      console.log('  purge [--force] [--dry-run]  Remove stale worktrees');
      console.log('  report                Show last cleanup report');
      break;
  }
}

// Run CLI if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  runCli(args);
}

module.exports = {
  WorktreePurge,
  shortBranchName,
  isProtectedBranch,
  PROTECTED_BRANCHES,
  runCli
};
