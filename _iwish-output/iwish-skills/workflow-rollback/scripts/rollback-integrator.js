/**
 * @fileoverview Workflow Rollback Integrator & Fail-Safe Hook
 *
 * Embeds the RollbackManager into a pipeline runner so that step failures
 * auto-trigger LIFO rollback. If a rollback itself crashes, execution is
 * immediately aborted and control is returned to the user with a detailed
 * diagnostic report.
 *
 * Part of the Topological Rollback Engine (Epic 2, Story 2.2).
 *
 * @module workflow-rollback/rollback-integrator
 */

import { RollbackManager, RollbackAbortError } from './rollback-manager.js';

// ─── Type Definitions ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} PipelineStep
 * @property {string} stepId - Unique identifier for the step.
 * @property {Function} execute - Async/sync function to execute the step.
 * @property {Function} rollback - Async/sync function to reverse the step.
 */

/**
 * @typedef {Object} PipelineSuccessResult
 * @property {'success'} status - Pipeline completed successfully.
 * @property {string[]} completedSteps - Step IDs that completed.
 * @property {null} diagnosticReport - No report on success.
 */

/**
 * @typedef {Object} PipelineFailureResult
 * @property {'rolled_back'|'rollback_failed'} status - Outcome type.
 * @property {'WARNING'|'CRITICAL'} severity - Severity level.
 * @property {string} diagnosticReport - Markdown diagnostic report.
 * @property {Error} originalError - The step error that triggered rollback.
 * @property {string} failedStepId - The step that failed during execution.
 * @property {string[]} completedSteps - Steps that were completed before failure.
 */

// ─── WorkflowRollbackIntegrator ────────────────────────────────────────────────

/**
 * Orchestrates pipeline step execution with automatic rollback on failure.
 *
 * Wraps a `RollbackManager` instance to provide:
 * - `wrapStep()` — register + execute + markCompleted in one call
 * - `runPipeline()` — sequential execution with auto-rollback on failure
 * - `handleFailure()` — rollback orchestration with diagnostic reporting
 * - `generateDiagnosticReport()` — markdown report for user consumption
 *
 * @example
 * ```js
 * import { RollbackManager } from './rollback-manager.js';
 * import { WorkflowRollbackIntegrator } from './rollback-integrator.js';
 *
 * const mgr = new RollbackManager();
 * const integrator = new WorkflowRollbackIntegrator(mgr);
 *
 * const result = await integrator.runPipeline([
 *   { stepId: 'build', execute: () => build(), rollback: () => clean() },
 *   { stepId: 'test',  execute: () => test(),  rollback: () => resetDb() },
 * ]);
 * ```
 */
export class WorkflowRollbackIntegrator {
  /**
   * @param {RollbackManager} rollbackManager - A RollbackManager instance to delegate state management to.
   * @throws {Error} If rollbackManager is not a RollbackManager instance.
   */
  constructor(rollbackManager) {
    if (!rollbackManager || !(rollbackManager instanceof RollbackManager)) {
      throw new Error(
        'WorkflowRollbackIntegrator requires a valid RollbackManager instance.'
      );
    }

    /** @type {RollbackManager} */
    this._manager = rollbackManager;

    /** @type {string[]} */
    this._completedSteps = [];
  }

  // ── wrapStep ───────────────────────────────────────────────────────────

  /**
   * Register, execute, and mark a step as completed in a single operation.
   *
   * The step is registered and executed. Only if execution succeeds is it
   * marked as completed. If execution fails, the step remains registered
   * (with its rollback command) but is NOT on the completed stack — meaning
   * a subsequent `rollbackAll()` will not attempt to roll it back.
   *
   * @param {string} stepId - Unique step identifier.
   * @param {Function} executeFn - Function to execute the step.
   * @param {Function} rollbackFn - Function to reverse the step.
   * @returns {Promise<*>} The return value of executeFn.
   * @throws {Error} Re-throws any error from executeFn after registration.
   */
  async wrapStep(stepId, executeFn, rollbackFn) {
    // 1. Register the step (throws if invalid or duplicate)
    this._manager.register(stepId, executeFn, rollbackFn);

    // 2. Execute the step
    let result;
    try {
      result = await Promise.resolve(executeFn());
    } catch (execError) {
      // Step failed — do NOT mark as completed.
      // The rollback command is still registered but the step won't be
      // included in rollbackAll() since it's not on the completed stack.
      throw execError;
    }

    // 3. Mark as completed only on success
    this._manager.markCompleted(stepId);
    this._completedSteps.push(stepId);

    return result;
  }

