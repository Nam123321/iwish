import { SemanticMetadata } from '../semantic-analyzer';

export interface LLMProvider {
  analyzeSemantic(prompt: string): Promise<SemanticMetadata>;
  providerName: string;
}
