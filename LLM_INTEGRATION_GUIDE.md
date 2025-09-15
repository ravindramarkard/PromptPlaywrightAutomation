# 🤖 LLM Integration for Code Generation

## Overview

The AI Test Generator now supports **real LLM integration** for intelligent code generation, in addition to the existing template-based approach. This allows users to leverage powerful language models like OpenAI GPT, Claude, or local models (Ollama, LM Studio) to generate more sophisticated and context-aware Playwright test code.

## 🏗️ Architecture

### Current Flow (Template-Based)
```
User Prompt → PromptParser → CodeGenerator → Playwright Test File
     ↓              ↓              ↓
"Click login" → {action: "click", target: "login"} → await page.click('login');
```

### Enhanced Flow (LLM-Powered)
```
User Prompt → PromptParser → LLMService → LLM Provider → Generated Code
     ↓              ↓            ↓            ↓              ↓
"Click login" → Parsed Steps → OpenAI/Claude → AI Response → await page.click('[data-testid="login-btn"]');
```

## 🔧 Components

### 1. LLMService (`server/services/LLMService.js`)
- **Purpose**: Handles communication with different LLM providers
- **Supported Providers**:
  - **OpenAI**: GPT-3.5-turbo, GPT-4
  - **Claude**: Claude-3-sonnet, Claude-3-haiku
  - **Local Models**: Ollama, LM Studio, vLLM

### 2. Enhanced CodeGenerator (`server/services/CodeGenerator.js`)
- **Purpose**: Orchestrates code generation with LLM fallback
- **Features**:
  - LLM-powered generation when enabled
  - Template-based fallback if LLM fails
  - Natural language conversion for LLM prompts

### 3. Environment Configuration
- **LLM Settings**: Provider, API key, model, base URL
- **Local Models**: Support for Ollama, LM Studio, vLLM
- **Test Connection**: Validate LLM configuration

## 🚀 Usage

### 1. Configure LLM Provider

#### For Cloud Providers (OpenAI/Claude):
```javascript
{
  "llmConfiguration": {
    "enabled": true,
    "provider": "openai", // or "claude"
    "apiKey": "sk-...",
    "model": "gpt-3.5-turbo",
    "baseUrl": "https://api.openai.com/v1"
  }
}
```

#### For Local Models (Ollama):
```javascript
{
  "llmConfiguration": {
    "enabled": true,
    "provider": "local",
    "llmProvider": "Ollama",
    "model": "llama2",
    "baseUrl": "http://localhost:11434",
    "apiKey": "" // Optional for local models
  }
}
```

### 2. Generate Code with LLM

#### Frontend (EnhancedAIGenerator):
```javascript
const response = await api.post('/code-generation/generate-playwright', {
  promptContent: "Login to the application and verify dashboard",
  testName: "Login Test",
  testType: "UI Test",
  environmentId: "env-123",
  useLLM: true, // Enable LLM generation
  options: {
    timeout: 30000,
    retries: 2
  }
});
```

#### Backend API:
```javascript
// POST /api/code-generation/generate-playwright
{
  "promptContent": "Login to the application",
  "testName": "Login Test",
  "environmentId": "env-123",
  "useLLM": true
}
```

## 📋 LLM Provider Configuration

### OpenAI Configuration
```javascript
const openaiConfig = {
  provider: "openai",
  apiKey: "sk-...",
  model: "gpt-3.5-turbo", // or "gpt-4"
  baseUrl: "https://api.openai.com/v1"
};
```

### Claude Configuration
```javascript
const claudeConfig = {
  provider: "claude",
  apiKey: "sk-ant-...",
  model: "claude-3-sonnet-20240229",
  baseUrl: "https://api.anthropic.com"
};
```

### Ollama (Local) Configuration
```javascript
const ollamaConfig = {
  provider: "local",
  llmProvider: "Ollama",
  model: "llama2", // or "codellama", "mistral"
  baseUrl: "http://localhost:11434",
  apiKey: "" // Optional
};
```

## 🎯 Code Generation Process

### 1. Prompt Processing
```javascript
// User input
"Login to the application, fill username and password, click submit button"

// Parsed by PromptParser
{
  parsedSteps: [
    { action: "navigate", target: "login page" },
    { action: "fill", target: "username", value: "user@example.com" },
    { action: "fill", target: "password", value: "password123" },
    { action: "click", target: "submit button" }
  ]
}
```

### 2. LLM Prompt Creation
```javascript
const systemPrompt = `You are an expert Playwright test automation engineer...`;
const userPrompt = `Generate a Playwright test for: "Login to the application, fill username and password, click submit button"`;
```

### 3. LLM Response Processing
```javascript
// LLM generates complete test file
const generatedCode = await llmClient.generate({
  systemPrompt,
  userPrompt,
  temperature: 0.1,
  maxTokens: 4000
});
```

