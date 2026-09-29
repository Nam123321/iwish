import { strict as assert } from 'node:assert';
import { StatsTracker } from '../thompson-router/scripts/stats-tracker.js';
import { ThompsonSelector } from '../thompson-router/scripts/thompson-selector.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a StatsTracker pre-seeded with model data.
 * @param {Array<{model: string, provider: string, alpha: number, beta: number, avgLatencyMs?: number, totalCost?: number, totalCalls?: number}>} models
 * @returns {StatsTracker}
 */
function createSeededTracker(models) {
  const tracker = new StatsTracker({ env: {} });
  for (const m of models) {
    // Manually inject stats into the tracker's internal store
    tracker._stats[m.model] = {
      model: m.model,
      provider: m.provider,
      alpha: m.alpha,
      beta: m.beta,
      totalCalls: m.totalCalls ?? 10,
      avgLatencyMs: m.avgLatencyMs ?? 200,
      totalCost: m.totalCost ?? 0.01,
      lastUpdated: new Date().toISOString()
    };
  }
  return tracker;
}

let passCount = 0;
let failCount = 0;

/**
 * Simple test runner.
 * @param {string} name
 * @param {() => void} fn
 */
function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: ThompsonSelector
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║        Thompson Selector — Unit Tests                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ─── 1. Constructor Tests ────────────────────────────────────────────────────

console.log('── Constructor ──');

test('Throws if no StatsTracker provided', () => {
  assert.throws(() => new ThompsonSelector(), {
    message: 'ThompsonSelector requires a StatsTracker instance'
  });
});

test('Throws if null StatsTracker provided', () => {
  assert.throws(() => new ThompsonSelector(null), {
    message: 'ThompsonSelector requires a StatsTracker instance'
  });
});

test('Accepts a valid StatsTracker', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  assert.ok(selector);
});

// ─── 2. sampleBeta() Tests ──────────────────────────────────────────────────

console.log('\n── sampleBeta() ──');

test('Returns a value in [0, 1] for Beta(1, 1)', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  for (let i = 0; i < 200; i++) {
    const val = selector.sampleBeta(1, 1);
    assert.ok(val >= 0 && val <= 1, `Got ${val} which is outside [0,1]`);
  }
});

test('Returns a value in [0, 1] for Beta(5, 2)', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  for (let i = 0; i < 200; i++) {
    const val = selector.sampleBeta(5, 2);
    assert.ok(val >= 0 && val <= 1, `Got ${val} which is outside [0,1]`);
  }
});

test('Returns a value in [0, 1] for Beta(0.5, 0.5) — Jöhnk regime', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  for (let i = 0; i < 200; i++) {
    const val = selector.sampleBeta(0.5, 0.5);
    assert.ok(val >= 0 && val <= 1, `Got ${val} which is outside [0,1]`);
  }
});

test('Returns a value in [0, 1] for Beta(100, 3) — extreme case', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  for (let i = 0; i < 100; i++) {
    const val = selector.sampleBeta(100, 3);
    assert.ok(val >= 0 && val <= 1, `Got ${val} which is outside [0,1]`);
  }
});

test('Beta(high α, low β) trends toward 1.0 — statistical test (500 draws)', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  const draws = [];
  for (let i = 0; i < 500; i++) {
    draws.push(selector.sampleBeta(50, 2));
  }
  const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
  // Expected mean for Beta(50, 2) = 50/(50+2) ≈ 0.962
  assert.ok(mean > 0.9, `Mean ${mean.toFixed(4)} should be > 0.9 for Beta(50, 2)`);
});

test('Beta(low α, high β) trends toward 0.0 — statistical test (500 draws)', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  const draws = [];
  for (let i = 0; i < 500; i++) {
    draws.push(selector.sampleBeta(2, 50));
  }
  const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
  // Expected mean for Beta(2, 50) = 2/(2+50) ≈ 0.038
  assert.ok(mean < 0.1, `Mean ${mean.toFixed(4)} should be < 0.1 for Beta(2, 50)`);
});

