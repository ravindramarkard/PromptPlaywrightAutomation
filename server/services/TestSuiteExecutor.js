const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class TestSuiteExecutor {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.resultsDir = path.join(this.projectRoot, 'test-results');
    this.allureResultsDir = path.join(this.projectRoot, 'allure-results');
    this.testSuitesDir = path.join(this.projectRoot, 'tests', 'TestSuites');
  }

  async executeTestSuite(testSuite, executionConfig, environmentConfig = null, providedExecutionId = null) {
    const {
      executionMode = 'sequential',
      workers = 1,
      useGlobalLogin = false,
      environment = 'test',
      browser = 'chromium',
      headless = true,
      tags = [],
      parallel = false
    } = executionConfig;

    console.log(`🚀 Starting test suite execution: ${testSuite.name || testSuite.suiteName}`);
    console.log(`📋 Execution mode: ${executionMode}`);
    console.log(`👥 Workers: ${workers}`);
    console.log(`🔐 Global login: ${useGlobalLogin ? 'enabled' : 'disabled'}`);

    try {
      // Ensure results directory exists
      await fs.ensureDir(this.resultsDir);
      await fs.ensureDir(this.allureResultsDir);

      // Use provided execution ID or generate one
      const executionId = providedExecutionId || `execution_${Date.now()}`;
      const executionDir = path.join(this.resultsDir, executionId);
      await fs.ensureDir(executionDir);

      // Write initial status
      await this.writeExecutionStatus(executionId, {
        status: 'running',
        startedAt: new Date().toISOString(),
        testSuite: testSuite.name || testSuite.suiteName,
        totalTests: 0,
        completedTests: 0,
        currentTest: 'Preparing execution...'
      });

      // Prepare test files
      console.log(`🔍 Preparing test files for test suite: ${testSuite.name}`);
      const testFiles = await this.prepareTestFiles(testSuite, executionDir);
      console.log(`📁 Prepared ${testFiles.length} test files:`, testFiles);
      
      if (testFiles.length === 0) {
        const testCases = testSuite.testCases || testSuite.selectedTestCases || [];
        const missingFiles = testCases.map(tc => tc.filePath || `${tc.id}.spec.ts`).join(', ');
        const errorMsg = `No valid test files found for execution. Test suite has ${testCases.length} test cases but none of the files exist. Missing files: ${missingFiles}`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`📁 Found ${testFiles.length} test files to execute`);

      // Update status with test file count
      await this.writeExecutionStatus(executionId, {
        status: 'running',
        startedAt: new Date().toISOString(),
        testSuite: testSuite.name || testSuite.suiteName,
        totalTests: testFiles.length,
        completedTests: 0,
        currentTest: 'Starting test execution...'
      });

      // Set environment variables from environment configuration
      // Handle both formats: {variables: {...}} and direct {...}
      const envVars = environmentConfig?.variables || environmentConfig || {};
      
      console.log('🔧 Environment config received:', JSON.stringify(environmentConfig, null, 2));
      console.log('🔧 Environment variables extracted:', JSON.stringify(envVars, null, 2));
      
      const env = {
        ...process.env,
        // Set Playwright browsers path to project root
        PLAYWRIGHT_BROWSERS_PATH: path.join(this.projectRoot, 'node_modules', 'playwright-core', '.local-browsers'),
        // Use environment config if available, otherwise use defaults
        BASE_URL: envVars.baseUrl || envVars.BASE_URL || 
                  (environment === 'test' ? 'http://localhost:5050' : 
                   environment === 'development' ? 'http://localhost:5050' : 
                   environment === 'production' ? 'https://your-prod-url.com' : 'http://localhost:5050'),
        API_BASE_URL: envVars.apiBaseUrl || envVars.API_BASE_URL || 
                      (environment === 'test' ? 'http://localhost:5051' : 
                       environment === 'development' ? 'http://localhost:5051' : 
                       environment === 'production' ? 'https://your-prod-api-url.com' : 'http://localhost:5051'),
        USERNAME: envVars.username || envVars.USERNAME || 'admin',
        PASSWORD: envVars.password || envVars.PASSWORD || 'admin123',
        RETRIES: (envVars.retries || envVars.RETRIES || 1).toString(),
        EXECUTION_MODE: executionMode,
        WORKERS: workers.toString(),
        USE_GLOBAL_LOGIN: useGlobalLogin.toString(),
        BROWSER: browser,
        HEADLESS: headless.toString(),
        TAGS: tags.join(','),
        PARALLEL: parallel.toString(),
        // Skip global setup for test suite execution to avoid browser context issues
        SKIP_GLOBAL_SETUP: 'true'
      };

      console.log('🔧 Final environment variables for test execution:');
      console.log('   BASE_URL:', env.BASE_URL);
      console.log('   USERNAME:', env.USERNAME);
      console.log('   PASSWORD:', env.PASSWORD);
      console.log('   RETRIES:', env.RETRIES);

      // Execute tests
      const result = await this.runPlaywrightTests(testFiles, env, executionDir, {
        executionMode,
        workers,
        useGlobalLogin,
        browser,
        headless,
        tags
      });

      // Update status to completed
      await this.writeExecutionStatus(executionId, {
        status: result.success ? 'completed' : 'failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        testSuite: testSuite.name || testSuite.suiteName,
        totalTests: testFiles.length,
        completedTests: testFiles.length,
        currentTest: 'Execution completed',
        result: result
      });

      // Store test suite execution result in FileStorage for reports
      const FileStorage = require('./FileStorage');
      const fileStorage = new FileStorage();
      
      try {
        await fileStorage.createTestResult({
          _id: executionId,
          testId: `test-suite-${testSuite.id}`,
          testName: `Test Suite: ${testSuite.name || testSuite.suiteName}`,
          testType: 'Test Suite',
          environment: environment,
          browser: browser,
          headless: headless,
          status: result.success ? 'passed' : 'failed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          results: {
            duration: Date.now() - new Date().getTime(),
            totalTests: testFiles.length,
            completedTests: testFiles.length,
            passed: result.success ? testFiles.length : 0,
            failed: result.success ? 0 : testFiles.length,
            testFiles: testFiles,
            executionMode: executionMode,
            workers: workers
          },
          logs: result.logs || []
        });
        console.log('✅ Test suite execution result stored for reports');
      } catch (storageError) {
        console.log('⚠️ Failed to store test suite result for reports:', storageError.message);
      }

      // Generate reports
      await this.generateReports(executionDir);

      return {
        success: true,
        executionId,
        result,
        reports: {
          html: path.join(executionDir, 'html-report', 'index.html'),
          allure: this.allureResultsDir,
          json: path.join(executionDir, 'results.json')
        }
      };

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Update status to failed if we have an executionId
      if (typeof executionId !== 'undefined') {
        await this.writeExecutionStatus(executionId, {
          status: 'failed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          testSuite: testSuite.name || testSuite.suiteName,
          totalTests: 0,
          completedTests: 0,
          currentTest: 'Execution failed',
          error: error.message || 'Unknown error occurred'
        });

        // Store failed test suite execution result in FileStorage for reports
        const FileStorage = require('./FileStorage');
        const fileStorage = new FileStorage();
        
        try {
          await fileStorage.createTestResult({
            _id: executionId,
            testId: `test-suite-${testSuite.id}`,
            testName: `Test Suite: ${testSuite.name || testSuite.suiteName}`,
            testType: 'Test Suite',
            environment: environment,
            browser: browser,
            headless: headless,
            status: 'failed',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            results: {
              duration: 0,
              totalTests: 0,
              completedTests: 0,
              passed: 0,
              failed: 0,
              error: error.message || 'Unknown error occurred'
            },
            logs: []
          });
          console.log('✅ Failed test suite execution result stored for reports');
        } catch (storageError) {
          console.log('⚠️ Failed to store failed test suite result for reports:', storageError.message);
        }
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        executionId: null
      };
    }
  }

  async prepareTestFiles(testSuite, executionDir) {
    const testFiles = [];
    
    console.log(`🔍 Preparing test files for suite: ${testSuite.name || testSuite.suiteName}`);
    console.log(`📋 Test cases:`, testSuite.testCases || testSuite.selectedTestCases);
    console.log(`📋 Test suite structure:`, Object.keys(testSuite));

    // Handle different test suite structures
    const testCases = testSuite.testCases || testSuite.selectedTestCases || [];
    console.log(`📋 Processing ${testCases.length} test cases`);
    
    if (testCases.length > 0) {
      for (const testCase of testCases) {
        console.log(`🔍 Processing test case:`, testCase);
        
        // Find the actual test file
        const testFile = await this.findTestFile(testCase);
        if (testFile) {
          // Check if this test file is already in the array to avoid duplicates
          if (!testFiles.includes(testFile)) {
            testFiles.push(testFile);
            console.log(`✅ Added test file: ${testFile}`);
          } else {
            console.log(`⚠️ Test file already exists, skipping duplicate: ${testFile}`);
          }
        } else {
          console.log(`❌ Could not find test file for: ${testCase.id || testCase.name}`);
        }
      }
    } else {
      console.log(`⚠️ No test cases found in test suite`);
    }

    console.log(`📁 Final test files array (${testFiles.length} unique files):`, testFiles);
    return testFiles;
  }

  async findTestFile(testCase) {
    console.log(`🔍 Looking for test file for test case:`, testCase);
    
    // If testCase has filePath, use it directly (for references)
    if (testCase.filePath) {
      // Check if it's a reference (starts with TestSuites/) or original path
      let fullPath;
      if (testCase.filePath.startsWith('TestSuites/')) {
        // Reference to TestSuites folder
        fullPath = path.join(this.testSuitesDir, testCase.filePath);
        console.log(`📁 Checking TestSuites reference: ${fullPath}`);
      } else {
        // Original file path
        fullPath = path.join(this.projectRoot, 'tests', testCase.filePath);
        console.log(`📁 Checking original file path: ${fullPath}`);
      }
      
      if (await fs.pathExists(fullPath)) {
        console.log(`✅ Found test file: ${fullPath}`);
        return fullPath;
      } else {
        console.log(`❌ File not found: ${fullPath}`);
      }
    }

    // Fallback: Look for test files in various locations - TestSuites folder first
    const searchPaths = [
      path.join(this.testSuitesDir, '**', '*.spec.ts'),
      path.join(this.projectRoot, 'tests', 'projects', '**', '*.spec.ts'),
      path.join(this.projectRoot, 'tests', 'generated', '**', '*.spec.ts'),
      path.join(this.projectRoot, 'tests', '**', '*.spec.ts')
    ];

    for (const searchPath of searchPaths) {
      console.log(`🔍 Searching in: ${searchPath}`);
      try {
        const files = await this.globFiles(searchPath);
        console.log(`📁 Found ${files.length} files in ${searchPath}`);
        
        const matchingFile = files.find(file => 
          file.includes(testCase.id) || 
          file.includes(testCase.name) ||
          file.includes(testCase.title)
        );
        
        if (matchingFile) {
          console.log(`✅ Found matching file: ${matchingFile}`);
          return matchingFile;
        }
      } catch (error) {
        console.log(`⚠️ Error searching in ${searchPath}:`, error.message);
      }
    }

    console.log(`❌ No test file found for test case: ${testCase.id || testCase.name}`);
    console.log(`   - Expected filePath: ${testCase.filePath || 'not provided'}`);
    console.log(`   - Searched in: ${searchPaths.join(', ')}`);
    return null;
  }

  async globFiles(pattern) {
    try {
      const { glob } = require('glob');
      return await glob(pattern);
    } catch (error) {
      console.error('Error with glob:', error);
      return [];
    }
  }

  async runPlaywrightTests(testFiles, env, executionDir, config) {
    // Check if we should run sequentially (one browser session for all tests)
    if (config.executionMode === 'sequential') {
      console.log(`🎭 Running in SEQUENTIAL mode - one browser session for all tests`);
      return await this.runSequentialTests(testFiles, env, executionDir, config);
    } else {
      console.log(`🎭 Running in PARALLEL mode - multiple workers`);
      return await this.runParallelTests(testFiles, env, executionDir, config);
    }
  }

  async runSequentialTests(testFiles, env, executionDir, config) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🎭 Starting SEQUENTIAL Playwright execution with ${testFiles.length} test files`);
        console.log(`📁 Test files:`, testFiles);
        
        // Log unique test files to verify no duplicates
        const uniqueTestFiles = [...new Set(testFiles)];
        if (uniqueTestFiles.length !== testFiles.length) {
          console.log(`⚠️ WARNING: Found ${testFiles.length - uniqueTestFiles.length} duplicate test files!`);
          console.log(`📁 Original files:`, testFiles);
          console.log(`📁 Unique files:`, uniqueTestFiles);
        } else {
          console.log(`✅ All test files are unique`);
        }
        
        // Run all test files in a single Playwright command with workers=1 for sequential execution
        // Use unique test files to prevent duplicates
        const args = [
          'test',
          ...uniqueTestFiles, // Pass unique test files to a single command
          '--reporter=html,json',
          '--output=' + executionDir,
          '--workers=1', // Force single worker for sequential execution
          '--timeout=30000',
          `--retries=${env.RETRIES || 1}`, // Use environment retries value
          // No global setup - using spec-level session management
        ];

        // Add headless mode
        if (config.headless) {
          console.log(`🎭 Running tests in headless mode`);
        } else {
          args.push('--headed');
          console.log(`🎭 Running tests in headed mode`);
        }

        // Add browser project
        if (config.browser !== 'chromium') {
          args.push('--project=' + config.browser);
          console.log(`🎭 Using browser project: ${config.browser}`);
        }

        // Add tag filtering
        if (config.tags && config.tags.length > 0) {
          args.push('--grep=' + config.tags.join('|'));
          console.log(`🎭 Using tag filter: ${config.tags.join('|')}`);
        }

        console.log(`🎭 Executing Playwright command: npx playwright ${args.join(' ')}`);

        const playwrightProcess = spawn('npx', ['playwright', ...args], {
          cwd: this.projectRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { 
            ...process.env, 
            ...env,
            // Ensure we use the root project's Playwright
            NODE_PATH: path.join(this.projectRoot, 'node_modules')
          }
        });

        let stdout = '';
        let stderr = '';

        playwrightProcess.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log(`[STDOUT] ${output}`);
        });

        playwrightProcess.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.error(`[STDERR] ${output}`);
        });

        playwrightProcess.on('close', (code) => {
          console.log(`🎭 Sequential execution completed with exit code: ${code}`);
          resolve({
            exitCode: code,
            stdout: stdout,
            stderr: stderr,
            success: code === 0
          });
        });

        playwrightProcess.on('error', (error) => {
          console.error(`❌ Playwright process error:`, error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Sequential execution error:', error);
        reject(error);
      }
    });
  }


  async runSingleTestFile(testFile, env, executionDir, config, index) {
    return new Promise((resolve, reject) => {
      const args = [
        'test',
        testFile,
        '--reporter=html,json',
        '--output=' + executionDir,
        '--workers=1', // Force single worker for sequential execution
        '--timeout=30000',
        `--retries=${env.RETRIES || 1}` // Use environment retries value
      ];

      // Add headless mode
      if (config.headless) {
        console.log(`🎭 Running test file ${index + 1} in headless mode`);
      } else {
        args.push('--headed');
        console.log(`🎭 Running test file ${index + 1} in headed mode`);
      }

      // Add browser project
      if (config.browser !== 'chromium') {
        args.push('--project=' + config.browser);
        console.log(`🎭 Using browser project: ${config.browser}`);
      }

      // Add tag filtering
      if (config.tags && config.tags.length > 0) {
        args.push('--grep=' + config.tags.join('|'));
        console.log(`🎭 Using tag filter: ${config.tags.join('|')}`);
      }

      console.log(`🎭 Running single test file with args: ${args.join(' ')}`);

      const child = spawn('npx', ['playwright', ...args], {
        cwd: this.projectRoot,
        env: { 
          ...process.env, 
          ...env,
          // Ensure we use the root project's Playwright
          NODE_PATH: path.join(this.projectRoot, 'node_modules')
        },
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`[STDOUT-${index + 1}] ${output}`);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`[STDERR-${index + 1}] ${output}`);
      });

      child.on('close', (code) => {
        console.log(`🎭 Test file ${index + 1} completed with code: ${code}`);
        resolve({
          exitCode: code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      child.on('error', (error) => {
        console.error(`❌ Test file ${index + 1} process error:`, error);
        resolve({
          exitCode: 1,
          stdout,
          stderr,
          success: false,
          error: error.message
        });
      });
    });
  }

  async runParallelTests(testFiles, env, executionDir, config) {
    return new Promise((resolve, reject) => {
      console.log(`🎭 Starting PARALLEL Playwright execution with ${testFiles.length} test files`);
      console.log(`📁 Test files:`, testFiles);
      
      // Deduplicate test files for parallel execution as well
      const uniqueTestFiles = [...new Set(testFiles)];
      if (uniqueTestFiles.length !== testFiles.length) {
        console.log(`⚠️ WARNING: Found ${testFiles.length - uniqueTestFiles.length} duplicate test files in parallel execution!`);
        console.log(`📁 Original files:`, testFiles);
        console.log(`📁 Unique files:`, uniqueTestFiles);
      } else {
        console.log(`✅ All test files are unique for parallel execution`);
      }
      
      const args = [
        'test',
        ...uniqueTestFiles,
        '--reporter=html,json',
        '--output=' + executionDir,
        '--workers=' + config.workers,
        '--timeout=30000',
        `--retries=${env.RETRIES || 1}`, // Use environment retries value
        // No global setup - using spec-level session management
      ];

      // Add headless mode
      if (config.headless) {
        // Playwright runs headless by default, no need to add --headed=false
        console.log(`🎭 Running in headless mode`);
      } else {
        args.push('--headed');
        console.log(`🎭 Running in headed mode`);
      }

      // Add browser project
      if (config.browser !== 'chromium') {
        args.push('--project=' + config.browser);
        console.log(`🎭 Using browser project: ${config.browser}`);
      }

      // Add tag filtering
      if (config.tags && config.tags.length > 0) {
        args.push('--grep=' + config.tags.join('|'));
        console.log(`🎭 Using tag filter: ${config.tags.join('|')}`);
      }

      console.log(`🎭 Running Playwright with args: ${args.join(' ')}`);
      console.log(`📁 Working directory: ${this.projectRoot}`);
      console.log(`🌍 Environment variables:`, Object.keys(env));

      const child = spawn('npx', ['playwright', ...args], {
        cwd: this.projectRoot,
        env: { 
          ...process.env, 
          ...env,
          // Ensure we use the root project's Playwright
          NODE_PATH: path.join(this.projectRoot, 'node_modules')
        },
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`[STDOUT] ${output}`);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`[STDERR] ${output}`);
      });

      child.on('close', (code) => {
        console.log(`🎭 Playwright execution completed with code: ${code}`);
        console.log(`📊 Total stdout length: ${stdout.length}`);
        console.log(`📊 Total stderr length: ${stderr.length}`);
        
        if (code === 0) {
          console.log(`✅ Playwright execution successful`);
          resolve({
            exitCode: code,
            stdout,
            stderr,
            success: true
          });
        } else {
          console.log(`❌ Playwright execution failed with code ${code}`);
          console.log(`📄 Stderr content: ${stderr}`);
          const errorMessage = stderr ? `Playwright execution failed with code ${code}: ${stderr}` : `Playwright execution failed with code ${code}`;
          reject(new Error(errorMessage));
        }
      });

      child.on('error', (error) => {
        console.error('❌ Playwright process error:', error);
        reject(error);
      });
    });
  }

  async generateReports(executionDir) {
    try {
      console.log('📊 Generating reports...');
      
      // Import ReportGenerator to update main reports
      const ReportGenerator = require('./ReportGenerator');
      const reportGenerator = new ReportGenerator();
      
      // Generate main reports with latest data
      try {
        console.log('📊 Updating main Playwright report...');
        await reportGenerator.generatePlaywrightReport();
        
        console.log('📊 Updating main Allure report...');
        await reportGenerator.generateAllureReport();
        
        console.log('✅ Main reports updated successfully');
      } catch (reportError) {
        console.log('⚠️ Main report generation failed, but continuing...', reportError.message);
      }
      
      // Also generate execution-specific reports
      try {
        const allureCommand = spawn('npx', ['allure', 'generate', this.allureResultsDir, '--clean', '-o', path.join(executionDir, 'allure-report')], {
          cwd: this.projectRoot,
          stdio: 'pipe'
        });

        return new Promise((resolve) => {
          allureCommand.on('close', (code) => {
            if (code === 0) {
              console.log('✅ Execution-specific Allure report generated successfully');
            } else {
              console.log('⚠️ Execution-specific Allure report generation failed, but continuing...');
            }
            resolve();
          });

          allureCommand.on('error', (error) => {
            console.log('⚠️ Execution-specific Allure report generation error, but continuing...', error.message);
            resolve();
          });
        });
      } catch (error) {
        console.log('⚠️ Allure not available, skipping execution-specific report generation');
        return Promise.resolve();
      }
    } catch (error) {
      console.log('⚠️ Report generation failed, but continuing...', error.message);
    }
  }

  async writeExecutionStatus(executionId, statusData) {
    const executionDir = path.join(this.resultsDir, executionId);
    const statusFile = path.join(executionDir, 'status.json');
    
    try {
      await fs.writeJson(statusFile, {
        ...statusData,
        updatedAt: new Date().toISOString()
      }, { spaces: 2 });
    } catch (error) {
      console.error('Error writing execution status:', error);
    }
  }

  async getExecutionStatus(executionId) {
    const executionDir = path.join(this.resultsDir, executionId);
    
    if (!await fs.pathExists(executionDir)) {
      return { status: 'not_found' };
    }

    // Check for status file first (real-time status)
    const statusFile = path.join(executionDir, 'status.json');
    if (await fs.pathExists(statusFile)) {
      try {
        const statusData = await fs.readJson(statusFile);
        return statusData;
      } catch (error) {
        console.error('Error reading status file:', error);
      }
    }

    // Fallback to results file (completed status)
    const resultsFile = path.join(executionDir, 'results.json');
    if (await fs.pathExists(resultsFile)) {
      try {
        const results = await fs.readJson(resultsFile);
        return {
          status: 'completed',
          results,
          completedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error reading results file:', error);
        return { status: 'error', error: error.message };
      }
    }

    return { status: 'running' };
  }

  async listExecutions() {
    try {
      if (!await fs.pathExists(this.resultsDir)) {
        return [];
      }

      const executions = await fs.readdir(this.resultsDir);
      return executions.filter(exec => exec.startsWith('execution_'));
    } catch (error) {
      console.error('Error listing executions:', error);
      return [];
    }
  }

  async getExecutionDetails(executionId) {
    const executionDir = path.join(this.resultsDir, executionId);
    
    if (!await fs.pathExists(executionDir)) {
      return null;
    }

    try {
      const details = {
        executionId,
        directory: executionDir,
        htmlReport: path.join(executionDir, 'html-report', 'index.html'),
        allureReport: path.join(executionDir, 'allure-report'),
        resultsJson: path.join(executionDir, 'results.json'),
        exists: true
      };

      // Check if files exist
      details.htmlReportExists = await fs.pathExists(details.htmlReport);
      details.allureReportExists = await fs.pathExists(details.allureReport);
      details.resultsJsonExists = await fs.pathExists(details.resultsJson);

      return details;
    } catch (error) {
      console.error('Error getting execution details:', error);
      return { executionId, exists: false, error: error.message };
    }
  }
}

module.exports = TestSuiteExecutor;
