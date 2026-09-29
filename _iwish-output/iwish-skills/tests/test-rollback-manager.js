/**
 * @fileoverview Unit tests for RollbackManager
 *
 * Tests cover: registration, completion tracking, LIFO rollback order,
 * abort-on-failure, structured logging, edge cases, and utility methods.
 *
 * Run: node tests/test-rollback-manager.js
 */

import assert from 'node:assert/strict';
import { RollbackManager, RollbackAbortError } from '../workflow-rollback/scripts/rollback-manager.js';

// ─── Helpers ────────────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

/**
 * Run a single test case with structured reporting.
 * @param {string} name
 * @param {Function} fn
 */
async function test(name, fn) {
  try {
    await fn();
    passCount++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
  }
}

// ─── Test Suite ─────────────────────────────────────────────────────────────────

console.log('=== Running Rollback Manager Tests ===\n');

// ── Registration Tests ──────────────────────────────────────────────────────

console.log('--- Registration ---');

await test('Register a step and verify it is stored in registry', async () => {
  const mgr = new RollbackManager();
  const execFn = () => {};
  const rollbackFn = () => {};
  mgr.register('step-1', execFn, rollbackFn);

  assert.equal(mgr.registrySize, 1);
  assert.equal(mgr.hasStep('step-1'), true);
});

await test('Reject duplicate stepId registration', async () => {
  const mgr = new RollbackManager();
  mgr.register('dup-step', () => {}, () => {});

  assert.throws(
    () => mgr.register('dup-step', () => {}, () => {}),
    { message: 'Step "dup-step" is already registered.' }
  );
});

await test('Reject registration with empty stepId', async () => {
  const mgr = new RollbackManager();
  assert.throws(() => mgr.register('', () => {}, () => {}), /stepId must be a non-empty string/);
  assert.throws(() => mgr.register(null, () => {}, () => {}), /stepId must be a non-empty string/);
});

await test('Reject registration with non-function executeCmd', async () => {
  const mgr = new RollbackManager();
  assert.throws(
    () => mgr.register('bad-exec', 'not-a-function', () => {}),
    /executeCmd for step "bad-exec" must be a function/
  );
});

await test('Reject registration with non-function rollbackCmd', async () => {
  const mgr = new RollbackManager();
  assert.throws(
    () => mgr.register('bad-rb', () => {}, 'not-a-function'),
    /rollbackCmd for step "bad-rb" must be a function/
  );
});

// ── Completion Tracking Tests ───────────────────────────────────────────────

console.log('\n--- Completion Tracking ---');

await test('markCompleted pushes step onto completed stack', async () => {
  const mgr = new RollbackManager();
  mgr.register('s1', () => {}, () => {});
  mgr.markCompleted('s1');

  const stack = mgr.getStack();
  assert.deepEqual(stack, ['s1']);
});

await test('markCompleted throws for unknown stepId', async () => {
  const mgr = new RollbackManager();
  assert.throws(
    () => mgr.markCompleted('ghost-step'),
    /Cannot mark step "ghost-step" as completed: step not found in registry/
  );
});

await test('Multiple steps maintain insertion order on stack', async () => {
  const mgr = new RollbackManager();
  mgr.register('a', () => {}, () => {});
  mgr.register('b', () => {}, () => {});
  mgr.register('c', () => {}, () => {});
  mgr.markCompleted('a');
  mgr.markCompleted('b');
  mgr.markCompleted('c');

  assert.deepEqual(mgr.getStack(), ['a', 'b', 'c']);
});

// ── getStack Immutability ───────────────────────────────────────────────────

console.log('\n--- Stack Immutability ---');

await test('getStack returns a copy, not a mutable reference', async () => {
  const mgr = new RollbackManager();
  mgr.register('x', () => {}, () => {});
  mgr.markCompleted('x');

  const stack1 = mgr.getStack();
  stack1.push('injected');

  const stack2 = mgr.getStack();
  assert.deepEqual(stack2, ['x'], 'Mutating returned stack should not affect internal state');
});

// ── Rollback Tests ──────────────────────────────────────────────────────────

console.log('\n--- rollbackAll ---');

await test('rollbackAll on empty stack returns success with empty log', async () => {
  const mgr = new RollbackManager();
  const result = await mgr.rollbackAll();

  assert.equal(result.rollback_completed, true);
  assert.deepEqual(result.rollback_log, []);
});

