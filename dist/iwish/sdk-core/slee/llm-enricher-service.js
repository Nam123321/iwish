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
exports.LLMEnricherService = void 0;
const crypto = __importStar(require("crypto"));
const LLM_PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini', envKey: 'GEMINI_API_KEY', defaultModel: 'gemini-2.5-flash', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models', schemaType: 'gemini' },
    { id: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY', defaultModel: 'gpt-4o-mini', defaultBaseUrl: 'https://api.openai.com/v1/chat/completions', schemaType: 'openai' },
    { id: 'anthropic', name: 'Anthropic Claude', envKey: 'ANTHROPIC_API_KEY', defaultModel: 'claude-3-5-sonnet-latest', defaultBaseUrl: 'https://api.anthropic.com/v1/messages', schemaType: 'anthropic' },
    { id: 'cohere', name: 'Cohere', envKey: 'COHERE_API_KEY', defaultModel: 'command-r-plus', defaultBaseUrl: 'https://api.cohere.ai/v1/chat', schemaType: 'cohere' },
    { id: 'groq', name: 'Groq', envKey: 'GROQ_API_KEY', defaultModel: 'llama3-8b-8192', defaultBaseUrl: 'https://api.groq.com/openai/v1/chat/completions', schemaType: 'openai' },
    { id: 'mistral', name: 'Mistral', envKey: 'MISTRAL_API_KEY', defaultModel: 'mistral-small-latest', defaultBaseUrl: 'https://api.mistral.ai/v1/chat/completions', schemaType: 'openai' },
    { id: 'deepseek', name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', defaultModel: 'deepseek-chat', defaultBaseUrl: 'https://api.deepseek.com/chat/completions', schemaType: 'openai' },
    { id: 'together', name: 'Together AI', envKey: 'TOGETHER_API_KEY', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', defaultBaseUrl: 'https://api.together.xyz/v1/chat/completions', schemaType: 'openai' },
    { id: 'openrouter', name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', defaultModel: 'google/gemini-2.5-flash', defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions', schemaType: 'openai' },
    { id: 'qwen', name: 'Alibaba Qwen', envKey: 'QWEN_API_KEY', defaultModel: 'qwen-plus', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', schemaType: 'openai' }
];
class LLMEnricherService {
    config;
    apiKey;
    constructor() {
        this.config = this.detectProvider();
        if (this.config) {
            this.apiKey = process.env[this.config.envKey];
        }
    }
    detectProvider() {
        const configuredProvider = process.env.IWISH_LLM_PROVIDER?.toLowerCase();
        if (configuredProvider) {
            const found = LLM_PROVIDERS.find(p => p.id === configuredProvider);
            if (found)
                return found;
        }
        // Auto-detect based on available keys
        for (const provider of LLM_PROVIDERS) {
            if (process.env[provider.envKey]) {
                return provider;
            }
        }
        return undefined;
    }
    async generateLinterRule(learning) {
        if (!this.config || !this.apiKey) {
            console.warn('[LLMEnricherService] No API key found for any of the 10 supported providers. Falling back.');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async boundary
            return this.generateFallbackRule(learning);
        }
        const systemInstruction = `You are the I-Wish Knowledge Enricher. Output strictly valid JSON with these keys: rule_name (string), description (string), language_framework (string), match_pattern (regex string), severity ("WARN" or "ERROR").`;
        const prompt = `Analyze this Learning and generate a CLI Linter Rule.\nRoot Cause: ${learning.root_cause_analysis}\nStrategy: ${learning.resolution_strategy}`;
        try {
            let resultText = '';
            if (this.config.schemaType === 'openai') {
                resultText = await this.callOpenAI(systemInstruction, prompt);
            }
            else if (this.config.schemaType === 'gemini') {
                resultText = await this.callGemini(systemInstruction, prompt);
            }
            else if (this.config.schemaType === 'anthropic') {
                resultText = await this.callAnthropic(systemInstruction, prompt);
            }
            else if (this.config.schemaType === 'cohere') {
                resultText = await this.callCohere(systemInstruction, prompt);
            }
            // Extract JSON block safely
            const match = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            const cleanJson = match ? match[1].trim() : resultText.trim();
            const ruleContent = JSON.parse(cleanJson);
            if (!ruleContent || typeof ruleContent !== 'object' || Array.isArray(ruleContent)) {
                throw new Error("LLM returned valid JSON, but not a JSON object");
            }
            return this.mapToLinterRule(learning, ruleContent);
        }
        catch (error) {
            console.error(`[LLMEnricherService] Failed to enrich learning via ${this.config.name}, falling back.`, error);
            return this.generateFallbackRule(learning);
        }
    }
    async callOpenAI(system, user) {
        const model = process.env[`IWISH_${this.config.id.toUpperCase()}_MODEL`] || this.config.defaultModel;
        const url = process.env[`IWISH_${this.config.id.toUpperCase()}_BASE_URL`] || this.config.defaultBaseUrl;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1
            }),
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
            const errBody = await response.text().catch(() => 'No body');
            throw new Error(`${this.config.name} API Error: ${response.status} - ${errBody}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
    async callGemini(system, user) {
        const model = process.env[`IWISH_${this.config.id.toUpperCase()}_MODEL`] || this.config.defaultModel;
        const baseUrl = process.env[`IWISH_${this.config.id.toUpperCase()}_BASE_URL`] || this.config.defaultBaseUrl;
        // Base URL for Gemini usually requires appending the model and key
        const url = `${baseUrl}/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: user }] }],
                systemInstruction: { parts: [{ text: system }] },
                generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
            }),
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
            const errBody = await response.text().catch(() => 'No body');
            throw new Error(`${this.config.name} API Error: ${response.status} - ${errBody}`);
        }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
    async callAnthropic(system, user) {
        const model = process.env[`IWISH_${this.config.id.toUpperCase()}_MODEL`] || this.config.defaultModel;
        const url = process.env[`IWISH_${this.config.id.toUpperCase()}_BASE_URL`] || this.config.defaultBaseUrl;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                system,
                messages: [{ role: 'user', content: user }],
                max_tokens: 1024,
                temperature: 0.1
            }),
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
            const errBody = await response.text().catch(() => 'No body');
            throw new Error(`${this.config.name} API Error: ${response.status} - ${errBody}`);
        }
        const data = await response.json();
        return data.content[0].text;
    }
    async callCohere(system, user) {
        const model = process.env[`IWISH_${this.config.id.toUpperCase()}_MODEL`] || this.config.defaultModel;
        const url = process.env[`IWISH_${this.config.id.toUpperCase()}_BASE_URL`] || this.config.defaultBaseUrl;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model,
                message: user,
                preamble: system,
                temperature: 0.1
            }),
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
            const errBody = await response.text().catch(() => 'No body');
            throw new Error(`${this.config.name} API Error: ${response.status} - ${errBody}`);
        }
        const data = await response.json();
        return data.text;
    }
    mapToLinterRule(learning, llmOutput) {
        return {
            id: crypto.randomUUID(),
            learning_id: learning.id,
            rule_name: llmOutput.rule_name || 'auto-generated-rule',
            description: llmOutput.description || learning.resolution_strategy,
            language_framework: llmOutput.language_framework || 'Unknown',
            match_pattern: llmOutput.match_pattern || '.*',
            severity: llmOutput.severity || 'WARN',
            status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
    generateFallbackRule(learning) {
        return {
            id: crypto.randomUUID(),
            learning_id: learning.id,
            rule_name: 'fallback-rule-' + Date.now(),
            description: 'Fallback rule generated because LLM API was unavailable. ' + learning.resolution_strategy,
            language_framework: 'TypeScript',
            match_pattern: 'fallback_regex',
            severity: 'WARN',
            status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
}
exports.LLMEnricherService = LLMEnricherService;
