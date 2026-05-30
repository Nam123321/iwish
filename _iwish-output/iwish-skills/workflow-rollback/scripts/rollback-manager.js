/**
 * @fileoverview Rollback Task Stack Manager
 *
 * Manages step execution history and performs reverse-order (LIFO) rollback
 * on task failure. Part of the Topological Rollback Engine (Epic 2).
 *
 * @module workflow-rollback/rollback-manager
 */

// ─── Custom Error ──────────────────────────────────────────────────────────────

/**
 * Thrown when a rollback command fails during `rollbackAll()`.
 * Carries diagnostic information including the partial rollback log
 * and the step that caused the abort.
 */
export class RollbackAbortError extends Error {
  /**
   * @param {string} failedStepId - The stepId whose rollback command failed.
   * @param {Error} cause - The original error from the rollback command.
   * @param {Array<RollbackLogEntry>} partialLog - Log entries collected before the abort.
   */
  constructor(failedStepId, cause, partialLog) {
    const message =
      `Rollback aborted at step "${failedStepId}": ${cause.message}. ` +
      `${partialLog.length} step(s) rolled back before failure.`;
    super(message);
    this.name = 'RollbackAbortError';
    /** @type {string} */
    this.failedStepId = failedStepId;
    /** @type {Error} */
    this.cause = cause;
    /** @type {Array<RollbackLogEntry>} */
    this.partialLog = partialLog;
  }
}

// ─── Type Definitions ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} StepEntry
 * @property {string} stepId - Unique identifier for the step.
 * @property {Function} executeCmd - The execute function/command.
 * @property {Function} rollbackCmd - The rollback function/command.
 */

/**
 * @typedef {Object} RollbackLogEntry
 * @property {string} stepId - The step identifier.
 * @property {'success'|'failed'} status - Whether the rollback succeeded or failed.
 * @property {string} timestamp - ISO-8601 timestamp.
 * @property {string} [error] - Error message if status is 'failed'.
 */

/**
 * @typedef {Object} RollbackResult
 * @property {boolean} rollback_completed - True if all rollbacks succeeded.
 * @property {Array<RollbackLogEntry>} rollback_log - Structured log of each rollback step.
 */

// ─── RollbackManager ───────────────────────────────────────────────────────────

/**
 * Stack-based rollback manager that tracks executed workflow steps and can
 * reverse them in LIFO order when failures occur.
 *
 * @example
 * ```js
 * const mgr = new RollbackManager();
 * mgr.register('step-a', () => { ... }, () => { ... });
 * mgr.register('step-b', () => { ... }, () => { ... });
 * mgr.markCompleted('step-a');
 * mgr.markCompleted('step-b');
 * const result = await mgr.rollbackAll();
 * // result.rollback_log[0].stepId === 'step-b' (LIFO)
 * ```
 */
export class RollbackManager {
  constructor() {
    /** @type {Map<string, StepEntry>} */
    this._registry = new Map();

    /** @type {string[]} */
    this._completedStack = [];

    /** @type {Array<RollbackLogEntry>} */
    this._logs = [];
  }

  // ── Registration ──────────────────────────────────────────────────────

  /**
   * Register an (execute, rollback) pair for a sub-task step.
   *
   * @param {string} stepId - Unique step identifier.
   * @param {Function} executeCmd - Function to execute the step.
   * @param {Function} rollbackCmd - Function to reverse the step.
   * @throws {Error} If stepId is falsy, or if executeCmd/rollbackCmd are not functions.
   * @throws {Error} If stepId is already registered (duplicate).
   */
  register(stepId, executeCmd, rollbackCmd) {
    if (!stepId || typeof stepId !== 'string') {
      throw new Error('stepId must be a non-empty string.');
    }
    if (typeof executeCmd !== 'function') {
      throw new Error(`executeCmd for step "${stepId}" must be a function.`);
    }
    if (typeof rollbackCmd !== 'function') {
      throw new Error(`rollbackCmd for step "${stepId}" must be a function.`);
    }
    if (this._registry.has(stepId)) {
      throw new Error(`Step "${stepId}" is already registered.`);
    }

    this._registry.set(stepId, { stepId, executeCmd, rollbackCmd });
  }

  // ── Completion Tracking ───────────────────────────────────────────────

  /**
   * Mark a registered step as completed, pushing it onto the completed stack.
   *
   * @param {string} stepId - The step to mark as completed.
   * @throws {Error} If stepId is not found in the registry.
   */
  markCompleted(stepId) {
    if (!this._registry.has(stepId)) {
      throw new Error(
        `Cannot mark step "${stepId}" as completed: step not found in registry. ` +
        `Registered steps: [${[...this._registry.keys()].join(', ')}]`
      );
    }

    this._completedStack.push(stepId);
  }

  // ── Rollback ──────────────────────────────────────────────────────────

