import { LLMProvider } from './llm-provider';
import { SemanticMetadata } from '../semantic-analyzer';

export class GeminiProvider implements LLMProvider {
  public readonly providerName = 'gemini';
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(modelName?: string) {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.modelName = modelName || process.env.IWISH_GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async analyzeSemantic(prompt: string): Promise<SemanticMetadata> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    // Explicitly ask for JSON matching the SemanticMetadata structure
    const systemInstruction = `You are a strict JSON outputting agent. Return ONLY valid JSON matching this schema: { "summary": "string", "tags": ["string"], "layer": "presentation" | "business" | "data" | "infrastructure" | "config" | "unknown", "complexity": "low" | "medium" | "high" | "unknown" }`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('No content returned from Gemini API');
    }

    try {
      const parsed = JSON.parse(resultText) as SemanticMetadata;
      // Provide fallback values if missing
      return {
        summary: parsed.summary || 'Analyzed file',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        layer: parsed.layer || 'unknown',
        complexity: parsed.complexity || 'unknown'
      };
    } catch (e) {
      throw new Error(`Failed to parse LLM response as JSON: ${resultText}`);
    }
  }
}
