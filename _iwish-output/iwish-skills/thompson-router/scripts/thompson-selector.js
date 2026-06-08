import { fileURLToPath } from 'node:url';
import { StatsTracker } from './stats-tracker.js';

/**
 * @typedef {Object} SelectionResult
 * @property {string} selected_model - The chosen model identifier
 * @property {string} selected_provider - The provider of the chosen model
 * @property {number} score - The Thompson sample score that won
 * @property {CandidateScore[]} candidates - All candidates with their scores
 */

/**
 * @typedef {Object} CandidateScore
 * @property {string} model - Model identifier
 * @property {string} provider - Provider name
 * @property {number} alpha - Beta distribution α parameter
 * @property {number} beta - Beta distribution β parameter
 * @property {number} score - Sampled Thompson score
 * @property {number} avgLatencyMs - Average latency in ms
 * @property {number} totalCost - Total accumulated cost
 * @property {number} totalCalls - Number of calls made
 */

/**
 * @typedef {Object} SelectionConstraints
 * @property {number} [maxLatencyMs] - Maximum acceptable average latency
 * @property {number} [maxCostPerCall] - Maximum acceptable cost per call
 */

/**
 * @typedef {Object} BenchmarkResult
 * @property {number} iterations - Number of iterations run
 * @property {Record<string, number>} selectionCounts - How many times each model was selected
 * @property {number} avgTimeMs - Average selection time in ms
 * @property {number} maxTimeMs - Max selection time in ms
 * @property {number} minTimeMs - Min selection time in ms
 */

/**
 * ThompsonSelector — runs Thompson Sampling across tracked model stats
 * to select the optimal model for a given task.
 *
 * Uses pure JavaScript Beta distribution sampling (no external dependencies).
 * Implements Jöhnk's algorithm for α,β < 1 cases and Gamma-variate-based
 * sampling for the general case.
 */
export class ThompsonSelector {
  /**
   * @param {StatsTracker} statsTracker - A StatsTracker instance providing model stats
   */
  constructor(statsTracker) {
    if (!statsTracker) {
      throw new Error('ThompsonSelector requires a StatsTracker instance');
    }
    /** @type {StatsTracker} */
    this._tracker = statsTracker;
  }

  // ─── Beta Distribution Sampling ──────────────────────────────────────────

  /**
   * Draw a random sample from the Beta(α, β) distribution.
   *
   * Uses Gamma-variate-based decomposition: if X ~ Gamma(α,1) and Y ~ Gamma(β,1),
   * then X/(X+Y) ~ Beta(α, β). For α or β < 1, applies Jöhnk's algorithm.
   *
   * @param {number} alpha - Shape parameter α (must be > 0)
   * @param {number} beta - Shape parameter β (must be > 0)
   * @returns {number} A random variate in [0, 1]
   * @throws {Error} If alpha or beta is ≤ 0
   */
  sampleBeta(alpha, beta) {
    if (typeof alpha !== 'number' || typeof beta !== 'number') {
      throw new Error('sampleBeta: alpha and beta must be numbers');
    }
    if (alpha <= 0 || beta <= 0) {
      throw new Error(
        `sampleBeta: alpha (${alpha}) and beta (${beta}) must both be > 0`
      );
    }
    if (!isFinite(alpha) || !isFinite(beta)) {
      throw new Error('sampleBeta: alpha and beta must be finite numbers');
    }

    // Special cases for exact integer 1 parameters (uniform shortcuts)
    if (alpha === 1 && beta === 1) {
      return Math.random();
    }

    // Use Gamma-variate decomposition: Beta(a,b) = Ga/(Ga + Gb)
    const x = this._sampleGamma(alpha);
    const y = this._sampleGamma(beta);
    const sum = x + y;

    // Guard against degenerate case (extremely unlikely but possible)
    if (sum === 0) {
      return 0.5;
    }

    return x / sum;
  }

  /**
   * Sample from Gamma(shape, 1) distribution using Marsaglia and Tsang's method.
   * For shape < 1, uses the Ahrens-Dieter boost: Gamma(a) = Gamma(a+1) * U^(1/a).
   *
   * @param {number} shape - Shape parameter (must be > 0)
   * @returns {number} A random Gamma variate
   * @private
   */
  _sampleGamma(shape) {
    if (shape < 1) {
      // Ahrens-Dieter: Gamma(a, 1) = Gamma(a+1, 1) * U^(1/a) for a < 1
      const boost = Math.pow(Math.random(), 1.0 / shape);
      return this._sampleGammaMarsaglia(shape + 1) * boost;
    }
    return this._sampleGammaMarsaglia(shape);
  }

