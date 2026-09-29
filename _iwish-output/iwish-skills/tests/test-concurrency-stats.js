import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StatsTracker } from '../thompson-router/scripts/stats-tracker.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SANDBOX = join(__dirname, '..', 'scratch', 'test-concurrency-stats-sandbox');
const STATS_FILE = join(SANDBOX, '.iwish', 'routing-stats.json');

function setupSandbox() {
  if (existsSync(SANDBOX)) {
    rmSync(SANDBOX, { recursive: true, force: true });
  }
  mkdirSync(SANDBOX, { recursive: true });
}

function teardownSandbox() {
  if (existsSync(SANDBOX)) {
    rmSync(SANDBOX, { recursive: true, force: true });
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== Running Concurrency Stats Tracker Tests ===\n');

  setupSandbox();

  console.log('Test 1: Simulating 100 concurrent log and save operations...');
  {
    // Initialize the file first with uniform priors
    const initTracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });
    initTracker.logCall('concurrency-model', 'google', true, 100, 0.001);
    await initTracker.saveStats();

    const promises = [];
    const numCalls = 100;

    for (let i = 0; i < numCalls; i++) {
      promises.push(
        (async (idx) => {
          // Introduce a tiny random jitter to stagger starts slightly, mimicking real-world concurrent queries
          await delay(Math.floor(Math.random() * 50));

          const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });
          // Load existing stats
          await tracker.loadStats();
          // Log a new call
          const success = idx % 2 === 0;
          tracker.logCall('concurrency-model', 'google', success, 100 + idx, 0.001);
          // Save stats
          const saveResult = await tracker.saveStats();
          if (!saveResult.saved) {
            throw new Error(`Failed to save stats at iteration ${idx}`);
          }
        })(i)
      );
    }

    // Wait for all concurrent saves to finish
    await Promise.all(promises);

    // Load final stats to verify
    const finalTracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });
    await finalTracker.loadStats();
    const stats = finalTracker.getStats('concurrency-model');

    assert.ok(stats !== null, 'Model stats should exist');
    // We logged 1 init call + 100 concurrent calls = 101 total calls
    assert.equal(stats.totalCalls, 101, `Should have recorded exactly 101 calls, got ${stats.totalCalls}`);

    // Verify alpha/beta counts
    // Initial: alpha = 2, beta = 1 (1 success)
    // 100 concurrent: 50 success, 50 failure
    // Final expected: alpha = 2 + 50 = 52, beta = 1 + 50 = 51
    assert.equal(stats.alpha, 52, `Alpha should be 52, got ${stats.alpha}`);
    assert.equal(stats.beta, 51, `Beta should be 51, got ${stats.beta}`);

    console.log('✅ Concurrency test passed successfully without data loss.');
  }

  teardownSandbox();
  console.log('\n🎉 ALL CONCURRENCY TESTS PASSED! 🎉');
}

try {
  await runTests();
  process.exit(0);
} catch (error) {
  teardownSandbox();
  console.error('❌ CONCURRENCY TEST FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}
