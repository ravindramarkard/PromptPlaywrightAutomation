const express = require('express');
const router = express.Router();
const PromptParser = require('../services/PromptParser');
const CodeGenerator = require('../services/CodeGenerator');
const FileStorage = require('../services/FileStorage');
const LLMService = require('../services/LLMService');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');

// Helper function to clean generated code
function cleanGeneratedCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') {
    return rawCode;
  }
  
  // Remove markdown code fences of various types
  let cleaned = rawCode
    .replace(/```typescript\n?/gi, '')
    .replace(/```tsx\n?/gi, '')
    .replace(/```javascript\n?/gi, '')
    .replace(/```js\n?/gi, '')
    .replace(/```ts\n?/gi, '')
    .replace(/```\n?/g, '');
  
  cleaned = cleaned.trim();

  // Try to isolate only the code between the first import and the last test closure
  const firstImportIdx = cleaned.search(/\bimport\s+\{/);
  if (firstImportIdx > -1) {
    cleaned = cleaned.substring(firstImportIdx);
  }

  // Hoist any test.use({...}) to top-level (before first describe)
  try {
    const useMatches = [...cleaned.matchAll(/test\.use\(\{[\s\S]*?\}\);/g)];
    if (useMatches.length > 0) {
      const firstUse = useMatches[0][0];
      // Remove all occurrences
      cleaned = cleaned.replace(/test\.use\(\{[\s\S]*?\}\);/g, '');
      // Insert a single top-level test.use right after imports
      const firstDescribeIdx = cleaned.search(/\btest\.describe\s*\(/);
      if (firstDescribeIdx > -1) {
        cleaned = cleaned.slice(0, firstDescribeIdx) + firstUse + '\n' + cleaned.slice(firstDescribeIdx);
      } else {
        cleaned = firstUse + '\n' + cleaned;
      }
    }
  } catch {}

  // Attempt to cut trailing prose after the last matching \n}); or \n}\); typical in Playwright files
  const endings = [
    cleaned.lastIndexOf('\n});'),
    cleaned.lastIndexOf('\n}\);'),
    cleaned.lastIndexOf('\n});\n')
  ].filter(i => i >= 0);
  if (endings.length > 0) {
    const cutAt = Math.max(...endings) + 4; // include '});'
    cleaned = cleaned.substring(0, cutAt);
  }

  // Remove common explanatory prefixes/lines
  cleaned = cleaned
    .split('\n')
    .filter(line => {
      const t = line.trim();
      if (/^(Explanation:|Note:|Tips?:)/i.test(t)) return false;
      if (/^[-*]\s/.test(t) && !/^\*\s@/.test(t)) return false; // drop bullet points except JSDoc tags
      if (/^\d+\./.test(t)) return false; // numbered lists
      return true;
    })
    .join('\n');

  // CRITICAL: Fix ambiguous selectors that cause strict mode violations
  cleaned = fixAmbiguousSelectors(cleaned);

  // Fix async/await syntax issues in callback functions
  cleaned = cleaned.replace(
    /(allure\.createStep\([^,]+,\s*)\(\)\s*=>\s*{([^}]*await[^}]*)}/g,
    '$1async () => {$2}'
  );

  // Fix other common callback patterns with await
  cleaned = cleaned.replace(
    /(\w+\.\w+\([^,]*,\s*)\(([^)]*)\)\s*=>\s*{([^}]*await[^}]*)}/g,
    '$1async ($2) => {$3}'
  );

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return cleaned.trim();
}