  /**
   * Execute all rollback hooks in reverse order (LIFO) for completed steps.
   *
   * If a rollback command fails, execution is immediately aborted and a
   * `RollbackAbortError` is thrown carrying the partial log and diagnostics.
   *
   * @returns {Promise<RollbackResult>} Result with completion status and log.
   * @throws {RollbackAbortError} If any rollback command fails.
   */
  async rollbackAll() {
    /** @type {Array<RollbackLogEntry>} */
    const rollbackLog = [];

    // Iterate in reverse order (LIFO)
    const reversedStack = [...this._completedStack].reverse();

    for (const stepId of reversedStack) {
      const entry = this._registry.get(stepId);
      const timestamp = new Date().toISOString();

      if (!entry) {
        // Defensive: should not happen if markCompleted validates
        const logEntry = {
          stepId,
          status: /** @type {const} */ ('failed'),
          timestamp,
          error: `Step "${stepId}" not found in registry during rollback.`,
        };
        rollbackLog.push(logEntry);
        this._logs.push(logEntry);
        throw new RollbackAbortError(stepId, new Error(logEntry.error), rollbackLog);
      }

      try {
        // Support both sync and async rollback commands
        await Promise.resolve(entry.rollbackCmd());

        /** @type {RollbackLogEntry} */
        const logEntry = { stepId, status: 'success', timestamp };
        rollbackLog.push(logEntry);
        this._logs.push(logEntry);
      } catch (err) {
        /** @type {RollbackLogEntry} */
        const logEntry = {
          stepId,
          status: /** @type {const} */ ('failed'),
          timestamp,
          error: err instanceof Error ? err.message : String(err),
        };
        rollbackLog.push(logEntry);
        this._logs.push(logEntry);

        // Abort immediately — do not attempt further rollbacks
        throw new RollbackAbortError(stepId, err instanceof Error ? err : new Error(String(err)), rollbackLog);
      }
    }

    // All rollbacks succeeded — clear the completed stack
    this._completedStack = [];

    /** @type {RollbackResult} */
    const result = {
      rollback_completed: true,
      rollback_log: rollbackLog,
    };

    return result;
  }

  // ── Utilities ─────────────────────────────────────────────────────────

  /**
   * Clear all state: registry, completed stack, and logs.
   */
  clear() {
    this._registry.clear();
    this._completedStack = [];
    this._logs = [];
  }

  /**
   * Get a copy of the completed stack (not a mutable reference).
   *
   * @returns {string[]} Array of stepIds in completion order.
   */
  getStack() {
    return [...this._completedStack];
  }

  /**
   * Get a copy of all accumulated rollback log entries.
   *
   * @returns {Array<RollbackLogEntry>} Array of log entries.
   */
  getLogs() {
    return [...this._logs];
  }

  /**
   * Get the number of registered steps.
   *
   * @returns {number}
   */
  get registrySize() {
    return this._registry.size;
  }

  /**
   * Check if a stepId is registered.
   *
   * @param {string} stepId
   * @returns {boolean}
   */
  hasStep(stepId) {
    return this._registry.has(stepId);
  }
}

// ─── CLI Interface ─────────────────────────────────────────────────────────────

/**
 * Thin CLI wrapper. Supports actions:
 *   - register_step <stepId>    Register a step (uses echo as placeholder commands)
 *   - execute_rollback          Rollback all completed steps
 *   - clear_stack               Clear all state
 *   - show_stack                Display current completed stack
 *
 * Usage: node rollback-manager.js <action> [args]
 */
async function cli() {
  const args = process.argv.slice(2);
  const action = args[0];

  if (!action) {
    console.error('Usage: node rollback-manager.js <action> [args]');
    console.error('Actions: register_step, execute_rollback, clear_stack, show_stack');
    process.exit(1);
  }

  // In CLI mode we use a simple in-memory manager.
  // For persistent state, a JSON file-backed implementation would be needed.
  const manager = new RollbackManager();

  switch (action) {
    case 'register_step': {
      const stepId = args[1];
      if (!stepId) {
        console.error('Usage: node rollback-manager.js register_step <stepId>');
        process.exit(1);
      }
      manager.register(
        stepId,
        () => console.log(`[execute] ${stepId}`),
        () => console.log(`[rollback] ${stepId}`)
      );
      console.log(JSON.stringify({ registered: stepId, success: true }));
      break;
    }

    case 'execute_rollback': {
      try {
        const result = await manager.rollbackAll();
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        if (err instanceof RollbackAbortError) {
          console.error(JSON.stringify({
            rollback_completed: false,
            failed_step: err.failedStepId,
            error: err.message,
            partial_log: err.partialLog,
          }, null, 2));
          process.exit(1);
        }
        throw err;
      }
      break;
    }

    case 'clear_stack': {
      manager.clear();
      console.log(JSON.stringify({ cleared: true }));
      break;
    }

    case 'show_stack': {
      console.log(JSON.stringify({
        completed_stack: manager.getStack(),
        registry_size: manager.registrySize,
        logs: manager.getLogs(),
      }, null, 2));
      break;
    }

    default:
      console.error(`Unknown action: "${action}". Use: register_step, execute_rollback, clear_stack, show_stack`);
      process.exit(1);
  }
}

// Run CLI only when executed directly (not imported)
const currentFileUrl = import.meta.url;
const executedFileUrl = process.argv[1]
  ? new URL(`file://${process.argv[1]}`).href
  : '';

if (currentFileUrl === executedFileUrl) {
  cli().catch((err) => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}
