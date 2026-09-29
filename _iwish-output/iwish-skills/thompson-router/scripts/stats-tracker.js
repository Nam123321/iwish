import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';

async function acquireLock(lockPath, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      return true;
    } catch (err) {
      if (err.code === 'EEXIST') {
        await setTimeout(5);
      } else {
        throw err;
      }
    }
  }
  return false;
}

function releaseLock(lockPath) {
  try {
    unlinkSync(lockPath);
  } catch (err) {}
}


/**
 * @typedef {Object} ProviderInfo
 * @property {string} provider - Provider name (e.g. 'google', 'anthropic')
 * @property {string} envVar - Environment variable name detected
 * @property {string[]} models - Default model identifiers for this provider
 */

/**
 * @typedef {Object} ModelStats
 * @property {string} model - Model identifier
 * @property {string} provider - Provider name
 * @property {number} alpha - Beta distribution α parameter (successes + 1)
 * @property {number} beta - Beta distribution β parameter (failures + 1)
 * @property {number} totalCalls - Total number of calls made
 * @property {number} avgLatencyMs - Running average latency in milliseconds
 * @property {number} totalCost - Cumulative estimated cost
 * @property {string} lastUpdated - ISO 8601 timestamp of last update
 */

/**
 * Known LLM provider configurations.
 * Each entry maps an environment variable to a provider and its default models.
 * @type {Array<{envVar: string, provider: string, defaultModels: string[]}>}
 */
const KNOWN_PROVIDERS = [
  {
    envVar: 'GEMINI_API_KEY',
    provider: 'google',
    defaultModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
  },
  {
    envVar: 'ANTHROPIC_API_KEY',
    provider: 'anthropic',
    defaultModels: ['claude-sonnet-4-20250514', 'claude-haiku-3.5']
  },
  {
    envVar: 'OPENAI_API_KEY',
    provider: 'openai',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini']
  },
  {
    envVar: 'OLLAMA_HOST',
    provider: 'ollama',
    defaultModels: ['llama3', 'codellama', 'mistral']
  }
];

/** Default stats file path relative to process.cwd() */
const DEFAULT_STATS_PATH = join('.iwish', 'routing-stats.json');

/**
 * StatsTracker — discovers available LLM providers by scanning environment
 * variables and maintains a stats database of model performance metrics
 * using Thompson Sampling Beta distribution priors.
 */
export class StatsTracker {
  /**
   * @param {Object} [options]
   * @param {string} [options.statsPath] - Custom path for the stats JSON file
   * @param {Object} [options.env] - Environment object to scan (defaults to process.env)
   */
  constructor(options = {}) {
    /** @type {string} */
    this.statsPath = options.statsPath || DEFAULT_STATS_PATH;

    /** @type {Object} */
    this._env = options.env || process.env;

    /**
     * In-memory stats store keyed by model name.
     * @type {Record<string, ModelStats>}
     */
    this._stats = {};
  }

  /**
   * Scans environment variables for known API key patterns and returns
   * a list of detected providers with their default model pools.
   *
   * @returns {ProviderInfo[]} Array of detected provider info objects
   */
  discoverProviders() {
    /** @type {ProviderInfo[]} */
    const detected = [];

    for (const entry of KNOWN_PROVIDERS) {
      const value = this._env[entry.envVar];
      if (value !== undefined && value !== '') {
        detected.push({
          provider: entry.provider,
          envVar: entry.envVar,
          models: [...entry.defaultModels]
        });
      }
    }

    return detected;
  }

