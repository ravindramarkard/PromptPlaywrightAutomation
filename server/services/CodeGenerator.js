const fs = require('fs-extra');
const path = require('path');
const LLMService = require('./LLMService');

class CodeGenerator {
  constructor() {
    this.templates = {
      imports: this.getImportsTemplate(),
      testSetup: this.getTestSetupTemplate(),
      testTeardown: this.getTestTeardownTemplate(),
      stepTemplates: this.getStepTemplates()
    };
    this.llmService = new LLMService();
  }

  async generatePlaywrightSpec(parsedPrompt, environment, options = {}) {
    const {
      testName = 'Generated Test',
      testType = 'UI Test',
      baseUrl = process.env.BASE_URL || environment?.variables?.BASE_URL || 'http://localhost:3000',
      timeout = environment?.variables?.TIMEOUT || 90000,
      browser = environment?.variables?.BROWSER || 'chromium',
      headless = environment?.variables?.HEADLESS !== false,
      retries = environment?.variables?.RETRIES || 2,
      useLLM = false
    } = options;

    // Use LLM if enabled and environment has LLM configuration
    if (useLLM && environment?.llmConfiguration?.enabled) {
      return await this.generateWithLLM(parsedPrompt, environment, options);
    }

    // Fallback to template-based generation
    const specContent = this.buildSpecContent({
      testName,
      testType,
      baseUrl,
      timeout,
      browser,
      headless,
      retries,
      steps: parsedPrompt.parsedSteps,
      hasUI: parsedPrompt.hasUI,
      hasAPI: parsedPrompt.hasAPI,
      options
    });

    return specContent;
  }

  async generateWithLLM(parsedPrompt, environment, options = {}) {
    try {
      // First, generate the base template
      const baseTemplate = this.buildSpecContent({
        testName: options.testName || 'Generated Test',
        testType: options.testType || 'UI Test',
        baseUrl: options.baseUrl || process.env.BASE_URL || 'http://localhost:3000',
        timeout: options.timeout || 30000,
        browser: options.browser || 'chromium',
        headless: options.headless !== false,
        retries: options.retries || 2,
        steps: parsedPrompt.parsedSteps,
        hasUI: parsedPrompt.hasUI,
        hasAPI: parsedPrompt.hasAPI
      });

      // Convert parsed steps to natural language for LLM context
      const naturalLanguagePrompt = this.convertToNaturalLanguage(parsedPrompt);
      
      // Create a prompt for LLM to review and enhance the template
      const llmPrompt = this.createLLMEnhancementPrompt(baseTemplate, naturalLanguagePrompt, options);
      
      // Get LLM enhancement
      const enhancedCode = await this.llmService.generateCode(
        llmPrompt,
        environment,
        options
      );
      
      return enhancedCode;
    } catch (error) {
      console.error('LLM enhancement failed, using base template:', error);
      // Fallback to template-based generation
      return this.buildSpecContent({
        testName: options.testName || 'Generated Test',
        testType: options.testType || 'UI Test',
        baseUrl: options.baseUrl || process.env.BASE_URL || 'http://localhost:3000',
        timeout: options.timeout || 30000,
        browser: options.browser || 'chromium',
        headless: options.headless !== false,
        retries: options.retries || 2,
        steps: parsedPrompt.parsedSteps,
        hasUI: parsedPrompt.hasUI,
        hasAPI: parsedPrompt.hasAPI,
        options
      });
    }
  }

