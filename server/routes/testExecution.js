const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const FileStorage = require('../services/FileStorage');
const TestExecutor = require('../services/TestExecutor');
const TestSuiteExecutor = require('../services/TestSuiteExecutor');
const ApiTestExecutor = require('../services/ApiTestExecutor');

const fileStorage = new FileStorage();
const testExecutor = new TestExecutor();
const testSuiteExecutor = new TestSuiteExecutor();
const apiTestExecutor = new ApiTestExecutor();

// Run a test with configuration
router.post('/run', async (req, res) => {
  try {
    const {
      testId,
      promptId,
      environment,
      environmentConfig,
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
      
      // Check if this is a new format ID (from /api/test-files)
      if (testId.startsWith('api-') || testId.startsWith('ui-')) {
        console.log('Detected new format ID, searching in generated tests directory');
        
        const testsDir = path.join(__dirname, '../tests/generated');
        const apiTestsPattern = path.join(testsDir, 'api-tests', '**/*.spec.ts');
        const uiTestsPattern = path.join(testsDir, '**/*.spec.ts');
        const projectsTestsPattern = path.join(__dirname, '../../tests/projects/**/*.spec.ts');
        
        console.log('Tests directory:', testsDir);
        console.log('API tests pattern:', apiTestsPattern);
        console.log('Directory exists:', require('fs').existsSync(testsDir));
        console.log('API tests dir exists:', require('fs').existsSync(path.join(testsDir, 'api-tests')));
        
        // List files in the directory
        try {
          const fs = require('fs');
          const apiTestsDir = path.join(testsDir, 'api-tests');
          const files = fs.readdirSync(apiTestsDir);
          console.log('Files in api-tests directory:', files);
        } catch (error) {
          console.log('Error reading api-tests directory:', error.message);
        }

        const apiFiles = glob.sync(apiTestsPattern);
        const uiFiles = glob.sync(uiTestsPattern).filter(file => !file.includes('api-tests'));
        const projectFiles = glob.sync(projectsTestsPattern);
        
        console.log('API files found:', apiFiles.length);
        console.log('UI files found:', uiFiles.length);
        console.log('Project files found:', projectFiles.length);
        
        const allFiles = [
          ...apiFiles,
          ...uiFiles,
          ...projectFiles
        ];

        console.log(`Found ${allFiles.length} files in generated tests directory`);
        console.log('API tests pattern:', apiTestsPattern);
        console.log('UI tests pattern:', uiTestsPattern);
        console.log('Projects tests pattern:', projectsTestsPattern);

        for (const filePath of allFiles) {
          const fileName = path.basename(filePath, '.spec.ts');
          const testIdFromFile = filePath.includes('api-tests') ? `api-${fileName}` : `ui-${fileName}`;
          
          console.log(`Checking file: ${filePath}`);
          console.log(`  - fileName: ${fileName}`);
          console.log(`  - testIdFromFile: ${testIdFromFile}`);
          console.log(`  - looking for: ${testId}`);
          
          if (testIdFromFile === testId) {
            testFilePath = filePath;
            console.log(`Matched new format test file: ${testFilePath}`);
            break;
          }
        }
      } else {
        // Old format ID - search in the original way
        console.log('Detected old format ID, searching in all tests directory');
        
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
            console.log(`Matched old format test file: ${testFilePath}`);
            break;
          }
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
        
        // Set environment variables for local browsers and test execution
        const env = { 
          ...process.env, 
          PLAYWRIGHT_BROWSERS_PATH: './node_modules/playwright-core/.local-browsers'
        };
        
        // If test was generated from a prompt with baseUrl, explicitly unset BASE_URL
        if (prompt && prompt.baseUrl) {
          console.log('Unsetting BASE_URL environment variable to preserve prompt baseUrl');
          delete env.BASE_URL;
        }
        
        // Add environment variables from selected environment
        if (environmentConfig && environmentConfig.variables) {
          const envVars = environmentConfig.variables;
          
          
          // Check if this test was generated from a prompt with a specific baseUrl
          if (prompt && prompt.baseUrl) {
            console.log('Test was generated from prompt with baseUrl:', prompt.baseUrl);
            console.log('Not setting BASE_URL environment variable to preserve prompt-specific baseUrl');
            // Don't set BASE_URL - let the test use its own logic (process.env.BASE_URL || 'prompt-baseUrl')
          } else {
            // For tests not generated from prompts, use environment BASE_URL
            if (envVars.BASE_URL) {
              env.BASE_URL = envVars.BASE_URL;
              console.log('Setting BASE_URL from environment:', envVars.BASE_URL);
            }
          }
          
          // Always set other environment variables
          if (envVars.API_URL) env.API_URL = envVars.API_URL;
          if (envVars.USERNAME) env.USERNAME = envVars.USERNAME;
          if (envVars.PASSWORD) env.PASSWORD = envVars.PASSWORD;
          if (envVars.TIMEOUT) env.TIMEOUT = envVars.TIMEOUT;
          if (envVars.BROWSER) env.BROWSER = envVars.BROWSER;
          if (envVars.HEADLESS) env.HEADLESS = envVars.HEADLESS;
          if (envVars.RETRIES) env.RETRIES = envVars.RETRIES;
          
          console.log('Environment variables from selected environment:');
          console.log('BASE_URL:', env.BASE_URL || 'Not set (preserving prompt baseUrl)');
          console.log('USERNAME:', env.USERNAME);
          console.log('PASSWORD:', env.PASSWORD ? '[REDACTED]' : 'Not set');
        }
        
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

// Run a test suite with configuration
router.post('/run-suite', async (req, res) => {
  try {
    const {
      testSuiteId,
      executionMode = 'sequential',
      workers = 1,
      useGlobalLogin = false,
      environment = 'test',
      environmentConfig: requestEnvironmentConfig,
      browser = 'chromium',
      headless = true,
      tags = [],
      parallel = false
    } = req.body;

    // Validate required fields
    if (!testSuiteId) {
      return res.status(400).json({
        success: false,
        message: 'Test Suite ID is required'
      });
    }

    // Get test suite from storage
    const testSuites = fileStorage.getTestSuites();
    const testSuite = testSuites.find(ts => ts.id === testSuiteId);

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        message: 'Test Suite not found'
      });
    }

    // Load environment variables from environment setup
    let environmentConfig = null;
    
    // Use environment config from request if provided, otherwise load from storage
    if (requestEnvironmentConfig) {
      environmentConfig = requestEnvironmentConfig;
      console.log('Using environment config from request:', environmentConfig.name);
    } else {
      try {
        const environments = fileStorage.getEnvironments();
        environmentConfig = environments.find(env => env.name === environment || env.id === environment);
        if (!environmentConfig) {
          console.log(`Environment '${environment}' not found, using default values`);
        }
      } catch (error) {
        console.log('Error loading environment config:', error.message);
      }
    }

    // Create execution configuration
    const executionConfig = {
      executionMode,
      workers,
      useGlobalLogin,
      environment,
      browser,
      headless,
      tags,
      parallel
    };

    console.log(`🚀 Starting test suite execution: ${testSuite.name || testSuite.suiteName}`);
    console.log(`📋 Configuration:`, executionConfig);

    // Generate execution ID immediately
    const executionId = `execution_${Date.now()}`;
    
    // Start execution asynchronously (don't await)
    testSuiteExecutor.executeTestSuite(testSuite, executionConfig, environmentConfig, executionId)
      .then(result => {
        console.log(`✅ Test suite execution completed: ${executionId}`, result.success ? 'SUCCESS' : 'FAILED');
      })
      .catch(error => {
        console.error(`❌ Test suite execution failed: ${executionId}`, error);
      });

    // Return immediately with execution ID
    res.json({
      success: true,
      message: 'Test suite execution started successfully',
      executionId: executionId,
      testSuite: {
        id: testSuite.id,
        name: testSuite.name || testSuite.suiteName,
        testType: testSuite.testType,
        totalTests: testSuite.totalTests || testSuite.testCases?.length || testSuite.selectedTestCases?.length || 0
      },
      config: executionConfig
    });

  } catch (error) {
    console.error('Error starting test suite execution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start test suite execution',
      error: error.message
    });
  }
});