  /**
   * Marsaglia and Tsang's method for Gamma(shape, 1) where shape >= 1.
   *
   * Reference: "A Simple Method for Generating Gamma Variables"
   * George Marsaglia and Wai Wan Tsang, ACM TOMS 2000.
   *
   * @param {number} shape - Shape parameter (must be >= 1)
   * @returns {number} A random Gamma variate
   * @private
   */
  _sampleGammaMarsaglia(shape) {
    const d = shape - 1.0 / 3.0;
    const c = 1.0 / Math.sqrt(9.0 * d);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let x, v;

      // Generate standard normal via Box-Muller
      do {
        x = this._sampleNormal();
        v = 1.0 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();
      const xSq = x * x;

      // Squeeze test (fast accept)
      if (u < 1.0 - 0.0331 * xSq * xSq) {
        return d * v;
      }

      // Full test
      if (Math.log(u) < 0.5 * xSq + d * (1.0 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  /**
   * Generate a standard normal variate using the Box-Muller transform.
   *
   * @returns {number} A N(0,1) random variate
   * @private
   */
  _sampleNormal() {
    let u1, u2;
    do {
      u1 = Math.random();
    } while (u1 === 0); // Avoid log(0)

    u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  // ─── Thompson Sampling Selection ─────────────────────────────────────────

  /**
   * Run Thompson Sampling across all known models and select the best one.
   *
   * For each model, draws a sample from Beta(α, β) and selects the model
   * with the highest sample. This naturally balances exploration (uncertain
   * models have wide distributions) and exploitation (proven models have
   * tight, high distributions).
   *
   * @param {string} [_taskType] - Reserved for future task-type-aware routing
   * @param {Object} [_options] - Reserved for future options
   * @returns {SelectionResult|null} The selection result, or null if no models available
   */
  selectModel(_taskType, _options) {
    const allStats = this._tracker.getStats();
    const models = Object.values(allStats);

    if (models.length === 0) {
      return null;
    }

    /** @type {CandidateScore[]} */
    const candidates = models.map((entry) => {
      const score = this.sampleBeta(entry.alpha, entry.beta);
      return {
        model: entry.model,
        provider: entry.provider,
        alpha: entry.alpha,
        beta: entry.beta,
        score,
        avgLatencyMs: entry.avgLatencyMs,
        totalCost: entry.totalCost,
        totalCalls: entry.totalCalls
      };
    });

    // Sort by score descending — highest sample wins
    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];
    return {
      selected_model: winner.model,
      selected_provider: winner.provider,
      score: winner.score,
      candidates
    };
  }

  /**
   * Select a model with latency and/or cost constraints.
   *
   * First filters the candidate pool to only include models whose
   * average latency and cost-per-call are within the specified bounds,
   * then runs Thompson Sampling on the filtered set.
   *
   * @param {SelectionConstraints} constraints - The constraints to apply
   * @returns {SelectionResult|null} The selection result, or null if no models meet constraints
   */
  selectModelWithConstraints(constraints = {}) {
    const allStats = this._tracker.getStats();
    const models = Object.values(allStats);

    if (models.length === 0) {
      return null;
    }

    // Filter by constraints
    const eligible = models.filter((entry) => {
      if (
        typeof constraints.maxLatencyMs === 'number' &&
        entry.totalCalls > 0 &&
        entry.avgLatencyMs > constraints.maxLatencyMs
      ) {
        return false;
      }
      if (
        typeof constraints.maxCostPerCall === 'number' &&
        entry.totalCalls > 0
      ) {
        const costPerCall = entry.totalCost / entry.totalCalls;
        if (costPerCall > constraints.maxCostPerCall) {
          return false;
        }
      }
      return true;
    });

    if (eligible.length === 0) {
      return null;
    }

    /** @type {CandidateScore[]} */
    const candidates = eligible.map((entry) => {
      const score = this.sampleBeta(entry.alpha, entry.beta);
      return {
        model: entry.model,
        provider: entry.provider,
        alpha: entry.alpha,
        beta: entry.beta,
        score,
        avgLatencyMs: entry.avgLatencyMs,
        totalCost: entry.totalCost,
        totalCalls: entry.totalCalls
      };
    });

    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];
    return {
      selected_model: winner.model,
      selected_provider: winner.provider,
      score: winner.score,
      candidates
    };
  }

  // ─── Pool Management ─────────────────────────────────────────────────────

  /**
   * Re-discover providers from the environment and synchronize the stats pool.
   *
   * New models are added with default Beta(1,1) priors. Existing model
   * data is never overwritten or deleted — this is an additive merge.
   *
   * @returns {{ added: string[], existing: string[], totalModels: number }}
   */
  refreshPool() {
    const providers = this._tracker.discoverProviders();
    const currentStats = this._tracker.getStats();
    const added = [];
    const existing = [];

    for (const provider of providers) {
      for (const model of provider.models) {
        if (currentStats[model]) {
          existing.push(model);
        } else {
          // Initialize with a zero-latency, zero-cost probe call
          // This creates the Beta(1,1) prior entry in the tracker
          this._tracker.logCall(model, provider.provider, true, 0, 0);
          // Reset alpha back to 1 (logCall bumps it to 2 on success)
          const stats = this._tracker.getStats(model);
          if (stats) {
            stats.alpha = 1;
            stats.totalCalls = 0;
            stats.avgLatencyMs = 0;
          }
          added.push(model);
        }
      }
    }

    return {
      added,
      existing,
      totalModels: Object.keys(this._tracker.getStats()).length
    };
  }
}

// ─── CLI Interface ───────────────────────────────────────────────────────────

/**
 * Formats a selection result for console output.
 * @param {SelectionResult} result
 * @returns {string}
 */
function formatSelection(result) {
  const lines = [
    `  🏆 Selected: ${result.selected_model} (${result.selected_provider})`,
    `     Score:    ${result.score.toFixed(6)}`,
    '',
    '  All Candidates:'
  ];

  const header =
    '    Model                    | Provider   | α     | β     | Score    | Avg Latency | Calls';
  const sep =
    '    -------------------------+------------+-------+-------+----------+-------------+------';
  lines.push(header, sep);

  for (const c of result.candidates) {
    const name = c.model.padEnd(24);
    const prov = c.provider.padEnd(10);
    const a = String(c.alpha).padStart(5);
    const b = String(c.beta).padStart(5);
    const score = c.score.toFixed(6).padStart(8);
    const lat = `${c.avgLatencyMs.toFixed(1)}ms`.padStart(11);
    const calls = String(c.totalCalls).padStart(5);
    lines.push(
      `    ${name} | ${prov} | ${a} | ${b} | ${score} | ${lat} | ${calls}`
    );
  }

  return lines.join('\n');
}

/**
 * Formats benchmark results for console output.
 * @param {BenchmarkResult} result
 * @returns {string}
 */
function formatBenchmark(result) {
  const lines = [
    `  📊 Benchmark Results (${result.iterations} iterations):`,
    `     Avg Selection Time: ${result.avgTimeMs.toFixed(4)}ms`,
    `     Min Selection Time: ${result.minTimeMs.toFixed(4)}ms`,
    `     Max Selection Time: ${result.maxTimeMs.toFixed(4)}ms`,
    `     Performance Target: ${result.avgTimeMs < 20 ? '✅ PASS' : '❌ FAIL'} (<20ms)`,
    '',
    '  Selection Distribution:'
  ];

  const sortedModels = Object.entries(result.selectionCounts)
    .sort((a, b) => b[1] - a[1]);

  for (const [model, count] of sortedModels) {
    const pct = ((count / result.iterations) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / result.iterations * 40));
    lines.push(`    ${model.padEnd(24)} ${String(count).padStart(6)} (${pct.padStart(5)}%) ${bar}`);
  }

  return lines.join('\n');
}

/**
 * CLI entry point. Invoked when this module is run directly.
 * Subcommands:
 *   select [taskType]       - Run Thompson Sampling selection
 *   benchmark <iterations>  - Run benchmark with N iterations
 */
async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Thompson Router — Thompson Selector CLI
Usage:
  node thompson-selector.js select [taskType]              Run Thompson Sampling model selection
  node thompson-selector.js benchmark <iterations>         Benchmark selection performance
`);
    process.exit(0);
  }

  const tracker = new StatsTracker();
  await tracker.loadStats();
  const selector = new ThompsonSelector(tracker);

  // Auto-discover and refresh pool
  const poolResult = selector.refreshPool();
  if (poolResult.added.length > 0) {
    console.log(`🔄 Pool refreshed: added ${poolResult.added.length} new model(s): ${poolResult.added.join(', ')}`);
    await tracker.saveStats();
  }

  switch (command) {
    case 'select': {
      const taskType = args[1] || undefined;
      const result = selector.selectModel(taskType);

      if (!result) {
        console.log('⚠️  No models available for selection.');
        console.log('    Run `node stats-tracker.js discover` to check providers, or log some calls first.');
        process.exit(1);
      }

      console.log('🎯 Thompson Sampling Selection:\n');
      console.log(formatSelection(result));
      break;
    }

    case 'benchmark': {
      const iterations = parseInt(args[1], 10) || 1000;

      const allStats = tracker.getStats();
      if (Object.keys(allStats).length === 0) {
        console.log('⚠️  No models available for benchmarking. Log some calls first.');
        process.exit(1);
      }

      console.log(`🏁 Running ${iterations} Thompson Sampling iterations...\n`);

      /** @type {Record<string, number>} */
      const counts = {};
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = selector.selectModel();
        const elapsed = performance.now() - start;
        times.push(elapsed);

        if (result) {
          counts[result.selected_model] = (counts[result.selected_model] || 0) + 1;
        }
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      /** @type {BenchmarkResult} */
      const benchResult = {
        iterations,
        selectionCounts: counts,
        avgTimeMs: avgTime,
        maxTimeMs: maxTime,
        minTimeMs: minTime
      };

      console.log(formatBenchmark(benchResult));
      break;
    }

    default:
      console.error(`❌ Unknown command: ${command}. Use --help for usage.`);
      process.exit(1);
  }
}

// Run CLI when executed directly (ESM detection)
const __filename_current = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename_current) {
  runCLI().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