  createLLMEnhancementPrompt(baseTemplate, naturalLanguagePrompt, options) {
    const testType = options.testType || 'UI Test';
    const testName = options.testName || 'Generated Test';
    const parsedSteps = options.parsedSteps || [];
    const includeAllureReport = options.includeAllureReport !== false;
    const includeTestSteps = options.includeTestSteps !== false;
    
    let stepsContext = '';
    if (parsedSteps.length > 0) {
      stepsContext = `\n**Parsed Steps (${parsedSteps.length} steps):**
${parsedSteps.map((step, index) => `- Step ${index + 1}: ${step.action?.toUpperCase()} - ${step.originalText}${step.target ? ` (Target: ${step.target})` : ''}${step.value ? ` (Value: ${step.value})` : ''}`).join('\n')}`;
    }
    
    return `You are an expert Playwright test automation engineer. I have generated a base Playwright test template based on the following user requirements:

**Test Requirements:**
- Test Name: ${testName}
- Test Type: ${testType}
- User Intent: ${naturalLanguagePrompt}${stepsContext}

**Base Template Generated:**
\`\`\`typescript
${baseTemplate}
\`\`\`

**Your Task:**
Please review and enhance this Playwright test code to make it more accurate, robust, and production-ready. Focus on:

1. **Selector Accuracy**: Improve selectors to be more reliable and specific
2. **Error Handling**: Add proper error handling and wait conditions
3. **Best Practices**: Follow Playwright best practices for stability
4. **Assertions**: Add meaningful assertions where appropriate
5. **Code Quality**: Improve code structure and readability
6. **Edge Cases**: Handle potential edge cases and timing issues
7. **Test Reporting**: ${includeAllureReport ? 'Use Playwright test.step() for step annotations (allure APIs have compatibility issues)' : 'Test reporting is disabled'}
8. **Step Annotations**: ${includeTestSteps ? 'Include detailed step annotations using test.step() for better reporting' : 'Step annotations are disabled'}

**Requirements:**
- Keep the same test structure and imports
- Maintain the same test name and describe block
- Ensure all selectors are robust and specific
- Add proper waits and error handling
- Use modern Playwright APIs
- Keep the code clean and maintainable
- ${includeAllureReport ? 'Use Playwright test.step() instead of allure APIs due to compatibility issues' : ''}
- ${includeTestSteps ? 'Wrap each step in test.step() for better reporting (avoid allure.step due to API issues)' : ''}

**CRITICAL SELECTOR FIXES - PREVENT ELEMENT AMBIGUITY:**
- NEVER use getByText() for common text that appears multiple times (Dashboard, Home, Login, Submit, etc.)
- ALWAYS use role-based selectors: getByRole('heading'), getByRole('button'), getByRole('link')
- For form elements: use getByLabel(), getByPlaceholder(), or getByRole('textbox')
- For navigation items: combine with parent containers like getByRole('navigation').getByText()
- For repeated elements: use nth() selector or specific CSS selectors
- Use data-testid when available: getByTestId('unique-id')
- Combine selectors for specificity: locator('.container').getByRole('button')
- For tables: use getByRole('cell') or getByRole('row') with specific text
- Test each selector to ensure it matches exactly one element
- Use browser dev tools to verify selector uniqueness before implementation

**Output:**
Return only the enhanced Playwright test code, no explanations or markdown formatting.`;
  }

  convertToNaturalLanguage(parsedPrompt) {
    const steps = parsedPrompt.parsedSteps.map(step => {
      const { action, target, value, assertion } = step;
      
      switch (action) {
        case 'navigate':
          return `Navigate to ${target}`;
        case 'click':
          return `Click on ${target}`;
        case 'fill':
          return `Fill ${target} with ${value || 'the specified value'}`;
        case 'assert':
          return `Assert that ${target} ${assertion || 'is visible'}`;
        case 'wait':
          return `Wait for ${step.waitTime ? step.waitTime / 1000 + ' seconds' : 'the page to load'}`;
        case 'hover':
          return `Hover over ${target}`;
        case 'scroll':
          return `Scroll to ${target}`;
        case 'select':
          return `Select ${value || 'an option'} from ${target}`;
        case 'upload':
          return `Upload ${value || 'a file'} to ${target}`;
        default:
          return step.originalText;
      }
    });

    return steps.join('. ');
  }

  buildSpecContent(config) {
    const { 
      testName, 
      testType, 
      baseUrl, 
      timeout, 
      browser, 
      headless, 
      retries, 
      steps, 
      hasUI, 
      hasAPI,
      options = {},
      tags = []
    } = config;
    
    let content = this.templates.imports;
    
    if (hasAPI) {
      content += this.getAPIImports();
    }
    
    // Add helper functions for auto-waiting and self-healing
    content += this.getHelperFunctions();
    
    content += this.templates.testSetup
      .replace('{{TEST_NAME}}', testName)
      .replace('{{TEST_TYPE}}', testType)
      .replace('{{BASE_URL}}', baseUrl)
      .replace('{{TIMEOUT}}', timeout)
      .replace('{{BROWSER}}', browser)
      .replace('{{HEADLESS}}', headless)
      .replace('{{RETRIES}}', retries);

    content += this.generateTestSteps(steps, hasUI, hasAPI, { ...options, tags });
    
    content += this.templates.testTeardown;
    
    // CRITICAL: Fix ambiguous selectors that cause strict mode violations
    content = this.fixAmbiguousSelectors(content);
    
    return content;
  }

