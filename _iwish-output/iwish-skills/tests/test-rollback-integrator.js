/**
 * @fileoverview Unit tests for WorkflowRollbackIntegrator
 *
 * Tests cover: wrapStep atomic behavior, runPipeline success/failure paths,
 * auto-rollback on step failure, CRITICAL abort on rollback failure,
 * diagnostic report generation, edge cases (empty pipeline, first-step failure).
 *
 * Run: node tests/test-rollback-integrator.js
 */

import assert from 'node:assert/strict';
import {
  WorkflowRollbackIntegrator,
  RollbackManager,
  RollbackAbortError,
} from '../workflow-rollback/scripts/rollback-integrator.js';

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
    if (err.stack) {
      // Show the first few lines of stack for debugging
      const stackLines = err.stack.split('\n').slice(1, 4).join('\n');
      console.error(`     ${stackLines}`);
    }
  }
}

/**
 * Create a fresh integrator with a new RollbackManager.
 * @returns {WorkflowRollbackIntegrator}
 */
function createIntegrator() {
  return new WorkflowRollbackIntegrator(new RollbackManager());
}

// ─── Test Suite ─────────────────────────────────────────────────────────────────

console.log('=== Running Rollback Integrator Tests ===\n');

// ── Constructor Tests ───────────────────────────────────────────────────────

console.log('--- Constructor ---');

await test('Constructor accepts a valid RollbackManager', async () => {
  const mgr = new RollbackManager();
  const integrator = new WorkflowRollbackIntegrator(mgr);
  assert.equal(integrator.getManager(), mgr);
});

await test('Constructor rejects null/undefined', async () => {
  assert.throws(
    () => new WorkflowRollbackIntegrator(null),
    /requires a valid RollbackManager instance/
  );
  assert.throws(
    () => new WorkflowRollbackIntegrator(undefined),
    /requires a valid RollbackManager instance/
  );
});

await test('Constructor rejects non-RollbackManager objects', async () => {
  assert.throws(
    () => new WorkflowRollbackIntegrator({ fake: true }),
    /requires a valid RollbackManager instance/
  );
  assert.throws(
    () => new WorkflowRollbackIntegrator('string'),
    /requires a valid RollbackManager instance/
  );
});

// ── wrapStep Tests ──────────────────────────────────────────────────────────

console.log('\n--- wrapStep ---');

await test('wrapStep registers, executes, and marks step as completed (AC4)', async () => {
  const integrator = createIntegrator();
  const executionLog = [];

  await integrator.wrapStep(
    'step-a',
    () => executionLog.push('executed-a'),
    () => executionLog.push('rollback-a')
  );

  // Step was executed
  assert.deepEqual(executionLog, ['executed-a']);

  // Step is on the completed stack
  assert.deepEqual(integrator.getManager().getStack(), ['step-a']);

  // Step is tracked by integrator
  assert.deepEqual(integrator.getCompletedSteps(), ['step-a']);
});

await test('wrapStep does NOT mark step completed if execution throws (AC4)', async () => {
  const integrator = createIntegrator();

  await assert.rejects(
    () => integrator.wrapStep(
      'failing-step',
      () => { throw new Error('exec failed'); },
      () => {}
    ),
    { message: 'exec failed' }
  );

  // Step should be registered but NOT on completed stack
  assert.equal(integrator.getManager().hasStep('failing-step'), true);
  assert.deepEqual(integrator.getManager().getStack(), []);
  assert.deepEqual(integrator.getCompletedSteps(), []);
});

await test('wrapStep returns the result of executeFn', async () => {
  const integrator = createIntegrator();
  const result = await integrator.wrapStep(
    'return-step',
    () => 42,
    () => {}
  );
  assert.equal(result, 42);
});

await test('wrapStep supports async executeFn', async () => {
  const integrator = createIntegrator();
  const result = await integrator.wrapStep(
    'async-step',
    async () => {
      await new Promise((r) => setTimeout(r, 5));
      return 'async-result';
    },
    () => {}
  );
  assert.equal(result, 'async-result');
  assert.deepEqual(integrator.getManager().getStack(), ['async-step']);
});

