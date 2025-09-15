const axios = require('axios');
const DOMAnalyzer = require('./DOMAnalyzer');

// Retry utility with exponential backoff
class RetryHelper {
  static async withRetry(fn, maxRetries = 5, baseDelay = 2000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Special handling for 429 (rate limit) errors - longer delays
        let delay;
        if (error.response?.status === 429) {
          // For rate limiting, use longer delays: 5s, 10s, 20s, 40s, 80s
          delay = baseDelay * Math.pow(2, attempt + 1) + Math.random() * 2000;
          console.log(`Rate limit hit (429), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
        } else {
          // For other errors, use standard exponential backoff
          delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(`LLM request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

class LLMService {
  constructor() {
    this.providers = {
      openai: this.createOpenAIClient.bind(this),
      claude: this.createClaudeClient.bind(this),
      openrouter: this.createOpenRouterClient.bind(this),
      local: this.createLocalClient.bind(this),
      ollama: this.createLocalClient.bind(this) // Ollama is a local model provider
    };
    this.domAnalyzer = new DOMAnalyzer();
  }

  async generateCode(prompt, environment, options = {}) {
    console.log('=== LLMService.generateCode called ===');
    console.log('Options received:', options);
    const { llmConfiguration } = environment || {};
    const {
      testName = 'Generated Test',
      testType = 'UI Test'
    } = options;
    
    // Prioritize baseUrl from options, then environment variables, then default
    const baseUrl = options.baseUrl || environment?.variables?.BASE_URL || process.env.BASE_URL || 'http://localhost:5050';
    
    console.log('=== LLM SERVICE BASE URL DEBUG ===');
    console.log('baseUrl from options:', options.baseUrl);
    console.log('environment.variables?.BASE_URL:', environment?.variables?.BASE_URL);
    console.log('process.env.BASE_URL:', process.env.BASE_URL);
    console.log('Final baseUrl for DOM analysis:', baseUrl);
    console.log('===================================');
    
    if (!llmConfiguration) {
      throw new Error('LLM configuration not found for this environment');
    }
    
    // If enabled is not explicitly set to false, consider it enabled
    if (llmConfiguration.enabled === false) {
      throw new Error('LLM configuration not enabled for this environment');
    }

    const { provider, llmProvider, apiKey, model, baseUrl: configBaseUrl } = llmConfiguration;
    
    // Determine the actual provider to use
    const actualProvider = provider === 'local' ? llmProvider : provider;
    const llmType = provider === 'local' ? 'local' : 'cloud';

    if (!actualProvider) {
      throw new Error('LLM provider not specified');
    }

    // Analyze DOM structure before generating code (skip for API tests)
    let domAnalysis = null;
    const isAPITest = testType === 'api' || testType === 'e2e-api' || options.testType === 'api' || options.testType === 'e2e-api';
    
    if (!isAPITest) {
      try {
        console.log('Starting DOM analysis for URL:', baseUrl);
        
        // Check if we have parsed steps for user journey analysis
        const parsedSteps = options.parsedSteps || [];
        if (parsedSteps.length > 0) {
          console.log('Using user journey analysis with', parsedSteps.length, 'steps');
          domAnalysis = await this.domAnalyzer.analyzeUserJourney(baseUrl, parsedSteps, {
            timeout: environment?.variables?.TIMEOUT || parseInt(process.env.PLAYWRIGHT_ANALYZER_TIMEOUT_MS || '60000', 10),
            waitUntil: process.env.PLAYWRIGHT_NAV_WAIT_UNTIL || 'load',
            retries: parseInt(process.env.PLAYWRIGHT_ANALYZER_RETRIES || '2', 10)
          });
          console.log(`User journey analysis completed successfully. Found ${domAnalysis.elements.length} unique elements across ${domAnalysis.totalPages || 1} pages`);
        } else {
          console.log('Using single page analysis');
          domAnalysis = await this.domAnalyzer.analyzePage(baseUrl, {
            timeout: environment?.variables?.TIMEOUT || parseInt(process.env.PLAYWRIGHT_ANALYZER_TIMEOUT_MS || '60000', 10),
            waitUntil: process.env.PLAYWRIGHT_NAV_WAIT_UNTIL || 'load',
            retries: parseInt(process.env.PLAYWRIGHT_ANALYZER_RETRIES || '2', 10)
          });
          console.log(`DOM analysis completed successfully. Found ${domAnalysis.elements.length} interactive elements`);
        }
        
        console.log('Sample elements found:', domAnalysis.elements.slice(0, 3).map(el => ({ type: el.type, selectors: el.selectors.slice(0, 2) })));
      } catch (error) {
        console.error('DOM analysis failed with error:', error.message);
        console.error('Error stack:', error.stack);
      }
    } else {
      console.log('Skipping DOM analysis for API test type:', testType);
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
            baseUrl: configBaseUrl || this.getDefaultBaseUrl(actualProvider)
          }), prompt, { ...options, domAnalysis });
        }
      }
      throw new Error(`Unsupported LLM provider: ${actualProvider}`);
    }

