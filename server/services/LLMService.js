const axios = require('axios');

class LLMService {
  constructor() {
    this.providers = {
      openai: this.createOpenAIClient.bind(this),
      claude: this.createClaudeClient.bind(this),
      openrouter: this.createOpenRouterClient.bind(this),
      local: this.createLocalClient.bind(this)
    };
  }

  async generateCode(prompt, environment, options = {}) {
    const { llmConfiguration } = environment || {};
    
    if (!llmConfiguration) {
      throw new Error('LLM configuration not found for this environment');
    }
    
    // If enabled is not explicitly set to false, consider it enabled
    if (llmConfiguration.enabled === false) {
      throw new Error('LLM configuration not enabled for this environment');
    }

    const { provider, llmProvider, apiKey, model, baseUrl } = llmConfiguration;
    
    // Determine the actual provider to use
    const actualProvider = provider === 'local' ? llmProvider : provider;
    const llmType = provider === 'local' ? 'local' : 'cloud';

    if (!actualProvider) {
      throw new Error('LLM provider not specified');
    }

    // Get the appropriate client
    const client = this.providers[actualProvider.toLowerCase()];
    if (!client) {
      // For local providers, try to use the local client
      if (llmType === 'local') {
        const localClient = this.providers['local'];
        if (localClient) {
          return await this.generatePlaywrightCode(localClient({
            apiKey: apiKey || '',
            model: model || this.getDefaultModel(actualProvider),
            baseUrl: baseUrl || this.getDefaultBaseUrl(actualProvider)
          }), prompt, options);
        }
      }
      throw new Error(`Unsupported LLM provider: ${actualProvider}`);
    }

    // Create client instance
    const llmClient = client({
      apiKey: llmType === 'local' ? (apiKey || '') : apiKey,
      model: model || this.getDefaultModel(actualProvider),
      baseUrl: baseUrl || this.getDefaultBaseUrl(actualProvider)
    });

    // Generate the code using LLM
    return await this.generatePlaywrightCode(llmClient, prompt, options);
  }

  async generatePlaywrightCode(llmClient, prompt, options = {}) {
    const {
      testName = 'Generated Test',
      testType = 'UI Test',
      baseUrl = process.env.BASE_URL || 'http://localhost:3000',
      environment = null
    } = options;

    // Create the system prompt for code generation
    const systemPrompt = this.createSystemPrompt(testType, baseUrl, environment);
    
    // Create the user prompt with context
    const userPrompt = this.createUserPrompt(prompt, testName, testType);

    try {
      const response = await llmClient.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.1, // Low temperature for consistent code generation
        maxTokens: 4000
      });