await test('rollbackAll executes hooks in reverse order (LIFO)', async () => {
  const mgr = new RollbackManager();
  const order = [];

  mgr.register('stage-1', () => {}, () => order.push('rb-1'));
  mgr.register('stage-2', () => {}, () => order.push('rb-2'));
  mgr.register('stage-3', () => {}, () => order.push('rb-3'));

  mgr.markCompleted('stage-1');
  mgr.markCompleted('stage-2');
  mgr.markCompleted('stage-3');

  const result = await mgr.rollbackAll();

  assert.deepEqual(order, ['rb-3', 'rb-2', 'rb-1'], 'Rollback must execute in reverse order');
  assert.equal(result.rollback_completed, true);
  assert.equal(result.rollback_log.length, 3);
  assert.equal(result.rollback_log[0].stepId, 'stage-3');
  assert.equal(result.rollback_log[1].stepId, 'stage-2');
  assert.equal(result.rollback_log[2].stepId, 'stage-1');
});

await test('rollbackAll returns structured result with rollback_completed and rollback_log', async () => {
  const mgr = new RollbackManager();
  mgr.register('only-step', () => {}, () => {});
  mgr.markCompleted('only-step');

  const result = await mgr.rollbackAll();

  assert.equal(typeof result.rollback_completed, 'boolean');
  assert.equal(result.rollback_completed, true);
  assert.ok(Array.isArray(result.rollback_log));
  assert.equal(result.rollback_log.length, 1);
});

await test('Each log entry has stepId, status, and timestamp fields', async () => {
  const mgr = new RollbackManager();
  mgr.register('logged-step', () => {}, () => {});
  mgr.markCompleted('logged-step');

  const result = await mgr.rollbackAll();
  const entry = result.rollback_log[0];

  assert.equal(entry.stepId, 'logged-step');
  assert.equal(entry.status, 'success');
  assert.ok(typeof entry.timestamp === 'string');
  // Validate ISO-8601 format
  assert.ok(!isNaN(Date.parse(entry.timestamp)), 'timestamp should be valid ISO-8601');
  assert.equal(entry.error, undefined, 'No error field on success');
});

await test('rollbackAll clears completed stack after success', async () => {
  const mgr = new RollbackManager();
  mgr.register('clearable', () => {}, () => {});
  mgr.markCompleted('clearable');

  await mgr.rollbackAll();
  assert.deepEqual(mgr.getStack(), [], 'Stack should be empty after successful rollback');
});

await test('rollbackAll supports async rollback commands', async () => {
  const mgr = new RollbackManager();
  const order = [];

  mgr.register('async-step', () => {}, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    order.push('async-done');
  });
  mgr.markCompleted('async-step');

  const result = await mgr.rollbackAll();
  assert.deepEqual(order, ['async-done']);
  assert.equal(result.rollback_completed, true);
});

// ── Abort on Failure Tests ──────────────────────────────────────────────────

console.log('\n--- Abort on Failure ---');

await test('rollbackAll throws RollbackAbortError when a hook fails', async () => {
  const mgr = new RollbackManager();
  mgr.register('good-step', () => {}, () => {});
  mgr.register('bad-step', () => {}, () => { throw new Error('disk full'); });

  mgr.markCompleted('good-step');
  mgr.markCompleted('bad-step');

  // bad-step is last completed → rolled back first (LIFO)
  await assert.rejects(
    () => mgr.rollbackAll(),
    (err) => {
      assert.ok(err instanceof RollbackAbortError);
      assert.equal(err.name, 'RollbackAbortError');
      assert.equal(err.failedStepId, 'bad-step');
      assert.ok(err.message.includes('disk full'));
      return true;
    }
  );
});