    // Create client instance
    const llmClient = client({
      apiKey: llmType === 'local' ? (apiKey || '') : apiKey,
      model: model || this.getDefaultModel(actualProvider),
      baseUrl: configBaseUrl || this.getDefaultBaseUrl(actualProvider)
    });

    // Generate the code using LLM with DOM analysis
    return await this.generatePlaywrightCode(llmClient, prompt, { ...options, domAnalysis });
  }

  async generatePlaywrightCode(llmClient, prompt, options = {}) {
    const {
      testName = 'Generated Test',
      testType = 'UI Test',
      baseUrl = process.env.BASE_URL || 'http://localhost:5050',
      environment = null,
      domAnalysis = null
    } = options;

    // Create the system prompt for code generation
    const systemPrompt = this.createSystemPrompt(testType, baseUrl, environment, domAnalysis);
    
    // Create the user prompt with context
    const userPrompt = this.createUserPrompt(prompt, testName, testType, domAnalysis);

    try {
      // Use retry logic for the LLM generation call
      const response = await RetryHelper.withRetry(async () => {
        return await llmClient.generate({
          systemPrompt,
          userPrompt,
          temperature: 0.1, // Low temperature for consistent code generation
          maxTokens: 4000
        });
      });

      return this.postProcessGeneratedCode(response, testName, testType);
    } catch (error) {
      console.error('LLM code generation error:', error);
      throw new Error(`Failed to generate code with LLM: ${error.message}`);
    }
  }

  createSystemPrompt(testType, baseUrl, environment, domAnalysis) {
    const envVars = environment?.variables || {};
    const timeout = envVars.TIMEOUT || 30000;
    const browser = envVars.BROWSER || 'chromium';
    const headless = envVars.HEADLESS !== false;
    
    const isAPITest = testType === 'api' || testType === 'e2e-api';
    
    if (isAPITest) {
      return `You are an expert Playwright API test automation engineer. Generate high-quality, production-ready Playwright API test code based on user requirements.

REQUIREMENTS:
- Use TypeScript with Playwright
- Focus on API testing using request.get(), request.post(), request.put(), request.delete()
- Include proper imports: import { test, expect } from '@playwright/test'
- Include Allure reporting: import { allure } from 'allure-playwright'
- Use environment variables for configuration (BASE_URL, TIMEOUT)
- Add comprehensive response validation (status codes, headers, body structure)
- Include proper error handling and retry mechanisms
- Follow API testing best practices
- Generate realistic test data and cleanup procedures
- Add proper assertions for API responses
- Include schema validation where appropriate
- Use proper HTTP methods and status code expectations
- Add authentication handling if required
- Include performance assertions (response time)
- Add proper test data management and cleanup

API TESTING PATTERNS:
- Use page.request or APIRequestContext for API calls
- Validate response status: expect(response.status()).toBe(200)
- Validate response body: expect(await response.json()).toMatchObject(expectedData)
- Validate response headers: expect(response.headers()['content-type']).toContain('application/json')
- Use proper HTTP methods: GET for retrieval, POST for creation, PUT for updates, DELETE for removal
- Include authentication headers when needed
- Add response time validation: expect(responseTime).toBeLessThan(2000)
- Use test data factories for consistent data generation
- Implement proper cleanup in afterEach hooks

Return ONLY the complete TypeScript test file code without explanations or markdown formatting.`;
    }

    let domContext = '';
     if (domAnalysis && domAnalysis.elements.length > 0) {
       domContext = `

AVAILABLE PAGE ELEMENTS (use these for accurate selectors):
${domAnalysis.elements.map(el => {
         const attrs = Object.entries(el.attributes || {})
           .map(([key, value]) => `${key}="${value}"`)
           .join(' ');
         return `- ${el.tagName} ${attrs ? `${attrs}` : ''} - Text: "${el.text || ''}" - Selectors: [${el.selectors.slice(0, 3).join(', ')}]`;
       }).join('\n')}

SELECTOR USAGE RULES:
1. ALWAYS use the provided selectors from the elements list above
2. Choose the FIRST selector from each element's selectors array (most reliable)
3. If data-testid is not available, use name, id, or class attributes
4. For text-based elements, use the exact text content provided
5. NEVER assume data-testid exists if not listed in the elements

CRITICAL: Only use selectors that actually exist on the page as shown above.`;
     }

    return `You are an expert Playwright test automation engineer. Generate high-quality, production-ready Playwright test code based on user requirements.

REQUIREMENTS:
- Use TypeScript with Playwright
- Include proper imports and setup
- ONLY use selectors provided in the AVAILABLE PAGE ELEMENTS section below
- For text selectors, use: page.getByText('text') or page.locator('text=text')
- For multiple selectors, use separate locators or proper CSS syntax
- Include proper error handling and assertions
- Follow Playwright best practices
- Include Allure reporting integration with allure.attachment() method (NOT allure.addAttachment())
- Use environment variables for configuration${domContext}

CRITICAL SELECTOR RULES - AVOID ELEMENT AMBIGUITY:
- NEVER use getByText() for common text that appears multiple times (e.g., 'Dashboard', 'Home', 'Login', 'Submit')
- ALWAYS prefer specific role-based selectors over generic text selectors
- For headings: use page.getByRole('heading', { name: 'Text' }) instead of getByText('Text')
- For buttons: use page.getByRole('button', { name: 'Text' }) instead of getByText('Text')
- For links: use page.getByRole('link', { name: 'Text' }) instead of getByText('Text')
- For form inputs: use page.getByLabel('Label') or page.getByPlaceholder('Placeholder')
- For navigation items: combine role with specific attributes like page.getByRole('navigation').getByText('Item')
- Use CSS selectors with :has-text() for precise targeting: page.locator('selector:has-text("Text")')
- Use data-testid when available: page.getByTestId('element-id')
- Combine selectors for specificity: page.locator('.class-name').getByRole('button', { name: 'Text' })
- For tables: use page.getByRole('cell', { name: 'Text' }) or page.getByRole('row')
- For modals/dialogs: use page.getByRole('dialog') or page.locator('[role="dialog"]')
- When text appears in multiple contexts, use parent container selectors first

DROPDOWN/COMBOBOX INTERACTION RULES - CRITICAL FOR RELIABILITY:
- ALWAYS wait for dropdown elements before interaction: await page.getByRole('combobox').waitFor({ state: 'visible', timeout: 15000 })
- Use robust dropdown interaction pattern with error handling and retries
- For dropdown selection, implement this robust pattern with auto-waiting and fallback strategies:
  * Wait for dropdown to be available: await dropdown.waitFor({ state: 'visible', timeout: 15000 })
  * Scroll into view: await dropdown.scrollIntoViewIfNeeded()
  * Click with retry mechanism (3 attempts with 1s delay)
  * Wait for options to appear: await page.waitForSelector('[role="option"]', { timeout: 10000 })
  * Select option with proper waiting: await option.waitFor({ state: 'visible', timeout: 10000 })
  * Verify selection: await expect(dropdown).toHaveText(optionName, { timeout: 5000 })
- For complex dropdowns, use multiple selector strategies: role-based, CSS selectors, and data attributes
- Always include proper error handling and timeout management for dropdown interactions
- Use scrollIntoViewIfNeeded() for dropdowns that might be outside viewport
- Implement wait strategies for dynamic dropdown content loading
- Example robust dropdown interaction:
  await page.getByRole('combobox', { name: 'User Role' }).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('combobox', { name: 'User Role' }).scrollIntoViewIfNeeded();
  await page.getByRole('combobox', { name: 'User Role' }).click({ timeout: 10000 });
  await page.waitForSelector('[role="option"]', { timeout: 10000 });
  await page.getByRole('option', { name: 'Admin' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('option', { name: 'Admin' }).click();

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

  createUserPrompt(prompt, testName, testType, domAnalysis) {
    const isAPITest = testType === 'api' || testType === 'e2e-api';
    
    if (isAPITest) {
      return `Generate a Playwright API test for: "${prompt}"

Test Name: ${testName}
Test Type: ${testType}

Requirements:
1. Parse the API testing requirements from the prompt
2. Generate appropriate Playwright API test code using request context
3. Include comprehensive API response validation
4. Add proper error handling and retry mechanisms
5. Use modern Playwright API testing patterns
6. Include test data management and cleanup
7. Add performance and schema validation

API TEST GUIDELINES:
- Use page.request or APIRequestContext for all API calls
- Include proper HTTP method selection (GET, POST, PUT, DELETE)
- Add comprehensive response validation (status, headers, body)
- Include authentication handling if required
- Add test data factories for consistent data generation
- Implement proper cleanup procedures
- Add response time assertions
- Include schema validation where appropriate
- Use proper error handling with try-catch blocks
- Add Allure reporting with proper tags and attachments

Generate the complete API test file code.`;
    }
    
    let selectorGuidance = '';
    if (domAnalysis && domAnalysis.elements.length > 0) {
      const recommendations = this.domAnalyzer.generateSelectorRecommendations(domAnalysis.elements, prompt);
      if (Object.keys(recommendations).length > 0) {
        selectorGuidance = `

RECOMMENDED SELECTORS FOR YOUR PROMPT:
${Object.entries(recommendations).map(([target, rec]) => 
          `- For "${target}": Use ${rec.recommendedSelector} (${rec.action} action)`
        ).join('\n')}

IMPORTANT: Use these exact selectors - they match the actual page elements.`;
      }
    }

    return `Generate a Playwright test for: "${prompt}"

Test Name: ${testName}
Test Type: ${testType}

Requirements:
1. Parse the natural language prompt into actionable test steps
2. Generate appropriate Playwright code for each step
3. Include proper selectors and assertions based on actual page elements
4. Handle both UI interactions and API calls if mentioned
5. Use modern Playwright patterns and best practices${selectorGuidance}

IMPORTANT SELECTOR GUIDELINES - PREVENT STRICT MODE VIOLATIONS:
- NEVER use getByText() for any text that might appear multiple times on a page
- Common ambiguous texts to avoid: 'Dashboard', 'Home', 'Login', 'Submit', 'Save', 'Cancel', 'Edit', 'Delete'
- ALWAYS use role-based selectors: getByRole('heading'), getByRole('button'), getByRole('link')
- For form elements: prefer getByLabel(), getByPlaceholder(), or getByRole('textbox')
- For navigation: use page.getByRole('navigation').locator() or specific CSS selectors
- For repeated elements: use nth() selector or combine with parent containers
- For dynamic content: use data-testid attributes or unique CSS selectors
- Test selector uniqueness: ensure each selector matches exactly one element
- Use browser dev tools to verify selector specificity before implementation

Generate the complete test file code.`;
  }

  postProcessGeneratedCode(generatedCode, testName, testType) {
    // Clean up the generated code
    let code = generatedCode.trim();
    
    // Remove markdown code blocks if present
    code = code.replace(/```typescript?\n?/g, '').replace(/```\n?/g, '');
    
    // CRITICAL: Fix any ambiguous selectors that cause strict mode violations
    code = this.fixAmbiguousSelectors(code);
    
    // Enhance dropdown interactions
    code = this.enhanceDropdownInteractions(code);
    
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

  fixAmbiguousSelectors(code) {
    // Fix common ambiguous selectors that cause strict mode violations
    const selectorFixes = [
      // Dashboard selectors
      {
        pattern: /page\.getByText\(['"]Dashboard['"]\)/g,
        replacement: "page.getByRole('heading', { name: 'Dashboard' })"
      },
      {
        pattern: /getByText\(['"]Dashboard['"]\)/g,
        replacement: "getByRole('heading', { name: 'Dashboard' })"
      },
      // Common button texts
      {
        pattern: /page\.getByText\(['"]Submit['"]\)/g,
        replacement: "page.getByRole('button', { name: 'Submit' })"
      },
      {
        pattern: /page\.getByText\(['"]Save['"]\)/g,
        replacement: "page.getByRole('button', { name: 'Save' })"
      },
      {
        pattern: /page\.getByText\(['"]Cancel['"]\)/g,
        replacement: "page.getByRole('button', { name: 'Cancel' })"
      },
      {
        pattern: /page\.getByText\(['"]Login['"]\)/g,
        replacement: "page.getByRole('button', { name: 'Login' })"
      },
      {
        pattern: /page\.getByText\(['"]Edit['"]\)/g,
        replacement: "page.getByRole('button', { name: 'Edit' })"
      },
      {
        pattern: /page\.getByText\(['"]Delete['"]\)/g,
        replacement: "page.getByRole('button', { name: 'Delete' })"
      },
      // Common navigation texts
      {
        pattern: /page\.getByText\(['"]Home['"]\)/g,
        replacement: "page.getByRole('link', { name: 'Home' })"
      },
      // Generic getByText patterns for common words
      {
        pattern: /getByText\(['"]Submit['"]\)/g,
        replacement: "getByRole('button', { name: 'Submit' })"
      },
      {
        pattern: /getByText\(['"]Save['"]\)/g,
        replacement: "getByRole('button', { name: 'Save' })"
      },
      {
        pattern: /getByText\(['"]Cancel['"]\)/g,
        replacement: "getByRole('button', { name: 'Cancel' })"
      },
      {
        pattern: /getByText\(['"]Login['"]\)/g,
        replacement: "getByRole('button', { name: 'Login' })"
      },
      {
        pattern: /getByText\(['"]Edit['"]\)/g,
        replacement: "getByRole('button', { name: 'Edit' })"
      },
      {
        pattern: /getByText\(['"]Delete['"]\)/g,
        replacement: "getByRole('button', { name: 'Delete' })"
      },
      {
        pattern: /getByText\(['"]Home['"]\)/g,
        replacement: "getByRole('link', { name: 'Home' })"
      }
    ];

    let fixedCode = code;
    let fixesApplied = [];

    selectorFixes.forEach(fix => {
      const matches = fixedCode.match(fix.pattern);
      if (matches) {
        fixesApplied.push(`${matches[0]} → ${fix.replacement}`);
        fixedCode = fixedCode.replace(fix.pattern, fix.replacement);
      }
    });

    if (fixesApplied.length > 0) {
      console.log('🔧 Fixed ambiguous selectors:', fixesApplied);
    }

    return fixedCode;
  }

  enhanceDropdownInteractions(code) {
    // Enhanced dropdown interaction patterns
    const dropdownEnhancements = [
      {
        pattern: /await page\.getByRole\('combobox'[^)]*\)\.click\(\);/g,
        replacement: (match) => {
          const selector = match.match(/getByRole\('combobox'[^)]*\)/)[0];
          return `await page.${selector}.waitFor({ state: 'visible', timeout: 15000 });
    await page.${selector}.scrollIntoViewIfNeeded();
    await page.${selector}.click({ timeout: 10000 });`;
        }
      },
      {
        pattern: /await page\.locator\('[^']*combobox[^']*'\)\.click\(\);/g,
        replacement: (match) => {
          const selector = match.match(/locator\('[^']*combobox[^']*'\)/)[0];
          return `await page.${selector}.waitFor({ state: 'visible', timeout: 15000 });
    await page.${selector}.scrollIntoViewIfNeeded();
    await page.${selector}.click({ timeout: 10000 });`;
        }
      }
    ];

    let enhancedCode = code;
    let enhancementsApplied = [];

    dropdownEnhancements.forEach(enhancement => {
      const matches = enhancedCode.match(enhancement.pattern);
      if (matches) {
        matches.forEach(match => {
          const replacement = typeof enhancement.replacement === 'function' 
            ? enhancement.replacement(match) 
            : enhancement.replacement;
          enhancementsApplied.push(`Enhanced dropdown: ${match.substring(0, 50)}...`);
          enhancedCode = enhancedCode.replace(match, replacement);
        });
      }
    });

    if (enhancementsApplied.length > 0) {
      console.log('🔧 Enhanced dropdown interactions:', enhancementsApplied);
    }

    return enhancedCode;
  }

  async cleanup() {
    try {
      if (this.domAnalyzer) {
        await this.domAnalyzer.close();
      }
    } catch (error) {
      console.warn('Error during LLMService cleanup:', error.message);
    }
  }

  // OpenAI Client
  createOpenAIClient({ apiKey, model, baseUrl }) {
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        return await RetryHelper.withRetry(async () => {
          try {
            const hasV1 = baseUrl.endsWith('/v1');
            const endpoint = hasV1 ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

            const headers = {
              'Content-Type': 'application/json'
            };
            if (apiKey) {
              headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await axios.post(endpoint, {
              model: model || 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature,
              max_tokens: maxTokens
            }, {
              headers
            });

            return response.data.choices[0].message.content;
          } catch (error) {
            // Handle rate limiting (429) with user-friendly message
            if (error.response?.status === 429) {
              throw new Error('OpenAI rate limit exceeded. Please wait a moment before trying again, or check your usage limits.');
            }
            
            // Handle other API errors with more context
            if (error.response?.status === 401) {
              throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
            }
            
            if (error.response?.status === 403) {
              throw new Error('OpenAI access forbidden. Please check your API key permissions.');
            }
            
            throw error;
          }
        }, 3, 2000); // 3 retries, starting with 2 second delay
      }
    };
  }

  // Claude Client
  createClaudeClient({ apiKey, model, baseUrl }) {
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        return await RetryHelper.withRetry(async () => {
          try {
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
          } catch (error) {
            // Handle rate limiting (429) with user-friendly message
            if (error.response?.status === 429) {
              throw new Error('Claude rate limit exceeded. Please wait a moment before trying again, or check your usage limits.');
            }
            
            // Handle other API errors with more context
            if (error.response?.status === 401) {
              throw new Error('Invalid Claude API key. Please check your API key configuration.');
            }
            
            if (error.response?.status === 403) {
              throw new Error('Claude access forbidden. Please check your API key permissions.');
            }
            
            throw error;
          }
        }, 3, 2000); // 3 retries, starting with 2 second delay
      }
    };
  }

  // OpenRouter Client
  createOpenRouterClient({ apiKey, model, baseUrl }) {
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        return await RetryHelper.withRetry(async () => {
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
                'HTTP-Referer': 'http://localhost:5050',
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
            
            // Handle rate limiting (429) with user-friendly message
            if (error.response?.status === 429) {
              throw new Error('Rate limit exceeded. Please wait a moment before trying again, or consider upgrading to a paid plan for higher limits.');
            }
            
            // Handle other API errors with more context
            if (error.response?.status === 401) {
              throw new Error('Invalid API key. Please check your OpenRouter API key configuration.');
            }
            
            if (error.response?.status === 403) {
              throw new Error('Access forbidden. Please check your API key permissions.');
            }
            
            throw error;
          }
        }, 3, 2000); // 3 retries, starting with 2 second delay
      }
    };
  }

  // Local Model Client (Ollama, LM Studio, etc.)
  createLocalClient({ apiKey, model, baseUrl }) {
    // Normalize baseUrl to avoid double slashes
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    
    return {
      async generate({ systemPrompt, userPrompt, temperature = 0.1, maxTokens = 4000 }) {
        return await RetryHelper.withRetry(async () => {
          try {
            // Try the newer Ollama API format first
            console.log('Trying Ollama /api/chat endpoint...');
            const response = await axios.post(`${normalizedBaseUrl}/api/chat`, {
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
            const response = await axios.post(`${normalizedBaseUrl}/api/generate`, {
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
        }, 2, 5000); // 2 retries for local models, starting with 5 second delay
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
    // Handle the case where provider is "local" and llmType is the actual provider name (e.g., "Ollama")
    let actualProvider;
    if (provider.toLowerCase() === 'local' && llmType) {
      // Provider is "local", llmType contains the actual provider name
      actualProvider = llmType.toLowerCase() === 'ollama' ? 'local' : llmType.toLowerCase();
    } else {
      // Legacy format: provider contains the actual provider name
      actualProvider = provider.toLowerCase();
    }
    
    const client = this.providers[actualProvider];
    
    if (!client) {
      console.log(`Available providers: ${Object.keys(this.providers).join(', ')}`);
      console.log(`Requested provider: ${provider}, llmType: ${llmType}, actualProvider: ${actualProvider}`);
      throw new Error(`Unsupported provider: ${actualProvider}`);
    }

    const llmClient = client({
      apiKey: actualProvider === 'local' ? (apiKey || '') : apiKey,
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