test('Beta(α, β) mean converges to α/(α+β) — statistical test (1000 draws)', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  const alpha = 10;
  const beta = 5;
  const expectedMean = alpha / (alpha + beta); // 0.6667
  const draws = [];
  for (let i = 0; i < 1000; i++) {
    draws.push(selector.sampleBeta(alpha, beta));
  }
  const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
  const error = Math.abs(mean - expectedMean);
  assert.ok(
    error < 0.05,
    `Mean ${mean.toFixed(4)} should be within 0.05 of expected ${expectedMean.toFixed(4)}, error: ${error.toFixed(4)}`
  );
});

test('Throws for alpha ≤ 0', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  assert.throws(() => selector.sampleBeta(0, 1), /must both be > 0/);
  assert.throws(() => selector.sampleBeta(-1, 1), /must both be > 0/);
});

test('Throws for beta ≤ 0', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  assert.throws(() => selector.sampleBeta(1, 0), /must both be > 0/);
  assert.throws(() => selector.sampleBeta(1, -5), /must both be > 0/);
});

test('Throws for non-numeric alpha/beta', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  assert.throws(() => selector.sampleBeta('a', 1), /must be numbers/);
  assert.throws(() => selector.sampleBeta(1, null), /must be numbers/);
});

test('Throws for Infinity alpha/beta', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  assert.throws(() => selector.sampleBeta(Infinity, 1), /must be finite/);
  assert.throws(() => selector.sampleBeta(1, Infinity), /must be finite/);
});

// ─── 3. selectModel() Tests ────────────────────────────────────────────────

console.log('\n── selectModel() ──');

test('Returns null when no models are available', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModel();
  assert.strictEqual(result, null);
});

test('Returns correct structure with single model', () => {
  const tracker = createSeededTracker([
    { model: 'gpt-4o', provider: 'openai', alpha: 10, beta: 2 }
  ]);
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModel();

  assert.ok(result);
  assert.strictEqual(result.selected_model, 'gpt-4o');
  assert.strictEqual(result.selected_provider, 'openai');
  assert.ok(typeof result.score === 'number');
  assert.ok(result.score >= 0 && result.score <= 1);
  assert.ok(Array.isArray(result.candidates));
  assert.strictEqual(result.candidates.length, 1);
});

test('Returns all required fields in candidate objects', () => {
  const tracker = createSeededTracker([
    { model: 'gemini-2.5-pro', provider: 'google', alpha: 8, beta: 3 }
  ]);
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModel();

  assert.ok(result);
  const c = result.candidates[0];
  assert.strictEqual(c.model, 'gemini-2.5-pro');
  assert.strictEqual(c.provider, 'google');
  assert.strictEqual(c.alpha, 8);
  assert.strictEqual(c.beta, 3);
  assert.ok(typeof c.score === 'number');
  assert.ok(typeof c.avgLatencyMs === 'number');
  assert.ok(typeof c.totalCost === 'number');
  assert.ok(typeof c.totalCalls === 'number');
});

test('Candidates are sorted by score descending', () => {
  const tracker = createSeededTracker([
    { model: 'model-a', provider: 'p1', alpha: 10, beta: 2 },
    { model: 'model-b', provider: 'p2', alpha: 5, beta: 5 },
    { model: 'model-c', provider: 'p3', alpha: 2, beta: 10 }
  ]);
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModel();

  assert.ok(result);
  for (let i = 1; i < result.candidates.length; i++) {
    assert.ok(
      result.candidates[i - 1].score >= result.candidates[i].score,
      `Candidate ${i - 1} score (${result.candidates[i - 1].score}) should be >= candidate ${i} score (${result.candidates[i].score})`
    );
  }
});

test('Statistically favors high-alpha model over 200 iterations', () => {
  const tracker = createSeededTracker([
    { model: 'strong-model', provider: 'p1', alpha: 100, beta: 2 },
    { model: 'weak-model', provider: 'p2', alpha: 2, beta: 100 }
  ]);
  const selector = new ThompsonSelector(tracker);
  let strongWins = 0;

  for (let i = 0; i < 200; i++) {
    const result = selector.selectModel();
    if (result && result.selected_model === 'strong-model') {
      strongWins++;
    }
  }

  // Strong model (α=100,β=2) should win overwhelmingly
  assert.ok(
    strongWins > 180,
    `Strong model won ${strongWins}/200 times, expected >180`
  );
});

