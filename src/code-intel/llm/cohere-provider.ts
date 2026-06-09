import { LLMProvider } from './llm-provider';
import { SemanticMetadata } from '../semantic-analyzer';

export class CohereProvider implements LLMProvider {
  public readonly providerName = 'cohere';
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor() {
    this.apiKey = process.env.COHERE_API_KEY || '';
    this.modelName = process.env.IWISH_COHERE_MODEL || 'command-r-plus';
  }

  async analyzeSemantic(prompt: string): Promise<SemanticMetadata> {
    if (!this.apiKey) {
      throw new Error('COHERE_API_KEY environment variable is not set.');
    }

    const url = 'https://api.cohere.com/v1/chat';
    
    const systemInstruction = `You are a strict JSON outputting agent. Return ONLY valid JSON matching this schema: { "summary": "string", "tags": ["string"], "layer": "presentation" | "business" | "data" | "infrastructure" | "config" | "unknown", "complexity": "low" | "medium" | "high" | "unknown" }`;

    const requestBody = {
      model: this.modelName,
      message: prompt,
      preamble: systemInstruction,
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
      throw new Error(`Cohere API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const resultText = data?.text;
    
    if (!resultText) {
      throw new Error('No content returned from Cohere API');
    }

    try {
      const parsed = JSON.parse(resultText) as SemanticMetadata;
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
