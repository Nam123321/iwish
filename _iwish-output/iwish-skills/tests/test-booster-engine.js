/**
 * @module test-booster-engine
 * @description Comprehensive test suite for the Agent Booster Engine.
 * Tests all 3 intents (wrap_try_catch, add_jsdoc, format_syntax),
 * timeout guard, edge cases, and performance requirements.
 *
 * Run: node --experimental-vm-modules tests/test-booster-engine.js
 *   or: node tests/test-booster-engine.js
 */

import { strict as assert } from 'node:assert';
import {
  matchIntent,
  applyTransform,
  runWithTimeout,
  getSupportedIntents,
} from '../agent-booster/scripts/booster-engine.js';

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

// ─── Test Suite ────────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n=== Agent Booster Engine Tests ===\n');

  // ── Section 1: getSupportedIntents ─────────────────────────────────────────

  console.log('── getSupportedIntents ──');

  await test('T0: Returns array of at least 3 supported intents', () => {
    const intents = getSupportedIntents();
    assert.ok(Array.isArray(intents), 'Should return an array');
    assert.ok(intents.length >= 3, `Expected >= 3 intents, got ${intents.length}`);
    assert.ok(intents.includes('wrap_try_catch'));
    assert.ok(intents.includes('add_jsdoc'));
    assert.ok(intents.includes('format_syntax'));
  });

  // ── Section 2: matchIntent ─────────────────────────────────────────────────

  console.log('\n── matchIntent ──');

  await test('T1: matchIntent returns true for valid wrap_try_catch code', () => {
    const code = `function greet(name) {\n  console.log(name);\n}`;
    assert.strictEqual(matchIntent(code, 'wrap_try_catch'), true);
  });

  await test('T2: matchIntent returns false for already-wrapped code', () => {
    const code = `function greet(name) {\n  try {\n    console.log(name);\n  } catch(e) {}\n}`;
    assert.strictEqual(matchIntent(code, 'wrap_try_catch'), false);
  });

  await test('T3: matchIntent returns true for undocumented function (add_jsdoc)', () => {
    const code = `function calculate(a, b) {\n  return a + b;\n}`;
    assert.strictEqual(matchIntent(code, 'add_jsdoc'), true);
  });

  await test('T4: matchIntent returns true for code with trailing whitespace (format_syntax)', () => {
    const code = `const x = 1;   \nconst y = 2;\n`;
    assert.strictEqual(matchIntent(code, 'format_syntax'), true);
  });

  await test('T5: matchIntent returns false for unknown intent', () => {
    const code = `function test() {}`;
    assert.strictEqual(matchIntent(code, 'unknown_intent'), false);
  });

  await test('T6: matchIntent returns false for empty code', () => {
    assert.strictEqual(matchIntent('', 'wrap_try_catch'), false);
    assert.strictEqual(matchIntent(null, 'wrap_try_catch'), false);
    assert.strictEqual(matchIntent(undefined, 'wrap_try_catch'), false);
  });

  await test('T7: matchIntent returns false for null/undefined intent', () => {
    assert.strictEqual(matchIntent('code', null), false);
    assert.strictEqual(matchIntent('code', undefined), false);
    assert.strictEqual(matchIntent('code', ''), false);
  });

  // ── Section 3: applyTransform — wrap_try_catch ─────────────────────────────

  console.log('\n── applyTransform: wrap_try_catch ──');

  await test('T8: Wraps function body in try/catch', () => {
    const code = `function greet(name) {\n  console.log(name);\n}`;
    const result = applyTransform(code, 'wrap_try_catch');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallback, false);
    assert.ok(result.modified_content !== null);
    assert.ok(result.modified_content.includes('try {'), 'Should contain try block');
    assert.ok(result.modified_content.includes('catch (err)'), 'Should contain catch block');
    assert.ok(result.modified_content.includes('console.log(name)'), 'Should preserve original body');
  });

  await test('T9: Wraps const arrow function in try/catch', () => {
    const code = `const greet = (name) => {\n  console.log(name);\n}`;
    const result = applyTransform(code, 'wrap_try_catch');

    assert.strictEqual(result.success, true);
    assert.ok(result.modified_content.includes('try {'));
    assert.ok(result.modified_content.includes('catch (err)'));
  });

  await test('T10: Does not double-wrap already-wrapped function', () => {
    const code = `function greet(name) {\n  try {\n    console.log(name);\n  } catch (err) {\n    throw err;\n  }\n}`;
    const result = applyTransform(code, 'wrap_try_catch');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
    assert.strictEqual(result.modified_content, null);
  });

  // ── Section 4: applyTransform — add_jsdoc ──────────────────────────────────

  console.log('\n── applyTransform: add_jsdoc ──');

  await test('T11: Adds JSDoc to undocumented function', () => {
    const code = `function calculate(a, b) {\n  return a + b;\n}`;
    const result = applyTransform(code, 'add_jsdoc');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallback, false);
    assert.ok(result.modified_content.includes('/**'), 'Should contain JSDoc opening');
    assert.ok(result.modified_content.includes('*/'), 'Should contain JSDoc closing');
    assert.ok(result.modified_content.includes('@param'), 'Should contain @param');
    assert.ok(result.modified_content.includes('@returns'), 'Should contain @returns');
    assert.ok(result.modified_content.includes('calculate'), 'Should mention function name');
  });

  await test('T12: Adds JSDoc with correct parameter names', () => {
    const code = `function add(x, y, z) {\n  return x + y + z;\n}`;
    const result = applyTransform(code, 'add_jsdoc');

    assert.strictEqual(result.success, true);
    assert.ok(result.modified_content.includes('@param {*} x'));
    assert.ok(result.modified_content.includes('@param {*} y'));
    assert.ok(result.modified_content.includes('@param {*} z'));
  });

  await test('T13: Does not add JSDoc to already-documented function', () => {
    const code = `/**\n * Documented function.\n * @param {string} name\n */\nfunction greet(name) {\n  return name;\n}`;
    const result = applyTransform(code, 'add_jsdoc');

    // Should fallback since the function is already documented
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  await test('T14: Handles async function declarations', () => {
    const code = `async function fetchData(url) {\n  return await fetch(url);\n}`;
    const result = applyTransform(code, 'add_jsdoc');

    assert.strictEqual(result.success, true);
    assert.ok(result.modified_content.includes('/**'));
    assert.ok(result.modified_content.includes('fetchData'));
    assert.ok(result.modified_content.includes('@param {*} url'));
  });

  await test('T15: Handles function with no parameters', () => {
    const code = `function noop() {\n  // nothing\n}`;
    const result = applyTransform(code, 'add_jsdoc');

    assert.strictEqual(result.success, true);
    assert.ok(result.modified_content.includes('/**'));
    assert.ok(result.modified_content.includes('@returns'));
    // Should NOT contain @param since there are none
    assert.ok(!result.modified_content.includes('@param'));
  });

  // ── Section 5: applyTransform — format_syntax ──────────────────────────────

  console.log('\n── applyTransform: format_syntax ──');

  await test('T16: Removes trailing whitespace', () => {
    const code = `const x = 1;   \nconst y = 2;  \n`;
    const result = applyTransform(code, 'format_syntax');

    assert.strictEqual(result.success, true);
    assert.ok(!result.modified_content.match(/[ \t]+\n/), 'Should have no trailing whitespace');
  });

  await test('T17: Collapses multiple blank lines', () => {
    const code = `const a = 1;\n\n\n\n\nconst b = 2;\n`;
    const result = applyTransform(code, 'format_syntax');

    assert.strictEqual(result.success, true);
    assert.ok(!result.modified_content.includes('\n\n\n'), 'Should not have 3+ consecutive newlines');
  });

  await test('T18: Adds spacing around assignment operators', () => {
    const code = `const x=1;\n`;
    const result = applyTransform(code, 'format_syntax');

    assert.strictEqual(result.success, true);
    assert.ok(result.modified_content.includes('x = 1'), 'Should add spaces around =');
  });

  await test('T19: Returns fallback for already-clean code', () => {
    const code = `const x = 1;\nconst y = 2;\n`;
    const result = applyTransform(code, 'format_syntax');

    // Already clean code won't match the format_syntax patterns
    assert.strictEqual(result.fallback, true);
  });

  // ── Section 6: applyTransform — Edge Cases ─────────────────────────────────

  console.log('\n── applyTransform: edge cases ──');

  await test('T20: Returns fallback for unknown intent', () => {
    const result = applyTransform('function test() {}', 'nonexistent');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.modified_content, null);
    assert.strictEqual(result.fallback, true);
  });

  await test('T21: Returns fallback for empty string input', () => {
    const result = applyTransform('', 'wrap_try_catch');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  await test('T22: Returns fallback for null input', () => {
    const result = applyTransform(null, 'wrap_try_catch');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  await test('T23: Returns fallback for undefined intent', () => {
    const result = applyTransform('code', undefined);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  await test('T24: Returns fallback for numeric input', () => {
    const result = applyTransform(12345, 'wrap_try_catch');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  // ── Section 7: runWithTimeout ──────────────────────────────────────────────

  console.log('\n── runWithTimeout ──');

  await test('T25: Resolves fast synchronous function within timeout', async () => {
    const result = await runWithTimeout(() => {
      return { success: true, modified_content: 'hello', fallback: false };
    }, 100);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.modified_content, 'hello');
    assert.strictEqual(result.fallback, false);
  });

  await test('T26: Resolves fast async function within timeout', async () => {
    const result = await runWithTimeout(async () => {
      return { success: true, modified_content: 'async-result', fallback: false };
    }, 100);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.modified_content, 'async-result');
  });

  await test('T27: Returns fallback when function exceeds timeout', async () => {
    const result = await runWithTimeout(async () => {
      // Simulate a slow operation
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true, modified_content: 'too-slow', fallback: false };
    }, 50);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.modified_content, null);
    assert.strictEqual(result.fallback, true);
  });

  await test('T28: Returns fallback when function throws', async () => {
    const result = await runWithTimeout(() => {
      throw new Error('Boom!');
    }, 100);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  await test('T29: Returns fallback for non-function argument', async () => {
    const result = await runWithTimeout('not-a-function', 100);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  await test('T30: Returns fallback for invalid timeout value', async () => {
    const result = await runWithTimeout(() => ({ success: true }), -1);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);

    const result2 = await runWithTimeout(() => ({ success: true }), 0);
    assert.strictEqual(result2.success, false);
    assert.strictEqual(result2.fallback, true);
  });

  await test('T31: Uses default 100ms timeout when not specified', async () => {
    const result = await runWithTimeout(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return { success: true, modified_content: 'late', fallback: false };
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  // ── Section 8: Integration — runWithTimeout + applyTransform ───────────────

  console.log('\n── Integration: runWithTimeout + applyTransform ──');

  await test('T32: Full pipeline: timeout wrapping applyTransform succeeds', async () => {
    const code = `function hello(name) {\n  console.log(name);\n}`;
    const result = await runWithTimeout(() => applyTransform(code, 'wrap_try_catch'), 100);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallback, false);
    assert.ok(result.modified_content.includes('try {'));
  });

  await test('T33: Full pipeline: timeout wrapping applyTransform with unknown intent', async () => {
    const code = `function test() {}`;
    const result = await runWithTimeout(() => applyTransform(code, 'bad_intent'), 100);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });

  // ── Section 9: Performance ─────────────────────────────────────────────────

  console.log('\n── Performance ──');

  await test('T34: wrap_try_catch completes in under 10ms', () => {
    const code = `function process(data) {\n  const result = data.map(x => x * 2);\n  return result;\n}`;
    const start = performance.now();
    applyTransform(code, 'wrap_try_catch');
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 10, `Expected < 10ms, got ${elapsed.toFixed(2)}ms`);
  });

  await test('T35: add_jsdoc completes in under 10ms', () => {
    const code = `function compute(a, b, c) {\n  return a * b + c;\n}`;
    const start = performance.now();
    applyTransform(code, 'add_jsdoc');
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 10, `Expected < 10ms, got ${elapsed.toFixed(2)}ms`);
  });

  await test('T36: format_syntax completes in under 10ms', () => {
    const code = `const a=1;  \nconst b=2;\n\n\n\nconst c=3;\n`;
    const start = performance.now();
    applyTransform(code, 'format_syntax');
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 10, `Expected < 10ms, got ${elapsed.toFixed(2)}ms`);
  });

  // ── Section 10: Result Shape Validation ────────────────────────────────────

  console.log('\n── Result shape validation ──');

  await test('T37: Success result has correct shape', () => {
    const code = `function test(x) {\n  return x;\n}`;
    const result = applyTransform(code, 'wrap_try_catch');

    assert.ok('success' in result, 'Must have success field');
    assert.ok('modified_content' in result, 'Must have modified_content field');
    assert.ok('fallback' in result, 'Must have fallback field');
    assert.strictEqual(typeof result.success, 'boolean');
    assert.strictEqual(typeof result.modified_content, 'string');
    assert.strictEqual(typeof result.fallback, 'boolean');
  });

  await test('T38: Fallback result has correct shape', () => {
    const result = applyTransform('random text', 'unknown');

    assert.ok('success' in result);
    assert.ok('modified_content' in result);
    assert.ok('fallback' in result);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.modified_content, null);
    assert.strictEqual(result.fallback, true);
  });

  // ── Summary ────────────────────────────────────────────────────────────────

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
