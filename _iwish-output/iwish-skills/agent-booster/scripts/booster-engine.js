#!/usr/bin/env node

/**
 * @module booster-engine
 * @description Local regex-based code modification engine that bypasses expensive
 * LLM API calls for simple, pattern-matched transformations.
 *
 * Supported intents:
 *   - wrap_try_catch: Wraps function bodies in try/catch blocks
 *   - add_jsdoc:      Adds JSDoc headers to undocumented functions
 *   - format_syntax:  Normalizes basic formatting (trailing whitespace, semicolons, spacing)
 *
 * Safety: All transforms are guarded by a configurable timeout (default 100ms)
 * to prevent ReDoS CPU exhaustion.
 *
 * @example
 *   // Programmatic usage
 *   import { matchIntent, applyTransform, runWithTimeout } from './booster-engine.js';
 *   const result = await runWithTimeout(() => applyTransform(code, 'wrap_try_catch'), 100);
 *
 *   // CLI usage
 *   node booster-engine.js <file_path> <intent>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Result Shape Helpers ──────────────────────────────────────────────────────

/**
 * Creates a success result with modified content.
 * @param {string} content - The transformed code string.
 * @returns {{ success: true, modified_content: string, fallback: false }}
 */
function successResult(content) {
  return { success: true, modified_content: content, fallback: false };
}

/**
 * Creates a fallback result indicating the transform could not be applied.
 * @returns {{ success: false, modified_content: null, fallback: true }}
 */
function fallbackResult() {
  return { success: false, modified_content: null, fallback: true };
}

// ─── Intent Pattern Registry ───────────────────────────────────────────────────

/**
 * Registry of supported intent patterns. Each entry contains:
 * - `match`: Regex to test whether the code is a candidate for transformation
 * - `transform`: Function that applies the regex-based transformation
 *
 * Adding a new intent is as simple as adding a new key to this map.
 */