  generateTestSteps(steps, hasUI, hasAPI, options = {}) {
    const { 
      includeAllureReport = true, 
      addTestDescription = true, 
      includeTestSteps = true,
      timeout = 90000,
      baseUrl = 'http://localhost:3000',
      tags = []
    } = options;
    
    let content = '';
    
    // Add beforeEach for allure tags
    if (includeAllureReport && tags && tags.length > 0) {
      content += '  test.beforeEach(async ({ page }) => {\n';
      tags.forEach(tag => {
        if (tag && tag.trim()) {
          content += `    await allure.tag('${tag.trim()}');\n`;
        }
      });
      content += '  });\n\n';
    }
    
    // Add test method signature
    content += '  test(\'should execute test steps\', async ({ page';
    if (hasAPI) {
      content += ', request';
    }
    content += ' }) => {\n';
    
    // Set timeout for auto-waiting capabilities
    content += `    test.setTimeout(${timeout});\n`;
    content += '\n';
    
    // Add test description if enabled
    if (includeAllureReport && addTestDescription) {
      content += `    allure.description('Automated test generated from AI prompt with ${steps.length} steps');\n`;
      content += `    allure.severity('normal');\n`;
      content += `    allure.owner('AI Test Generator');\n\n`;
    }
    
    // Auto-navigate to base URL at test start
    content += `    // Auto-navigate to base URL at test start\n`;
    content += `    const baseUrl = process.env.BASE_URL || '${baseUrl}';\n`;
    content += `    await navigateWithAutoWait(page, baseUrl);\n`;
    content += '\n';
    
    content += '    try {\n';
    
    steps.forEach((step, index) => {
      content += this.generateStepCode(step, index + 1, hasUI, hasAPI, options);
    });
    
    content += '      console.log(\'Test completed successfully\');\n';
    content += '    } catch (error) {\n';
    content += '      console.error(\'Test failed:\', error.message);\n';
    content += '      await handleTestCleanup(page, test.info());\n';
    content += '      throw error;\n';
    content += '    }\n';
    
    content += '  });\n';
    
    return content;
  }

  generateStepCode(step, stepNumber, hasUI, hasAPI, options = {}) {
    const { action, target, value, assertion, waitTime } = step;
    const { includeAllureReport = true, includeTestSteps = true } = options;
    
    let code = `\n    // Step ${stepNumber}: ${this.generateStepDescription(step)}\n`;
    
    // Add test step annotation if enabled (using Playwright test.step instead of allure.step)
    if (includeAllureReport && includeTestSteps) {
      code += `    await test.step('Step ${stepNumber}: ${this.generateStepDescription(step)}', async () => {\n`;
    }
    
    // Add try-catch for better error handling
    code += `      try {\n`;
    
    switch (action) {
      case 'navigate':
        code += this.generateNavigateCode(target);
        break;
      case 'click':
        code += this.generateClickCode(target);
        break;
      case 'fill':
        code += this.generateFillCode(target, value);
        break;
      case 'assert':
        code += this.generateAssertCode(target, assertion);
        break;
      case 'wait':
        code += this.generateWaitCode(waitTime);
        break;
      case 'hover':
        code += this.generateHoverCode(target);
        break;
      case 'scroll':
        code += this.generateScrollCode(target);
        break;
      case 'select':
        code += this.generateSelectCode(target, value);
        break;
      case 'upload':
        code += this.generateUploadCode(target, value);
        break;
      default:
        code += this.generateGenericCode(step);
    }
    
    // Close try-catch
    code += `      } catch (error) {\n`;
    code += `        console.error('Step ${stepNumber} failed:', error);\n`;
    code += `        throw error;\n`;
    code += `      }\n`;
    
    // Close Allure step if enabled
    if (includeAllureReport && includeTestSteps) {
      code += `      });\n`;
    }
    
    return code;
  }

