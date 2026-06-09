import { LLMProvider } from './llm-provider';
import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { CohereProvider } from './cohere-provider';
import { OpenAICompatibleProvider } from './openai-compatible-provider';

export class LLMFactory {
  static getProvider(): LLMProvider {
    const providerName = process.env.IWISH_LLM_PROVIDER?.toLowerCase();

    // Map exact provider names
    switch (providerName) {
      case 'gemini': return new GeminiProvider();
      case 'openai': return new OpenAIProvider();
      case 'anthropic': return new AnthropicProvider();
      case 'cohere': return new CohereProvider();
      case 'groq': return new OpenAICompatibleProvider({ providerName: 'groq', envKeyName: 'GROQ_API_KEY', defaultModel: 'llama3-8b-8192', defaultBaseUrl: 'https://api.groq.com/openai/v1/chat/completions' });
      case 'mistral': return new OpenAICompatibleProvider({ providerName: 'mistral', envKeyName: 'MISTRAL_API_KEY', defaultModel: 'mistral-small-latest', defaultBaseUrl: 'https://api.mistral.ai/v1/chat/completions' });
      case 'deepseek': return new OpenAICompatibleProvider({ providerName: 'deepseek', envKeyName: 'DEEPSEEK_API_KEY', defaultModel: 'deepseek-chat', defaultBaseUrl: 'https://api.deepseek.com/chat/completions' });
      case 'together': return new OpenAICompatibleProvider({ providerName: 'together', envKeyName: 'TOGETHER_API_KEY', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', defaultBaseUrl: 'https://api.together.xyz/v1/chat/completions' });
      case 'openrouter': return new OpenAICompatibleProvider({ providerName: 'openrouter', envKeyName: 'OPENROUTER_API_KEY', defaultModel: 'google/gemini-2.5-flash', defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions' });
      case 'qwen': return new OpenAICompatibleProvider({ providerName: 'qwen', envKeyName: 'QWEN_API_KEY', defaultModel: 'qwen-plus', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' });
    }

    // Auto-detect based on available keys if no explicit provider config
    if (process.env.GEMINI_API_KEY) return new GeminiProvider();
    if (process.env.OPENAI_API_KEY) return new OpenAIProvider();
    if (process.env.ANTHROPIC_API_KEY) return new AnthropicProvider();
    if (process.env.COHERE_API_KEY) return new CohereProvider();
    if (process.env.GROQ_API_KEY) return new OpenAICompatibleProvider({ providerName: 'groq', envKeyName: 'GROQ_API_KEY', defaultModel: 'llama3-8b-8192', defaultBaseUrl: 'https://api.groq.com/openai/v1/chat/completions' });
    if (process.env.MISTRAL_API_KEY) return new OpenAICompatibleProvider({ providerName: 'mistral', envKeyName: 'MISTRAL_API_KEY', defaultModel: 'mistral-small-latest', defaultBaseUrl: 'https://api.mistral.ai/v1/chat/completions' });
    if (process.env.DEEPSEEK_API_KEY) return new OpenAICompatibleProvider({ providerName: 'deepseek', envKeyName: 'DEEPSEEK_API_KEY', defaultModel: 'deepseek-chat', defaultBaseUrl: 'https://api.deepseek.com/chat/completions' });
    if (process.env.TOGETHER_API_KEY) return new OpenAICompatibleProvider({ providerName: 'together', envKeyName: 'TOGETHER_API_KEY', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', defaultBaseUrl: 'https://api.together.xyz/v1/chat/completions' });
    if (process.env.OPENROUTER_API_KEY) return new OpenAICompatibleProvider({ providerName: 'openrouter', envKeyName: 'OPENROUTER_API_KEY', defaultModel: 'google/gemini-2.5-flash', defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions' });
    if (process.env.QWEN_API_KEY) return new OpenAICompatibleProvider({ providerName: 'qwen', envKeyName: 'QWEN_API_KEY', defaultModel: 'qwen-plus', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' });

    throw new Error('No LLM Provider configured. Run "iwish update" or set an API KEY in your environment.');
  }
}
