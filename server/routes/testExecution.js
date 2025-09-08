const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const FileStorage = require('../services/FileStorage');
const TestExecutor = require('../services/TestExecutor');

const fileStorage = new FileStorage();
const testExecutor = new TestExecutor();

// Run a test with configuration
router.post('/run', async (req, res) => {
  try {
    const {
      testId,
      promptId,
      environment,
      browser,
      headless,
      retries,
      timeout
    } = req.body;

    // Validate required fields
    if (!testId) {
      return res.status(400).json({
        success: false,
        message: 'Test ID is required'
      });
    }

    // Get the prompt if promptId is provided
    let prompt = null;
    let test = null;
    
    if (promptId) {
      prompt = await fileStorage.getPromptById(promptId);
      if (prompt) {
        test = prompt.generatedTests.find(t => t.testId === testId);
      }
    }

    // If no test found in prompt, create a basic test
    if (!test) {
      test = {
        testId,
        testName: 'Browser Test',
        testCode: '// Basic browser test',
        specContent: '// Basic browser test'
      };
    }

    // Set default testType if not available
    const testType = prompt?.testType || 'UI Test';

    // Create test execution record
    const executionId = uuidv4();
    const testExecution = {
      executionId,
      testId,
      promptId: promptId || null,
      testName: test.testName,
      testType: testType,
      environment,
      browser,
      headless: headless || false,
      retries: retries || 0,
      timeout: timeout || 30000,
      status: 'running',
      startedAt: new Date().toISOString(),
      results: null,
      logs: []
    };

    // Store test execution in file storage
    await fileStorage.createTestResult({
      _id: executionId,
      ...testExecution
    });

    // Find the test file first (synchronously)
    let testFilePath = null;
    const fs = require('fs-extra');
    const path = require('path');
    const glob = require('glob');
    
    try {
      console.log(`Looking for testId: ${testId}`);
      
      const pattern = path.join(__dirname, '../../tests/**/*.spec.ts');
      const testFiles = await new Promise((resolve, reject) => {
        glob(pattern, (err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
      
      console.log(`Found ${testFiles.length} test files`);
      
      for (const testPath of testFiles) {
        const testName = path.basename(testPath, '.spec.ts');
        
        // Parse the path to extract metadata
        const pathParts = testPath.split(path.sep);
        const testsIndex = pathParts.indexOf('tests');
        const relativePath = pathParts.slice(testsIndex + 1);
        
        let project = 'unknown';
        let model = 'unknown';
        let modelName = 'unknown';
        let promptId = 'unknown';
        
        if (relativePath.length >= 1) project = relativePath[0];
        if (relativePath.length >= 2) model = relativePath[1];
        if (relativePath.length >= 3) modelName = relativePath[2];
        if (relativePath.length >= 4) promptId = relativePath[3];
        
        const id = `${project}-${model}-${modelName}-${promptId}-${testName}`;
        console.log(`Found test: ${id} at ${testPath}`);
        
        if (id === testId) {
          testFilePath = testPath;
          console.log(`Matched test file: ${testFilePath}`);
          break;
        }
      }
    } catch (error) {
      console.error('Error finding test file:', error);
    }
    
    if (!testFilePath) {
      return res.status(404).json({
        success: false,
        message: 'Test file not found',
        testId: testId
      });
    }
    
    // Execute the test using real Playwright
    (async () => {
      try {
        console.log(`Starting real test execution for: ${test.testName}`);
        console.log(`Using test file: ${testFilePath}`);
        
        console.log(`Executing test file: ${testFilePath}`);
        
        // Execute the test using Playwright directly
        const { spawn } = require('child_process');
        const path = require('path');
        
        // Get the relative path for Playwright from project root
        const projectRoot = path.join(__dirname, '../..');
        const relativePath = path.relative(projectRoot, testFilePath);
        console.log(`Project root: ${projectRoot}`);
        console.log(`Relative path: ${relativePath}`);
        
        // Build Playwright command
        const playwrightArgs = ['playwright', 'test', relativePath];
        if (browser && browser !== 'chromium') {
          playwrightArgs.push('--project', browser);
        }
        if (headless) {
          playwrightArgs.push('--headed=false');
        } else {
          playwrightArgs.push('--headed');
        }
        if (timeout) {
          playwrightArgs.push('--timeout', timeout.toString());
        }
        
        const command = `npx ${playwrightArgs.join(' ')}`;
        console.log(`Running command: ${command}`);
        
        // Set environment variable for local browsers
        const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: './playwright-browsers' };
        console.log('Setting PLAYWRIGHT_BROWSERS_PATH to:', env.PLAYWRIGHT_BROWSERS_PATH);
        
        // Execute Playwright test from the project root
        const playwrightProcess = spawn('npx', playwrightArgs, {
          cwd: projectRoot, // Run from project root
          stdio: ['pipe', 'pipe', 'pipe'],
          env: env
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
        
        playwrightProcess.on('close', async (code) => {
          console.log(`Test execution completed with code: ${code}`);
          
          // Update test execution with results
          const executionResult = {
            success: code === 0,
            status: code === 0 ? 'passed' : 'failed',
            completedAt: new Date().toISOString(),
            output: testOutput,
            error: testError,
            exitCode: code
          };
          
          await fileStorage.updateTestResult(executionId, {
            status: executionResult.status,
            completedAt: executionResult.completedAt,
            results: executionResult,
            logs: testOutput.split('\n').filter(line => line.trim())
          });
        });
        
        // Response already sent above, don't send again
        
      } catch (error) {
        console.error('Error executing test:', error);
        
        // Update test execution with error
        await fileStorage.updateTestResult(executionId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          results: {
            success: false,
            error: error.message,
            status: 'failed'
          }
        });
      }
    })();
    
    // Return immediately
    res.json({
      success: true,
      message: 'Test execution started',
      executionId,
      testId,
      testName: test.testName,
      status: 'running',
      command: `npx playwright test ${testFilePath} --headed --timeout 30000`
    });

  } catch (error) {
    console.error('Error starting test execution:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to start test execution',
      error: error.message,
      stack: error.stack
    });
  }
});

// Get test execution status
router.get('/status/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const result = await fileStorage.getTestResultById(executionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Test execution not found'
      });
    }

    res.json({
      success: true,
      execution: result
    });
  } catch (error) {
    console.error('Error getting test execution status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test execution status',
      error: error.message
    });
  }
});

// Get all test executions
router.get('/executions', async (req, res) => {
  try {
    const results = await fileStorage.getTestResults();
    res.json({
      success: true,
      executions: results
    });
  } catch (error) {
    console.error('Error getting test executions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test executions',
      error: error.message
    });
  }
});

module.exports = router;