  generateNavigateCode(target) {
    if (target.startsWith('http')) {
      return `      await page.goto('${target}', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => console.log('Network idle timeout, continuing...'));
`;
    } else {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const path = target.startsWith('/') ? target : `/${target}`;
      return `      await page.goto('${baseUrl}${path}', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => console.log('Network idle timeout, continuing...'));
`;
    }
  }

  generateClickCode(target) {
      const selector = this.sanitizeSelector(target);
      return `      // Auto-waiting and self-healing click with multiple strategies
      const clickElement = async () => {
        const selectors = [
          '${selector}',
          'button[name="${target.replace(/[\[\]"']/g, '')}"]',
          '#${target.replace(/[\[\]"'#]/g, '')}',
          'input[type="submit"][value*="${target.replace(/[\[\]"']/g, '')}"]',
          '[role="button"]:has-text("${target.replace(/[\[\]"']/g, '')}")',
          'a:has-text("${target.replace(/[\[\]"']/g, '')}")',
          '*[onclick]:has-text("${target.replace(/[\[\]"']/g, '')}")',
          'button:has-text("${target.replace(/[\[\]"']/g, '')}")',
          '[data-testid*="${target.replace(/[\[\]"']/g, '').toLowerCase()}"]'
        ];
        
        for (let i = 0; i < selectors.length; i++) {
          try {
            const element = page.locator(selectors[i]).first();
            await element.waitFor({ state: 'visible' });
            await element.click();
            console.log(\`Successfully clicked using selector: \${selectors[i]}\`);
            return;
          } catch (error) {
            console.log(\`Selector \${selectors[i]} failed: \${error.message}\`);
            if (i === selectors.length - 1) throw error;
          }
        }
      };
      
      // Retry mechanism with reduced backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await clickElement();
          break;
        } catch (error) {
          console.log(\`Click attempt \${attempt} failed: \${error.message}\`);
          if (attempt === 3) throw new Error(\`Failed to click element after 3 attempts: \${error.message}\`);
          await page.waitForTimeout(attempt * 500); // Reduced backoff time
        }
      }
`;
    }

  generateFillCode(target, value) {
      const selector = this.sanitizeSelector(target);
      const sanitizedValue = value ? `'${value.replace(/'/g, "\'")}'` : "'test value'";
      return `      // Auto-waiting and self-healing fill with multiple strategies
      const fillElement = async () => {
        const selectors = [
          '${selector}',
          'input[name="${target.replace(/[\[\]"']/g, '')}"]',
          '#${target.replace(/[\[\]"'#]/g, '')}',
          'input[placeholder*="${target.replace(/[\[\]"']/g, '')}"]',
          'input[type="text"][id*="${target.replace(/[\[\]"']/g, '').toLowerCase()}"]',
          'input[type="password"][id*="${target.replace(/[\[\]"']/g, '').toLowerCase()}"]',
          'input[type="email"][id*="${target.replace(/[\[\]"']/g, '').toLowerCase()}"]',
          'textarea[name="${target.replace(/[\[\]"']/g, '')}"]',
          '[data-testid*="${target.replace(/[\[\]"']/g, '').toLowerCase()}"]'
        ];
        
        for (let i = 0; i < selectors.length; i++) {
          try {
            const element = page.locator(selectors[i]).first();
            await element.waitFor({ state: 'visible' });
            await element.clear();
            await element.fill(${sanitizedValue});
            console.log(\`Successfully filled using selector: \${selectors[i]}\`);
            return;
          } catch (error) {
            console.log(\`Selector \${selectors[i]} failed: \${error.message}\`);
            if (i === selectors.length - 1) throw error;
          }
        }
      };
      
      // Retry mechanism with reduced backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await fillElement();
          break;
        } catch (error) {
          console.log(\`Fill attempt \${attempt} failed: \${error.message}\`);
          if (attempt === 3) throw new Error(\`Failed to fill element after 3 attempts: \${error.message}\`);
          await page.waitForTimeout(attempt * 500); // Reduced backoff time
        }
      }
`;
    }

