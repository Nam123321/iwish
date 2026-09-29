"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddedDefaults = getEmbeddedDefaults;
exports.detectProvider = detectProvider;
exports.resolveModel = resolveModel;
exports.fallbackChain = fallbackChain;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
function getEmbeddedDefaults() {
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
function detectProvider() {
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
function loadJsonFileSafe(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        return fs.readJsonSync(filePath);
    }
    catch {
        return null;
    }
}
function resolveModel(projectRoot, tag, provider) {
    const resolvedProvider = provider || detectProvider();
    // Layer 1: Manual override from .iwish/config/models.json
    const manualOverridePath = path.join(projectRoot, '.iwish', 'config', 'models.json');
    const manualOverride = loadJsonFileSafe(manualOverridePath);
    if (manualOverride) {
        const providerMap = manualOverride[resolvedProvider];
        if (providerMap && providerMap[tag]) {
            return { provider: resolvedProvider, modelId: providerMap[tag], source: 'manual-override' };
        }
    }
    // Layer 2: CDN cache from .iwish/cache/models-meta.json
    const cdnCachePath = path.join(projectRoot, '.iwish', 'cache', 'models-meta.json');
    const cdnCache = loadJsonFileSafe(cdnCachePath);
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
function fallbackChain(projectRoot, error, tag, provider) {
    const resolvedProvider = provider || detectProvider();
    const activeModelId = process.env.ACTIVE_AGENT_MODEL || process.env.MODEL_NAME || 'gemini-2.5-flash';
    console.warn(`[CRITICAL WARNING] API call failed for provider '${resolvedProvider}' with tag '${tag}'. Error: ${error?.message || error}. Falling back to session default model: '${activeModelId}' to prevent workflow interruption.`);
    return {
        provider: resolvedProvider,
        modelId: activeModelId,
        source: 'embedded-default',
    };
}