await test('wrapStep rejects duplicate stepId', async () => {
  const integrator = createIntegrator();
  await integrator.wrapStep('dup', () => {}, () => {});

  await assert.rejects(
    () => integrator.wrapStep('dup', () => {}, () => {}),
    /already registered/
  );
});

// ── runPipeline Success Tests ───────────────────────────────────────────────

console.log('\n--- runPipeline (Success) ---');

await test('runPipeline runs all steps sequentially and returns success (AC5)', async () => {
  const integrator = createIntegrator();
  const order = [];

  const result = await integrator.runPipeline([
    { stepId: 'build',  execute: () => order.push('build'),  rollback: () => {} },
    { stepId: 'test',   execute: () => order.push('test'),   rollback: () => {} },
    { stepId: 'deploy', execute: () => order.push('deploy'), rollback: () => {} },
  ]);

  assert.equal(result.status, 'success');
  assert.deepEqual(result.completedSteps, ['build', 'test', 'deploy']);
  assert.equal(result.diagnosticReport, null);
  assert.deepEqual(order, ['build', 'test', 'deploy']);
});

await test('runPipeline with empty steps array returns success immediately (AC5)', async () => {
  const integrator = createIntegrator();
  const result = await integrator.runPipeline([]);

  assert.equal(result.status, 'success');
  assert.deepEqual(result.completedSteps, []);
  assert.equal(result.diagnosticReport, null);
});

await test('runPipeline with single step returns success', async () => {
  const integrator = createIntegrator();
  const result = await integrator.runPipeline([
    { stepId: 'solo', execute: () => 'ok', rollback: () => {} },
  ]);

  assert.equal(result.status, 'success');
  assert.deepEqual(result.completedSteps, ['solo']);
});

// ── runPipeline Failure + Successful Rollback Tests ─────────────────────────

console.log('\n--- runPipeline (Step Failure → Rollback) ---');

await test('runPipeline auto-triggers rollback when a middle step fails (AC1)', async () => {
  const integrator = createIntegrator();
  const order = [];

  const result = await integrator.runPipeline([
    { stepId: 'step-1', execute: () => order.push('exec-1'), rollback: () => order.push('rb-1') },
    { stepId: 'step-2', execute: () => order.push('exec-2'), rollback: () => order.push('rb-2') },
    { stepId: 'step-3', execute: () => { throw new Error('step-3 boom'); }, rollback: () => order.push('rb-3') },
    { stepId: 'step-4', execute: () => order.push('exec-4'), rollback: () => order.push('rb-4') },
  ]);

  // Steps 1 and 2 executed, step-3 failed, step-4 never reached
  assert.ok(order.includes('exec-1'));
  assert.ok(order.includes('exec-2'));
  assert.ok(!order.includes('exec-4'), 'Step 4 should not have executed');

  // Rollback should have been triggered for completed steps (1 and 2) in LIFO
  assert.ok(order.includes('rb-2'));
  assert.ok(order.includes('rb-1'));
  assert.ok(order.indexOf('rb-2') < order.indexOf('rb-1'), 'LIFO: rb-2 before rb-1');

  // step-3's rollback should NOT run (it never completed)
  assert.ok(!order.includes('rb-3'));
  assert.ok(!order.includes('rb-4'));
});

await test('runPipeline returns WARNING diagnostic on successful rollback (AC1, AC6)', async () => {
  const integrator = createIntegrator();

  const result = await integrator.runPipeline([
    { stepId: 's1', execute: () => {}, rollback: () => {} },
    { stepId: 's2', execute: () => { throw new Error('test fail'); }, rollback: () => {} },
  ]);

  assert.equal(result.status, 'rolled_back');
  assert.equal(result.severity, 'WARNING');
  assert.ok(result.diagnosticReport.includes('WARNING'));
  assert.ok(result.diagnosticReport.includes('Pipeline Failure Diagnostic Report'));
  assert.ok(result.diagnosticReport.includes('test fail'));
  assert.equal(result.failedStepId, 's2');
  assert.deepEqual(result.completedSteps, ['s1']);
});