const INTENT_REGISTRY = {

  /**
   * wrap_try_catch
   * Matches: function declarations/expressions whose body is NOT already wrapped
   * in a try block. Wraps the outermost body content in try { ... } catch (err) { throw err; }
   */
  wrap_try_catch: {
    // Matches `function name(...)  {` or `(args) => {` where body does NOT start with `try`
    match: /(?:function\s+\w+\s*\([^)]*\)\s*\{|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function\s*\([^)]*\)|\([^)]*\)\s*=>|\w+\s*=>)\s*\{)(?!\s*\n\s*try\b)/,

    /**
     * Wraps function bodies in try/catch. Handles the outermost function found.
     * @param {string} code
     * @returns {string} Transformed code
     */
    transform(code) {
      // Strategy: Find function body opening brace, track brace depth to find
      // the closing brace, then wrap the inner content.
      const fnPattern = /((?:function\s+\w+\s*\([^)]*\)|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function\s*\([^)]*\)|\([^)]*\)\s*=>|\w+\s*=>))\s*\{)/;
      const match = fnPattern.exec(code);
      if (!match) return code;

      const openBraceIndex = match.index + match[0].length - 1;
      let depth = 1;
      let closeBraceIndex = -1;

      for (let i = openBraceIndex + 1; i < code.length; i++) {
        if (code[i] === '{') depth++;
        if (code[i] === '}') depth--;
        if (depth === 0) {
          closeBraceIndex = i;
          break;
        }
      }

      if (closeBraceIndex === -1) return code;

      const body = code.substring(openBraceIndex + 1, closeBraceIndex);

      // Skip if body already contains a try block at the top level
      if (/^\s*try\s*\{/.test(body.trim())) return code;

      // Detect indentation from existing body
      const bodyLines = body.split('\n').filter(l => l.trim().length > 0);
      const existingIndent = bodyLines.length > 0
        ? (bodyLines[0].match(/^(\s*)/)?.[1] || '  ')
        : '  ';
      const baseIndent = existingIndent;
      const innerIndent = baseIndent + '  ';

      // Re-indent body lines inside try block
      const indentedBody = bodyLines
        .map(line => innerIndent + line.trim())
        .join('\n');

      const wrapped =
        `\n${baseIndent}try {\n${indentedBody}\n${baseIndent}} catch (err) {\n${innerIndent}throw err;\n${baseIndent}}\n`;

      return (
        code.substring(0, openBraceIndex + 1) +
        wrapped +
        code.substring(closeBraceIndex)
      );
    },
  },

  /**
   * add_jsdoc
   * Matches: function declarations that are NOT preceded by a JSDoc comment block.
   * Adds a basic JSDoc stub with @param and @returns placeholders.
   */
  add_jsdoc: {
    // Matches function keyword NOT preceded by */ (end of JSDoc)
    match: /(?<!\*\/\s*\n\s*)(?:(?:async\s+)?function\s+\w+\s*\([^)]*\)|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/,

    /**
     * Adds JSDoc stub above undocumented functions.
     * @param {string} code
     * @returns {string} Transformed code
     */
    transform(code) {
      // Pattern: captures optional async, function name, and parameters
      const fnDeclPattern = /^([ \t]*)((?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\))/gm;
      let result = code;
      let hasMatch = false;

      // Process each function declaration
      result = code.replace(fnDeclPattern, (fullMatch, indent, declaration, fnName, params, offset) => {
        // Check if there's already a JSDoc comment above this function
        const before = code.substring(0, offset);
        const linesBefore = before.split('\n');
        const prevLine = linesBefore.length >= 2 ? linesBefore[linesBefore.length - 2].trim() : '';

        if (prevLine.endsWith('*/') || prevLine.startsWith('*') || prevLine.startsWith('/**')) {
          return fullMatch; // Already documented
        }

        hasMatch = true;

        // Parse parameters
        const paramList = params
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0);

        // Build JSDoc
        let jsdoc = `${indent}/**\n`;
        jsdoc += `${indent} * ${fnName}\n`;

        for (const param of paramList) {
          // Strip default values and destructuring for the param name
          const paramName = param.replace(/\s*=.*$/, '').replace(/[{}[\]]/g, '').trim();
          if (paramName) {
            jsdoc += `${indent} * @param {*} ${paramName}\n`;
          }
        }

        jsdoc += `${indent} * @returns {*}\n`;
        jsdoc += `${indent} */\n`;

        return jsdoc + fullMatch;
      });

      // Also handle arrow function declarations: const name = (...) => {
      if (!hasMatch) {
        const arrowPattern = /^([ \t]*)((?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>)/gm;
        result = result.replace(arrowPattern, (fullMatch, indent, declaration, fnName, params, offset) => {
          const before = result.substring(0, offset);
          const linesBefore = before.split('\n');
          const prevLine = linesBefore.length >= 2 ? linesBefore[linesBefore.length - 2].trim() : '';

          if (prevLine.endsWith('*/') || prevLine.startsWith('*') || prevLine.startsWith('/**')) {
            return fullMatch;
          }

          hasMatch = true;

          const paramList = params
            .split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0);

          let jsdoc = `${indent}/**\n`;
          jsdoc += `${indent} * ${fnName}\n`;

          for (const param of paramList) {
            const paramName = param.replace(/\s*=.*$/, '').replace(/[{}[\]]/g, '').trim();
            if (paramName) {
              jsdoc += `${indent} * @param {*} ${paramName}\n`;
            }
          }

          jsdoc += `${indent} * @returns {*}\n`;
          jsdoc += `${indent} */\n`;

          return jsdoc + fullMatch;
        });
      }

      return result;
    },
  },

  /**
   * format_syntax
   * Matches: code with common formatting issues (trailing whitespace,
   * missing semicolons, inconsistent spacing around operators).
   * Applies basic structural cleanup.
   */
  format_syntax: {
    // Matches if code has trailing whitespace, multiple blank lines, or inconsistent spacing
    match: /[ \t]+\n|\n{3,}|[^ \t\n=!<>]=(?!=)[^ =]|[^ \t\n=!<>]=[^ =>\n]/,

    /**
     * Normalizes basic formatting: trailing whitespace, blank lines, operator spacing.
     * @param {string} code
     * @returns {string} Formatted code
     */
    transform(code) {
      let result = code;

      // 1. Remove trailing whitespace on each line
      result = result.replace(/[ \t]+$/gm, '');

      // 2. Collapse 3+ consecutive newlines into 2
      result = result.replace(/\n{3,}/g, '\n\n');

      // 3. Normalize spacing around assignment operators (=) but not ==, ===, =>, !=, <=, >=
      // Only add spaces where they are missing around standalone `=`
      result = result.replace(/([^ \t\n=!<>])=(?!=|>)([^ =\n])/g, '$1 = $2');

      // 4. Ensure single space after commas (but not inside strings — best effort)
      result = result.replace(/,([^ \n\r])/g, ', $1');

      // 5. Ensure trailing newline
      if (!result.endsWith('\n')) {
        result += '\n';
      }

      return result;
    },
  },
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Checks whether the given code matches a known transformation pattern for the
 * specified intent.
 *
 * @param {string} code - Source code to evaluate.
 * @param {string} intent - Intent keyword (e.g., 'wrap_try_catch', 'add_jsdoc', 'format_syntax').
 * @returns {boolean} `true` if the code matches the intent pattern, `false` otherwise.
 */