test('Moderate-alpha models still get explored occasionally', () => {
  const tracker = createSeededTracker([
    { model: 'good-model', provider: 'p1', alpha: 20, beta: 5 },
    { model: 'okay-model', provider: 'p2', alpha: 10, beta: 10 }
  ]);
  const selector = new ThompsonSelector(tracker);

  const wins = { 'good-model': 0, 'okay-model': 0 };
  for (let i = 0; i < 500; i++) {
    const result = selector.selectModel();
    if (result) {
      wins[result.selected_model]++;
    }
  }

  // Okay model should still win at least some times (exploration)
  assert.ok(
    wins['okay-model'] > 3,
    `Okay model should be explored at least a few times, got ${wins['okay-model']}`
  );
  // Good model should still win the majority
  assert.ok(
    wins['good-model'] > wins['okay-model'],
    `Good model (${wins['good-model']}) should win more than okay model (${wins['okay-model']})`
  );
});

test('Accepts optional taskType and options parameters', () => {
  const tracker = createSeededTracker([
    { model: 'test-model', provider: 'test', alpha: 5, beta: 2 }
  ]);
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModel('coding', { priority: 'speed' });
  assert.ok(result);
  assert.strictEqual(result.selected_model, 'test-model');
});

// ─── 4. selectModelWithConstraints() Tests ──────────────────────────────────

console.log('\n── selectModelWithConstraints() ──');

test('Returns null when no models available', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModelWithConstraints({ maxLatencyMs: 500 });
  assert.strictEqual(result, null);
});

test('Filters models exceeding maxLatencyMs', () => {
  const tracker = createSeededTracker([
    { model: 'fast-model', provider: 'p1', alpha: 10, beta: 2, avgLatencyMs: 100, totalCalls: 5 },
    { model: 'slow-model', provider: 'p2', alpha: 10, beta: 2, avgLatencyMs: 500, totalCalls: 5 }
  ]);
  const selector = new ThompsonSelector(tracker);

  let slowSelected = false;
  for (let i = 0; i < 100; i++) {
    const result = selector.selectModelWithConstraints({ maxLatencyMs: 200 });
    assert.ok(result);
    if (result.selected_model === 'slow-model') {
      slowSelected = true;
    }
  }
  assert.ok(!slowSelected, 'Slow model should never be selected with maxLatencyMs=200');
});

test('Filters models exceeding maxCostPerCall', () => {
  const tracker = createSeededTracker([
    { model: 'cheap-model', provider: 'p1', alpha: 10, beta: 2, totalCost: 0.01, totalCalls: 10 },
    { model: 'expensive-model', provider: 'p2', alpha: 10, beta: 2, totalCost: 1.0, totalCalls: 10 }
  ]);
  const selector = new ThompsonSelector(tracker);

  let expensiveSelected = false;
  for (let i = 0; i < 100; i++) {
    const result = selector.selectModelWithConstraints({ maxCostPerCall: 0.005 });
    assert.ok(result);
    if (result.selected_model === 'expensive-model') {
      expensiveSelected = true;
    }
  }
  assert.ok(!expensiveSelected, 'Expensive model should never be selected with maxCostPerCall=0.005');
});

test('Returns null when no models meet constraints', () => {
  const tracker = createSeededTracker([
    { model: 'only-model', provider: 'p1', alpha: 10, beta: 2, avgLatencyMs: 500, totalCalls: 5 }
  ]);
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModelWithConstraints({ maxLatencyMs: 100 });
  assert.strictEqual(result, null);
});

test('Applies both latency and cost constraints simultaneously', () => {
  const tracker = createSeededTracker([
    { model: 'goldilocks', provider: 'p1', alpha: 10, beta: 2, avgLatencyMs: 100, totalCost: 0.05, totalCalls: 10 },
    { model: 'too-slow', provider: 'p2', alpha: 10, beta: 2, avgLatencyMs: 500, totalCost: 0.05, totalCalls: 10 },
    { model: 'too-pricey', provider: 'p3', alpha: 10, beta: 2, avgLatencyMs: 100, totalCost: 1.0, totalCalls: 10 }
  ]);
  const selector = new ThompsonSelector(tracker);

  for (let i = 0; i < 50; i++) {
    const result = selector.selectModelWithConstraints({
      maxLatencyMs: 200,
      maxCostPerCall: 0.01
    });
    assert.ok(result);
    assert.strictEqual(result.selected_model, 'goldilocks');
  }
});