await test('runPipeline first-step failure triggers rollback with no prior steps (AC1)', async () => {
  const integrator = createIntegrator();

  const result = await integrator.runPipeline([
    { stepId: 'first', execute: () => { throw new Error('first fails'); }, rollback: () => {} },
    { stepId: 'second', execute: () => {}, rollback: () => {} },
  ]);

  assert.equal(result.status, 'rolled_back');
  assert.equal(result.severity, 'WARNING');
  assert.deepEqual(result.completedSteps, []);
  assert.equal(result.failedStepId, 'first');
});

// ── runPipeline Failure + Failed Rollback (CRITICAL) Tests ──────────────────

console.log('\n--- runPipeline (Rollback Failure → CRITICAL) ---');

await test('runPipeline returns CRITICAL when rollback crashes (AC2)', async () => {
  const integrator = createIntegrator();

  const result = await integrator.runPipeline([
    { stepId: 'ok-step', execute: () => {}, rollback: () => { throw new Error('rollback crash'); } },
    { stepId: 'fail-step', execute: () => { throw new Error('step failed'); }, rollback: () => {} },
  ]);

  assert.equal(result.status, 'rollback_failed');
  assert.equal(result.severity, 'CRITICAL');
  assert.ok(result.diagnosticReport.includes('CRITICAL'));
  assert.ok(result.diagnosticReport.includes('Manual Recovery Instructions'));
  assert.equal(result.failedStepId, 'fail-step');
});

await test('CRITICAL report includes dirty steps (AC2, AC3)', async () => {
  const integrator = createIntegrator();

  // Pipeline: 3 steps complete, 4th fails.
  // Rollback: step-3 succeeds, step-2 crashes → step-1 never rolled back.
  // Dirty: step-1, step-2
  const result = await integrator.runPipeline([
    { stepId: 'step-1', execute: () => {}, rollback: () => {} },
    { stepId: 'step-2', execute: () => {}, rollback: () => { throw new Error('rb-crash'); } },
    { stepId: 'step-3', execute: () => {}, rollback: () => {} },
    { stepId: 'step-4', execute: () => { throw new Error('step-4 exploded'); }, rollback: () => {} },
  ]);

  assert.equal(result.status, 'rollback_failed');
  assert.equal(result.severity, 'CRITICAL');

  // Dirty steps should appear in the report
  // step-3 rolled back OK (LIFO first), step-2 crashed, step-1 never reached
  assert.ok(result.diagnosticReport.includes('step-1'), 'step-1 should be listed as dirty');
  assert.ok(result.diagnosticReport.includes('step-2'), 'step-2 should be listed as dirty');
});

await test('CRITICAL report contains recovery instructions (AC3)', async () => {
  const integrator = createIntegrator();

  const result = await integrator.runPipeline([
    { stepId: 'dirty', execute: () => {}, rollback: () => { throw new Error('crash'); } },
    { stepId: 'trigger', execute: () => { throw new Error('fail'); }, rollback: () => {} },
  ]);

  assert.equal(result.severity, 'CRITICAL');
  assert.ok(result.diagnosticReport.includes('Manual Recovery Instructions'));
  assert.ok(result.diagnosticReport.includes('Manually execute'));
  assert.ok(result.diagnosticReport.includes('rollback-manager.js'));
});

// ── handleFailure Tests ─────────────────────────────────────────────────────

console.log('\n--- handleFailure ---');

await test('handleFailure with no completed steps returns WARNING with no rollback needed', async () => {
  const integrator = createIntegrator();
  // Don't run any steps — no completed steps
  const result = await integrator.handleFailure(new Error('early fail'), 'step-0');

  assert.equal(result.status, 'rolled_back');
  assert.equal(result.severity, 'WARNING');
  assert.deepEqual(result.completedSteps, []);
});

await test('handleFailure distinguishes RollbackAbortError from generic errors (AC2)', async () => {
  // Test with a manager that has completed steps and will fail during rollback
  const mgr = new RollbackManager();
  mgr.register('a', () => {}, () => { throw new Error('kaboom'); });
  mgr.markCompleted('a');

  const integrator = new WorkflowRollbackIntegrator(mgr);
  // Manually set _completedSteps to simulate pipeline context
  integrator._completedSteps = ['a'];

  const result = await integrator.handleFailure(new Error('step failed'), 'b');

  assert.equal(result.status, 'rollback_failed');
  assert.equal(result.severity, 'CRITICAL');
  assert.ok(result.diagnosticReport.includes('CRITICAL'));
  assert.ok(result.diagnosticReport.includes('kaboom'));
});