  generateAssertCode(target, assertion) {
    const selector = this.sanitizeSelector(target);
    if (assertion) {
      return `      await page.waitForSelector('${selector}', { state: 'visible' });\n      await expect(page.locator('${selector}')).${this.parseAssertion(assertion)};\n`;
    } else {
      return `      await page.waitForSelector('${selector}', { state: 'visible' });\n      await expect(page.locator('${selector}')).toBeVisible();\n`;
    }
  }

  generateWaitCode(waitTime) {
    if (waitTime) {
      return `      await page.waitForTimeout(${waitTime});\n`;
    } else {
      return `      await page.waitForLoadState('networkidle');\n`;
    }
  }

  generateHoverCode(target) {
    const selector = this.sanitizeSelector(target);
    return `      await page.waitForSelector('${selector}', { state: 'visible' });\n      await page.hover('${selector}');\n`;
  }

  generateScrollCode(target) {
    const selector = this.sanitizeSelector(target);
    return `      await page.waitForSelector('${selector}', { state: 'visible' });\n      await page.locator('${selector}').scrollIntoViewIfNeeded();\n`;
  }

  generateSelectCode(target, value) {
    const selector = this.sanitizeSelector(target);
    const sanitizedValue = value ? `'${value.replace(/'/g, "\\'")}'` : "'option1'";
    return `      await page.waitForSelector('${selector}', { state: 'visible' });\n      await page.selectOption('${selector}', ${sanitizedValue});\n`;
  }

  generateUploadCode(target, value) {
    const selector = this.sanitizeSelector(target);
    const filePath = value || './test-file.txt';
    return `      await page.waitForSelector('${selector}', { state: 'visible' });\n      await page.setInputFiles('${selector}', '${filePath}');\n`;
  }

  generateGenericCode(step) {
    return `      // TODO: Implement step: ${step.originalText}\n      console.log('Step not implemented:', '${step.originalText}');\n`;
  }

  generateStepDescription(step) {
    const { action, target, value, assertion } = step;
    
    switch (action) {
      case 'navigate':
        return `Navigate to ${target}`;
      case 'click':
        return `Click on ${target}`;
      case 'fill':
        return `Fill ${target} with ${value || 'value'}`;
      case 'assert':
        return `Assert ${assertion || 'condition'}`;
      case 'wait':
        return `Wait for ${step.waitTime ? step.waitTime / 1000 + ' seconds' : 'condition'}`;
      case 'hover':
        return `Hover over ${target}`;
      case 'scroll':
        return `Scroll ${target}`;
      default:
        return step.originalText;
    }
  }

  sanitizeSelector(selector) {
    if (!selector) return 'body';
    
    // Basic selector sanitization
    if (selector.startsWith('[') || selector.startsWith('.') || selector.startsWith('#')) {
      return selector;
    }
    
    // If it looks like text content, use text selector
    if (!selector.includes('[') && !selector.includes('.') && !selector.includes('#') && !selector.includes('=')) {
      return `text=${selector}`;
    }
    
    // If it looks like a data attribute or role
    if (selector.includes('data-') || selector.includes('role=') || selector.includes('aria-')) {
      return selector;
    }
    
    // If it looks like a button or link text
    if (selector.toLowerCase().includes('button') || selector.toLowerCase().includes('link')) {
      return `text=${selector}`;
    }
    
    return selector;
  }

  parseAssertion(assertion) {
    if (assertion.includes('visible')) return 'toBeVisible()';
    if (assertion.includes('hidden')) return 'toBeHidden()';
    if (assertion.includes('enabled')) return 'toBeEnabled()';
    if (assertion.includes('disabled')) return 'toBeDisabled()';
    if (assertion.includes('contain')) return 'toContainText()';
    if (assertion.includes('exist')) return 'toHaveCount(1)';
    
    return 'toBeVisible()';
  }

  getImportsTemplate() {
    return `import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

`;
  }

  getAPIImports() {
    return `import { APIRequestContext } from '@playwright/test';

`;
  }

