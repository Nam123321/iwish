"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICompatibleProvider = void 0;
class OpenAICompatibleProvider {
    providerName;
    apiKey;
    modelName;
    baseUrl;
    constructor(config) {
        this.providerName = config.providerName;
        this.apiKey = process.env[config.envKeyName] || '';
        this.modelName = process.env[`IWISH_${config.providerName.toUpperCase()}_MODEL`] || config.defaultModel;
        this.baseUrl = process.env[`IWISH_${config.providerName.toUpperCase()}_BASE_URL`] || config.defaultBaseUrl;
    }
    async analyzeSemantic(prompt) {
        if (!this.apiKey) {
            throw new Error(`API Key for ${this.providerName} is not set. Expected env var: ${this.providerName.toUpperCase()}_API_KEY`);
        }
        const systemInstruction = `You are a strict JSON outputting agent. Return ONLY valid JSON matching this schema: { "summary": "string", "tags": ["string"], "layer": "presentation" | "business" | "data" | "infrastructure" | "config" | "unknown", "complexity": "low" | "medium" | "high" | "unknown" }`;
        const requestBody = {
            model: this.modelName,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        };
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`${this.providerName} API Error: ${response.status} ${errText}`);
        }
        const data = await response.json();
        const resultText = data?.choices?.[0]?.message?.content;
        if (!resultText) {
            throw new Error(`No content returned from ${this.providerName} API`);
        }
        try {
            const parsed = JSON.parse(resultText);
            return {
                summary: parsed.summary || 'Analyzed file',
                tags: Array.isArray(parsed.tags) ? parsed.tags : [],
                layer: parsed.layer || 'unknown',
                complexity: parsed.complexity || 'unknown'
            };
        }
        catch (e) {
            throw new Error(`Failed to parse LLM response as JSON: ${resultText}`);
        }
    }
}
exports.OpenAICompatibleProvider = OpenAICompatibleProvider;