test('Models with zero calls are not filtered by constraints (no data yet)', () => {
  const tracker = createSeededTracker([
    { model: 'new-model', provider: 'p1', alpha: 1, beta: 1, avgLatencyMs: 0, totalCost: 0, totalCalls: 0 }
  ]);
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModelWithConstraints({ maxLatencyMs: 100, maxCostPerCall: 0.001 });
  assert.ok(result);
  assert.strictEqual(result.selected_model, 'new-model');
});

test('Empty constraints object selects from all models', () => {
  const tracker = createSeededTracker([
    { model: 'model-a', provider: 'p1', alpha: 10, beta: 2 },
    { model: 'model-b', provider: 'p2', alpha: 5, beta: 5 }
  ]);
  const selector = new ThompsonSelector(tracker);
  const result = selector.selectModelWithConstraints({});
  assert.ok(result);
  assert.ok(['model-a', 'model-b'].includes(result.selected_model));
});

// ─── 5. refreshPool() Tests ────────────────────────────────────────────────

console.log('\n── refreshPool() ──');

test('Adds new models from discovered providers with Beta(1,1) priors', () => {
  const tracker = new StatsTracker({
    env: { GEMINI_API_KEY: 'test-key' }
  });
  const selector = new ThompsonSelector(tracker);
  const result = selector.refreshPool();

  assert.ok(result.added.length > 0, 'Should add at least one model');
  assert.ok(result.added.includes('gemini-2.5-pro'), 'Should add gemini-2.5-pro');

  // Verify Beta(1,1) priors
  const stats = tracker.getStats('gemini-2.5-pro');
  assert.ok(stats, 'Stats should exist for newly added model');
  assert.strictEqual(stats.alpha, 1, 'Alpha should be 1 (uniform prior)');
  assert.strictEqual(stats.beta, 1, 'Beta should be 1 (uniform prior)');
  assert.strictEqual(stats.totalCalls, 0, 'Total calls should be 0');
});

test('Does not overwrite existing model stats', () => {
  const tracker = new StatsTracker({
    env: { GEMINI_API_KEY: 'test-key' }
  });

  // Pre-seed a model with real data
  tracker._stats['gemini-2.5-pro'] = {
    model: 'gemini-2.5-pro',
    provider: 'google',
    alpha: 50,
    beta: 5,
    totalCalls: 100,
    avgLatencyMs: 350,
    totalCost: 0.5,
    lastUpdated: new Date().toISOString()
  };

  const selector = new ThompsonSelector(tracker);
  const result = selector.refreshPool();

  assert.ok(result.existing.includes('gemini-2.5-pro'), 'Should recognize existing model');

  // Verify data was NOT overwritten
  const stats = tracker.getStats('gemini-2.5-pro');
  assert.strictEqual(stats.alpha, 50, 'Alpha should be unchanged');
  assert.strictEqual(stats.beta, 5, 'Beta should be unchanged');
  assert.strictEqual(stats.totalCalls, 100, 'Total calls should be unchanged');
});

test('Reports correct totals', () => {
  const tracker = new StatsTracker({
    env: { GEMINI_API_KEY: 'test-key', OPENAI_API_KEY: 'test-key-2' }
  });
  const selector = new ThompsonSelector(tracker);
  const result = selector.refreshPool();

  assert.ok(result.totalModels > 0, 'Should have models in pool');
  assert.strictEqual(
    result.totalModels,
    result.added.length + result.existing.length,
    'Total should equal added + existing'
  );
});

test('Returns empty added list when no providers detected', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);
  const result = selector.refreshPool();

  assert.strictEqual(result.added.length, 0);
  assert.strictEqual(result.existing.length, 0);
  assert.strictEqual(result.totalModels, 0);
});

// ─── 6. Performance Tests ──────────────────────────────────────────────────

console.log('\n── Performance ──');