await test('RollbackAbortError carries partial log with correct entries', async () => {
  const mgr = new RollbackManager();
  const order = [];

  mgr.register('s1', () => {}, () => order.push('rb-s1'));
  mgr.register('s2', () => {}, () => { throw new Error('network down'); });
  mgr.register('s3', () => {}, () => order.push('rb-s3'));

  mgr.markCompleted('s1');
  mgr.markCompleted('s2');
  mgr.markCompleted('s3');

  // LIFO: s3 → s2 (fail) → s1 (never reached)
  try {
    await mgr.rollbackAll();
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof RollbackAbortError);
    assert.equal(err.failedStepId, 's2');

    // Partial log should have s3 (success) + s2 (failed)
    assert.equal(err.partialLog.length, 2);
    assert.equal(err.partialLog[0].stepId, 's3');
    assert.equal(err.partialLog[0].status, 'success');
    assert.equal(err.partialLog[1].stepId, 's2');
    assert.equal(err.partialLog[1].status, 'failed');
    assert.ok(err.partialLog[1].error.includes('network down'));

    // s1 should NOT have been rolled back
    assert.ok(!order.includes('rb-s1'), 'Steps after failure should NOT execute');
  }
});

await test('Abort prevents further rollbacks (fail-safe)', async () => {
  const mgr = new RollbackManager();
  const executed = [];

  mgr.register('first', () => {}, () => executed.push('first'));
  mgr.register('crasher', () => {}, () => { throw new Error('boom'); });
  mgr.register('last', () => {}, () => executed.push('last'));

  mgr.markCompleted('first');
  mgr.markCompleted('crasher');
  mgr.markCompleted('last');

  // LIFO: last → crasher (fail) → first (never)
  try {
    await mgr.rollbackAll();
  } catch {
    // expected
  }

  assert.deepEqual(executed, ['last'], 'Only steps before the failure should have executed');
});

// ── Logs Accumulation ───────────────────────────────────────────────────────

console.log('\n--- Logs ---');

await test('getLogs accumulates across multiple rollbackAll calls', async () => {
  const mgr = new RollbackManager();
  mgr.register('r1', () => {}, () => {});
  mgr.register('r2', () => {}, () => {});

  mgr.markCompleted('r1');
  await mgr.rollbackAll();

  mgr.markCompleted('r2');
  await mgr.rollbackAll();

  const logs = mgr.getLogs();
  assert.equal(logs.length, 2);
  assert.equal(logs[0].stepId, 'r1');
  assert.equal(logs[1].stepId, 'r2');
});

await test('getLogs returns a copy, not a mutable reference', async () => {
  const mgr = new RollbackManager();
  mgr.register('imm', () => {}, () => {});
  mgr.markCompleted('imm');
  await mgr.rollbackAll();

  const logs1 = mgr.getLogs();
  logs1.push({ stepId: 'fake', status: 'success', timestamp: '' });

  assert.equal(mgr.getLogs().length, 1, 'Internal logs should not be affected');
});

await test('Failed rollback entries include error field in logs', async () => {
  const mgr = new RollbackManager();
  mgr.register('err-step', () => {}, () => { throw new Error('oops'); });
  mgr.markCompleted('err-step');

  try {
    await mgr.rollbackAll();
  } catch {
    // expected
  }

  const logs = mgr.getLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].status, 'failed');
  assert.ok(logs[0].error.includes('oops'));
});

// ── Clear Tests ─────────────────────────────────────────────────────────────

console.log('\n--- Clear ---');

await test('clear() resets registry, stack, and logs', async () => {
  const mgr = new RollbackManager();
  mgr.register('c1', () => {}, () => {});
  mgr.markCompleted('c1');
  await mgr.rollbackAll();

  assert.ok(mgr.registrySize > 0);
  assert.ok(mgr.getLogs().length > 0);

  mgr.clear();

  assert.equal(mgr.registrySize, 0);
  assert.deepEqual(mgr.getStack(), []);
  assert.deepEqual(mgr.getLogs(), []);
  assert.equal(mgr.hasStep('c1'), false);
});

// ── RollbackAbortError Shape ────────────────────────────────────────────────

console.log('\n--- RollbackAbortError ---');

await test('RollbackAbortError has correct name and properties', async () => {
  const cause = new Error('test cause');
  const partialLog = [{ stepId: 'x', status: 'success', timestamp: new Date().toISOString() }];
  const err = new RollbackAbortError('failed-step', cause, partialLog);

  assert.equal(err.name, 'RollbackAbortError');
  assert.equal(err.failedStepId, 'failed-step');
  assert.equal(err.cause, cause);
  assert.deepEqual(err.partialLog, partialLog);
  assert.ok(err instanceof Error);
  assert.ok(err.message.includes('failed-step'));
  assert.ok(err.message.includes('test cause'));
});

// ── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);

if (failCount > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 ALL ROLLBACK MANAGER TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}
