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

  async analyzePage(url, options = {}) {
    try {
      await this.initialize();
      
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
        await this.loadHtmlSnapshot(url, timeout);
      }
       
      // Wait for page to be fully loaded (best-effort)
      await this.page.waitForLoadState('domcontentloaded', { timeout: Math.min(timeout, 15000) }).catch(() => {});
      
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
      return {
        url,
        timestamp: new Date().toISOString(),
        elements,
        pageTitle: await this.page.title()
      };
      
    } catch (error) {
      console.error('DOM analysis failed:', error);
      throw new Error(`Failed to analyze DOM: ${error.message}`);
    }
  }

  async loadHtmlSnapshot(url, timeout) {
    try {
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