  // ── runPipeline ────────────────────────────────────────────────────────

  /**
   * Run an array of pipeline steps sequentially with automatic rollback on failure.
   *
   * Each step is registered, executed, and marked completed via `wrapStep()`.
   * If any step fails:
   * 1. All previously completed steps are rolled back via `rollbackAll()`.
   * 2. If rollback succeeds → WARNING diagnostic report.
   * 3. If rollback fails (RollbackAbortError) → CRITICAL diagnostic report.
   *
   * @param {PipelineStep[]} steps - Array of step objects to execute sequentially.
   * @returns {Promise<PipelineSuccessResult|PipelineFailureResult>} Pipeline outcome.
   */
  async runPipeline(steps) {
    // Validate input
    if (!Array.isArray(steps)) {
      throw new Error('runPipeline expects an array of steps.');
    }

    // Reset tracking for this pipeline run
    this._completedSteps = [];

    // Execute steps sequentially
    for (const step of steps) {
      this._validateStep(step);

      try {
        await this.wrapStep(step.stepId, step.execute, step.rollback);
      } catch (stepError) {
        // Step failed — orchestrate rollback
        return this.handleFailure(stepError, step.stepId);
      }
    }

    // All steps succeeded
    return {
      status: 'success',
      completedSteps: [...this._completedSteps],
      diagnosticReport: null,
    };
  }

  // ── handleFailure ──────────────────────────────────────────────────────

  /**
   * Orchestrate rollback after a step failure and produce a diagnostic report.
   *
   * Attempts `rollbackAll()` on the underlying RollbackManager:
   * - On success → returns WARNING-level result with clean rollback report.
   * - On RollbackAbortError → returns CRITICAL-level result with dirty-step
   *   inventory and manual recovery instructions.
   *
   * @param {Error} originalError - The error from the failed step.
   * @param {string} [failedStepId='unknown'] - The step ID that failed.
   * @returns {Promise<PipelineFailureResult>} Diagnostic result.
   */
  async handleFailure(originalError, failedStepId = 'unknown') {
    const completedBeforeFailure = [...this._completedSteps];

    // If no steps were completed, no rollback needed
    if (completedBeforeFailure.length === 0) {
      const report = this.generateDiagnosticReport(originalError, {
        severity: 'WARNING',
        failedStepId,
        completedSteps: [],
        rollbackResult: { rollback_completed: true, rollback_log: [] },
        dirtySteps: [],
      });

      return {
        status: 'rolled_back',
        severity: 'WARNING',
        diagnosticReport: report,
        originalError,
        failedStepId,
        completedSteps: completedBeforeFailure,
      };
    }

    try {
      // Attempt rollback of all completed steps
      const rollbackResult = await this._manager.rollbackAll();

      const report = this.generateDiagnosticReport(originalError, {
        severity: 'WARNING',
        failedStepId,
        completedSteps: completedBeforeFailure,
        rollbackResult,
        dirtySteps: [],
      });

      return {
        status: 'rolled_back',
        severity: 'WARNING',
        diagnosticReport: report,
        originalError,
        failedStepId,
        completedSteps: completedBeforeFailure,
      };
    } catch (rollbackError) {
      // Rollback itself failed — CRITICAL
      if (rollbackError instanceof RollbackAbortError) {
        // Determine which steps were NOT rolled back (dirty steps)
        const rolledBackStepIds = rollbackError.partialLog
          .filter((entry) => entry.status === 'success')
          .map((entry) => entry.stepId);

        const dirtySteps = completedBeforeFailure.filter(
          (id) => !rolledBackStepIds.includes(id)
        );

        const report = this.generateDiagnosticReport(originalError, {
          severity: 'CRITICAL',
          failedStepId,
          completedSteps: completedBeforeFailure,
          rollbackError,
          dirtySteps,
        });

        return {
          status: 'rollback_failed',
          severity: 'CRITICAL',
          diagnosticReport: report,
          originalError,
          failedStepId,
          completedSteps: completedBeforeFailure,
        };
      }

      // Unexpected error type during rollback — still CRITICAL
      const report = this.generateDiagnosticReport(originalError, {
        severity: 'CRITICAL',
        failedStepId,
        completedSteps: completedBeforeFailure,
        rollbackError,
        dirtySteps: completedBeforeFailure,
      });

      return {
        status: 'rollback_failed',
        severity: 'CRITICAL',
        diagnosticReport: report,
        originalError,
        failedStepId,
        completedSteps: completedBeforeFailure,
      };
    }
  }