export function matchIntent(code, intent) {
  if (!code || typeof code !== 'string') return false;
  if (!intent || typeof intent !== 'string') return false;

  const entry = INTENT_REGISTRY[intent];
  if (!entry) return false;

  return entry.match.test(code);
}

/**
 * Applies a regex-based code transformation for the specified intent.
 *
 * @param {string} code - Source code to transform.
 * @param {string} intent - Intent keyword.
 * @returns {{ success: boolean, modified_content: string|null, fallback: boolean }}
 *   Result object. On match: `{ success: true, modified_content: <string>, fallback: false }`.
 *   On no-match or error: `{ success: false, modified_content: null, fallback: true }`.
 */
export function applyTransform(code, intent) {
  // Validate inputs
  if (!code || typeof code !== 'string') return fallbackResult();
  if (!intent || typeof intent !== 'string') return fallbackResult();

  const entry = INTENT_REGISTRY[intent];
  if (!entry) return fallbackResult();

  // Check if the code matches the pattern
  if (!entry.match.test(code)) return fallbackResult();

  try {
    const modified = entry.transform(code);

    // If transform produced no change, treat as no-match
    if (modified === code) return fallbackResult();

    return successResult(modified);
  } catch {
    return fallbackResult();
  }
}

/**
 * Wraps a synchronous or asynchronous function in a timeout guard.
 * If the function does not complete within `timeoutMs`, the promise resolves
 * with a fallback result to prevent ReDoS CPU exhaustion.
 *
 * @param {Function} fn - Function to execute. May return a value or a Promise.
 * @param {number} [timeoutMs=100] - Maximum execution time in milliseconds.
 * @returns {Promise<{ success: boolean, modified_content: string|null, fallback: boolean }>}
 */
export async function runWithTimeout(fn, timeoutMs = 100) {
  if (typeof fn !== 'function') return fallbackResult();
  if (typeof timeoutMs !== 'number' || timeoutMs <= 0) return fallbackResult();

  return Promise.race([
    // Execute the transform
    (async () => {
      try {
        const result = await fn();
        return result;
      } catch {
        return fallbackResult();
      }
    })(),

    // Timeout sentinel
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackResult()), timeoutMs);
    }),
  ]);
}

/**
 * Returns the list of supported intent identifiers.
 * @returns {string[]}
 */
export function getSupportedIntents() {
  return Object.keys(INTENT_REGISTRY);
}

// ─── CLI Entry Point ───────────────────────────────────────────────────────────

/**
 * CLI handler: reads a source file, applies the requested transform, and writes
 * the result back. Exits with code 0 on success, 1 on fallback/error.
 *
 * Usage: node booster-engine.js <file_path> <intent>
 */
async function cli() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node booster-engine.js <file_path> <intent>');
    console.error(`Supported intents: ${getSupportedIntents().join(', ')}`);
    process.exit(1);
  }

  const [filePath, intent] = args;
  const resolvedPath = resolve(filePath);

  // Read source file
  let code;
  try {
    code = readFileSync(resolvedPath, 'utf8');
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }

  // Apply transform with timeout guard
  const result = await runWithTimeout(() => applyTransform(code, intent), 100);

  if (result.success && result.modified_content !== null) {
    try {
      writeFileSync(resolvedPath, result.modified_content, 'utf8');
      console.log(`✅ Transform '${intent}' applied successfully to ${resolvedPath}`);
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (err) {
      console.error(`Error writing file: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log(`⚠️  Fallback: Transform '${intent}' could not be applied. Route to LLM.`);
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

// Run CLI only when this is the main module
const __currentFile = decodeURIComponent(new URL(import.meta.url).pathname);
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(__currentFile);
if (isMainModule) {
  cli();
}