  /**
   * Records a single LLM call result, updating the Beta distribution
   * parameters and running statistics for the given model.
   *
   * If no prior record exists for the model, a new entry is created
   * with uniform Beta(1,1) priors before applying the update.
   *
   * @param {string} model - Model identifier (e.g. 'gemini-2.5-pro')
   * @param {string} provider - Provider name (e.g. 'google')
   * @param {boolean} success - Whether the call succeeded
   * @param {number} latencyMs - Call latency in milliseconds
   * @param {number} [estimatedCost=0] - Estimated cost of the call in USD
   */
  logCall(model, provider, success, latencyMs, estimatedCost = 0) {
    if (!model || typeof model !== 'string') {
      throw new Error('logCall: model must be a non-empty string');
    }
    if (!provider || typeof provider !== 'string') {
      throw new Error('logCall: provider must be a non-empty string');
    }
    if (typeof latencyMs !== 'number' || isNaN(latencyMs) || latencyMs < 0) {
      throw new Error('logCall: latencyMs must be a non-negative number');
    }

    // Initialize entry with uniform Beta(1,1) priors if new
    if (!this._stats[model]) {
      this._stats[model] = {
        model,
        provider,
        alpha: 1,
        beta: 1,
        totalCalls: 0,
        avgLatencyMs: 0,
        totalCost: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    const entry = this._stats[model];

    // Update Beta distribution parameters
    if (success) {
      entry.alpha += 1;
    } else {
      entry.beta += 1;
    }

    // Update running average latency: newAvg = oldAvg + (new - oldAvg) / (n+1)
    entry.totalCalls += 1;
    entry.avgLatencyMs =
      entry.avgLatencyMs + (latencyMs - entry.avgLatencyMs) / entry.totalCalls;

    // Accumulate cost
    entry.totalCost += estimatedCost;

    // Update provider (in case the same model is used through a different route)
    entry.provider = provider;

    // Timestamp
    entry.lastUpdated = new Date().toISOString();
  }

  /**
   * Returns stats for a specific model or all models.
   *
   * @param {string} [model] - Optional model name. If omitted, returns all stats.
   * @returns {ModelStats|Record<string, ModelStats>|null}
   *   Single model stats, all stats object, or null if model not found.
   */
  getStats(model) {
    if (model) {
      return this._stats[model] || null;
    }
    // Return a shallow copy to prevent external mutation
    return { ...this._stats };
  }

  /**
   * Loads stats from a JSON file into memory.
   * If the file doesn't exist or contains invalid JSON, initializes
   * with an empty stats object and logs a warning.
   *
   * @param {string} [filePath] - Path to the stats JSON file (defaults to this.statsPath)
   * @returns {{ loaded: boolean, modelCount: number }}
   */
  async loadStats(filePath) {
    const targetPath = filePath || this.statsPath;
    const lockPath = targetPath + '.lock';

    const dir = dirname(targetPath);
    if (!existsSync(dir) || !existsSync(targetPath)) {
      this._stats = {};
      return { loaded: false, modelCount: 0 };
    }

    const locked = await acquireLock(lockPath);
    if (!locked) {
      console.warn(`[StatsTracker] Warning: Failed to acquire lock for loading stats at ${targetPath}. Proceeding without lock.`);
    }

    try {
      const raw = readFileSync(targetPath, 'utf8');
      const parsed = JSON.parse(raw);

      // Validate top-level structure
      if (parsed && typeof parsed === 'object' && parsed.models) {
        this._stats = parsed.models;
      } else if (parsed && typeof parsed === 'object' && !parsed.models) {
        // Accept flat format { modelName: {...} } as well
        this._stats = parsed;
      } else {
        this._stats = {};
      }

      const modelCount = Object.keys(this._stats).length;
      return { loaded: true, modelCount };
    } catch (err) {
      console.warn(
        `[StatsTracker] Warning: Failed to parse stats file at ${targetPath}: ${err.message}. Starting fresh.`
      );
      this._stats = {};
      return { loaded: false, modelCount: 0 };
    } finally {
      if (locked) {
        releaseLock(lockPath);
      }
    }
  }

  /**
   * Persists the current in-memory stats to a JSON file.
   * Creates parent directories automatically if they don't exist.
   *
   * @param {string} [filePath] - Path to write stats to (defaults to this.statsPath)
   * @returns {{ saved: boolean, modelCount: number, path: string }}
   */
  async saveStats(filePath) {
    const targetPath = filePath || this.statsPath;
    const lockPath = targetPath + '.lock';

    // Ensure parent directory exists before acquiring the lock file
    try {
      const dir = dirname(targetPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      // Let it fail at writeFileSync or acquireLock
    }

    const locked = await acquireLock(lockPath);
    if (!locked) {
      console.warn(`[StatsTracker] Warning: Failed to acquire lock for saving stats at ${targetPath}. Proceeding without lock.`);
    }

    try {
      const payload = {
        _meta: {
          version: '1.0.0',
          updatedAt: new Date().toISOString(),
          description: 'Thompson Sampling routing stats for multi-provider LLM selection'
        },
        models: this._stats
      };

      writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf8');

      return {
        saved: true,
        modelCount: Object.keys(this._stats).length,
        path: targetPath
      };
    } catch (err) {
      console.error(
        `[StatsTracker] Error: Failed to save stats to ${targetPath}: ${err.message}`
      );
      return {
        saved: false,
        modelCount: Object.keys(this._stats).length,
        path: targetPath
      };
    } finally {
      if (locked) {
        releaseLock(lockPath);
      }
    }
  }

  /**
   * Resets all in-memory stats. Does NOT delete the persisted file.
   */
  resetStats() {
    this._stats = {};
  }
}

// ─── CLI Interface ───────────────────────────────────────────────────────────

/**
 * Formats a stats table for console output.
 * @param {Record<string, ModelStats>} stats
 * @returns {string}
 */
function formatStatsTable(stats) {
  const models = Object.values(stats);
  if (models.length === 0) {
    return '  (no stats recorded yet)';
  }

  const header =
    '  Model                    | Provider   | α    | β    | Calls | Avg Latency | Total Cost | Last Updated';
  const sep =
    '  -------------------------+------------+------+------+-------+-------------+------------+---------------------';

  const rows = models.map((m) => {
    const name = m.model.padEnd(24);
    const prov = m.provider.padEnd(10);
    const a = String(m.alpha).padStart(4);
    const b = String(m.beta).padStart(4);
    const calls = String(m.totalCalls).padStart(5);
    const lat = `${m.avgLatencyMs.toFixed(1)}ms`.padStart(11);
    const cost = `$${m.totalCost.toFixed(4)}`.padStart(10);
    const ts = m.lastUpdated ? m.lastUpdated.slice(0, 19) : 'N/A';
    return `  ${name} | ${prov} | ${a} | ${b} | ${calls} | ${lat} | ${cost} | ${ts}`;
  });

  return [header, sep, ...rows].join('\n');
}

/**
 * CLI entry point. Invoked when this module is run directly.
 * Subcommands:
 *   discover              - List detected LLM providers
 *   log <model> <provider> <success:0|1> <latency_ms> [cost]  - Log a call
 *   show [model]           - Display stats
 */
async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Thompson Router — Stats Tracker CLI
Usage:
  node stats-tracker.js discover                                       List detected providers
  node stats-tracker.js log <model> <provider> <success:0|1> <latency_ms> [cost]   Log a call result
  node stats-tracker.js show [model]                                   Show stats (all or one model)
`);
    process.exit(0);
  }

  const tracker = new StatsTracker();
  await tracker.loadStats();

  switch (command) {
    case 'discover': {
      const providers = tracker.discoverProviders();
      if (providers.length === 0) {
        console.log('⚠️  No LLM providers detected. Set one of:');
        console.log('    GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, OLLAMA_HOST');
      } else {
        console.log(`✅ Detected ${providers.length} provider(s):\n`);
        for (const p of providers) {
          console.log(`  🔹 ${p.provider} (${p.envVar})`);
          console.log(`     Models: ${p.models.join(', ')}`);
        }
      }
      break;
    }

    case 'log': {
      const model = args[1];
      const provider = args[2];
      const successFlag = args[3];
      const latencyMs = parseFloat(args[4]);
      const cost = args[5] ? parseFloat(args[5]) : 0;

      if (!model || !provider || successFlag === undefined || isNaN(latencyMs)) {
        console.error('❌ Usage: node stats-tracker.js log <model> <provider> <success:0|1> <latency_ms> [cost]');
        process.exit(1);
      }

      const success = successFlag === '1' || successFlag === 'true';
      tracker.logCall(model, provider, success, latencyMs, cost);
      const result = await tracker.saveStats();

      console.log(
        `📝 Logged: ${model} via ${provider} — ${success ? '✅ success' : '❌ failure'} — ${latencyMs}ms — $${cost.toFixed(4)}`
      );
      if (result.saved) {
        console.log(`💾 Stats saved to ${result.path} (${result.modelCount} model(s))`);
      }
      break;
    }

    case 'show': {
      const modelFilter = args[1];

      if (modelFilter) {
        const stat = tracker.getStats(modelFilter);
        if (!stat) {
          console.log(`⚠️  No stats found for model: ${modelFilter}`);
        } else {
          console.log(`📊 Stats for ${modelFilter}:\n`);
          console.log(formatStatsTable({ [modelFilter]: stat }));
        }
      } else {
        const allStats = tracker.getStats();
        console.log('📊 All Model Stats:\n');
        console.log(formatStatsTable(allStats));
      }
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
