/**
 * @module booster-integration
 * @description Integration layer that wires the agent-booster engine into the
 * dev-agent workflow. When a code modification request arrives, the booster is
 * consulted FIRST. If it succeeds (regex match + transform within 100ms), the
 * LLM call is bypassed and the file is updated directly. If it falls back, the
 * request proceeds to the LLM with the original code intact.
 *
 * @example
 *   // Direct usage
 *   import { tryBoostFirst } from './booster-integration.js';
 *   const result = await tryBoostFirst('/path/to/file.js', 'wrap_try_catch');
 *   if (result.boosted) {
 *     console.log('LLM bypassed — file updated by booster');
 *   } else {
 *     console.log(`Fallback to LLM: ${result.reason}`);
 *     // Forward result.originalCode to the LLM pipeline
 *   }
 *
 * @example
 *   // Middleware usage in dev-agent pipeline
 *   import { createBoosterMiddleware } from './booster-integration.js';
 *   const boosterMiddleware = createBoosterMiddleware();
 *   await boosterMiddleware(context, next);
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { matchIntent, applyTransform, runWithTimeout } from './booster-engine.js';

// ─── Default Configuration ─────────────────────────────────────────────────────

/** @type {number} Default timeout in ms for booster transforms */
const DEFAULT_TIMEOUT_MS = 100;

// ─── Result Builders ───────────────────────────────────────────────────────────

/**
 * Creates a successful boost result.
 * @param {string} modifiedContent - The transformed code.
 * @param {string} filePath - The absolute path of the modified file.
 * @returns {{ boosted: true, modified_content: string, filePath: string }}
 */
function boostSuccess(modifiedContent, filePath) {
  return {
    boosted: true,
    modified_content: modifiedContent,
    filePath,
  };
}

/**
 * Creates a fallback result indicating the boost could not be applied.
 * @param {'no_match' | 'timeout' | 'error'} reason - Why the boost failed.
 * @param {string | null} originalCode - The original file content (null if file couldn't be read).
 * @returns {{ boosted: false, reason: string, originalCode: string | null }}
 */
function boostFallback(reason, originalCode = null) {
  return {
    boosted: false,
    reason,
    originalCode,
  };
}

// ─── Core Integration Function ─────────────────────────────────────────────────

/**
 * Attempts to apply a booster transform to a file BEFORE routing to the LLM.
 *
 * Flow:
 *   1. Read the source file from disk
 *   2. Check `matchIntent(code, intent)` for eligibility
 *   3. If match: run `applyTransform(code, intent)` within `runWithTimeout(100ms)`
 *   4. If success: write modified content back to the file → return `{ boosted: true }`
 *   5. If fallback: return `{ boosted: false, reason, originalCode }` so the LLM can proceed
 *
 * @param {string} filePath - Path to the source file to modify.
 * @param {string} intent - Intent keyword (e.g., 'wrap_try_catch', 'add_jsdoc', 'format_syntax').
 * @param {Object} [options] - Optional configuration.
 * @param {number} [options.timeoutMs=100] - Timeout in ms for the transform operation.
 * @param {boolean} [options.dryRun=false] - If true, do not write the file (preview mode).
 * @returns {Promise<{
 *   boosted: boolean,
 *   modified_content?: string,
 *   filePath?: string,
 *   reason?: 'no_match' | 'timeout' | 'error',
 *   originalCode?: string | null
 * }>}
 */
export async function tryBoostFirst(filePath, intent, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, dryRun = false } = options;

  // ── Step 1: Validate inputs ──────────────────────────────────────────────
  if (!filePath || typeof filePath !== 'string') {
    return boostFallback('error', null);
  }

  if (!intent || typeof intent !== 'string') {
    return boostFallback('error', null);
  }

  // ── Step 2: Read the source file ─────────────────────────────────────────
  let originalCode;
  let resolvedPath;

  try {
    resolvedPath = resolve(filePath);
    originalCode = readFileSync(resolvedPath, 'utf8');
  } catch (err) {
    return boostFallback('error', null);
  }

  // ── Step 3: Check intent eligibility ─────────────────────────────────────
  if (!matchIntent(originalCode, intent)) {
    return boostFallback('no_match', originalCode);
  }

  // ── Step 4: Apply transform with timeout guard ───────────────────────────
  let result;
  try {
    result = await runWithTimeout(
      () => applyTransform(originalCode, intent),
      timeoutMs
    );
  } catch (err) {
    return boostFallback('error', originalCode);
  }

  // ── Step 5: Evaluate result ──────────────────────────────────────────────
  if (!result || result.fallback || !result.success || result.modified_content === null) {
    // Determine reason: if we got a result but it fell back, could be timeout
    // The runWithTimeout returns fallback on timeout, so we differentiate
    const reason = result && result.fallback ? 'timeout' : 'error';
    return boostFallback(reason, originalCode);
  }

  // ── Step 6: Write the modified file (unless dryRun) ──────────────────────
  if (!dryRun) {
    try {
      writeFileSync(resolvedPath, result.modified_content, 'utf8');
    } catch (err) {
      return boostFallback('error', originalCode);
    }
  }

  return boostSuccess(result.modified_content, resolvedPath);
}

// ─── Middleware Factory ────────────────────────────────────────────────────────

/**
 * Creates a middleware function for the dev-agent pipeline.
 *
 * The middleware intercepts modification requests and attempts to boost them
 * locally before they reach the LLM. The context object must contain:
 *   - `filePath` {string} — path to the target file
 *   - `intent` {string} — the modification intent
 *
 * On success: sets `context.result` with the boost result, does NOT call `next()`.
 * On fallback: preserves `context.code` with the original content, calls `next()`.
 *
 * @param {Object} [config] - Middleware configuration.
 * @param {number} [config.timeoutMs=100] - Timeout for booster transforms.
 * @param {boolean} [config.dryRun=false] - Preview mode (no file writes).
 * @returns {function(Object, Function): Promise<void>} Middleware function `(context, next) => Promise<void>`.
 */
export function createBoosterMiddleware(config = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, dryRun = false } = config;

  /**
   * Booster middleware for the dev-agent pipeline.
   * @param {Object} context - Pipeline context containing filePath, intent, and optional code.
   * @param {Function} next - Next middleware in the pipeline (typically the LLM call).
   * @returns {Promise<void>}
   */
  return async function boosterMiddleware(context, next) {
    // Validate context
    if (!context || typeof context !== 'object') {
      if (typeof next === 'function') {
        await next();
      }
      return;
    }

    const { filePath, intent } = context;

    // If no filePath or intent, skip booster and proceed to LLM
    if (!filePath || !intent) {
      if (typeof next === 'function') {
        await next();
      }
      return;
    }

    // Attempt boost
    const result = await tryBoostFirst(filePath, intent, { timeoutMs, dryRun });

    if (result.boosted) {
      // ✅ Boost succeeded — set result on context, skip LLM (don't call next)
      context.result = result;
      context.boosted = true;
    } else {
      // ⚠️ Fallback — preserve original code on context for LLM consumption
      context.boosted = false;
      context.boostReason = result.reason;

      // Attach original code to context so LLM has pristine input
      if (result.originalCode !== null) {
        context.code = result.originalCode;
      }

      // Forward to LLM pipeline
      if (typeof next === 'function') {
        await next();
      }
    }
  };
}
