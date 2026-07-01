import { DummyEventDispatcher } from './dummy-modules';
import { FileSystemSleeStore } from '../slee/file-system-store';
import { SleeOrchestrator } from '../slee/slee-orchestrator';

async function runTests() {
  console.log('=== Starting SLEE Integration Tests ===');

  const dispatcher = new DummyEventDispatcher();
  const store = new FileSystemSleeStore('./_iwish-output/slee-data-test'); // use test dir
  
  // Clean up previous test runs
  const fs = require('fs/promises');
  await fs.rm('./_iwish-output/slee-data-test', { recursive: true, force: true });
  
  await store.init();
  const orchestrator = new SleeOrchestrator(dispatcher, store);

  // Dispatch an error
  const fakeError = new Error('Cannot read properties of undefined (reading "toString")');
  fakeError.stack = 'TypeError: Cannot read properties of undefined...\n  at Object.module.exports [as toString] (index.js:5:10)';
  
  console.log('\n--- Dispatching first ExecutionFailed ---');
  await dispatcher.dispatch('ExecutionFailed', {
    taskId: 'task-001',
    error: fakeError,
    context: { file: 'index.js' }
  });

  // Wait a bit for the async pipeline (it simulates a 1s LLM timeout)
  console.log('Waiting for async pipeline to process...');
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n--- Dispatching DUPLICATE ExecutionFailed ---');
  // Dispatch the same error. Deduplication should catch this.
  await dispatcher.dispatch('ExecutionFailed', {
    taskId: 'task-002',
    error: fakeError, // same error message and stack
    context: { file: 'other.js' }
  });

  await new Promise(r => setTimeout(r, 500));

  console.log('\n=== Verifying Storage Results ===');
  const logs = JSON.parse(await fs.readFile('./_iwish-output/slee-data-test/execution_logs.json', 'utf-8'));
  const learnings = JSON.parse(await fs.readFile('./_iwish-output/slee-data-test/learnings.json', 'utf-8'));
  const rules = JSON.parse(await fs.readFile('./_iwish-output/slee-data-test/linter_rules.json', 'utf-8'));

  console.log(`Execution Logs Count: ${logs.length} (Expected: 2)`);
  console.log(`Learnings Count: ${learnings.length} (Expected: 1)`);
  console.log(`Linter Rules Count: ${rules.length} (Expected: 1)`);

  if (logs.length === 2 && learnings.length === 1 && rules.length === 1) {
    console.log('\n✅ TEST PASSED: Deduplication and Async Enrichment successful.');
  } else {
    console.error('\n❌ TEST FAILED: Entity counts do not match expectations.');
  }
}

runTests().catch(console.error);
