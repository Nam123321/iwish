"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMFactory = void 0;
const gemini_provider_1 = require("./gemini-provider");
const openai_provider_1 = require("./openai-provider");
const anthropic_provider_1 = require("./anthropic-provider");
const cohere_provider_1 = require("./cohere-provider");
const openai_compatible_provider_1 = require("./openai-compatible-provider");
const model_registry_1 = require("../model-registry");
class LLMFactory {
    static getProvider(projectRoot) {
        const providerName = process.env.IWISH_LLM_PROVIDER?.toLowerCase();
        // Map exact provider names
        switch (providerName) {
            case 'gemini': return new gemini_provider_1.GeminiProvider(projectRoot ? (0, model_registry_1.resolveModel)(projectRoot, 'balanced', 'google').modelId : undefined);
            case 'openai': return new openai_provider_1.OpenAIProvider(projectRoot ? (0, model_registry_1.resolveModel)(projectRoot, 'balanced', 'openai').modelId : undefined);
            case 'anthropic': return new anthropic_provider_1.AnthropicProvider(projectRoot ? (0, model_registry_1.resolveModel)(projectRoot, 'balanced', 'anthropic').modelId : undefined);
            case 'cohere': return new cohere_provider_1.CohereProvider();
            case 'groq': return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'groq', envKeyName: 'GROQ_API_KEY', defaultModel: 'llama3-8b-8192', defaultBaseUrl: 'https://api.groq.com/openai/v1/chat/completions' });
            case 'mistral': return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'mistral', envKeyName: 'MISTRAL_API_KEY', defaultModel: 'mistral-small-latest', defaultBaseUrl: 'https://api.mistral.ai/v1/chat/completions' });
            case 'deepseek': return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'deepseek', envKeyName: 'DEEPSEEK_API_KEY', defaultModel: 'deepseek-chat', defaultBaseUrl: 'https://api.deepseek.com/chat/completions' });
            case 'together': return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'together', envKeyName: 'TOGETHER_API_KEY', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', defaultBaseUrl: 'https://api.together.xyz/v1/chat/completions' });
            case 'openrouter': return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'openrouter', envKeyName: 'OPENROUTER_API_KEY', defaultModel: 'google/gemini-2.5-flash', defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions' });
            case 'qwen': return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'qwen', envKeyName: 'QWEN_API_KEY', defaultModel: 'qwen-plus', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' });
        }
        // Auto-detect based on available keys if no explicit provider config
        if (process.env.GEMINI_API_KEY)
            return new gemini_provider_1.GeminiProvider(projectRoot ? (0, model_registry_1.resolveModel)(projectRoot, 'balanced', 'google').modelId : undefined);
        if (process.env.OPENAI_API_KEY)
            return new openai_provider_1.OpenAIProvider(projectRoot ? (0, model_registry_1.resolveModel)(projectRoot, 'balanced', 'openai').modelId : undefined);
        if (process.env.ANTHROPIC_API_KEY)
            return new anthropic_provider_1.AnthropicProvider(projectRoot ? (0, model_registry_1.resolveModel)(projectRoot, 'balanced', 'anthropic').modelId : undefined);
        if (process.env.COHERE_API_KEY)
            return new cohere_provider_1.CohereProvider();
        if (process.env.GROQ_API_KEY)
            return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'groq', envKeyName: 'GROQ_API_KEY', defaultModel: 'llama3-8b-8192', defaultBaseUrl: 'https://api.groq.com/openai/v1/chat/completions' });
        if (process.env.MISTRAL_API_KEY)
            return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'mistral', envKeyName: 'MISTRAL_API_KEY', defaultModel: 'mistral-small-latest', defaultBaseUrl: 'https://api.mistral.ai/v1/chat/completions' });
        if (process.env.DEEPSEEK_API_KEY)
            return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'deepseek', envKeyName: 'DEEPSEEK_API_KEY', defaultModel: 'deepseek-chat', defaultBaseUrl: 'https://api.deepseek.com/chat/completions' });
        if (process.env.TOGETHER_API_KEY)
            return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'together', envKeyName: 'TOGETHER_API_KEY', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', defaultBaseUrl: 'https://api.together.xyz/v1/chat/completions' });
        if (process.env.OPENROUTER_API_KEY)
            return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'openrouter', envKeyName: 'OPENROUTER_API_KEY', defaultModel: 'google/gemini-2.5-flash', defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions' });
        if (process.env.QWEN_API_KEY)
            return new openai_compatible_provider_1.OpenAICompatibleProvider({ providerName: 'qwen', envKeyName: 'QWEN_API_KEY', defaultModel: 'qwen-plus', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' });
        throw new Error('No LLM Provider configured. Run "iwish update" or set an API KEY in your environment.');
    }
}
exports.LLMFactory = LLMFactory;