// ── generateDiagnosticReport Tests ──────────────────────────────────────────

console.log('\n--- generateDiagnosticReport ---');

await test('WARNING report includes rollback log and no dirty steps (AC3, AC6)', async () => {
  const integrator = createIntegrator();

  const report = integrator.generateDiagnosticReport(
    new Error('build failed'),
    {
      severity: 'WARNING',
      failedStepId: 'build-step',
      completedSteps: ['init', 'setup'],
      rollbackResult: {
        rollback_completed: true,
        rollback_log: [
          { stepId: 'setup', status: 'success', timestamp: '2026-05-31T00:00:00Z' },
          { stepId: 'init',  status: 'success', timestamp: '2026-05-31T00:00:01Z' },
        ],
      },
      dirtySteps: [],
    }
  );

  assert.ok(report.includes('WARNING'));
  assert.ok(report.includes('build-step'));
  assert.ok(report.includes('build failed'));
  assert.ok(report.includes('ROLLED BACK SUCCESSFULLY'));
  assert.ok(report.includes('setup'));
  assert.ok(report.includes('init'));
  assert.ok(report.includes('All steps were successfully rolled back'));
  assert.ok(!report.includes('Manual Recovery'));
});

await test('CRITICAL report includes partial log, dirty steps, and recovery (AC3)', async () => {
  const integrator = createIntegrator();
  const cause = new Error('disk full');
  const abortError = new RollbackAbortError('step-2', cause, [
    { stepId: 'step-3', status: 'success', timestamp: '2026-05-31T00:00:00Z' },
    { stepId: 'step-2', status: 'failed', timestamp: '2026-05-31T00:00:01Z', error: 'disk full' },
  ]);

  const report = integrator.generateDiagnosticReport(
    new Error('test crashed'),
    {
      severity: 'CRITICAL',
      failedStepId: 'test-step',
      completedSteps: ['step-1', 'step-2', 'step-3'],
      rollbackError: abortError,
      dirtySteps: ['step-1', 'step-2'],
    }
  );

  assert.ok(report.includes('CRITICAL'));
  assert.ok(report.includes('ROLLBACK FAILED'));
  assert.ok(report.includes('MANUAL INTERVENTION REQUIRED'));
  assert.ok(report.includes('test crashed'));
  assert.ok(report.includes('step-2'));
  assert.ok(report.includes('disk full'));
  assert.ok(report.includes('step-1'));
  assert.ok(report.includes('Partial Rollback Log'));
  assert.ok(report.includes('Manual Recovery Instructions'));
  assert.ok(report.includes('Manually execute'));
});

await test('Diagnostic report output is valid markdown with required sections (AC3)', async () => {
  const integrator = createIntegrator();

  const report = integrator.generateDiagnosticReport(
    new Error('some error'),
    {
      severity: 'WARNING',
      failedStepId: 'some-step',
      completedSteps: ['a'],
      rollbackResult: { rollback_completed: true, rollback_log: [] },
      dirtySteps: [],
    }
  );

  // Check markdown structure
  assert.ok(report.includes('# 🔴 Pipeline Failure Diagnostic Report'));
  assert.ok(report.includes('## 1. Original Error'));
  assert.ok(report.includes('## 2. Completed Steps Before Failure'));
  assert.ok(report.includes('## 3. Rollback Result'));
  assert.ok(report.includes('## 4. Dirty Steps (Not Rolled Back)'));
  assert.ok(report.includes('---'));
});

// ── Input Validation Tests ──────────────────────────────────────────────────

console.log('\n--- Input Validation ---');

await test('runPipeline rejects non-array input', async () => {
  const integrator = createIntegrator();
  await assert.rejects(
    () => integrator.runPipeline('not-an-array'),
    /expects an array/
  );
});

await test('runPipeline rejects step with missing stepId', async () => {
  const integrator = createIntegrator();
  await assert.rejects(
    () => integrator.runPipeline([{ execute: () => {}, rollback: () => {} }]),
    /non-empty string "stepId"/
  );
});

