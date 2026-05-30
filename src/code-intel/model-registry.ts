import * as fs from 'fs-extra';
import * as path from 'path';

export type ModelTag = 'cheap' | 'balanced' | 'advanced';
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'auto';

export type ResolvedModel = {
  provider: ModelProvider;
  modelId: string;
  source: 'manual-override' | 'cdn-cache' | 'embedded-default';
};

type ModelMap = Record<ModelProvider, Record<ModelTag, string>>;

export function getEmbeddedDefaults(): Record<ModelProvider, Record<ModelTag, string>> {
  return {
    openai: {
      cheap: 'gpt-4.1-mini',
      balanced: 'gpt-4.1',
      advanced: 'o3',
    },
    anthropic: {
      cheap: 'claude-sonnet-4-20250514',
      balanced: 'claude-sonnet-4-20250514',
      advanced: 'claude-opus-4-20250514',
    },
    google: {
      cheap: 'gemini-2.5-flash',
      balanced: 'gemini-2.5-pro',
      advanced: 'gemini-2.5-pro',
    },
    auto: {
      cheap: 'gpt-4.1-mini',
      balanced: 'gpt-4.1',
      advanced: 'o3',
    },
  };
}

export function detectProvider(): ModelProvider {
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }
  if (process.env.GOOGLE_API_KEY) {
    return 'google';
  }
  return 'auto';
}

function loadJsonFileSafe<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return fs.readJsonSync(filePath) as T;
  } catch {
    return null;
  }
}

export function resolveModel(projectRoot: string, tag: ModelTag, provider?: ModelProvider): ResolvedModel {
  const resolvedProvider = provider || detectProvider();

  // Layer 1: Manual override from .iwish/config/models.json
  const manualOverridePath = path.join(projectRoot, '.iwish', 'config', 'models.json');
  const manualOverride = loadJsonFileSafe<Partial<ModelMap>>(manualOverridePath);
  if (manualOverride) {
    const providerMap = manualOverride[resolvedProvider];
    if (providerMap && providerMap[tag]) {
      return { provider: resolvedProvider, modelId: providerMap[tag], source: 'manual-override' };
    }
  }

  // Layer 2: CDN cache from .iwish/cache/models-meta.json
  const cdnCachePath = path.join(projectRoot, '.iwish', 'cache', 'models-meta.json');
  const cdnCache = loadJsonFileSafe<{ models?: Partial<ModelMap> }>(cdnCachePath);
  if (cdnCache?.models) {
    const providerMap = cdnCache.models[resolvedProvider];
    if (providerMap && providerMap[tag]) {
      return { provider: resolvedProvider, modelId: providerMap[tag], source: 'cdn-cache' };
    }
  }

  // Layer 3: Embedded defaults
  const defaults = getEmbeddedDefaults();
  const modelId = defaults[resolvedProvider]?.[tag] || defaults.auto[tag];
  return { provider: resolvedProvider, modelId, source: 'embedded-default' };
}

export function fallbackChain(
  projectRoot: string,
  error: any,
  tag: ModelTag,
  provider?: ModelProvider,
): ResolvedModel {
  const resolvedProvider = provider || detectProvider();
  const activeModelId = process.env.ACTIVE_AGENT_MODEL || process.env.MODEL_NAME || 'gemini-2.5-flash';
  
  console.warn(
    `[CRITICAL WARNING] API call failed for provider '${resolvedProvider}' with tag '${tag}'. Error: ${
      error?.message || error
    }. Falling back to session default model: '${activeModelId}' to prevent workflow interruption.`
  );

  return {
    provider: resolvedProvider,
    modelId: activeModelId,
    source: 'embedded-default',
  };
}

