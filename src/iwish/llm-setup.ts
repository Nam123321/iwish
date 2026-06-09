import * as readline from 'readline';
import { EnvManager } from './env-manager';

const LLM_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', envKey: 'GEMINI_API_KEY' },
  { id: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY' },
  { id: 'anthropic', name: 'Anthropic Claude', envKey: 'ANTHROPIC_API_KEY' },
  { id: 'cohere', name: 'Cohere', envKey: 'COHERE_API_KEY' },
  { id: 'groq', name: 'Groq', envKey: 'GROQ_API_KEY' },
  { id: 'mistral', name: 'Mistral', envKey: 'MISTRAL_API_KEY' },
  { id: 'deepseek', name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY' },
  { id: 'together', name: 'Together AI', envKey: 'TOGETHER_API_KEY' },
  { id: 'openrouter', name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY' },
  { id: 'qwen', name: 'Alibaba Qwen', envKey: 'QWEN_API_KEY' }
];

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

export async function promptLLMSetup(projectRoot: string): Promise<void> {
  const envManager = new EnvManager(projectRoot);
  
  // Check if LLM is already configured
  const currentProvider = envManager.get('IWISH_LLM_PROVIDER');
  if (currentProvider) {
    const providerConfig = LLM_PROVIDERS.find(p => p.id === currentProvider.toLowerCase());
    if (providerConfig && envManager.has(providerConfig.envKey)) {
      console.log(`\n\x1b[32m[I-Wish Setup]\x1b[0m LLM Provider is already configured as '${providerConfig.name}'. Skipping setup.`);
      return;
    }
  } else {
    // Check if any recognized API key already exists natively
    const existingKeyProvider = LLM_PROVIDERS.find(p => envManager.has(p.envKey));
    if (existingKeyProvider) {
      console.log(`\n\x1b[32m[I-Wish Setup]\x1b[0m Found existing ${existingKeyProvider.name} API Key. Skipping explicit LLM setup.`);
      return;
    }
  }

  console.log('\n\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m  Configure LLM Provider for I-Wish Code Intelligence\x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m');
  
  LLM_PROVIDERS.forEach((provider, index) => {
    console.log(`  ${index + 1}. ${provider.name}`);
  });
  console.log('  0. Skip LLM setup');
  console.log('\x1b[36m====================================================\x1b[0m');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    let selectedProviderIndex = -1;
    while (selectedProviderIndex < 0 || selectedProviderIndex > LLM_PROVIDERS.length) {
      const choice = await askQuestion(rl, 'Select a provider [1-10, or 0 to skip]: ');
      const parsed = parseInt(choice, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= LLM_PROVIDERS.length) {
        selectedProviderIndex = parsed;
      } else {
        console.log('\x1b[31mInvalid choice. Please select a valid number.\x1b[0m');
      }
    }

    if (selectedProviderIndex === 0) {
      console.log('\n\x1b[33mSkipping LLM setup. Features requiring AI will be disabled.\x1b[0m');
      return;
    }

    const provider = LLM_PROVIDERS[selectedProviderIndex - 1];
    let apiKey = '';
    while (!apiKey) {
      apiKey = await askQuestion(rl, `Enter API Key for ${provider.name} (${provider.envKey}): `);
      if (!apiKey) {
        console.log('\x1b[31mAPI Key is required to configure the provider.\x1b[0m');
      }
    }

    envManager.set('IWISH_LLM_PROVIDER', provider.id);
    envManager.set(provider.envKey, apiKey);
    envManager.save();

    console.log(`\n\x1b[32mSuccessfully configured ${provider.name} as the default LLM provider.\x1b[0m`);
    console.log(`(API Key saved to .env file in ${projectRoot})\n`);

  } finally {
    rl.close();
  }
}
