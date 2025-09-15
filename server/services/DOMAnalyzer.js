const { chromium } = require('playwright');
const axios = require('axios');

class DOMAnalyzer {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    if (!this.browser) {
      const headless = process.env.HEADLESS === 'false' ? false : true;
      this.browser = await chromium.launch({ headless });
      this.page = await this.browser.newPage();
    }
  }

  async cleanup() {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      this.page = null;
      this.browser = null;
    } catch (error) {
      console.warn('DOMAnalyzer cleanup error:', error.message);
    }
  }

  async navigateToPage(url, timeout, waitUntil, retries) {
    const waitOrder = [waitUntil, 'load', 'domcontentloaded', 'networkidle'];
    let lastError = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      for (const wu of waitOrder) {
        try {
          console.log(`DOMAnalyzer: navigating (attempt ${attempt + 1}/${retries + 1}) waitUntil=${wu}, timeout=${timeout}ms`);
          await this.page.goto(url, { waitUntil: wu, timeout });
          await this.page.waitForLoadState('domcontentloaded', { timeout: Math.min(timeout, 15000) }).catch(() => {});
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          console.warn(`DOMAnalyzer navigation failed with waitUntil=${wu}: ${err.message}`);
        }
      }
      if (!lastError) break;
    }

    if (lastError) {
      console.warn('DOMAnalyzer: navigation failed after retries, attempting HTML snapshot fallback...');
      try {
        await this.loadHtmlSnapshot(url, timeout);
      } catch (snapshotError) {
        console.warn('DOMAnalyzer: HTML snapshot also failed, continuing without DOM analysis');
        throw lastError;
      }
    }
  }

  async executeStep(step, timeout) {
    try {
      const action = step.action || 'click';
      const target = step.target || '';
      const value = step.value || '';
      
      console.log(`Executing step: ${action} on ${target} with value: ${value}`);
      
      switch (action) {
        case 'navigate':
        case 'goto':
          const url = step.url || step.target || step.originalText;
          if (url && url.startsWith('http')) {
            await this.page.goto(url, { waitUntil: 'load', timeout });
            return url;
          }
          break;
          
        case 'click':
          if (target) {
            // Try different selector strategies
            const selectors = this.generateSelectors(target);
            for (const selector of selectors) {
              try {
                await this.page.click(selector, { timeout: 2000 });
                await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
                return this.page.url();
              } catch (err) {
                console.log(`Selector ${selector} failed: ${err.message}`);
              }
            }
          }
          break;
          
        case 'fill':
        case 'type':
          if (target && value) {
            const selectors = this.generateSelectors(target);
            for (const selector of selectors) {
              try {
                await this.page.fill(selector, value, { timeout: 2000 });
                return this.page.url();
              } catch (err) {
                console.log(`Fill selector ${selector} failed: ${err.message}`);
              }
            }
          }
          break;
          
        case 'select':
          if (target && value) {
            const selectors = this.generateSelectors(target);
            for (const selector of selectors) {
              try {
                await this.page.selectOption(selector, value, { timeout: 2000 });
                await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
                return this.page.url();
              } catch (err) {
                console.log(`Select selector ${selector} failed: ${err.message}`);
              }
            }
          }
          break;
      }
      
      // Wait a bit for any navigation to complete
      await this.page.waitForTimeout(1000);
      return this.page.url();
      
    } catch (error) {
      console.warn(`Step execution failed: ${error.message}`);
      return this.page.url();
    }
  }

  generateSelectors(target) {
    const selectors = [];
    
    // If target looks like a URL, use it directly
    if (target.startsWith('http')) {
      return [target];
    }
    
    // Generate various selector strategies
    if (target.includes('username') || target.includes('email')) {
      selectors.push('#username', '[name="username"]', '[name="email"]', 'input[type="email"]', 'input[placeholder*="username" i]', 'input[placeholder*="email" i]');
    } else if (target.includes('password')) {
      selectors.push('#password', '[name="password"]', 'input[type="password"]', 'input[placeholder*="password" i]');
    } else if (target.includes('submit') || target.includes('login') || target.includes('sign in')) {
      selectors.push('button[type="submit"]', 'input[type="submit"]', 'button:has-text("Login")', 'button:has-text("Sign In")', 'button:has-text("Submit")');
    } else if (target.includes('button')) {
      selectors.push('button', `button:has-text("${target}")`, `[role="button"]:has-text("${target}")`);
    } else if (target.includes('link')) {
      selectors.push('a', `a:has-text("${target}")`);
    } else {
      // Generic selectors
      selectors.push(`#${target}`, `[name="${target}"]`, `[data-testid="${target}"]`, `button:has-text("${target}")`, `a:has-text("${target}")`);
    }
    
    return selectors;
  }

  async extractElements() {
    try {
      // Wait for page to be fully loaded
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      
      // Extract all interactive elements
      const elements = await this.page.evaluate(() => {
        const interactiveElements = [];
        
        // Get all input elements
        const inputs = document.querySelectorAll('input');
        inputs.forEach((input, index) => {
          const elementInfo = {
            type: 'input',
            tagName: input.tagName.toLowerCase(),
            index,
            attributes: {},
            text: input.value || input.placeholder || '',
            selectors: []
          };
          
          // Collect all attributes
          for (let attr of input.attributes) {
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          // Generate possible selectors
          if (input.getAttribute('data-testid')) {
            elementInfo.selectors.push(`[data-testid="${input.getAttribute('data-testid')}"]`);
          }
          if (input.id) {
            elementInfo.selectors.push(`#${input.id}`);
          }
          if (input.name) {
            elementInfo.selectors.push(`[name="${input.name}"]`);
          }
          if (input.className) {
            elementInfo.selectors.push(`.${input.className.split(' ').join('.')}`);
          }
          
          // Add generic selector as fallback
          elementInfo.selectors.push(`input:nth-child(${index + 1})`);
          
          interactiveElements.push(elementInfo);
        });
        
        // Get all button elements
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        buttons.forEach((button, index) => {
          const elementInfo = {
            type: 'button',
            tagName: button.tagName.toLowerCase(),
            index,
            attributes: {},
            text: button.textContent?.trim() || button.value || '',
            selectors: []
          };
          
          // Collect all attributes
          for (let attr of button.attributes) {
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          // Generate possible selectors
          if (button.getAttribute('data-testid')) {
            elementInfo.selectors.push(`[data-testid="${button.getAttribute('data-testid')}"]`);
          }
          if (button.id) {
            elementInfo.selectors.push(`#${button.id}`);
          }
          if (button.name) {
            elementInfo.selectors.push(`[name="${button.name}"]`);
          }
          if (button.className) {
            elementInfo.selectors.push(`.${button.className.split(' ').join('.')}`);
          }
          if (elementInfo.text) {
            elementInfo.selectors.push(`button:has-text("${elementInfo.text}")`);
          }
          
          // Add generic selector as fallback
          elementInfo.selectors.push(`button:nth-child(${index + 1})`);
          
          interactiveElements.push(elementInfo);
        });
        
        // Get all link elements
        const links = document.querySelectorAll('a[href]');
        links.forEach((link, index) => {
          const elementInfo = {
            type: 'link',
            tagName: 'a',
            index,
            attributes: {},
            text: link.textContent?.trim() || '',
            selectors: []
          };
          
          // Collect all attributes
          for (let attr of link.attributes) {
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          // Generate possible selectors
          if (link.getAttribute('data-testid')) {
            elementInfo.selectors.push(`[data-testid="${link.getAttribute('data-testid')}"]`);
          }
          if (link.id) {
            elementInfo.selectors.push(`#${link.id}`);
          }
          if (link.className) {
            elementInfo.selectors.push(`.${link.className.split(' ').join('.')}`);
          }
          if (elementInfo.text) {
            elementInfo.selectors.push(`a:has-text("${elementInfo.text}")`);
          }
          
          // Add generic selector as fallback
          elementInfo.selectors.push(`a:nth-child(${index + 1})`);
          
          interactiveElements.push(elementInfo);
        });
        
        return interactiveElements;
      });
      
      return elements;
    } catch (error) {
      console.warn('Element extraction failed:', error.message);
      return [];
    }
  }

  removeDuplicateElements(elements) {
    const seen = new Set();
    const unique = [];
    
    for (const element of elements) {
      // Create a unique key based on selectors and attributes
      const key = element.selectors.sort().join('|') + '|' + element.type + '|' + element.text;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(element);
      }
    }
    
    return unique;
  }

  async analyzeUserJourney(baseUrl, steps = [], options = {}) {
    try {
      // Always start fresh for user journey analysis
      await this.cleanup();
      await this.initialize();
      
      // Check if page is still valid
      if (!this.page || this.page.isClosed()) {
        console.log('DOMAnalyzer: Page is closed, reinitializing...');
        await this.cleanup();
        await this.initialize();
      }
      
      console.log(`Analyzing user journey starting from: ${baseUrl}`);
      console.log(`Steps to analyze: ${steps.length}`);
      
      const resolved = typeof options === 'number' ? { timeout: options } : options || {};
      const timeout = resolved.timeout || parseInt(process.env.PLAYWRIGHT_ANALYZER_TIMEOUT_MS || '15000', 10); // Reduced from 60000 to 15000
      const waitUntil = resolved.waitUntil || process.env.PLAYWRIGHT_NAV_WAIT_UNTIL || 'load';
      const retries = resolved.retries != null ? resolved.retries : parseInt(process.env.PLAYWRIGHT_ANALYZER_RETRIES || '1', 10); // Reduced from 2 to 1

      const allElements = [];
      const pageAnalysis = [];
      let currentUrl = baseUrl;

      // Start with the base URL
      await this.navigateToPage(currentUrl, timeout, waitUntil, retries);
      const initialElements = await this.extractElements();
      allElements.push(...initialElements);
      pageAnalysis.push({
        url: currentUrl,
        elements: initialElements,
        step: 'Initial page load'
      });

      // Follow each step and analyze the resulting pages (limit to first 5 steps to prevent timeout)
      const maxSteps = Math.min(steps.length, 5);
      for (let i = 0; i < maxSteps; i++) {
        const step = steps[i];
        console.log(`Analyzing step ${i + 1}: ${step.originalText || step.action}`);
        
        try {
          // Execute the step
          const newUrl = await this.executeStep(step, timeout);
          if (newUrl && newUrl !== currentUrl) {
            currentUrl = newUrl;
            console.log(`Step ${i + 1} navigated to: ${currentUrl}`);
            
            // Analyze the new page
            const stepElements = await this.extractElements();
            allElements.push(...stepElements);
            pageAnalysis.push({
              url: currentUrl,
              elements: stepElements,
              step: step.originalText || step.action,
              stepIndex: i + 1
            });
          }
        } catch (stepError) {
          console.warn(`Step ${i + 1} failed: ${stepError.message}`);
          // Continue with next step even if current step fails
        }
      }

      // Remove duplicate elements based on selector uniqueness
      const uniqueElements = this.removeDuplicateElements(allElements);
      
      console.log(`User journey analysis completed. Found ${uniqueElements.length} unique elements across ${pageAnalysis.length} pages`);
      
      return {
        url: baseUrl,
        timestamp: new Date().toISOString(),
        elements: uniqueElements,
        pageAnalysis: pageAnalysis,
        totalPages: pageAnalysis.length,
        totalElements: uniqueElements.length
      };
      
    } catch (error) {
      console.error('User journey analysis failed:', error);
      return {
        url: baseUrl,
        timestamp: new Date().toISOString(),
        elements: [],
        pageAnalysis: [],
        error: `User journey analysis failed: ${error.message}`
      };
    }
  }

  async analyzePage(url, options = {}) {
    try {
      await this.initialize();
      
      // Check if page is still valid
      if (!this.page || this.page.isClosed()) {
        console.log('DOMAnalyzer: Page is closed, reinitializing...');
        await this.initialize();
      }
      
      console.log(`Analyzing DOM structure for: ${url}`);
      // Backward compatibility: if a number was passed, treat as timeout
      const resolved = typeof options === 'number' ? { timeout: options } : options || {};
      const timeout = resolved.timeout || parseInt(process.env.PLAYWRIGHT_ANALYZER_TIMEOUT_MS || '60000', 10);
      const waitUntil = resolved.waitUntil || process.env.PLAYWRIGHT_NAV_WAIT_UNTIL || 'load';
      const retries = resolved.retries != null ? resolved.retries : parseInt(process.env.PLAYWRIGHT_ANALYZER_RETRIES || '2', 10);

      // Try navigation with retries and fallback waitUntil strategies
      const waitOrder = [waitUntil, 'load', 'domcontentloaded', 'networkidle'];
      let lastError = null;
      for (let attempt = 0; attempt <= retries; attempt++) {
        for (const wu of waitOrder) {
          try {
            console.log(`DOMAnalyzer: navigating (attempt ${attempt + 1}/${retries + 1}) waitUntil=${wu}, timeout=${timeout}ms`);
            await this.page.goto(url, { waitUntil: wu, timeout });
            // Basic readiness wait
            await this.page.waitForLoadState('domcontentloaded', { timeout: Math.min(timeout, 15000) }).catch(() => {});
            lastError = null;
            break;
          } catch (err) {
            lastError = err;
            console.warn(`DOMAnalyzer navigation failed with waitUntil=${wu}: ${err.message}`);
          }
        }
        if (!lastError) break; // success
      }

      if (lastError) {
        console.warn('DOMAnalyzer: navigation failed after retries, attempting HTML snapshot fallback...');
        try {
          await this.loadHtmlSnapshot(url, timeout);
        } catch (snapshotError) {
          console.warn('DOMAnalyzer: HTML snapshot also failed, continuing without DOM analysis');
          // Return a minimal analysis result instead of throwing
          return {
            elements: [],
            url: url,
            timestamp: new Date().toISOString(),
            error: 'DOM analysis failed - page navigation and HTML snapshot both failed'
          };
        }
      }
       
      // Wait for page to be fully loaded (best-effort)
      await this.page.waitForLoadState('domcontentloaded', { timeout: Math.min(timeout, 15000) }).catch(() => {});
      
      // Check if page is still valid before extracting elements
      if (!this.page || this.page.isClosed()) {
        console.warn('DOMAnalyzer: Page is closed before element extraction, returning minimal analysis');
        return {
          elements: [],
          url: url,
          timestamp: new Date().toISOString(),
          error: 'Page was closed before element extraction'
        };
      }
      
      // Extract all interactive elements with their attributes
      const elements = await this.page.evaluate(() => {
        const interactiveElements = [];
        
        // Get all input elements
        const inputs = document.querySelectorAll('input');
        inputs.forEach((input, index) => {
          const elementInfo = {
            type: 'input',
            tagName: input.tagName.toLowerCase(),
            index,
            attributes: {},
            text: input.value || input.placeholder || '',
            selectors: []
          };
          
          // Collect all attributes
          for (let attr of input.attributes) {
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          // Generate possible selectors in order of preference
          if (input.getAttribute('data-testid')) {
            elementInfo.selectors.push(`[data-testid="${input.getAttribute('data-testid')}"]`);
          }
          if (input.id) {
            elementInfo.selectors.push(`#${input.id}`);
          }
          if (input.name) {
            elementInfo.selectors.push(`[name="${input.name}"]`);
          }
          if (input.className) {
            elementInfo.selectors.push(`.${input.className.split(' ').join('.')}`);
          }
          if (input.type) {
            elementInfo.selectors.push(`input[type="${input.type}"]`);
          }
          if (input.placeholder) {
            elementInfo.selectors.push(`[placeholder="${input.placeholder}"]`);
          }
          
          // Add generic selector as fallback
          elementInfo.selectors.push(`input:nth-child(${index + 1})`);
          
          interactiveElements.push(elementInfo);
        });
        
        // Get all button elements
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
          const elementInfo = {
            type: 'button',
            tagName: button.tagName.toLowerCase(),
            index,
            attributes: {},
            text: button.textContent?.trim() || '',
            selectors: []
          };
          
          // Collect all attributes
          for (let attr of button.attributes) {
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          // Generate possible selectors
          if (button.getAttribute('data-testid')) {
            elementInfo.selectors.push(`[data-testid="${button.getAttribute('data-testid')}"]`);
          }
          if (button.id) {
            elementInfo.selectors.push(`#${button.id}`);
          }
          if (button.className) {
            elementInfo.selectors.push(`.${button.className.split(' ').join('.')}`);
          }
          if (button.type) {
            elementInfo.selectors.push(`button[type="${button.type}"]`);
          }
          if (button.textContent?.trim()) {
            elementInfo.selectors.push(`text=${button.textContent.trim()}`);
            elementInfo.selectors.push(`button:has-text("${button.textContent.trim()}")`);
          }
          
          // Add generic selector as fallback
          elementInfo.selectors.push(`button:nth-child(${index + 1})`);
          
          interactiveElements.push(elementInfo);
        });
        
        // Get all link elements
        const links = document.querySelectorAll('a');
        links.forEach((link, index) => {
          const elementInfo = {
            type: 'link',
            tagName: link.tagName.toLowerCase(),
            index,
            attributes: {},
            text: link.textContent?.trim() || '',
            selectors: []
          };
          
          // Collect all attributes
          for (let attr of link.attributes) {
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          // Generate possible selectors
          if (link.getAttribute('data-testid')) {
            elementInfo.selectors.push(`[data-testid="${link.getAttribute('data-testid')}"]`);
          }
          if (link.id) {
            elementInfo.selectors.push(`#${link.id}`);
          }
          if (link.className) {
            elementInfo.selectors.push(`.${link.className.split(' ').join('.')}`);
          }
          if (link.href) {
            elementInfo.selectors.push(`[href="${link.getAttribute('href')}"]`);
          }
          if (link.textContent?.trim()) {
            elementInfo.selectors.push(`text=${link.textContent.trim()}`);
            elementInfo.selectors.push(`a:has-text("${link.textContent.trim()}")`);
          }
          
          // Add generic selector as fallback
          elementInfo.selectors.push(`a:nth-child(${index + 1})`);
          
          interactiveElements.push(elementInfo);
        });
        
        // Get all select elements
        const selects = document.querySelectorAll('select');
        selects.forEach((select, index) => {
          const elementInfo = {
            type: 'select',
            tagName: select.tagName.toLowerCase(),
            index,
            attributes: {},
            text: '',
            selectors: []
          };
          
          // Collect all attributes
          for (let attr of select.attributes) {
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          // Generate possible selectors
          if (select.getAttribute('data-testid')) {
            elementInfo.selectors.push(`[data-testid="${select.getAttribute('data-testid')}"]`);
          }
          if (select.id) {
            elementInfo.selectors.push(`#${select.id}`);
          }
          if (select.name) {
            elementInfo.selectors.push(`[name="${select.name}"]`);
          }
          if (select.className) {
            elementInfo.selectors.push(`.${select.className.split(' ').join('.')}`);
          }
          
          // Add generic selector as fallback
          elementInfo.selectors.push(`select:nth-child(${index + 1})`);
          
          interactiveElements.push(elementInfo);
        });
        
        return interactiveElements;
      });
      
      console.log(`Found ${elements.length} interactive elements`);
      // Get page title if page is still valid
      let pageTitle = 'Unknown';
      try {
        if (this.page && !this.page.isClosed()) {
          pageTitle = await this.page.title();
        }
      } catch (titleError) {
        console.warn('Could not get page title:', titleError.message);
      }

      return {
        url,
        timestamp: new Date().toISOString(),
        elements,
        pageTitle
      };
      
    } catch (error) {
      console.error('DOM analysis failed:', error);
      // Return a minimal analysis result instead of throwing to prevent test generation failure
      return {
        elements: [],
        url: url,
        timestamp: new Date().toISOString(),
        error: `DOM analysis failed: ${error.message}`
      };
    }
  }

  async loadHtmlSnapshot(url, timeout) {
    try {
      // Check if page is still valid before using it
      if (!this.page || this.page.isClosed()) {
        console.log('DOMAnalyzer: Page is closed during HTML snapshot, reinitializing...');
        await this.initialize();
      }
      
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), Math.min(timeout, 15000));
      const res = await axios.get(url, { signal: controller.signal, timeout: Math.min(timeout, 15000) });
      clearTimeout(id);
      const html = res.data;
      // Load static HTML to extract basic elements
      await this.page.setContent(html, { waitUntil: 'domcontentloaded' });
      console.log('DOMAnalyzer: HTML snapshot loaded for basic extraction');
    } catch (e) {
      console.warn('DOMAnalyzer: HTML snapshot fallback failed:', e.message);
      throw e;
    }
  }

  findElementByPurpose(elements, purpose) {
    const purposeLower = purpose.toLowerCase();
    
    // Common mappings for different purposes
    const purposeMapping = {
      'username': ['username', 'user', 'email', 'login'],
      'password': ['password', 'pass', 'pwd'],
      'login': ['login', 'signin', 'submit', 'enter'],
      'search': ['search', 'find', 'query'],
      'submit': ['submit', 'send', 'save', 'confirm'],
      'cancel': ['cancel', 'close', 'back'],
      'directory': ['directory', 'dir', 'folder']
    };
    
    const keywords = purposeMapping[purposeLower] || [purposeLower];
    
    // Find elements that match the purpose
    const matches = elements.filter(element => {
      // Check attributes
      const nameMatch = element.attributes.name && keywords.some(keyword => 
        element.attributes.name.toLowerCase().includes(keyword)
      );
      const idMatch = element.attributes.id && keywords.some(keyword => 
        element.attributes.id.toLowerCase().includes(keyword)
      );
      const classMatch = element.attributes.class && keywords.some(keyword => 
        element.attributes.class.toLowerCase().includes(keyword)
      );
      const placeholderMatch = element.attributes.placeholder && keywords.some(keyword => 
        element.attributes.placeholder.toLowerCase().includes(keyword)
      );
      const textMatch = element.text && keywords.some(keyword => 
        element.text.toLowerCase().includes(keyword)
      );
      
      return nameMatch || idMatch || classMatch || placeholderMatch || textMatch;
    });
    
    return matches.length > 0 ? matches[0] : null;
  }

  generateSelectorRecommendations(elements, prompt) {
    const recommendations = {};
    
    // Parse common actions from prompt
    const actions = this.parseActionsFromPrompt(prompt);
    
    actions.forEach(action => {
      const element = this.findElementByPurpose(elements, action.target);
      if (element && element.selectors.length > 0) {
        recommendations[action.target] = {
          element,
          bestSelector: element.selectors[0],
          alternatives: element.selectors.slice(1, 5)
        };
      }
    });
 
    return recommendations;
  }

  parseActionsFromPrompt(prompt) {
    const actions = [];
    if (!prompt || typeof prompt !== 'string') return actions;
    
    const lower = prompt.toLowerCase();
    
    if (lower.includes('login') || lower.includes('sign in')) {
      actions.push({ action: 'type', target: 'username' });
      actions.push({ action: 'type', target: 'password' });
      actions.push({ action: 'click', target: 'login' });
    }
    
    if (lower.includes('search')) {
      actions.push({ action: 'type', target: 'search' });
      actions.push({ action: 'click', target: 'submit' });
    }
    
    return actions;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = DOMAnalyzer;