### 4. Code Post-Processing
```javascript
// Clean and validate generated code
const finalCode = this.postProcessGeneratedCode(generatedCode, testName, testType);
```

## 🔄 Fallback Mechanism

If LLM generation fails, the system automatically falls back to template-based generation:

```javascript
try {
  // Try LLM generation
  return await this.generateWithLLM(parsedPrompt, environment, options);
} catch (error) {
  console.error('LLM generation failed, using templates:', error);
  // Fallback to template-based generation
  return this.buildSpecContent(config);
}
```

## 🧪 Testing LLM Connection

### Test Connection API
```javascript
// POST /api/environments/test-llm-connection
{
  "provider": "Ollama",
  "llmType": "local",
  "model": "llama2",
  "baseUrl": "http://localhost:11434"
}
```

### Response
```javascript
{
  "success": true,
  "message": "Ollama local model connection successful",
  "details": {
    "provider": "Ollama",
    "llmType": "local",
    "model": "llama2",
    "baseUrl": "http://localhost:11434",
    "apiKeyRequired": false,
    "timestamp": "2025-09-04T17:58:38.165Z"
  }
}
```

## 📊 Generated Code Examples

### Template-Based (Simple)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Test', () => {
  test('should execute test steps', async ({ page }) => {
    await page.goto('http://localhost:5050');
    await page.click('login');
    await page.fill('username', 'user@example.com');
    await page.fill('password', 'password123');
    await page.click('submit');
  });
});
```

### LLM-Generated (Advanced)
```typescript
import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Login Test', () => {
  test.beforeEach(async ({ page }) => {
    allure.epic('UI Test');
    allure.feature('User Authentication');
    allure.story('Login Flow');
    
    test.setTimeout(30000);
    const baseUrl = process.env.BASE_URL || 'http://localhost:5050';
    await page.goto(baseUrl);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="login-submit"]');
    
    // Verify successful login
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test.afterEach(async ({ page }) => {
    if (test.info().status === 'failed') {
      await page.screenshot({ 
        path: `test-results/screenshots/failure-${Date.now()}.png`,
        fullPage: true 
      });
    }
  });
});
```

## 🎛️ Frontend Integration

### Toggle LLM Generation
```jsx
<FormGroup>
  <ToggleContainer>
    <ToggleLabel>Use LLM for Code Generation</ToggleLabel>
    <ToggleButton
      enabled={formData.useLLM}
      onClick={() => setFormData(prev => ({ ...prev, useLLM: !prev.useLLM }))}
    >
      {formData.useLLM ? <FiToggleRight /> : <FiToggleLeft />}
    </ToggleButton>
  </ToggleContainer>
  <HelpText>
    Enable to use configured LLM provider for intelligent code generation
  </HelpText>
</FormGroup>
```

### Generation Method Indicator
```javascript
const generationMethod = response.data.metadata?.generatedWith || 'Template';
toast.success(`${generationMethod} test code generated successfully`);
```

## 🔧 Environment Setup

### 1. Install Dependencies
```bash
npm install axios  # Already installed
```

### 2. Configure Environment Variables
```bash
# .env
BASE_URL=http://localhost:5050
OPENAI_API_KEY=sk-... # Optional
ANTHROPIC_API_KEY=sk-ant-... # Optional
```

### 3. Start Local LLM (Ollama)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Start Ollama server
ollama serve
```

## 🚀 Benefits of LLM Integration

### 1. **Intelligent Code Generation**
- Context-aware test creation
- Better selector generation
- Sophisticated error handling

### 2. **Advanced Patterns**
- Page Object Model integration
- Data-driven test support
- Custom assertions and validations

### 3. **Flexibility**
- Support for multiple LLM providers
- Local model support for privacy
- Fallback to templates if needed

### 4. **Quality Improvements**
- More maintainable code
- Better test structure
- Enhanced readability

## 🔍 Monitoring and Debugging

### 1. Logs
```javascript
console.log('LLM code generation started');
console.log('Using provider:', actualProvider);
console.log('Generated with:', generationMethod);
```

### 2. Error Handling
```javascript
try {
  const code = await llmService.generateCode(prompt, environment, options);
} catch (error) {
  console.error('LLM generation failed:', error);
  // Automatic fallback to templates
}
```

### 3. Connection Testing
```javascript
const isConnected = await llmService.testConnection(provider, llmType, apiKey, model, baseUrl);
```

## 📈 Future Enhancements

1. **Model Fine-tuning**: Custom models for test generation
2. **Code Quality Metrics**: AI-powered code quality assessment
3. **Multi-model Support**: Ensemble generation from multiple LLMs
4. **Real-time Learning**: Improve generation based on user feedback
5. **Custom Templates**: User-defined generation templates

---

This LLM integration provides a powerful, flexible foundation for intelligent test code generation while maintaining backward compatibility with the existing template-based approach.