  getTestSetupTemplate() {
    return `test.describe('{{TEST_NAME}}', () => {
  // Auto-waiting navigation helper function
  const navigateWithAutoWait = async (page, url) => {
    const navigationStrategies = [
      { waitUntil: 'domcontentloaded', timeout: 30000 },
      { waitUntil: 'load', timeout: 45000 },
      { waitUntil: 'networkidle', timeout: 60000 }
    ];
    
    for (let i = 0; i < navigationStrategies.length; i++) {
      try {
        await page.goto(url, navigationStrategies[i]);
        console.log(\`Navigation successful with strategy: \${JSON.stringify(navigationStrategies[i])}\`);
        
        // Additional wait for page stability
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        return;
      } catch (error) {
        console.log(\`Navigation strategy \${i + 1} failed: \${error.message}\`);
        if (i === navigationStrategies.length - 1) {
          throw new Error(\`All navigation strategies failed: \${error.message}\`);
        }
      }
    }
  };

`;
  }

  getTestTeardownTemplate() {
    return `  // Auto-cleanup and reporting helper
  const handleTestCleanup = async (page, testInfo) => {
    try {
      if (testInfo.status === 'failed') {
        await page.screenshot({ 
          path: \`test-results/screenshots/failure-\${Date.now()}.png\`,
          fullPage: true 
        });
        console.log('Screenshot captured for failed test');
      }
    } catch (error) {
      console.log('Failed to capture screenshot:', error.message);
    }
  };
});

`;
  }

  fixAmbiguousSelectors(code) {
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
        fixes.push(pattern.source.match(/getByText\\\\\(['\"]([^'\"]+)['\"]\\\\\)/)?.[1] || 'text selector');
      }
    });
    
    if (fixes.length > 0) {
      console.log('Applied selector fixes for:', fixes.join(', '));
    }
    
    return fixedCode;
  }

  getHelperFunctions() {
    return `
// Auto-waiting navigation helper with multiple strategies
async function navigateWithAutoWait(page, url) {
  const strategies = [
    { waitUntil: 'domcontentloaded' },
    { waitUntil: 'load' },
    { waitUntil: 'networkidle' }
  ];
  
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const strategy of strategies) {
      try {
        await page.goto(url, strategy);
        await page.waitForLoadState('networkidle').catch(() => console.log('Network idle timeout, continuing...'));
        console.log('Navigation successful with strategy:', strategy.waitUntil);
        return;
      } catch (error) {
        console.log('Navigation attempt failed:', error.message);
        await page.waitForTimeout(500 * (attempt + 1)); // Reduced backoff
      }
    }
  }
  throw new Error('All navigation strategies failed');
}

// Test cleanup helper
async function handleTestCleanup(page, testInfo) {
  try {
    if (testInfo.status !== 'passed') {
      const screenshotPath = \`screenshots/failure-\${Date.now()}.png\`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Screenshot saved:', screenshotPath);
    }
    
    await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], .modal, .popup');
      dialogs.forEach(dialog => {
        if (dialog.style) dialog.style.display = 'none';
      });
    });
    
    console.log('Test cleanup completed');
  } catch (error) {
    console.error('Error during test cleanup:', error.message);
  }
}
`;
  }

  getStepTemplates() {
    return {
      navigate: 'await page.goto(\'{{URL}}\');',
      click: 'await page.click(\'{{SELECTOR}}\');',
      fill: 'await page.fill(\'{{SELECTOR}}\', \'{{VALUE}}\');',
      assert: 'await expect(page.locator(\'{{SELECTOR}}\')).{{ASSERTION}};',
      wait: 'await page.waitForTimeout({{TIME}});'
    };
  }

  async saveTestFile(content, filePath) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  generateFilePath(projectId, modelId, modelName, promptId, testName) {
    const safeTestName = testName || 'Generated Test';
    const sanitizedTestName = safeTestName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const sanitizedModelName = modelName.replace(/[^a-zA-Z0-9-_]/g, '-');
    // Return absolute path to project root tests directory
    const projectRoot = path.resolve(__dirname, '../..');
    const fullPath = path.join(projectRoot, 'tests/projects', projectId, 'models', modelId, sanitizedModelName, 'prompts', promptId, `${sanitizedTestName}.spec.ts`);
    console.log('Generated file path:', fullPath);
    console.log('Project root:', projectRoot);
    console.log('__dirname:', __dirname);
    return fullPath;
  }
}

module.exports = CodeGenerator;