  // ── generateDiagnosticReport ───────────────────────────────────────────

  /**
   * Generate a markdown diagnostic report for user consumption.
   *
   * @param {Error} originalError - The error that triggered the pipeline failure.
   * @param {Object} context - Report context.
   * @param {'WARNING'|'CRITICAL'} context.severity - Severity level.
   * @param {string} context.failedStepId - Step that failed during execution.
   * @param {string[]} context.completedSteps - Steps completed before failure.
   * @param {Object} [context.rollbackResult] - Result from successful rollbackAll().
   * @param {RollbackAbortError} [context.rollbackError] - Error from failed rollback.
   * @param {string[]} context.dirtySteps - Steps that were NOT rolled back.
   * @returns {string} Markdown-formatted diagnostic report.
   */
  generateDiagnosticReport(originalError, context) {
    const {
      severity,
      failedStepId,
      completedSteps,
      rollbackResult,
      rollbackError,
      dirtySteps,
    } = context;

    const timestamp = new Date().toISOString();
    const lines = [];

    // ── Header
    lines.push(`# 🔴 Pipeline Failure Diagnostic Report`);
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| **Severity** | \`${severity}\` |`);
    lines.push(`| **Timestamp** | ${timestamp} |`);
    lines.push(`| **Failed Step** | \`${failedStepId}\` |`);
    lines.push(
      `| **Pipeline Status** | ${severity === 'CRITICAL' ? 'ROLLBACK FAILED — MANUAL INTERVENTION REQUIRED' : 'ROLLED BACK SUCCESSFULLY'} |`
    );
    lines.push('');

    // ── Original Error
    lines.push(`## 1. Original Error`);
    lines.push('');
    lines.push(`- **Step:** \`${failedStepId}\``);
    lines.push(
      `- **Error:** ${originalError instanceof Error ? originalError.message : String(originalError)}`
    );
    if (originalError instanceof Error && originalError.stack) {
      lines.push('');
      lines.push('```');
      lines.push(originalError.stack);
      lines.push('```');
    }
    lines.push('');

    // ── Completed Steps
    lines.push(`## 2. Completed Steps Before Failure`);
    lines.push('');
    if (completedSteps.length === 0) {
      lines.push('_No steps were completed before the failure._');
    } else {
      for (const stepId of completedSteps) {
        lines.push(`- \`${stepId}\``);
      }
    }
    lines.push('');

    // ── Rollback Result
    lines.push(`## 3. Rollback Result`);
    lines.push('');