// Fix ambiguous selectors that cause strict mode violations
function fixAmbiguousSelectors(code) {
  if (!code || typeof code !== 'string') {
    return code;
  }
  
  let fixedCode = code;
  const fixes = [];
  
  // Fix Dashboard text selector - most common issue
  const dashboardRegex = /getByText\(['"]Dashboard['"]\)/g;
  if (dashboardRegex.test(fixedCode)) {
    fixedCode = fixedCode.replace(dashboardRegex, "getByRole('heading', { name: 'Dashboard' })");
    fixes.push('Dashboard text selector');
  }
  
  // Fix other common ambiguous text selectors
  const commonAmbiguousTexts = [
    { pattern: /getByText\(['"]Home['"]\)/g, replacement: "getByRole('link', { name: 'Home' })" },
    { pattern: /getByText\(['"]Login['"]\)/g, replacement: "getByRole('button', { name: 'Login' })" },
    { pattern: /getByText\(['"]Submit['"]\)/g, replacement: "getByRole('button', { name: 'Submit' })" },
    { pattern: /getByText\(['"]Save['"]\)/g, replacement: "getByRole('button', { name: 'Save' })" },
    { pattern: /getByText\(['"]Cancel['"]\)/g, replacement: "getByRole('button', { name: 'Cancel' })" },
    { pattern: /getByText\(['"]Settings['"]\)/g, replacement: "getByRole('link', { name: 'Settings' })" },
    { pattern: /getByText\(['"]Profile['"]\)/g, replacement: "getByRole('link', { name: 'Profile' })" }
  ];
  
  commonAmbiguousTexts.forEach(({ pattern, replacement }) => {
    if (pattern.test(fixedCode)) {
      fixedCode = fixedCode.replace(pattern, replacement);
      fixes.push(pattern.source.match(/getByText\\\(['\"]([^'\"]+)['\"]\\\)/)?.[1] || 'text selector');
    }
  });
  
  if (fixes.length > 0) {
    console.log('Applied selector fixes for:', fixes.join(', '));
  }
  
  return fixedCode;
}

// Helper function to launch browser test
function launchBrowserTest(testFilePath, environment) {
  return new Promise((resolve, reject) => {
    try {
      // Get the relative path from project root
      const projectRoot = path.resolve(__dirname, '../..');
      const relativePath = path.relative(projectRoot, testFilePath);
      
      console.log('Launching browser test:', {
        testFilePath: relativePath,
        projectRoot,
        environment: environment?.name
      });
      
      // Set environment variables for the test
      const env = {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: 0,
        BASE_URL: environment?.variables?.BASE_URL || 'http://localhost:5050',
        BROWSER_TYPE: environment?.variables?.BROWSER || 'chromium',
        HEADLESS_MODE: environment?.variables?.HEADLESS || 'false' // Set to false for headed mode
      };
      
      // Launch Playwright test with headed mode
      // Quote the path to handle spaces in directory names
      const quotedPath = `"${relativePath}"`;
      const playwrightProcess = spawn('npx', [
        'playwright',
        'test',
        quotedPath,
        '--headed'
      ], {
        cwd: projectRoot,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true // Enable shell to handle quoted paths properly
      });
      
      let output = '';
      let errorOutput = '';
      
      playwrightProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('Playwright stdout:', chunk);
      });
      
      playwrightProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.log('Playwright stderr:', chunk);
      });
      
      playwrightProcess.on('close', (code) => {
        console.log('Playwright process closed with code:', code);
        resolve({
          success: code === 0,
          exitCode: code,
          output,
          errorOutput,
          message: code === 0 ? 'Test launched successfully' : 'Test execution failed'
        });
      });
      
      playwrightProcess.on('error', (error) => {
        console.error('Failed to launch Playwright test:', error);
        reject({
          success: false,
          error: error.message,
          message: 'Failed to launch browser test'
        });
      });
      
      // Don't wait for the process to complete, resolve immediately
      // This allows the browser to launch while returning the response
      setTimeout(() => {
        resolve({
          success: true,
          launched: true,
          message: 'Browser test launched successfully',
          processId: playwrightProcess.pid
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error launching browser test:', error);
      reject({
        success: false,
        error: error.message,
        message: 'Failed to launch browser test'
      });
    }
  });
}

const promptParser = new PromptParser();
const codeGenerator = new CodeGenerator();
const fileStorage = new FileStorage();
const llmService = new LLMService();

// Helper function to add session management code to generated tests
function addSessionManagementCode(testCode) {
  console.log('=== addSessionManagementCode DEBUG ===');
  console.log('addSessionManagementCode called with testCode length:', testCode.length);
  console.log('testCode preview (first 200 chars):', testCode.substring(0, 200));
  
  // Add session management imports if not already present
  if (!testCode.includes('createContextWithSession')) {
    console.log('Adding session management imports...');
    const importMatch = testCode.match(/import\s*{([^}]+)}\s*from\s*['"]@playwright\/test['"];?/);
    if (importMatch) {
      // Add session management import after Playwright imports
      testCode = testCode.replace(
        /import\s*{([^}]+)}\s*from\s*['"]@playwright\/test['"];?/,
        `import { $1 } from '@playwright/test';\nimport { createContextWithSession, shouldSkipLogin, saveSessionAfterLogin } from '../test-utils/session-manager';`
      );
    } else {
      // Add at the beginning if no imports found
      testCode = `import { createContextWithSession, shouldSkipLogin, saveSessionAfterLogin } from '../test-utils/session-manager';\n${testCode}`;
    }
  }

  // Add session management beforeEach if not already present
  if (!testCode.includes('beforeEach')) {
    const describeMatch = testCode.match(/(test\.describe\([^)]+\)\s*{)/);
    if (describeMatch) {
      const beforeEachCode = `
  let page;
  
  test.beforeEach(async ({ browser }) => {
    const context = await createContextWithSession(browser, { viewport: { width: 1920, height: 1080 } });
    page = await context.newPage();
  });`;
      
      testCode = testCode.replace(describeMatch[1], `${describeMatch[1]}${beforeEachCode}`);
    }
  }

  // Add session check at the start of each test
  if (!testCode.includes('shouldSkipLogin')) {
    const testMatch = testCode.match(/(test\([^)]+\)\s*async\s*\([^)]*\)\s*=>\s*{)/);
    if (testMatch) {
      const sessionCheckCode = `
    // Check if already logged in
    const isLoggedIn = await shouldSkipLogin(page);
    if (isLoggedIn) {
      console.log('🚀 Already logged in, skipping login steps');
      return;
    }`;
      
      testCode = testCode.replace(testMatch[1], `${testMatch[1]}${sessionCheckCode}`);
    }
  }

  return testCode;
}

// Parse prompt and return structured steps
router.post('/parse-prompt', async (req, res) => {
  try {
    const { promptContent } = req.body;
    
    if (!promptContent) {
      return res.status(400).json({ error: 'Prompt content is required' });
    }
    
    const parsedPrompt = promptParser.parsePrompt(promptContent);
    res.json(parsedPrompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Playwright test code directly from LLM
router.post('/generate-llm-playwright', async (req, res) => {
  try {
    const {
      promptContent,
      testName = 'Generated Test',
      testType = 'UI Test',
      environment,
      parsedSteps = [],
      baseUrl,
      useExistingSession = false
    } = req.body;
    
    if (!promptContent) {
      return res.status(400).json({ error: 'Prompt content is required' });
    }

    if (!environment || !environment.llmConfiguration) {
      return res.status(400).json({ error: 'Valid LLM environment is required' });
    }

    console.log('Generating Playwright code with LLM:', {
      testName,
      testType,
      environment: environment.name,
      stepCount: parsedSteps.length,
      llmConfig: environment.llmConfiguration,
      promptContentLength: promptContent?.length || 0,
      promptContentPreview: promptContent?.substring(0, 100) + '...'
    });

    // Create a comprehensive prompt for the LLM
    const finalBaseUrl = baseUrl || environment.variables?.BASE_URL || 'http://localhost:5050';
    const browserType = environment.variables?.BROWSER || 'chromium';
    const headlessMode = environment.variables?.HEADLESS || 'true';
    
    console.log('=== BASE URL DEBUG ===');
    console.log('baseUrl from request:', baseUrl);
    console.log('environment.variables?.BASE_URL:', environment.variables?.BASE_URL);
    console.log('finalBaseUrl:', finalBaseUrl);
    console.log('========================');
    
    const llmPrompt = `Generate a complete Playwright test file for: "${promptContent}"

Test Name: ${testName}
Base URL: ${finalBaseUrl}
Browser: ${browserType}
Headless: ${headlessMode}

${parsedSteps.length > 0 ? `Steps to implement:
${parsedSteps.map((step, index) => `${index + 1}. ${step.originalText}`).join('\n')}` : ''}

Create a complete TypeScript Playwright test file with:
- Proper imports: import { test, expect } from '@playwright/test' and import { allure } from 'allure-playwright'
- Environment variables: BASE_URL, BROWSER_TYPE, HEADLESS_MODE
- Test structure: describe block with beforeEach, test, and afterEach
- Error handling: try-catch blocks with screenshot capture on failure
- Allure reporting: tags, attachments, and proper metadata
- Proper selectors: use data-testid when possible, fallback to other selectors
- Wait conditions: use page.waitForSelector() for element visibility
- Meaningful assertions: verify the test outcome

IMPORTANT SELECTOR RULES - AVOID ELEMENT AMBIGUITY:
- NEVER use getByText() for any text that might appear multiple times on a page
- Common ambiguous texts: Dashboard, Home, Login, Submit, Save, Cancel, Edit, Delete, Search, Filter
- ALWAYS use role-based selectors: getByRole('heading'), getByRole('button'), getByRole('link')
- For form elements: use getByLabel(), getByPlaceholder(), or getByRole('textbox')
- For navigation: use getByRole('navigation').getByText() or specific CSS selectors
- For repeated elements: use nth() selector or combine with parent containers
- For dynamic content: use data-testid attributes or unique CSS class selectors
- Verify selector uniqueness: each selector should match exactly one element
- Use browser dev tools to test selector specificity during development

Return ONLY the complete TypeScript code without explanations or markdown.`;

    // Generate code using LLM
    console.log('Calling LLMService with:', {
      promptLength: llmPrompt.length,
      environment: environment.name,
      llmConfig: environment.llmConfiguration
    });
    
    // Fix baseUrl by removing trailing slash
    const fixedEnvironment = {
      ...environment,
      llmConfiguration: {
        ...environment.llmConfiguration,
        baseUrl: environment.llmConfiguration.baseUrl?.replace(/\/$/, '') || environment.llmConfiguration.baseUrl,
        model: environment.llmConfiguration.model || 'llama3.1:8b' // Use newer model
      }
    };
    
    // Use the proper LLMService approach with system and user prompts - NO FALLBACK
    const systemPrompt = `You are an expert Playwright test automation engineer. Generate high-quality, production-ready Playwright test code based on user requirements.

REQUIREMENTS:
- Use TypeScript with Playwright
- Include proper imports: import { test, expect } from '@playwright/test'
- Include Allure reporting: import { allure } from 'allure-playwright'
- Use environment variables for configuration (BASE_URL, BROWSER_TYPE, HEADLESS_MODE)
- Add proper test structure with describe and test blocks
- Use data-testid selectors when possible, fallback to other selectors
- Add proper error handling with try-catch blocks
- Include meaningful assertions and validations
- Add screenshot capture on failure
- Use page.waitForSelector() for element visibility
- Add proper test cleanup in afterEach
- Include Allure tags and attachments

CRITICAL SELECTOR RULES - PREVENT ELEMENT AMBIGUITY:
- NEVER use getByText() for common text that appears multiple times (Dashboard, Home, Login, Submit, Save, Cancel, Edit, Delete)
- ALWAYS use role-based selectors to avoid strict mode violations:
  * For headings: page.getByRole('heading', { name: 'Text' })
  * For buttons: page.getByRole('button', { name: 'Text' })
  * For links: page.getByRole('link', { name: 'Text' })
  * For form inputs: page.getByLabel('Label') or page.getByPlaceholder('Placeholder')
- For navigation items: use page.getByRole('navigation').getByText('Item')
- For repeated elements: use nth() selector or combine with parent containers
- Use data-testid when available: page.getByTestId('unique-id')
- Combine selectors for specificity: page.locator('.container').getByRole('button', { name: 'Text' })
- For tables: use page.getByRole('cell', { name: 'Text' }) or page.getByRole('row')
- Test selector uniqueness: ensure each selector matches exactly one element

Return ONLY the complete TypeScript test file code without any explanations or markdown formatting.`;

    const userPrompt = llmPrompt;
    
    console.log('Enforcing direct LLM generation - no fallback to templates');
    
    // Generate code using LLM - throw error if it fails (no fallback)
    const rawCode = await llmService.generateCode(userPrompt, fixedEnvironment, {
      systemPrompt,
      testName,
      testType,
      baseUrl: finalBaseUrl,
      environment: fixedEnvironment,
      parsedSteps: parsedSteps
    });
    
    // Clean the generated code
    let testCode = cleanGeneratedCode(rawCode);
    
    // Add session management code if useExistingSession is true
    if (useExistingSession) {
      testCode = addSessionManagementCode(testCode);
    }
    
    // Validate that we actually got code from LLM
    if (!testCode || testCode.trim().length === 0) {
      throw new Error('LLM generated empty or invalid code. Please check your LLM configuration and try again.');
    }
    
    console.log('LLM code generation successful, proceeding with test execution');

    // Generate file path for saving
    const filePath = codeGenerator.generateFilePath(
      'enhanced-ai',
      'llm-generated',
      'LLM-Generated',
      uuidv4(),
      testName
    );
    console.log('Generated filePath in route:', filePath);

    // Save the test file
    const savedPath = await codeGenerator.saveTestFile(testCode, filePath);
    console.log('Saved path in route:', savedPath);

    // Launch browser test after saving the file
    let browserLaunchResult = null;
    try {
      console.log('Attempting to launch browser test for:', savedPath);
      browserLaunchResult = await launchBrowserTest(savedPath, environment);
      console.log('Browser launch result:', browserLaunchResult);
    } catch (error) {
      console.error('Failed to launch browser test:', error);
      browserLaunchResult = {
        success: false,
        error: error.message || 'Unknown error',
        message: 'Failed to launch browser test'
      };
    }

    res.json({
      testCode,
      filePath: savedPath,
      browserLaunch: browserLaunchResult,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedWith: 'LLM',
        llmProvider: environment.llmConfiguration.provider,
        llmModel: environment.llmConfiguration.model,
        testName,
        testType,
        stepCount: parsedSteps.length,
        environment: environment.name,
        browserLaunched: browserLaunchResult?.success || false
      }
    });
  } catch (error) {
    console.error('Error generating LLM Playwright code:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: error.message || 'Unknown error occurred',
      details: error.response?.data || 'No additional details'
    });
  }
});

// Generate Playwright test code
router.post('/generate-playwright', async (req, res) => {
  try {
    const {
      promptContent,
      testName,
      testType = 'UI Test',
      environmentId,
      environment, // Direct environment object from frontend
      useLLM = false,
      parsedSteps, // Parsed steps from frontend
      options = {}
    } = req.body;
    
    if (!promptContent) {
      return res.status(400).json({ error: 'Prompt content is required' });
    }
    
    // Parse the prompt (use provided parsedSteps if available, otherwise parse)
    let parsedPrompt;
    if (parsedSteps && parsedSteps.length > 0) {
      // Use provided parsed steps
      parsedPrompt = {
        parsedSteps,
        hasUI: parsedSteps.some(step => 
          ['navigate', 'click', 'fill', 'hover', 'scroll'].includes(step.action)
        ),
        hasAPI: parsedSteps.some(step => 
          step.originalText && ['api', 'request', 'response'].some(keyword => 
            step.originalText.toLowerCase().includes(keyword)
          )
        ),
        totalSteps: parsedSteps.length
      };
    } else {
      // Parse the prompt normally
      parsedPrompt = promptParser.parsePrompt(promptContent);
    }
    
    // Get environment - prefer direct object, fallback to ID lookup
    let env = environment;
    if (!env && environmentId) {
      env = await fileStorage.getEnvironmentById(environmentId);
    }
    
    // Generate the test code
    const testCode = await codeGenerator.generatePlaywrightSpec(
      parsedPrompt,
      env,
      {
        testName: testName || 'Generated Test',
        testType,
        useLLM,
        parsedSteps: parsedSteps || parsedPrompt.parsedSteps,
        ...options
      }
    );
    
    res.json({
      testCode,
      parsedPrompt,
      metadata: {
        hasUI: parsedPrompt.hasUI,
        hasAPI: parsedPrompt.hasAPI,
        totalSteps: parsedPrompt.totalSteps,
        generatedAt: new Date().toISOString(),
        generatedWith: useLLM && env?.llmConfiguration?.enabled ? 'LLM' : 'Template',
        llmProvider: env?.llmConfiguration?.provider || 'Template',
        stepsProcessed: parsedSteps ? parsedSteps.length : parsedPrompt.totalSteps
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate and save test file
router.post('/generate-and-save', async (req, res) => {
  try {
    const {
      promptContent,
      testName,
      testType = 'UI Test',
      projectId = 'default-project',
      modelId = 'default-model',
      modelName = 'Default Model',
      environmentId,
      options = {}
    } = req.body;
    
    if (!promptContent) {
      return res.status(400).json({ error: 'Prompt content is required' });
    }
    
    // Parse the prompt
    const parsedPrompt = promptParser.parsePrompt(promptContent);
    
    // Get environment if specified
    let environment = null;
    if (environmentId) {
      environment = await fileStorage.getEnvironmentById(environmentId);
    }
    
    // Generate unique IDs
    const promptId = uuidv4();
    const testId = uuidv4();
    
    // Generate the test code
    const testCode = await codeGenerator.generatePlaywrightSpec(
      parsedPrompt,
      environment,
      {
        testName: testName || 'Generated Test',
        testType,
        useLLM: true, // Enable LLM generation
        ...options
      }
    );
    
    // Generate file path
    const filePath = codeGenerator.generateFilePath(
      projectId,
      modelId,
      modelName,
      promptId,
      testName || 'Generated Test'
    );
    
    // Save test file
    const savedPath = await codeGenerator.saveTestFile(testCode, filePath);
    
    res.json({
      testCode,
      filePath: savedPath,
      testId,
      promptId,
      parsedPrompt,
      metadata: {
        hasUI: parsedPrompt.hasUI,
        hasAPI: parsedPrompt.hasAPI,
        totalSteps: parsedPrompt.totalSteps,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate API test code
router.post('/generate-api-test', async (req, res) => {
  try {
    const {
      endpoints,
      testType = 'API Test',
      environmentId,
      options = {}
    } = req.body;
    
    if (!endpoints || !Array.isArray(endpoints)) {
      return res.status(400).json({ error: 'Endpoints array is required' });
    }
    
    // Get environment if specified
    let environment = null;
    if (environmentId) {
      environment = await fileStorage.getEnvironmentById(environmentId);
    }
    
    // Generate API test code
    const testCode = generateAPITestCode(endpoints, environment, options);
    
    res.json({
      testCode,
      metadata: {
        endpointCount: endpoints.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate E2E test suite
router.post('/generate-e2e-suite', async (req, res) => {
  try {
    const {
      prompts,
      suiteName,
      testType = 'E2E Test',
      environmentId,
      options = {}
    } = req.body;
    
    if (!prompts || !Array.isArray(prompts)) {
      return res.status(400).json({ error: 'Prompts array is required' });
    }
    
    // Get environment if specified
    let environment = null;
    if (environmentId) {
      environment = await fileStorage.getEnvironmentById(environmentId);
    }
    
    // Parse all prompts
    const parsedPrompts = prompts.map(prompt => ({
      ...promptParser.parsePrompt(prompt.content),
      title: prompt.title,
      description: prompt.description
    }));
    
    // Generate E2E test suite
    const testCode = generateE2ETestSuite(parsedPrompts, suiteName, environment, options);
    
    res.json({
      testCode,
      metadata: {
        promptCount: prompts.length,
        totalSteps: parsedPrompts.reduce((sum, p) => sum + p.totalSteps, 0),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate API test code
function generateAPITestCode(endpoints, environment, options) {
  const baseUrl = environment?.variables?.BASE_URL || process.env.BASE_URL || 'http://localhost:5050';
  const timeout = environment?.variables?.TIMEOUT || 30000;
  
  let code = `import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('API Tests', () => {
  test.beforeEach(async ({ request }) => {
    allure.epic('API Testing');
    allure.feature('Automated API Test Generation');
    test.setTimeout(${timeout});
  });

`;

  endpoints.forEach((endpoint, index) => {
    const { method = 'GET', path, expectedStatus = 200, headers = {} } = endpoint;
    
    code += `  test('${method} ${path} - should return ${expectedStatus}', async ({ request }) => {
    allure.story('${method} ${path}');
    
    const response = await request.${method.toLowerCase()}('${baseUrl}${path}', {
      headers: {
        'Content-Type': 'application/json',
        ...${JSON.stringify(headers)}
      }
    });
    
    expect(response.status()).toBe(${expectedStatus});
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

`;
  });
  
  code += `});`;
  
  return code;
}

// Helper function to generate E2E test suite
function generateE2ETestSuite(parsedPrompts, suiteName, environment, options) {
  const baseUrl = environment?.variables?.BASE_URL || process.env.BASE_URL || 'http://localhost:5050';
  const timeout = environment?.variables?.TIMEOUT || 30000;
  
  let code = `import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('${suiteName || 'E2E Test Suite'}', () => {
  test.beforeEach(async ({ page }) => {
    allure.epic('E2E Testing');
    allure.feature('${suiteName || 'E2E Test Suite'}');
    test.setTimeout(${timeout});
    
    const baseUrl = process.env.BASE_URL || '${baseUrl}';
    await page.goto(baseUrl);
  });

`;

  parsedPrompts.forEach((parsedPrompt, index) => {
    code += `  test('${parsedPrompt.title || `Test ${index + 1}`}', async ({ page }) => {
    allure.story('${parsedPrompt.title || `Test ${index + 1}`}');
    
`;

    parsedPrompt.parsedSteps.forEach((step, stepIndex) => {
      code += `    // Step ${stepIndex + 1}: ${step.originalText}\n`;
      
      switch (step.action) {
        case 'navigate':
          code += `    await page.goto('${step.target}');\n`;
          break;
        case 'click':
          code += `    await page.click('${step.target}');\n`;
          break;
        case 'fill':
          code += `    await page.fill('${step.target}', '${step.value || 'test value'}');\n`;
          break;
        case 'assert':
          code += `    await expect(page.locator('${step.target}')).toBeVisible();\n`;
          break;
        case 'wait':
          code += `    await page.waitForTimeout(${step.waitTime || 1000});\n`;
          break;
        default:
          code += `    // TODO: Implement step: ${step.originalText}\n`;
      }
      
      code += `\n`;
    });
    
    code += `  });

`;
  });
  
  code += `});`;
  
  return code;
}

// Generate and run test immediately
router.post('/generate-and-run', async (req, res) => {
  try {
    const {
      promptContent,
      testName,
      testType = 'UI Test',
      projectId = 'default-project',
      modelId = 'default-model',
      modelName = 'Default Model',
      environmentId,
      options = {}
    } = req.body;
    
    if (!promptContent) {
      return res.status(400).json({ error: 'Prompt content is required' });
    }
    
    // Parse the prompt
    const parsedPrompt = promptParser.parsePrompt(promptContent);
    
    // Get environment if specified
    let environment = null;
    if (environmentId) {
      environment = await fileStorage.getEnvironmentById(environmentId);
    }
    
    // Generate unique IDs
    const promptId = uuidv4();
    const testId = uuidv4();
    
    // Generate the test code
    const testCode = await codeGenerator.generatePlaywrightSpec(
      parsedPrompt,
      environment,
      {
        testName: testName || 'Generated Test',
        testType,
        useLLM: true, // Enable LLM generation
        ...options
      }
    );
    
    // Generate file path
    const filePath = codeGenerator.generateFilePath(
      projectId,
      modelId,
      modelName,
      promptId,
      testName || 'Generated Test'
    );
    
    // Save test file
    const savedPath = await codeGenerator.saveTestFile(testCode, filePath);
    
    // Run the test immediately
    const { spawn } = require('child_process');
    const path = require('path');
    
    // Get the relative path for Playwright
    const relativePath = path.relative(process.cwd(), savedPath);
    
    console.log(`Running test: ${relativePath}`);
    
    // Run Playwright test
    const playwrightProcess = spawn('npx', ['playwright', 'test', relativePath, '--headed', '--project=chromium'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let testOutput = '';
    let testError = '';
    
    playwrightProcess.stdout.on('data', (data) => {
      testOutput += data.toString();
      console.log(`Test output: ${data}`);
    });
    
    playwrightProcess.stderr.on('data', (data) => {
      testError += data.toString();
      console.error(`Test error: ${data}`);
    });
    
    playwrightProcess.on('close', (code) => {
      console.log(`Test execution completed with code: ${code}`);
    });
    
    // Return immediately with test info, but keep process running
    res.json({
      success: true,
      message: 'Test generated and execution started',
      testCode,
      filePath: savedPath,
      relativePath: relativePath,
      testId,
      promptId,
      parsedPrompt,
      execution: {
        started: true,
        processId: playwrightProcess.pid,
        command: `npx playwright test ${relativePath} --headed --project=chromium`
      },
      metadata: {
        hasUI: parsedPrompt.hasUI,
        hasAPI: parsedPrompt.hasAPI,
        totalSteps: parsedPrompt.totalSteps,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in generate-and-run:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Generate and immediately run a test
router.post('/generate-and-run', async (req, res) => {
  try {
    console.log('=== /generate-and-run endpoint called ===');
    console.log('useExistingSession from request:', req.body.useExistingSession);
    
    const {
      promptContent,
      testName = 'Generated Test',
      testType = 'UI Test',
      environment,
      parsedSteps = [],
      baseUrl,
      promptId,
      useExistingSession = false,
      analysisResult = null
    } = req.body;
    
    if (!promptContent) {
      return res.status(400).json({ error: 'Prompt content is required' });
    }

    if (!environment || !environment.llmConfiguration) {
      return res.status(400).json({ error: 'Valid LLM environment is required' });
    }

    console.log('Generating and running Playwright test with LLM:', {
      testName,
      testType,
      environment: environment.name,
      stepCount: parsedSteps.length,
      baseUrl: baseUrl
    });

    // First, generate the test code
    const generateResponse = await generateLLMPlaywrightTest({
      promptContent,
      testName,
      testType,
      environment,
      parsedSteps,
      baseUrl,
      useExistingSession,
      analysisResult
    });

    if (!generateResponse.success) {
      return res.status(500).json({ error: generateResponse.error });
    }

    // Now run the generated test
    const testId = generateResponse.testId;
    const testFilePath = generateResponse.filePath;
    
    // Use absolute path for Playwright execution
    console.log('Running generated test:', {
      testId,
      testFilePath
    });

    // Execute the test using Playwright
    const { spawn } = require('child_process');
    const path = require('path');
    
    // Convert absolute path to relative path from project root
    const projectRoot = path.join(__dirname, '../..');
    const relativePath = path.relative(projectRoot, testFilePath);
    
    console.log('Playwright execution details:', {
      testFilePath,
      relativePath,
      projectRoot,
      workingDirectory: projectRoot,
      fileExists: require('fs').existsSync(testFilePath)
    });
    
    const playwrightArgs = [
      'test',
      relativePath,
      '--headed',
      '--project=chromium',
      '--timeout=30000'
    ];

    // Add session management if using existing session
    if (useExistingSession) {
      const fs = require('fs-extra');
      const sessionPath = path.join(__dirname, '../../storageState.json');
      
      if (await fs.pathExists(sessionPath)) {
        console.log('Using existing session for execution:', sessionPath);
        // The test will automatically use storageState.json due to playwright.config.js
      } else {
        console.log('No existing session found, proceeding with normal execution');
      }
    }

    console.log('Executing Playwright command:', `npx playwright ${playwrightArgs.join(' ')}`);

    // Set environment variable for local browsers
    const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: './node_modules/playwright-core/.local-browsers' };
    console.log('Setting PLAYWRIGHT_BROWSERS_PATH to:', env.PLAYWRIGHT_BROWSERS_PATH);

    const playwrightProcess = spawn('npx', ['playwright', ...playwrightArgs], {
      cwd: projectRoot, // Use project root as working directory
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env
    });

    let stdout = '';
    let stderr = '';

    playwrightProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('Playwright stdout:', data.toString());
    });

    playwrightProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('Playwright stderr:', data.toString());
    });

    // Send immediate response
    res.json({
      success: true,
      message: 'Test generated and execution started',
      testCode: generateResponse.testCode,
      filePath: testFilePath,
      testId,
      execution: {
        started: true,
        command: `npx playwright ${playwrightArgs.join(' ')}`,
        pid: playwrightProcess.pid,
        workingDirectory: path.join(__dirname, '../..')
      }
    });

    // Handle process completion
    playwrightProcess.on('close', (code) => {
      console.log(`Playwright process exited with code ${code}`);
      console.log('Final stdout:', stdout);
      console.log('Final stderr:', stderr);
      
      // Update test results in storage
      const testResult = {
        testId,
        testName,
        status: code === 0 ? 'passed' : 'failed',
        executionTime: Date.now(),
        output: stdout,
        error: stderr,
        exitCode: code,
        filePath: testFilePath,
        relativePath: relativePath
      };
      
      // Store the result (you might want to implement this)
      console.log('Test execution completed:', testResult);
      
      if (code !== 0) {
        console.error('Test execution failed:', {
          code,
          stdout,
          stderr,
          filePath: testFilePath,
          relativePath: relativePath,
          workingDirectory: path.join(__dirname, '../..')
        });
      }
    });

  } catch (error) {
    console.error('Error in generate-and-run:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate LLM Playwright test
async function generateLLMPlaywrightTest({ promptContent, testName, testType, environment, parsedSteps, baseUrl, useExistingSession = false, analysisResult = null }) {
  try {
    console.log('=== generateLLMPlaywrightTest DEBUG ===');
    console.log('useExistingSession parameter:', useExistingSession);
    console.log('useExistingSession type:', typeof useExistingSession);
    console.log('baseUrl parameter:', baseUrl);
    console.log('baseUrl type:', typeof baseUrl);
    console.log('baseUrl truthy:', !!baseUrl);
    console.log('environment.variables?.BASE_URL:', environment.variables?.BASE_URL);
    
    // Create a comprehensive prompt for the LLM
    // Use the provided baseUrl (from prompt) instead of environment
    const finalBaseUrl = baseUrl || environment.variables?.BASE_URL || 'http://localhost:5050';
    console.log('finalBaseUrl:', finalBaseUrl);
    console.log('=====================================');
    const browserType = environment.variables?.BROWSER || 'chromium';
    const headlessMode = environment.variables?.HEADLESS || 'true';
    
    const sessionManagementInstructions = useExistingSession ? `

CRITICAL SESSION MANAGEMENT REQUIREMENTS - MUST BE INCLUDED:
1. Add these imports at the top of the file:
   import { createContextWithSession, shouldSkipLogin, saveSessionAfterLogin } from '../test-utils/session-manager';

2. In beforeEach, create context with session:
   test.beforeEach(async ({ browser }) => {
     const context = await createContextWithSession(browser, { viewport: { width: 1920, height: 1080 } });
     page = await context.newPage();
   });

3. At the start of each test, check if already logged in:
   const isLoggedIn = await shouldSkipLogin(page);
   if (isLoggedIn) {
     console.log('🚀 Already logged in, skipping login steps');
     return; // Skip the rest of the test if already logged in
   }

4. After successful login actions, save the session:
   await saveSessionAfterLogin(page);
   console.log('✅ Session saved for subsequent tests');

MANDATORY: The test file MUST include all 4 points above. Do not generate a test without these session management features.` : '';

    const llmPrompt = `Generate a complete Playwright test file for: "${promptContent}"

Test Name: ${testName}
Base URL: ${finalBaseUrl}
Browser: ${browserType}
Headless: ${headlessMode}

${parsedSteps.length > 0 ? `Steps to implement:
${parsedSteps.map((step, index) => `${index + 1}. ${step.originalText}`).join('\n')}` : ''}

${analysisResult && analysisResult.elements && analysisResult.elements.length > 0 ? `DOM Analysis Results:
The following elements were found during DOM analysis and should be used for more accurate selectors:
${analysisResult.elements.map((element, index) => `${index + 1}. ${element.selector} - ${element.text || element.tagName || 'element'}`).join('\n')}

Use these analyzed selectors when possible for more reliable test automation.` : ''}

Create a complete TypeScript Playwright test file with:
- Proper imports: import { test, expect } from '@playwright/test' and import { allure } from 'allure-playwright'
- Use the EXACT Base URL provided above (${finalBaseUrl}) - do NOT use process.env.BASE_URL
- Test structure: describe block with beforeEach, test, and afterEach
- Error handling: try-catch blocks with screenshot capture on failure
- Allure reporting: tags, attachments, and proper metadata
- Proper selectors: use data-testid when possible, fallback to other selectors
- Wait conditions: use page.waitForSelector() for element visibility
- Meaningful assertions: verify the test outcome${sessionManagementInstructions}

CRITICAL REQUIREMENT: Start your test file with this exact line:
const BASE_URL = '${finalBaseUrl}';

DO NOT use process.env.BASE_URL anywhere in the code. Always use the constant BASE_URL = '${finalBaseUrl}' instead.

IMPORTANT: The test should use the exact baseUrl provided (${finalBaseUrl}) and NOT rely on environment variables. This ensures the test uses the prompt's baseUrl regardless of environment settings.

EXAMPLE of what NOT to do:
const BASE_URL = process.env.BASE_URL || '${finalBaseUrl}'; // WRONG

EXAMPLE of what to do:
const BASE_URL = '${finalBaseUrl}'; // CORRECT

Return ONLY the complete TypeScript code without explanations or markdown.`;

    // Generate code using LLM
    const fixedEnvironment = {
      ...environment,
      llmConfiguration: {
        ...environment.llmConfiguration,
        baseUrl: environment.llmConfiguration.baseUrl?.replace(/\/$/, '') || environment.llmConfiguration.baseUrl,
        model: environment.llmConfiguration.model || 'llama3.1:8b'
      }
    };
    
    const systemPrompt = `You are an expert Playwright test automation engineer. Generate high-quality, production-ready Playwright test code based on user requirements.

REQUIREMENTS:
- Use TypeScript with Playwright
- Include proper imports: import { test, expect } from '@playwright/test'
- Include Allure reporting: import { allure } from 'allure-playwright'
- Use environment variables for configuration (BASE_URL, BROWSER_TYPE, HEADLESS_MODE)
- Add proper test structure with describe and test blocks
- Use data-testid selectors when possible, fallback to other selectors
- Add proper error handling with try-catch blocks
- Include meaningful assertions and validations
- Add screenshot capture on failure
- Use page.waitForSelector() for element visibility
- Add proper test cleanup in afterEach
- Include Allure tags and attachments

${useExistingSession ? `
CRITICAL SESSION MANAGEMENT - MUST INCLUDE:
- Import session management utilities: import { createContextWithSession, shouldSkipLogin, saveSessionAfterLogin } from '../test-utils/session-manager';
- Use createContextWithSession in beforeEach to create context with existing session
- Check shouldSkipLogin at test start and skip login if already authenticated
- Call saveSessionAfterLogin after successful login actions
- These features are MANDATORY and must be included in the generated code
` : ''}

Return ONLY the complete TypeScript test file code without any explanations or markdown formatting.`;

    const userPrompt = llmPrompt;
    
    console.log('Enforcing direct LLM generation - no fallback to templates');
    
    const rawCode = await llmService.generateCode(userPrompt, fixedEnvironment, {
      systemPrompt,
      testName,
      testType,
      baseUrl: finalBaseUrl,
      environment: fixedEnvironment,
      parsedSteps: parsedSteps
    });
    
    // Clean the generated code
    let testCode = cleanGeneratedCode(rawCode);
    
    // Add session management code if useExistingSession is true
    if (useExistingSession) {
      testCode = addSessionManagementCode(testCode);
    }
    
    // Validate that we actually got code from LLM
    if (!testCode || testCode.trim().length === 0) {
      throw new Error('LLM generated empty or invalid code. Please check your LLM configuration and try again.');
    }
    
    console.log('LLM code generation successful, proceeding with test execution');

    // Generate file path for saving
    const CodeGenerator = require('../services/CodeGenerator');
    const codeGenerator = new CodeGenerator();
    
    const filePath = codeGenerator.generateFilePath(
      'enhanced-ai',
      'llm-generated',
      'LLM-Generated',
      uuidv4(),
      testName
    );

    // Save the test file
    const savedPath = await codeGenerator.saveTestFile(testCode, filePath);

    // Generate test ID from file path
    const testId = path.basename(savedPath, '.spec.ts').replace(/[^a-zA-Z0-9-_]/g, '-');

    return {
      success: true,
      testCode,
      filePath: savedPath,
      testId,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedWith: 'LLM',
        llmProvider: environment.llmConfiguration.provider,
        llmModel: environment.llmConfiguration.model,
        testName,
        testType,
        stepCount: parsedSteps.length,
        environment: environment.name
      }
    };
  } catch (error) {
    console.error('Error generating LLM Playwright test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = router;