await test('runPipeline rejects step with non-function execute', async () => {
  const integrator = createIntegrator();
  await assert.rejects(
    () => integrator.runPipeline([{ stepId: 'bad', execute: 'nope', rollback: () => {} }]),
    /"execute" must be a function/
  );
});

await test('runPipeline rejects step with non-function rollback', async () => {
  const integrator = createIntegrator();
  await assert.rejects(
    () => integrator.runPipeline([{ stepId: 'bad', execute: () => {}, rollback: null }]),
    /"rollback" must be a function/
  );
});

// ── Integration Test: Full Pipeline Flow ────────────────────────────────────

console.log('\n--- Integration: Full Pipeline Flow ---');

await test('Full pipeline: 5 steps, 4th fails, rollback succeeds (end-to-end)', async () => {
  const integrator = createIntegrator();
  const timeline = [];

  const result = await integrator.runPipeline([
    { stepId: 'init',    execute: () => timeline.push('e:init'),    rollback: () => timeline.push('r:init') },
    { stepId: 'build',   execute: () => timeline.push('e:build'),   rollback: () => timeline.push('r:build') },
    { stepId: 'migrate', execute: () => timeline.push('e:migrate'), rollback: () => timeline.push('r:migrate') },
    { stepId: 'test',    execute: () => { timeline.push('e:test'); throw new Error('test assertion failed'); }, rollback: () => timeline.push('r:test') },
    { stepId: 'deploy',  execute: () => timeline.push('e:deploy'),  rollback: () => timeline.push('r:deploy') },
  ]);

  // Execution: init, build, migrate, test(fail). Deploy never reached.
  assert.deepEqual(
    timeline.filter(e => e.startsWith('e:')),
    ['e:init', 'e:build', 'e:migrate', 'e:test']
  );

  // Rollback: migrate, build, init (LIFO). test was never completed.
  const rollbacks = timeline.filter(e => e.startsWith('r:'));
  assert.deepEqual(rollbacks, ['r:migrate', 'r:build', 'r:init']);

  // Result
  assert.equal(result.status, 'rolled_back');
  assert.equal(result.severity, 'WARNING');
  assert.equal(result.failedStepId, 'test');
  assert.deepEqual(result.completedSteps, ['init', 'build', 'migrate']);
  assert.ok(result.diagnosticReport.includes('test assertion failed'));
});

await test('Full pipeline: 3 steps, 3rd fails, rollback crashes on 1st (end-to-end CRITICAL)', async () => {
  const integrator = createIntegrator();
  const timeline = [];

  const result = await integrator.runPipeline([
    { stepId: 'provision', execute: () => timeline.push('e:provision'), rollback: () => { throw new Error('cannot deprovision'); } },
    { stepId: 'configure', execute: () => timeline.push('e:configure'), rollback: () => timeline.push('r:configure') },
    { stepId: 'validate',  execute: () => { throw new Error('validation error'); }, rollback: () => {} },
  ]);

  // Execution happened for provision and configure
  assert.ok(timeline.includes('e:provision'));
  assert.ok(timeline.includes('e:configure'));

  // Rollback: configure OK (LIFO first), provision crash → abort
  assert.ok(timeline.includes('r:configure'));

  // Result is CRITICAL
  assert.equal(result.status, 'rollback_failed');
  assert.equal(result.severity, 'CRITICAL');
  assert.equal(result.failedStepId, 'validate');
  assert.ok(result.diagnosticReport.includes('CRITICAL'));
  assert.ok(result.diagnosticReport.includes('cannot deprovision'));
  assert.ok(result.diagnosticReport.includes('provision'));
});

// ── Re-export Tests ─────────────────────────────────────────────────────────

console.log('\n--- Re-exports ---');

await test('RollbackManager and RollbackAbortError are re-exported', async () => {
  assert.equal(typeof RollbackManager, 'function');
  assert.equal(typeof RollbackAbortError, 'function');

  const mgr = new RollbackManager();
  assert.ok(mgr instanceof RollbackManager);

  const err = new RollbackAbortError('x', new Error('y'), []);
  assert.ok(err instanceof RollbackAbortError);
  assert.ok(err instanceof Error);
});

// ── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);

if (failCount > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 ALL ROLLBACK INTEGRATOR TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}