    if (severity === 'WARNING' && rollbackResult) {
      lines.push('✅ **All completed steps were successfully rolled back.**');
      lines.push('');
      if (rollbackResult.rollback_log.length > 0) {
        lines.push('| Step | Status | Timestamp |');
        lines.push('|------|--------|-----------|');
        for (const entry of rollbackResult.rollback_log) {
          lines.push(
            `| \`${entry.stepId}\` | ${entry.status} | ${entry.timestamp} |`
          );
        }
      }
    } else if (severity === 'CRITICAL' && rollbackError) {
      lines.push(
        '❌ **Rollback FAILED. The environment may be in a corrupted state.**'
      );
      lines.push('');

      if (rollbackError instanceof RollbackAbortError) {
        lines.push(
          `- **Rollback failed at step:** \`${rollbackError.failedStepId}\``
        );
        lines.push(`- **Rollback error:** ${rollbackError.cause?.message || rollbackError.message}`);
        lines.push('');

        if (rollbackError.partialLog.length > 0) {
          lines.push('### Partial Rollback Log');
          lines.push('');
          lines.push('| Step | Status | Error |');
          lines.push('|------|--------|-------|');
          for (const entry of rollbackError.partialLog) {
            lines.push(
              `| \`${entry.stepId}\` | ${entry.status} | ${entry.error || '—'} |`
            );
          }
        }
      } else {
        lines.push(`- **Rollback error:** ${rollbackError.message || String(rollbackError)}`);
      }
    }
    lines.push('');

    // ── Dirty Steps
    lines.push(`## 4. Dirty Steps (Not Rolled Back)`);
    lines.push('');
    if (dirtySteps.length === 0) {
      lines.push(
        '_All steps were successfully rolled back. Environment is clean._'
      );
    } else {
      lines.push(
        '> ⚠️ **The following steps completed but were NOT rolled back.**'
      );
      lines.push(
        '> The environment may contain side-effects from these steps.'
      );
      lines.push('');
      for (const stepId of dirtySteps) {
        lines.push(`- ❗ \`${stepId}\``);
      }
    }
    lines.push('');

    // ── Manual Recovery (CRITICAL only)
    if (severity === 'CRITICAL') {
      lines.push(`## 5. Manual Recovery Instructions`);
      lines.push('');
      lines.push(
        '> 🛑 **Automatic rollback has failed. You must manually recover the environment.**'
      );
      lines.push('');
      lines.push('1. **Inspect** the dirty steps listed above.');
      lines.push(
        '2. **Manually execute** the rollback commands for each dirty step in reverse order.'
      );
      lines.push(
        '3. **Verify** the environment state before re-running the pipeline.'
      );
      lines.push(
        '4. **Check logs** in the RollbackManager for additional diagnostics.'
      );
      lines.push('');
      lines.push(
        '```bash'
      );
      lines.push(
        '# Example: Review rollback manager state'
      );
      lines.push(
        'node workflow-rollback/scripts/rollback-manager.js show_stack'
      );
      lines.push('```');
      lines.push('');
    }

    // ── Footer
    lines.push('---');
    lines.push(
      `_Report generated by WorkflowRollbackIntegrator at ${timestamp}_`
    );

    return lines.join('\n');
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  /**
   * Validate a pipeline step object.
   *
   * @param {PipelineStep} step
   * @throws {Error} If step shape is invalid.
   * @private
   */
  _validateStep(step) {
    if (!step || typeof step !== 'object') {
      throw new Error('Each pipeline step must be an object.');
    }
    if (!step.stepId || typeof step.stepId !== 'string') {
      throw new Error(
        'Each pipeline step must have a non-empty string "stepId".'
      );
    }
    if (typeof step.execute !== 'function') {
      throw new Error(
        `Step "${step.stepId}": "execute" must be a function.`
      );
    }
    if (typeof step.rollback !== 'function') {
      throw new Error(
        `Step "${step.stepId}": "rollback" must be a function.`
      );
    }
  }

  // ── Accessors ──────────────────────────────────────────────────────────

  /**
   * Get the list of step IDs completed in the current/last pipeline run.
   *
   * @returns {string[]} Copy of completed step IDs.
   */
  getCompletedSteps() {
    return [...this._completedSteps];
  }

  /**
   * Get the underlying RollbackManager instance.
   *
   * @returns {RollbackManager}
   */
  getManager() {
    return this._manager;
  }
}

// Re-export for convenience
export { RollbackManager, RollbackAbortError };