// Get test suite execution status
router.get('/suite-status/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const status = await testSuiteExecutor.getExecutionStatus(executionId);
    
    res.json({
      success: true,
      executionId,
      status
    });
  } catch (error) {
    console.error('Error getting test suite execution status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test suite execution status',
      error: error.message
    });
  }
});

// List all test suite executions
router.get('/suite-executions', async (req, res) => {
  try {
    const executions = await testSuiteExecutor.listExecutions();
    
    res.json({
      success: true,
      executions
    });
  } catch (error) {
    console.error('Error listing test suite executions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list test suite executions',
      error: error.message
    });
  }
});

// Get test suite execution details
router.get('/suite-details/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const details = await testSuiteExecutor.getExecutionDetails(executionId);
    
    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'Execution not found'
      });
    }

    res.json({
      success: true,
      details
    });
  } catch (error) {
    console.error('Error getting test suite execution details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test suite execution details',
      error: error.message
    });
  }
});

// Check if session exists
router.get('/check-session', async (req, res) => {
  try {
    const fs = require('fs-extra');
    const path = require('path');
    
    const sessionPath = path.join(__dirname, '../../storageState.json');
    const exists = await fs.pathExists(sessionPath);
    
    res.json({
      success: true,
      exists: exists,
      sessionPath: exists ? sessionPath : null
    });
  } catch (error) {
    console.error('Error checking session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check session',
      error: error.message
    });
  }
});

// Run API test
router.post('/run-api', async (req, res) => {
  try {
    const {
      testFile,
      environment,
      environmentConfig,
      timeout = 30000,
      retries = 1
    } = req.body;

    // Validate required fields
    if (!testFile) {
      return res.status(400).json({
        success: false,
        message: 'Test file path is required'
      });
    }

    console.log(`🚀 API Test Execution Request:`, {
      testFile,
      environment,
      environmentConfig,
      timeout,
      retries
    });

    // Default execution config
    const executionConfig = {
      environment: environment || 'test',
      timeout: parseInt(timeout),
      retries: parseInt(retries),
      tags: []
    };

    // Execute the API test
    const result = await apiTestExecutor.executeApiTest(
      testFile, 
      executionConfig, 
      environmentConfig
    );

    res.json({
      success: result.success,
      executionId: result.executionId,
      exitCode: result.exitCode,
      message: result.success ? 'API test executed successfully' : 'API test execution failed',
      executionDir: result.executionDir,
      stdout: result.stdout,
      stderr: result.stderr
    });

  } catch (error) {
    console.error('❌ API test execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute API test',
      error: error.message
    });
  }
});

module.exports = router;
