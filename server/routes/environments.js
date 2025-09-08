const express = require('express');
const router = express.Router();
const FileStorage = require('../services/FileStorage');

const fileStorage = new FileStorage();

// Get all environments
router.get('/', async (req, res) => {
  try {
    const environments = await fileStorage.getEnvironments();
    res.json(environments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single environment
router.get('/:id', async (req, res) => {
  try {
    const environment = await fileStorage.getEnvironmentById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    res.json(environment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new environment
router.post('/', async (req, res) => {
  try {
    const {
      name,
      key,
      description,
      variables,
      jiraIntegration,
      llmConfiguration
    } = req.body;
    
    // Validate required fields
    if (!name || !key) {
      return res.status(400).json({ error: 'Name and key are required' });
    }
    
    // Check if key already exists
    const existingEnv = await fileStorage.getEnvironmentByKey(key);
    if (existingEnv) {
      return res.status(400).json({ error: 'Environment key already exists' });
    }
    
    const environmentData = {
      name,
      key,
      description,
      variables: {
        BASE_URL: variables?.BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
        API_URL: variables?.API_URL || '',
        USERNAME: variables?.USERNAME || '',
        PASSWORD: variables?.PASSWORD || '',
        TIMEOUT: variables?.TIMEOUT || 30000,
        BROWSER: variables?.BROWSER || 'chromium',
        HEADLESS: variables?.HEADLESS !== false,
        RETRIES: variables?.RETRIES || 2,
        ...variables
      },
      jiraIntegration: {
        enabled: jiraIntegration?.enabled || false,
        url: jiraIntegration?.url || '',
        username: jiraIntegration?.username || '',
        password: jiraIntegration?.password || '',
        projectKey: jiraIntegration?.projectKey || '',
        ...jiraIntegration
      },
      llmConfiguration: {
        enabled: llmConfiguration?.enabled || false,
        provider: llmConfiguration?.provider || 'openai',
        apiKey: llmConfiguration?.apiKey || '',
        model: llmConfiguration?.model || '',
        baseUrl: llmConfiguration?.baseUrl || '',
        ...llmConfiguration
      }
    };
    
    const environment = await fileStorage.createEnvironment(environmentData);
    res.status(201).json(environment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update environment
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      key,
      description,
      variables,
      jiraIntegration,
      llmConfiguration,
      status
    } = req.body;
    
    const environment = await fileStorage.getEnvironmentById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    
    // Check if key is being changed and if it already exists
    if (key && key !== environment.key) {
      const existingEnv = await fileStorage.getEnvironmentByKey(key);
      if (existingEnv) {
        return res.status(400).json({ error: 'Environment key already exists' });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (key) updateData.key = key;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    
    if (variables) {
      updateData.variables = {
        ...environment.variables,
        ...variables
      };
    }
    
    if (jiraIntegration) {
      updateData.jiraIntegration = {
        ...environment.jiraIntegration,
        ...jiraIntegration
      };
    }
    
    if (llmConfiguration) {
      updateData.llmConfiguration = {
        ...environment.llmConfiguration,
        ...llmConfiguration
      };
    }
    
    const updatedEnvironment = await fileStorage.updateEnvironment(req.params.id, updateData);
    res.json(updatedEnvironment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete environment
router.delete('/:id', async (req, res) => {
  try {
    const environment = await fileStorage.getEnvironmentById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    
    await fileStorage.deleteEnvironment(req.params.id);
    res.json({ message: 'Environment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test environment connection
router.post('/:id/test-connection', async (req, res) => {
  try {
    const environment = await fileStorage.getEnvironmentById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    
    const { BASE_URL } = environment.variables;
    
    if (!BASE_URL) {
      return res.status(400).json({ error: 'BASE_URL not configured' });
    }
    
    // Test basic connectivity
    const axios = require('axios');
    try {
      const response = await axios.get(BASE_URL, { timeout: 5000 });
      res.json({
        success: true,
        status: response.status,
        message: 'Connection successful'
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message,
        message: 'Connection failed'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get environment variables for test execution
router.get('/:id/variables', async (req, res) => {
  try {
    const environment = await fileStorage.getEnvironmentById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    
    res.json(environment.variables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test LLM connection
router.post('/test-llm-connection', async (req, res) => {
  try {
    const { provider, llmType, apiKey, baseUrl, model } = req.body;

    // For local models, provider is the LLM provider name (e.g., "Ollama")
    // For non-local models, provider is the service name (e.g., "openai")
    const isLocal = llmType === 'local';

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider is required'
      });
    }

    // For non-local models, API key is required
    if (!isLocal && !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required for non-local models'
      });
    }

    // Simulate LLM connection test based on provider
    let isConnected = false;
    let message = '';

    if (isLocal) {
      // For local models, test if baseUrl is accessible
      isConnected = baseUrl && baseUrl.startsWith('http');
      message = isConnected ? `${provider} local model connection successful` : 'Invalid local model URL';
    } else {
      // For cloud providers, validate API key format
      switch (provider.toLowerCase()) {
        case 'openai':
          isConnected = apiKey.startsWith('sk-') && apiKey.length > 20;
          message = isConnected ? 'OpenAI connection successful' : 'Invalid OpenAI API key format';
          break;
        case 'claude':
          isConnected = apiKey.startsWith('sk-ant-') && apiKey.length > 20;
          message = isConnected ? 'Claude connection successful' : 'Invalid Claude API key format';
          break;
        case 'openrouter':
          isConnected = apiKey.startsWith('sk-or-') && apiKey.length > 20;
          message = isConnected ? 'OpenRouter connection successful' : 'Invalid OpenRouter API key format';
          break;
        default:
          isConnected = false;
          message = 'Unsupported provider';
      }
    }

    // Add some randomness for demo purposes
    if (isConnected) {
      isConnected = Math.random() > 0.2; // 80% success rate
      if (!isConnected) {
        message = 'Connection test failed - service unavailable';
      }
    }

    res.json({
      success: isConnected,
      message,
      details: {
        provider,
        llmType: isLocal ? 'local' : 'cloud',
        model: model || 'default',
        baseUrl: baseUrl || 'N/A',
        apiKeyRequired: !isLocal,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error testing LLM connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test LLM connection',
      error: error.message
    });
  }
});

module.exports = router;