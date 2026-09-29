"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
class OpenAIProvider {
    providerName = 'openai';
    apiKey;
    modelName;
    constructor(modelName) {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.modelName = modelName || process.env.IWISH_OPENAI_MODEL || 'gpt-4o-mini';
    }
    async analyzeSemantic(prompt) {
        if (!this.apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set.');
        }
        const url = 'https://api.openai.com/v1/chat/completions';
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
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} ${errText}`);
        }
        const data = await response.json();
        const resultText = data?.choices?.[0]?.message?.content;
        if (!resultText) {
            throw new Error('No content returned from OpenAI API');
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
exports.OpenAIProvider = OpenAIProvider;
