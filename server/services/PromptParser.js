class PromptParser {
  constructor() {
    this.actionPatterns = {
      navigate: /navigate to|go to|visit|open/i,
      click: /click|press|tap|select/i,
      fill: /fill|enter|type|input|set/i,
      assert: /assert|verify|check|validate|expect|should/i,
      wait: /wait|pause|sleep/i,
      hover: /hover|mouse over/i,
      scroll: /scroll|move down|move up/i,
      select: /select|choose|pick/i,
      upload: /upload|attach|browse/i,
      download: /download|save/i
    };
    
    this.uiElements = {
      button: /button|btn|submit|login|logout|save|cancel|ok|yes|no/i,
      input: /input|field|textbox|text field|username|password|email|search/i,
      link: /link|anchor|href/i,
      dropdown: /dropdown|select|combo|list/i,
      checkbox: /checkbox|check|tick/i,
      radio: /radio|option/i,
      image: /image|img|picture|photo/i,
      text: /text|label|heading|title|paragraph/i,
      table: /table|grid|list|rows|columns/i,
      modal: /modal|dialog|popup|overlay/i
    };
  }

  parsePrompt(promptText) {
    const steps = [];
    const lines = promptText.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const step = this.parseStep(line, i + 1);
      if (step) {
        steps.push(step);
      }
    }
    
    return {
      originalPrompt: promptText,
      parsedSteps: steps,
      totalSteps: steps.length,
      hasUI: this.detectUIElements(promptText),
      hasAPI: this.detectAPICalls(promptText)
    };
  }

  parseStep(line, stepNumber) {
    const step = {
      stepNumber,
      originalText: line,
      action: this.extractAction(line),
      target: this.extractTarget(line),
      value: this.extractValue(line),
      assertion: this.extractAssertion(line),
      waitTime: this.extractWaitTime(line)
    };
    
    return step;
  }

  extractAction(line) {
    for (const [action, pattern] of Object.entries(this.actionPatterns)) {
      if (pattern.test(line)) {
        return action;
      }
    }
    return 'unknown';
  }

  extractTarget(line) {
    // Extract UI element references
    for (const [element, pattern] of Object.entries(this.uiElements)) {
      if (pattern.test(line)) {
        return this.extractElementSelector(line, element);
      }
    }
    
    // Extract URLs
    const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Extract quoted text (likely selectors)
    const quotedMatch = line.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      return quotedMatch[1];
    }
    
    return this.extractGenericTarget(line);
  }

  extractElementSelector(line, elementType) {
    // Try to extract specific selectors
    const selectors = [
      /id[:\s]+([a-zA-Z0-9_-]+)/i,
      /class[:\s]+([a-zA-Z0-9_-]+)/i,
      /data-testid[:\s]+([a-zA-Z0-9_-]+)/i,
      /aria-label[:\s]+["']([^"']+)["']/i,
      /text[:\s]+["']([^"']+)["']/i
    ];
    
    for (const selector of selectors) {
      const match = line.match(selector);
      if (match) {
        return `[data-testid="${match[1]}"]`; // Default to data-testid
      }
    }
    
    // Fallback to element type
    return elementType;
  }

  extractGenericTarget(line) {
    // Extract words that might be element identifiers
    const words = line.split(/\s+/);
    const targetWords = words.filter(word => 
      word.length > 2 && 
      !this.actionPatterns.navigate.test(word) &&
      !this.actionPatterns.click.test(word) &&
      !this.actionPatterns.fill.test(word) &&
      !this.actionPatterns.assert.test(word)
    );
    
    return targetWords.join(' ');
  }

  extractValue(line) {
    // Extract values for fill actions
    const valuePatterns = [
      /with\s+["']([^"']+)["']/i,
      /as\s+["']([^"']+)["']/i,
      /value[:\s]+["']([^"']+)["']/i,
      /enter\s+["']([^"']+)["']/i
    ];
    
    for (const pattern of valuePatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  extractAssertion(line) {
    if (this.actionPatterns.assert.test(line)) {
      // Extract what to assert
      const assertionPatterns = [
        /should\s+(?:be|contain|have|exist|visible|enabled|disabled)/i,
        /verify\s+(.+)/i,
        /check\s+(.+)/i,
        /validate\s+(.+)/i,
        /expect\s+(.+)/i
      ];
      
      for (const pattern of assertionPatterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1] || match[0];
        }
      }
    }
    
    return null;
  }

  extractWaitTime(line) {
    const waitMatch = line.match(/wait\s+(\d+)\s*(?:seconds?|secs?|s)?/i);
    if (waitMatch) {
      return parseInt(waitMatch[1]) * 1000; // Convert to milliseconds
    }
    return null;
  }

  detectUIElements(promptText) {
    return Object.values(this.uiElements).some(pattern => pattern.test(promptText));
  }

  detectAPICalls(promptText) {
    const apiPatterns = [
      /GET|POST|PUT|DELETE|PATCH/i,
      /api|endpoint|request|response/i,
      /http|https/i,
      /json|xml|data/i
    ];
    
    return apiPatterns.some(pattern => pattern.test(promptText));
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
}

module.exports = PromptParser;
