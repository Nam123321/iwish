"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
class AnthropicProvider {
    providerName = 'anthropic';
    apiKey;
    modelName;
    constructor(modelName) {
        this.apiKey = process.env.ANTHROPIC_API_KEY || '';
        this.modelName = modelName || process.env.IWISH_ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
    }
    async analyzeSemantic(prompt) {
        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
        }
        const url = 'https://api.anthropic.com/v1/messages';
        const systemInstruction = `You are a strict JSON outputting agent. Return ONLY valid JSON matching this schema: { "summary": "string", "tags": ["string"], "layer": "presentation" | "business" | "data" | "infrastructure" | "config" | "unknown", "complexity": "low" | "medium" | "high" | "unknown" }`;
        const requestBody = {
            model: this.modelName,
            max_tokens: 1024,
            system: systemInstruction,
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.1
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Anthropic API Error: ${response.status} ${errText}`);
        }
        const data = await response.json();
        const resultText = data?.content?.[0]?.text;
        if (!resultText) {
            throw new Error('No content returned from Anthropic API');
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
exports.AnthropicProvider = AnthropicProvider;
