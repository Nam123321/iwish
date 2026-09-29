/**
 * @module test-booster-integration
 * @description Comprehensive test suite for the booster-integration module.
 * Tests tryBoostFirst() and createBoosterMiddleware() across all AC paths:
 *   - Boost success → file written, LLM bypassed
 *   - Boost fallback → original code preserved, LLM proceeds
 *   - Error handling → graceful fallback with reason codes
 *   - Middleware pipeline composition
 *
 * Run: node tests/test-booster-integration.js
 */

import { strict as assert } from 'node:assert';
import { writeFileSync, readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  tryBoostFirst,
  createBoosterMiddleware,
} from '../agent-booster/scripts/booster-integration.js';

let passed = 0;
let failed = 0;

/**
 * Simple test runner helper.
 * @param {string} name - Test description
 * @param {Function} fn - Test function (may be async)
 */
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ─── Temp File Helpers ─────────────────────────────────────────────────────────

let tempDir;

/**
 * Creates a temporary file with given content and returns its path.
 * @param {string} filename
 * @param {string} content
 * @returns {string} Absolute path to the temporary file
 */
function createTempFile(filename, content) {
  const filePath = join(tempDir, filename);
  writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Reads a temporary file's content.
 * @param {string} filePath
 * @returns {string}
 */
function readTempFile(filePath) {
  return readFileSync(filePath, 'utf8');
}

// ─── Test Suite ────────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n=== Booster Integration Tests ===\n');

  // Set up temp directory for file I/O tests
  tempDir = mkdtempSync(join(tmpdir(), 'booster-integration-'));

  try {
    // ── Section 1: tryBoostFirst — Success Path ────────────────────────────

    console.log('── tryBoostFirst: success path ──');

    await test('T1: Boost succeeds for matching wrap_try_catch intent', async () => {
      const code = `function greet(name) {\n  console.log(name);\n}`;
      const filePath = createTempFile('t1.js', code);

      const result = await tryBoostFirst(filePath, 'wrap_try_catch');

      assert.strictEqual(result.boosted, true);
      assert.ok(result.modified_content !== undefined);
      assert.ok(result.modified_content.includes('try {'), 'Modified content should have try block');
      assert.ok(result.modified_content.includes('catch (err)'), 'Modified content should have catch block');
      assert.ok(result.filePath, 'Should include filePath');
    });

    await test('T2: Boost succeeds for matching add_jsdoc intent', async () => {
      const code = `function calculate(a, b) {\n  return a + b;\n}`;
      const filePath = createTempFile('t2.js', code);

      const result = await tryBoostFirst(filePath, 'add_jsdoc');

      assert.strictEqual(result.boosted, true);
      assert.ok(result.modified_content.includes('/**'));
      assert.ok(result.modified_content.includes('@param'));
      assert.ok(result.modified_content.includes('@returns'));
    });

    await test('T3: Boost succeeds for matching format_syntax intent', async () => {
      const code = `const x=1;   \nconst y=2;\n`;
      const filePath = createTempFile('t3.js', code);

      const result = await tryBoostFirst(filePath, 'format_syntax');

      assert.strictEqual(result.boosted, true);
      assert.ok(!result.modified_content.match(/[ \t]+\n/), 'Should have no trailing whitespace');
    });

    await test('T7: File is written on successful boost', async () => {
      const code = `function hello(name) {\n  return name;\n}`;
      const filePath = createTempFile('t7.js', code);

      const result = await tryBoostFirst(filePath, 'wrap_try_catch');
      assert.strictEqual(result.boosted, true);

      const fileContent = readTempFile(filePath);
      assert.ok(fileContent.includes('try {'), 'File on disk should contain try block');
      assert.ok(fileContent.includes('catch (err)'), 'File on disk should contain catch block');
      assert.strictEqual(fileContent, result.modified_content, 'File content should match result');
    });

    // ── Section 2: tryBoostFirst — Fallback Path ───────────────────────────

    console.log('\n── tryBoostFirst: fallback path ──');

    await test('T4: Fallback with reason no_match for non-matching intent', async () => {
      // Already-wrapped code won't match wrap_try_catch
      const code = `function greet(name) {\n  try {\n    console.log(name);\n  } catch (err) {\n    throw err;\n  }\n}`;
      const filePath = createTempFile('t4.js', code);

      const result = await tryBoostFirst(filePath, 'wrap_try_catch');

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'no_match');
      assert.ok(result.originalCode !== null, 'Should include original code');
      assert.strictEqual(result.originalCode, code, 'Original code should be unchanged');
    });

    await test('T5: Fallback with reason no_match for unknown intent', async () => {
      const code = `function test() { return 1; }`;
      const filePath = createTempFile('t5.js', code);

      const result = await tryBoostFirst(filePath, 'nonexistent_intent');

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'no_match');
      assert.strictEqual(result.originalCode, code);
    });

    await test('T6: File is NOT written on fallback', async () => {
      const code = `function greet(name) {\n  try {\n    console.log(name);\n  } catch (err) {}\n}`;
      const filePath = createTempFile('t6.js', code);

      const result = await tryBoostFirst(filePath, 'wrap_try_catch');
      assert.strictEqual(result.boosted, false);

      const fileContent = readTempFile(filePath);
      assert.strictEqual(fileContent, code, 'File should be unchanged on fallback');
    });

    // ── Section 3: tryBoostFirst — Error Path ──────────────────────────────

    console.log('\n── tryBoostFirst: error path ──');

    await test('T3e: Error fallback for non-existent file', async () => {
      const result = await tryBoostFirst('/non/existent/file.js', 'wrap_try_catch');

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'error');
      assert.strictEqual(result.originalCode, null, 'No original code when file cannot be read');
    });

    await test('T14a: Error fallback for null filePath', async () => {
      const result = await tryBoostFirst(null, 'wrap_try_catch');

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'error');
      assert.strictEqual(result.originalCode, null);
    });

    await test('T14b: Error fallback for undefined filePath', async () => {
      const result = await tryBoostFirst(undefined, 'wrap_try_catch');

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'error');
      assert.strictEqual(result.originalCode, null);
    });

    await test('T14c: Error fallback for null intent', async () => {
      const code = `function test() {}`;
      const filePath = createTempFile('t14c.js', code);

      const result = await tryBoostFirst(filePath, null);

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'error');
    });

    await test('T14d: Error fallback for empty string filePath', async () => {
      const result = await tryBoostFirst('', 'wrap_try_catch');

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'error');
    });

    // ── Section 4: tryBoostFirst — Edge Cases ──────────────────────────────

    console.log('\n── tryBoostFirst: edge cases ──');

    await test('T13: Empty file content → graceful fallback', async () => {
      const filePath = createTempFile('t13.js', '');

      const result = await tryBoostFirst(filePath, 'wrap_try_catch');

      assert.strictEqual(result.boosted, false);
      assert.strictEqual(result.reason, 'no_match');
    });

    await test('T12: dryRun mode does not write file', async () => {
      const code = `function greet(name) {\n  console.log(name);\n}`;
      const filePath = createTempFile('t12.js', code);

      const result = await tryBoostFirst(filePath, 'wrap_try_catch', { dryRun: true });

      assert.strictEqual(result.boosted, true, 'Should report success');
      assert.ok(result.modified_content.includes('try {'), 'Should have transformed content');

      // But the file on disk should remain UNCHANGED
      const fileContent = readTempFile(filePath);
      assert.strictEqual(fileContent, code, 'File should NOT be modified in dryRun mode');
    });

    await test('T5t: Custom timeout option is respected', async () => {
      const code = `function greet(name) {\n  console.log(name);\n}`;
      const filePath = createTempFile('t5t.js', code);

      // With a very generous timeout, should succeed
      const result = await tryBoostFirst(filePath, 'wrap_try_catch', { timeoutMs: 5000 });

      assert.strictEqual(result.boosted, true);
      assert.ok(result.modified_content.includes('try {'));
    });

    // ── Section 5: Result Shape Validation ──────────────────────────────────

    console.log('\n── Result shape validation ──');

    await test('T15: Success result has all required fields', async () => {
      const code = `function test(x) {\n  return x;\n}`;
      const filePath = createTempFile('t15.js', code);

      const result = await tryBoostFirst(filePath, 'wrap_try_catch');

      assert.ok('boosted' in result, 'Must have boosted field');
      assert.ok('modified_content' in result, 'Must have modified_content field');
      assert.ok('filePath' in result, 'Must have filePath field');
      assert.strictEqual(typeof result.boosted, 'boolean');
      assert.strictEqual(typeof result.modified_content, 'string');
      assert.strictEqual(typeof result.filePath, 'string');
      assert.strictEqual(result.boosted, true);
    });

    await test('T16: Fallback result has all required fields', async () => {
      const code = `function greet(name) {\n  try {\n    console.log(name);\n  } catch (err) {}\n}`;
      const filePath = createTempFile('t16.js', code);

      const result = await tryBoostFirst(filePath, 'wrap_try_catch');

      assert.ok('boosted' in result, 'Must have boosted field');
      assert.ok('reason' in result, 'Must have reason field');
      assert.ok('originalCode' in result, 'Must have originalCode field');
      assert.strictEqual(typeof result.boosted, 'boolean');
      assert.strictEqual(typeof result.reason, 'string');
      assert.strictEqual(result.boosted, false);
      assert.ok(['no_match', 'timeout', 'error'].includes(result.reason), `Reason should be valid, got: ${result.reason}`);
    });

    // ── Section 6: createBoosterMiddleware ──────────────────────────────────

    console.log('\n── createBoosterMiddleware ──');

    await test('T8: createBoosterMiddleware returns a function', () => {
      const middleware = createBoosterMiddleware();
      assert.strictEqual(typeof middleware, 'function');
    });

    await test('T9: Middleware calls next() on fallback', async () => {
      const middleware = createBoosterMiddleware();
      const code = `function greet(name) {\n  try {\n    console.log(name);\n  } catch (err) {}\n}`;
      const filePath = createTempFile('t9.js', code);

      let nextCalled = false;
      const context = { filePath, intent: 'wrap_try_catch' };

      await middleware(context, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, 'next() should be called on fallback');
      assert.strictEqual(context.boosted, false, 'context.boosted should be false');
      assert.ok(context.boostReason, 'context.boostReason should be set');
    });

    await test('T10: Middleware does NOT call next() on success', async () => {
      const middleware = createBoosterMiddleware();
      const code = `function greet(name) {\n  console.log(name);\n}`;
      const filePath = createTempFile('t10.js', code);

      let nextCalled = false;
      const context = { filePath, intent: 'wrap_try_catch' };

      await middleware(context, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, 'next() should NOT be called on success');
      assert.strictEqual(context.boosted, true, 'context.boosted should be true');
      assert.ok(context.result, 'context.result should be set');
      assert.ok(context.result.modified_content.includes('try {'));
    });

    await test('T11: Middleware preserves context.code with original on fallback', async () => {
      const middleware = createBoosterMiddleware();
      const code = `const x = 1;\nconst y = 2;\n`;  // Already clean — no match
      const filePath = createTempFile('t11.js', code);

      const context = { filePath, intent: 'format_syntax' };

      await middleware(context, () => {});

      assert.strictEqual(context.boosted, false);
      assert.strictEqual(context.code, code, 'context.code should contain original code');
    });

    await test('T17: Middleware calls next() when context is missing filePath', async () => {
      const middleware = createBoosterMiddleware();

      let nextCalled = false;
      const context = { intent: 'wrap_try_catch' };

      await middleware(context, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, 'next() should be called when filePath is missing');
    });

    await test('T18: Middleware calls next() when context is missing intent', async () => {
      const middleware = createBoosterMiddleware();
      const filePath = createTempFile('t18.js', 'const x = 1;');

      let nextCalled = false;
      const context = { filePath };

      await middleware(context, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, 'next() should be called when intent is missing');
    });

    await test('T19: Middleware handles null context gracefully', async () => {
      const middleware = createBoosterMiddleware();

      let nextCalled = false;

      await middleware(null, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, 'next() should be called for null context');
    });

    await test('T20: Middleware works with dryRun config', async () => {
      const middleware = createBoosterMiddleware({ dryRun: true });
      const code = `function greet(name) {\n  console.log(name);\n}`;
      const filePath = createTempFile('t20.js', code);

      const context = { filePath, intent: 'wrap_try_catch' };

      await middleware(context, () => {});

      assert.strictEqual(context.boosted, true, 'Should report success');

      // File should NOT be written in dryRun mode
      const fileContent = readTempFile(filePath);
      assert.strictEqual(fileContent, code, 'File should remain unchanged in dryRun');
    });

    await test('T21: Middleware handles missing next() gracefully on success', async () => {
      const middleware = createBoosterMiddleware();
      const code = `function greet(name) {\n  console.log(name);\n}`;
      const filePath = createTempFile('t21.js', code);

      const context = { filePath, intent: 'wrap_try_catch' };

      // No error even when next is not provided on the success path
      await middleware(context, undefined);

      assert.strictEqual(context.boosted, true);
    });

    await test('T22: Middleware handles missing next() gracefully on fallback', async () => {
      const middleware = createBoosterMiddleware();
      const context = { filePath: '/non/existent.js', intent: 'wrap_try_catch' };

      // Should not throw even without next()
      await middleware(context, undefined);

      assert.strictEqual(context.boosted, false);
    });

    // ── Section 7: Integration — Full Pipeline ─────────────────────────────

    console.log('\n── Integration: full pipeline ──');

    await test('T23: Full pipeline: boost then verify file content', async () => {
      const originalCode = `function process(data) {\n  const result = data.map(x => x * 2);\n  return result;\n}`;
      const filePath = createTempFile('t23.js', originalCode);

      // Step 1: Try boost
      const result = await tryBoostFirst(filePath, 'wrap_try_catch');
      assert.strictEqual(result.boosted, true);

      // Step 2: Verify file was updated
      const updatedContent = readTempFile(filePath);
      assert.ok(updatedContent.includes('try {'));
      assert.ok(updatedContent.includes('catch (err)'));
      assert.ok(updatedContent.includes('data.map'));

      // Step 3: Verify result.modified_content matches file
      assert.strictEqual(updatedContent, result.modified_content);
    });

    await test('T24: Full pipeline: fallback preserves file and provides code to LLM', async () => {
      const originalCode = `const x = 1;\nconst y = 2;\n`; // Already clean
      const filePath = createTempFile('t24.js', originalCode);

      // Step 1: Try boost — should fallback
      const result = await tryBoostFirst(filePath, 'format_syntax');
      assert.strictEqual(result.boosted, false);

      // Step 2: File should be unchanged
      const fileContent = readTempFile(filePath);
      assert.strictEqual(fileContent, originalCode);

      // Step 3: originalCode should be available for LLM
      assert.strictEqual(result.originalCode, originalCode);
    });

    await test('T25: Multiple sequential boosts on same file', async () => {
      // Start with undocumented, unformatted function
      const code = `function add(a,b) {\n  return a+b;\n}`;
      const filePath = createTempFile('t25.js', code);

      // Boost 1: add_jsdoc
      const r1 = await tryBoostFirst(filePath, 'add_jsdoc');
      assert.strictEqual(r1.boosted, true, 'First boost (add_jsdoc) should succeed');
      assert.ok(r1.modified_content.includes('/**'));

      // Boost 2: wrap_try_catch on the now-documented file
      const r2 = await tryBoostFirst(filePath, 'wrap_try_catch');
      assert.strictEqual(r2.boosted, true, 'Second boost (wrap_try_catch) should succeed');
      assert.ok(r2.modified_content.includes('try {'));

      // Final file should have both JSDoc and try/catch
      const finalContent = readTempFile(filePath);
      assert.ok(finalContent.includes('/**'), 'Final file should have JSDoc');
      assert.ok(finalContent.includes('try {'), 'Final file should have try/catch');
    });

  } finally {
    // ── Cleanup ──────────────────────────────────────────────────────────────
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} TEST(S) FAILED\n`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${passed} TESTS PASSED SUCCESSFULLY! 🎉\n`);
    process.exit(0);
  }
}

runAllTests();