      return this.postProcessGeneratedCode(response, testName, testType);
    } catch (error) {
      console.error('LLM code generation error:', error);
      throw new Error(`Failed to generate code with LLM: ${error.message}`);
    }
  }

  createSystemPrompt(testType, baseUrl, environment) {
    const envVars = environment?.variables || {};
    const timeout = envVars.TIMEOUT || 30000;
    const browser = envVars.BROWSER || 'chromium';
    const headless = envVars.HEADLESS !== false;

    return `You are an expert Playwright test automation engineer. Generate high-quality, production-ready Playwright test code based on user requirements.

REQUIREMENTS:
- Use TypeScript with Playwright
- Include proper imports and setup
- Use data-testid selectors when possible
- For text selectors, use: page.getByText('text') or page.locator('text=text')
- For multiple selectors, use separate locators or proper CSS syntax
- Include proper error handling and assertions
- Follow Playwright best practices
- Include Allure reporting integration
- Use environment variables for configuration

CONFIGURATION:
- Base URL: ${baseUrl}
- Timeout: ${timeout}ms
- Browser: ${browser}
- Headless: ${headless}
- Test Type: ${testType}

GENERATE:
- Complete test file with imports
- Test setup and teardown
- Step-by-step test implementation
- Proper assertions and error handling
- Screenshot capture on failure
- Allure reporting tags

Return ONLY the complete TypeScript test file code, no explanations or markdown formatting.`;
  }

  createUserPrompt(prompt, testName, testType) {
    return `Generate a Playwright test for: "${prompt}"

Test Name: ${testName}
Test Type: ${testType}

Requirements:
1. Parse the natural language prompt into actionable test steps
2. Generate appropriate Playwright code for each step
3. Include proper selectors and assertions
4. Handle both UI interactions and API calls if mentioned
5. Use modern Playwright patterns and best practices

Generate the complete test file code.`;
  }

  postProcessGeneratedCode(generatedCode, testName, testType) {
    // Clean up the generated code
    let code = generatedCode.trim();
    
    // Remove markdown code blocks if present
    code = code.replace(/```typescript?\n?/g, '').replace(/```\n?/g, '');
    
    // Ensure proper imports
    if (!code.includes("import { test, expect }")) {
      code = `import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

${code}`;
    }

    // Ensure proper test structure
    if (!code.includes('test.describe')) {
      code = `test.describe('${testName}', () => {
  test('should execute test steps', async ({ page }) => {
${code}
  });
});`;
    }

    return code;
  }

  // OpenAI Client
  createOpenAIClient({ apiKey, model, baseUrl }) {
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        const response = await axios.post(`${baseUrl}/v1/chat/completions`, {
          model: model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        return response.data.choices[0].message.content;
      }
    };
  }

  // Claude Client
  createClaudeClient({ apiKey, model, baseUrl }) {
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        const response = await axios.post(`${baseUrl}/v1/messages`, {
          model: model || 'claude-3-sonnet-20240229',
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        }, {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        });

        return response.data.content[0].text;
      }
    };
  }

  // OpenRouter Client
  createOpenRouterClient({ apiKey, model, baseUrl }) {
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        try {
          const response = await axios.post(`${baseUrl}/api/v1/chat/completions`, {
            model: model || 'deepseek/deepseek-chat-v3.1:free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature,
            max_tokens: maxTokens
          }, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'AI Test Generator'
            },
            timeout: 30000
          });

          if (!response.data || !response.data.choices || !response.data.choices[0]) {
            throw new Error('Invalid response from OpenRouter API');
          }

          return response.data.choices[0].message.content;
        } catch (error) {
          console.error('OpenRouter API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
          throw error;
        }
      }
    };
  }

  // Local Model Client (Ollama, LM Studio, etc.)
  createLocalClient({ apiKey, model, baseUrl }) {
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        try {
          // Try the newer Ollama API format first
          console.log('Trying Ollama /api/chat endpoint...');
          const response = await axios.post(`${baseUrl}/api/chat`, {
            model: model || 'llama2:latest',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            stream: false,
            options: {
              temperature,
              num_predict: Math.min(maxTokens, 2000) // Reduce max tokens for faster generation
            }
          }, {
            timeout: 120000 // 2 minutes timeout
          });

          console.log('Ollama /api/chat response received');
          return response.data.message.content;
        } catch (error) {
          // Fallback to the older generate API
          console.log('Trying fallback /api/generate API format...', error.message);
          const response = await axios.post(`${baseUrl}/api/generate`, {
            model: model || 'llama2:latest',
            prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
            stream: false,
            options: {
              temperature,
              num_predict: Math.min(maxTokens, 2000) // Reduce max tokens for faster generation
            }
          }, {
            timeout: 120000 // 2 minutes timeout
          });

          console.log('Ollama /api/generate response received');
          return response.data.response;
        }
      }
    };
  }

  getDefaultModel(provider) {
    const defaults = {
      openai: 'gpt-3.5-turbo',
      claude: 'claude-3-sonnet-20240229',
      openrouter: 'deepseek/deepseek-chat-v3.1:free',
      ollama: 'llama2',
      'lm-studio': 'llama2',
      vllm: 'llama2',
      local: 'llama2'
    };
    return defaults[provider.toLowerCase()] || 'gpt-3.5-turbo';
  }

  getDefaultBaseUrl(provider) {
    const defaults = {
      openai: 'https://api.openai.com',
      claude: 'https://api.anthropic.com',
      openrouter: 'https://openrouter.ai',
      ollama: 'http://localhost:11434',
      'lm-studio': 'http://localhost:1234',
      vllm: 'http://localhost:8000',
      local: 'http://localhost:11434'
    };
    return defaults[provider.toLowerCase()] || 'https://api.openai.com';
  }

  // Test LLM connection
  async testConnection(provider, llmType, apiKey, model, baseUrl) {
    const actualProvider = llmType === 'local' ? provider : provider;
    const client = this.providers[actualProvider.toLowerCase()];
    
    if (!client) {
      throw new Error(`Unsupported provider: ${actualProvider}`);
    }

    const llmClient = client({
      apiKey: llmType === 'local' ? (apiKey || '') : apiKey,
      model: model || this.getDefaultModel(actualProvider),
      baseUrl: baseUrl || this.getDefaultBaseUrl(actualProvider)
    });

    // Test with a simple prompt
    try {
      await llmClient.generate({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Say "Connection successful"',
        temperature: 0.1,
        maxTokens: 10
      });
      return true;
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}

module.exports = LLMService;
