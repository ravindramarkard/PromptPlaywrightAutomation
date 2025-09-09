const express = require('express');
const router = express.Router();
const FileStorage = require('../services/FileStorage');
const PromptParser = require('../services/PromptParser');
const CodeGenerator = require('../services/CodeGenerator');
const { v4: uuidv4 } = require('uuid');

const fileStorage = new FileStorage();
const promptParser = new PromptParser();
const codeGenerator = new CodeGenerator();

// Get all prompts
router.get('/', async (req, res) => {
  try {
    const { projectId, modelId, page = 1, limit = 10, search } = req.query;
    
    const result = await fileStorage.getPrompts({
      projectId,
      modelId,
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single prompt
router.get('/:id', async (req, res) => {
  try {
    const prompt = await fileStorage.getPromptById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new prompt
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      promptContent,
      testType,
      tags,
      additionalContext,
      baseUrl,
      additionalInformation,
      projectId,
      modelId,
      modelName
    } = req.body;
    
    // Generate unique prompt ID
    const promptId = uuidv4();
    
    // Parse the prompt content
    const parsedPrompt = promptParser.parsePrompt(promptContent);
    
    const promptData = {
      title,
      description,
      promptContent,
      testType,
      tags: tags && typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : (Array.isArray(tags) ? tags : []),
      additionalContext,
      baseUrl,
      additionalInformation,
      projectId: projectId || 'default-project',
      modelId: modelId || 'default-model',
      modelName: modelName || 'Default Model',
      promptId,
      status: 'draft',
      generatedTests: [],
      metadata: {
        parsedSteps: parsedPrompt.parsedSteps,
        timestamp: new Date().toISOString()
      }
    };
    
    const prompt = await fileStorage.createPrompt(promptData);
    res.status(201).json(prompt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update prompt
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      promptContent,
      testType,
      tags,
      additionalContext,
      baseUrl,
      additionalInformation,
      generatedTests
    } = req.body;
    
    const prompt = await fileStorage.getPromptById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // Re-parse if prompt content changed
    let parsedPrompt = null;
    if (promptContent && promptContent !== prompt.promptContent) {
      parsedPrompt = promptParser.parsePrompt(promptContent);
    }
    
    const updateData = {
      title: title || prompt.title,
      description: description || prompt.description,
      promptContent: promptContent || prompt.promptContent,
      testType: testType || prompt.testType,
      tags: tags && typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : (Array.isArray(tags) ? tags : prompt.tags),
      additionalContext: additionalContext || prompt.additionalContext,
      baseUrl: baseUrl || prompt.baseUrl,
      additionalInformation: additionalInformation || prompt.additionalInformation
    };
    
    // Handle generatedTests update
    if (generatedTests !== undefined) {
      updateData.generatedTests = generatedTests;
    }
    
    if (parsedPrompt) {
      updateData.metadata = {
        ...prompt.metadata,
        parsedSteps: parsedPrompt.parsedSteps,
        timestamp: new Date().toISOString()
      };
    }
    
    const updatedPrompt = await fileStorage.updatePrompt(req.params.id, updateData);
    res.json(updatedPrompt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete prompt
router.delete('/:id', async (req, res) => {
  try {
    const prompt = await fileStorage.getPromptById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    await fileStorage.deletePrompt(req.params.id);
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate test code from prompt
router.post('/:id/generate-test', async (req, res) => {
  try {
    const { environmentId, testName, options = {} } = req.body;
    
    const prompt = await fileStorage.getPromptById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // Get environment if specified
    let environment = null;
    if (environmentId) {
      environment = await fileStorage.getEnvironmentById(environmentId);
    }
    
    // Generate the test code
    const testCode = await codeGenerator.generatePlaywrightSpec(
      {
        parsedSteps: prompt.metadata.parsedSteps,
        hasUI: prompt.metadata.parsedSteps.some(step => 
          ['navigate', 'click', 'fill', 'hover', 'scroll'].includes(step.action)
        ),
        hasAPI: prompt.metadata.parsedSteps.some(step => 
          step.originalText && ['api', 'request', 'response'].some(keyword => 
            step.originalText.toLowerCase().includes(keyword)
          )
        )
      },
      environment,
      {
        testName: testName || prompt.title,
        testType: prompt.testType,
        baseUrl: prompt.baseUrl || process.env.BASE_URL,
        tags: prompt.tags || [],
        ...options
      }
    );
    
    // Generate file path
    const filePath = codeGenerator.generateFilePath(
      prompt.projectId,
      prompt.modelId,
      prompt.modelName,
      prompt.promptId,
      testName || prompt.title || 'Generated Test'
    );
    
    // Save test file
    const savedPath = await codeGenerator.saveTestFile(testCode, filePath);
    
    // Update prompt with generated test info
    const testId = uuidv4();
    const newTest = {
      testId,
      testName: testName || prompt.title,
      filePath: savedPath,
      createdAt: new Date().toISOString()
    };
    
    prompt.generatedTests.push(newTest);
    await fileStorage.updatePrompt(req.params.id, { generatedTests: prompt.generatedTests });
    
    res.json({
      testCode,
      filePath: savedPath,
      testId,
      message: 'Test generated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Parse prompt without saving
router.post('/parse', async (req, res) => {
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

// Get spec content for a test
router.get('/:promptId/tests/:testId/spec', async (req, res) => {
  try {
    const { promptId, testId } = req.params;
    
    const prompt = await fileStorage.getPromptById(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // Find the specific test
    const test = prompt.generatedTests.find(t => t.testId === testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Read the spec file content
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const specContent = await fs.readFile(test.filePath, 'utf8');
      res.json({
        specContent,
        testInfo: {
          testId: test.testId,
          testName: test.testName,
          filePath: test.filePath,
          createdAt: test.createdAt
        }
      });
    } catch (fileError) {
      console.error('Error reading spec file:', fileError);
      res.status(404).json({ error: 'Spec file not found or could not be read' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