test('selectModel() completes in under 20ms for 20 models', () => {
  // Create a tracker with 20 models
  const models = [];
  for (let i = 0; i < 20; i++) {
    models.push({
      model: `model-${i}`,
      provider: `provider-${i % 4}`,
      alpha: Math.floor(Math.random() * 50) + 1,
      beta: Math.floor(Math.random() * 20) + 1
    });
  }
  const tracker = createSeededTracker(models);
  const selector = new ThompsonSelector(tracker);

  // Warm up
  selector.selectModel();
  selector.selectModel();

  // Measure
  const times = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    selector.selectModel();
    times.push(performance.now() - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);

  console.log(`     (avg: ${avgTime.toFixed(4)}ms, max: ${maxTime.toFixed(4)}ms)`);

  assert.ok(
    avgTime < 20,
    `Average selection time ${avgTime.toFixed(4)}ms should be < 20ms`
  );
});

test('sampleBeta() completes in under 1ms per sample', () => {
  const tracker = new StatsTracker({ env: {} });
  const selector = new ThompsonSelector(tracker);

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    selector.sampleBeta(10, 5);
  }
  const elapsed = performance.now() - start;
  const perSample = elapsed / 1000;

  console.log(`     (${perSample.toFixed(6)}ms per sample, ${elapsed.toFixed(2)}ms total for 1000)`);

  assert.ok(
    perSample < 1,
    `Per-sample time ${perSample.toFixed(4)}ms should be < 1ms`
  );
});

// ─── 7. Integration-Style Tests ─────────────────────────────────────────────

console.log('\n── Integration ──');

test('Full workflow: discover → log calls → select best model', () => {
  const tracker = new StatsTracker({
    env: { GEMINI_API_KEY: 'test', OPENAI_API_KEY: 'test' }
  });
  const selector = new ThompsonSelector(tracker);

  // 1. Discover and initialize
  const pool = selector.refreshPool();
  assert.ok(pool.added.length > 0);

  // 2. Simulate call history — gemini is better
  for (let i = 0; i < 50; i++) {
    tracker.logCall('gemini-2.5-pro', 'google', true, 200, 0.001);
  }
  for (let i = 0; i < 5; i++) {
    tracker.logCall('gemini-2.5-pro', 'google', false, 500, 0.001);
  }

  // GPT-4o has a worse success rate
  for (let i = 0; i < 20; i++) {
    tracker.logCall('gpt-4o', 'openai', true, 300, 0.003);
  }
  for (let i = 0; i < 30; i++) {
    tracker.logCall('gpt-4o', 'openai', false, 600, 0.003);
  }

  // 3. Thompson sampling should favor gemini
  let geminiWins = 0;
  for (let i = 0; i < 200; i++) {
    const result = selector.selectModel();
    if (result && result.selected_model === 'gemini-2.5-pro') {
      geminiWins++;
    }
  }

  assert.ok(
    geminiWins > 100,
    `Gemini (50 success / 5 fail) should win most of the time, won ${geminiWins}/200`
  );
});

test('Constraint selection filters correctly in integrated workflow', () => {
  const tracker = new StatsTracker({ env: {} });

  // Manually seed two models with different characteristics
  tracker._stats['fast-cheap'] = {
    model: 'fast-cheap',
    provider: 'p1',
    alpha: 15,
    beta: 3,
    totalCalls: 20,
    avgLatencyMs: 80,
    totalCost: 0.02,
    lastUpdated: new Date().toISOString()
  };
  tracker._stats['slow-expensive'] = {
    model: 'slow-expensive',
    provider: 'p2',
    alpha: 20,
    beta: 2,
    totalCalls: 20,
    avgLatencyMs: 800,
    totalCost: 2.0,
    lastUpdated: new Date().toISOString()
  };

  const selector = new ThompsonSelector(tracker);

  // With tight latency constraint, only fast-cheap should pass
  for (let i = 0; i < 50; i++) {
    const result = selector.selectModelWithConstraints({ maxLatencyMs: 200 });
    assert.ok(result);
    assert.strictEqual(result.selected_model, 'fast-cheap');
  }
});

test('refreshPool is idempotent — calling twice does not duplicate models', () => {
  const tracker = new StatsTracker({ env: { GEMINI_API_KEY: 'test' } });
  const selector = new ThompsonSelector(tracker);

  const first = selector.refreshPool();
  const second = selector.refreshPool();

  assert.strictEqual(first.totalModels, second.totalModels, 'Model count should not change');
  assert.strictEqual(second.added.length, 0, 'Second refresh should add 0 new models');
  assert.ok(second.existing.length > 0, 'Second refresh should list all as existing');
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════');
console.log(`  Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
console.log('══════════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  process.exit(1);
}
