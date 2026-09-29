import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StatsTracker } from '../thompson-router/scripts/stats-tracker.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SANDBOX = join(__dirname, '..', 'scratch', 'test-stats-tracker-sandbox');
const STATS_FILE = join(SANDBOX, '.iwish', 'routing-stats.json');

/**
 * Setup: clean sandbox before each test run
 */
function setupSandbox() {
  if (existsSync(SANDBOX)) {
    rmSync(SANDBOX, { recursive: true, force: true });
  }
  mkdirSync(SANDBOX, { recursive: true });
}

/**
 * Teardown: remove sandbox after tests
 */
function teardownSandbox() {
  if (existsSync(SANDBOX)) {
    rmSync(SANDBOX, { recursive: true, force: true });
  }
}

async function runTests() {
  console.log('=== Running Stats Tracker Tests ===\n');

  setupSandbox();

  // ──────────────────────────────────────────────────────────────────────────
  // Test 1: discoverProviders() detects providers when env vars are set
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 1: discoverProviders() detects providers when env vars are set...');
  {
    const tracker = new StatsTracker({
      statsPath: STATS_FILE,
      env: {
        GEMINI_API_KEY: 'test-key-123',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        OPENAI_API_KEY: '',  // empty should NOT be detected
        OLLAMA_HOST: 'http://localhost:11434'
      }
    });

    const providers = tracker.discoverProviders();
    assert.equal(providers.length, 3, 'Should detect 3 providers (empty OPENAI excluded)');

    const names = providers.map(p => p.provider);
    assert.ok(names.includes('google'), 'Should detect google');
    assert.ok(names.includes('anthropic'), 'Should detect anthropic');
    assert.ok(names.includes('ollama'), 'Should detect ollama');
    assert.ok(!names.includes('openai'), 'Should NOT detect openai with empty key');

    // Verify models are returned
    const google = providers.find(p => p.provider === 'google');
    assert.ok(google.models.length > 0, 'Google should have default models');
    assert.ok(google.models.includes('gemini-2.5-pro'), 'Should include gemini-2.5-pro');
    assert.equal(google.envVar, 'GEMINI_API_KEY', 'Should report correct env var');
  }
  console.log('✅ Test 1 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 2: discoverProviders() returns empty array when no env vars match
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 2: discoverProviders() returns empty when no env vars match...');
  {
    const tracker = new StatsTracker({
      statsPath: STATS_FILE,
      env: {
        SOME_RANDOM_VAR: 'value',
        PATH: '/usr/local/bin'
      }
    });

    const providers = tracker.discoverProviders();
    assert.equal(providers.length, 0, 'Should return empty array');
    assert.ok(Array.isArray(providers), 'Should be an array');
  }
  console.log('✅ Test 2 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 3: logCall() creates new model entry with correct initial priors
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 3: logCall() creates new model entry with correct priors...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });

    // Log a successful call for a new model
    tracker.logCall('gemini-2.5-pro', 'google', true, 150, 0.002);

    const stats = tracker.getStats('gemini-2.5-pro');
    assert.ok(stats !== null, 'Stats entry should exist');
    assert.equal(stats.model, 'gemini-2.5-pro');
    assert.equal(stats.provider, 'google');
    assert.equal(stats.alpha, 2, 'Alpha should be 1 (prior) + 1 (success) = 2');
    assert.equal(stats.beta, 1, 'Beta should remain at 1 (prior only)');
    assert.equal(stats.totalCalls, 1);
    assert.equal(stats.avgLatencyMs, 150);
    assert.equal(stats.totalCost, 0.002);
    assert.ok(stats.lastUpdated, 'Should have lastUpdated timestamp');
  }
  console.log('✅ Test 3 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 4: logCall() on failure increments beta
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 4: logCall() failure increments beta correctly...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });

    // Log a failed call
    tracker.logCall('claude-sonnet-4', 'anthropic', false, 500, 0.01);

    const stats = tracker.getStats('claude-sonnet-4');
    assert.equal(stats.alpha, 1, 'Alpha should stay at 1 (prior only, no success)');
    assert.equal(stats.beta, 2, 'Beta should be 1 (prior) + 1 (failure) = 2');
    assert.equal(stats.totalCalls, 1);
    assert.equal(stats.avgLatencyMs, 500);
  }
  console.log('✅ Test 4 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 5: logCall() increments existing model stats correctly
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 5: logCall() increments existing model stats...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });

    tracker.logCall('gpt-4o', 'openai', true, 200, 0.005);
    tracker.logCall('gpt-4o', 'openai', true, 300, 0.005);
    tracker.logCall('gpt-4o', 'openai', false, 1000, 0.005);

    const stats = tracker.getStats('gpt-4o');
    assert.equal(stats.alpha, 3, 'Alpha = 1 (prior) + 2 (successes) = 3');
    assert.equal(stats.beta, 2, 'Beta = 1 (prior) + 1 (failure) = 2');
    assert.equal(stats.totalCalls, 3);
    assert.equal(stats.totalCost, 0.015);

    // Running average: (200 + 300 + 1000) / 3 = 500
    assert.ok(
      Math.abs(stats.avgLatencyMs - 500) < 0.01,
      `Average latency should be ~500ms, got ${stats.avgLatencyMs}`
    );
  }
  console.log('✅ Test 5 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 6: getStats(model) returns null for unknown model
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 6: getStats() returns null for unknown model...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });
    const result = tracker.getStats('nonexistent-model');
    assert.equal(result, null, 'Should return null for unknown model');
  }
  console.log('✅ Test 6 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 7: getStats() with no args returns all models
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 7: getStats() without args returns all models...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });

    tracker.logCall('model-a', 'provider-a', true, 100, 0.001);
    tracker.logCall('model-b', 'provider-b', false, 200, 0.002);

    const all = tracker.getStats();
    assert.ok(typeof all === 'object');
    assert.ok('model-a' in all, 'Should contain model-a');
    assert.ok('model-b' in all, 'Should contain model-b');
    assert.equal(Object.keys(all).length, 2, 'Should have exactly 2 models');
  }
  console.log('✅ Test 7 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 8: saveStats() creates parent directory and file
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 8: saveStats() creates parent directory and file...');
  {
    const deepPath = join(SANDBOX, 'deep', 'nested', '.iwish', 'routing-stats.json');
    const tracker = new StatsTracker({ statsPath: deepPath, env: {} });

    tracker.logCall('test-model', 'test-provider', true, 100, 0.001);
    const result = await tracker.saveStats();

    assert.ok(result.saved, 'Should report saved=true');
    assert.equal(result.modelCount, 1);
    assert.ok(existsSync(deepPath), 'File should exist on disk');

    // Verify file content
    const content = JSON.parse(readFileSync(deepPath, 'utf8'));
    assert.ok(content._meta, 'Should have _meta field');
    assert.equal(content._meta.version, '1.0.0');
    assert.ok(content.models['test-model'], 'Should contain test-model data');
  }
  console.log('✅ Test 8 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 9: loadStats() recovers gracefully from corrupted JSON
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 9: loadStats() recovers from corrupted JSON...');
  {
    const corruptPath = join(SANDBOX, 'corrupt-stats.json');
    writeFileSync(corruptPath, '{ this is not valid JSON !!!', 'utf8');

    const tracker = new StatsTracker({ statsPath: corruptPath, env: {} });

    // Should not throw — captures the original console.warn
    const origWarn = console.warn;
    let warningLogged = false;
    console.warn = (...args) => {
      warningLogged = true;
    };

    const result = await tracker.loadStats();

    console.warn = origWarn;

    assert.equal(result.loaded, false, 'Should report loaded=false');
    assert.equal(result.modelCount, 0);
    assert.ok(warningLogged, 'Should have logged a warning');

    // Internal state should be clean
    const all = tracker.getStats();
    assert.equal(Object.keys(all).length, 0);
  }
  console.log('✅ Test 9 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 10: loadStats() returns empty stats when file does not exist
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 10: loadStats() returns empty stats when file does not exist...');
  {
    const tracker = new StatsTracker({
      statsPath: join(SANDBOX, 'nonexistent', 'stats.json'),
      env: {}
    });

    const result = await tracker.loadStats();
    assert.equal(result.loaded, false);
    assert.equal(result.modelCount, 0);
  }
  console.log('✅ Test 10 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 11: Save then load round-trip preserves data
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 11: Save/load round-trip preserves data...');
  {
    const roundTripPath = join(SANDBOX, 'roundtrip-stats.json');

    // Save
    const tracker1 = new StatsTracker({ statsPath: roundTripPath, env: {} });
    tracker1.logCall('gemini-2.5-pro', 'google', true, 150, 0.003);
    tracker1.logCall('gemini-2.5-pro', 'google', false, 400, 0.003);
    tracker1.logCall('gpt-4o', 'openai', true, 250, 0.01);
    await tracker1.saveStats();

    // Load into a new tracker
    const tracker2 = new StatsTracker({ statsPath: roundTripPath, env: {} });
    const loadResult = await tracker2.loadStats();
    assert.equal(loadResult.loaded, true);
    assert.equal(loadResult.modelCount, 2);

    const gemini = tracker2.getStats('gemini-2.5-pro');
    assert.equal(gemini.alpha, 2, 'Alpha should be preserved (1 prior + 1 success)');
    assert.equal(gemini.beta, 2, 'Beta should be preserved (1 prior + 1 failure)');
    assert.equal(gemini.totalCalls, 2);
    assert.equal(gemini.totalCost, 0.006);

    const gpt = tracker2.getStats('gpt-4o');
    assert.equal(gpt.totalCalls, 1);
  }
  console.log('✅ Test 11 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 12: Average latency calculation is correct across multiple calls
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 12: Average latency calculation across multiple calls...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });

    const latencies = [100, 200, 300, 400, 500];
    for (const lat of latencies) {
      tracker.logCall('latency-test', 'test', true, lat, 0);
    }

    const stats = tracker.getStats('latency-test');
    const expectedAvg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    assert.ok(
      Math.abs(stats.avgLatencyMs - expectedAvg) < 0.001,
      `Expected avg ${expectedAvg}, got ${stats.avgLatencyMs}`
    );
  }
  console.log('✅ Test 12 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 13: logCall() input validation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 13: logCall() validates inputs...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });

    assert.throws(() => tracker.logCall('', 'provider', true, 100), /model must be a non-empty string/);
    assert.throws(() => tracker.logCall('model', '', true, 100), /provider must be a non-empty string/);
    assert.throws(() => tracker.logCall('model', 'provider', true, -5), /latencyMs must be a non-negative number/);
    assert.throws(() => tracker.logCall('model', 'provider', true, NaN), /latencyMs must be a non-negative number/);
  }
  console.log('✅ Test 13 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 14: resetStats() clears in-memory state
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 14: resetStats() clears in-memory state...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });
    tracker.logCall('model-x', 'provider-x', true, 100, 0.001);
    assert.ok(tracker.getStats('model-x') !== null);

    tracker.resetStats();
    assert.equal(tracker.getStats('model-x'), null, 'Should be null after reset');
    assert.equal(Object.keys(tracker.getStats()).length, 0, 'All stats should be empty');
  }
  console.log('✅ Test 14 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Test 15: Default estimatedCost parameter
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 15: logCall() with default estimatedCost=0...');
  {
    const tracker = new StatsTracker({ statsPath: STATS_FILE, env: {} });
    tracker.logCall('free-model', 'local', true, 50);
    const stats = tracker.getStats('free-model');
    assert.equal(stats.totalCost, 0, 'Cost should default to 0');
  }
  console.log('✅ Test 15 Passed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ──────────────────────────────────────────────────────────────────────────
  teardownSandbox();

  console.log('🎉 ALL STATS TRACKER TESTS PASSED SUCCESSFULLY! 🎉');
}

try {
  await runTests();
  process.exit(0);
} catch (error) {
  teardownSandbox();
  console.error('❌ TEST RUN FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}
