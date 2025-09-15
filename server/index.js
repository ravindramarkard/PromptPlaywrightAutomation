const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

// Load environment variables
dotenv.config();

// Import routes
const promptRoutes = require('./routes/prompts');
const testSuiteRoutes = require('./routes/testSuites');
const environmentRoutes = require('./routes/environments');
const testResultRoutes = require('./routes/testResults');
const enhancedTestResultRoutes = require('./routes/enhancedTestResults');
const enhancedReportRoutes = require('./routes/enhancedReports');
const codeGenerationRoutes = require('./routes/codeGeneration');
const testExecutionRoutes = require('./routes/testExecution');
const apiTestGeneratorRoutes = require('./routes/apiTestGenerator');
const domAnalyzerRoutes = require('./routes/domAnalyzer');
const apiTestExecutionRoutes = require('./routes/apiTestExecution');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5051;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve report files
app.use('/reports', express.static(path.join(__dirname, 'reports')));

console.log('Using File-Based Storage (No Database Required)');

// API Routes
app.use('/api/prompts', promptRoutes);
app.use('/api/test-suites', testSuiteRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/analytics', enhancedTestResultRoutes);
app.use('/api/reports', enhancedReportRoutes);
app.use('/api/code-generation', codeGenerationRoutes);
app.use('/api/test-execution', testExecutionRoutes);
app.use('/api/api-test-generator', apiTestGeneratorRoutes);
app.use('/api/dom-analyzer', domAnalyzerRoutes);
app.use('/api/api-test-execution', apiTestExecutionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// API endpoint to fetch test files
app.get('/api/test-files', (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const testsDir = path.join(__dirname, 'tests/generated');
    let testFiles = [];
    
    if (type === 'api' || type === 'all') {
      const apiTestsPattern = path.join(testsDir, 'api-tests', '**/*.spec.ts');
      const apiFiles = glob.sync(apiTestsPattern);
      
      apiFiles.forEach(filePath => {
        const relativePath = path.relative(testsDir, filePath);
        const fileName = path.basename(filePath, '.spec.ts');
        const stats = fs.statSync(filePath);
        
        // Extract test name and tags from filename
        const testName = fileName.replace(/--/g, ' ').replace(/-/g, ' ');
        const tags = ['api'];
        
        // Add specific tags based on filename patterns
        if (fileName.includes('happy-path')) {
          tags.push('happy-path');
        } else if (fileName.includes('error-cases')) {
          tags.push('error-handling');
        } else if (fileName.includes('data-validation')) {
          tags.push('validation');
        }
        
        testFiles.push({
          id: `api-${fileName}`,
          name: testName,
          tags: tags,
          type: 'API',
          filePath: relativePath,
          created: stats.birthtime,
          modified: stats.mtime
        });
      });
    }
    
    if (type === 'ui' || type === 'all') {
      // Look for UI tests in both generated and projects directories
      const uiTestsPattern = path.join(testsDir, '**/*.spec.ts');
      const projectsTestsPattern = path.join(__dirname, '../tests/projects/**/*.spec.ts');
      
      const uiFiles = [
        ...glob.sync(uiTestsPattern).filter(file => 
          !file.includes('api-tests') && file.endsWith('.spec.ts')
        ),
        ...glob.sync(projectsTestsPattern)
      ];
      
      uiFiles.forEach(filePath => {
        const relativePath = path.relative(path.join(__dirname, '../tests'), filePath);
        const fileName = path.basename(filePath, '.spec.ts');
        const stats = fs.statSync(filePath);
        
        const testName = fileName.replace(/--/g, ' ').replace(/-/g, ' ');
        const tags = ['ui'];
        
        // Add specific tags based on filename patterns
        if (fileName.includes('login')) {
          tags.push('login');
        } else if (fileName.includes('search')) {
          tags.push('search');
        } else if (fileName.includes('generated')) {
          tags.push('generated');
        }
        
        testFiles.push({
          id: `ui-${fileName}`,
          name: testName,
          tags: tags,
          type: 'UI',
          filePath: relativePath,
          created: stats.birthtime,
          modified: stats.mtime
        });
      });
    }
    
    res.json({
      success: true,
      tests: testFiles,
      total: testFiles.length
    });
  } catch (error) {
    console.error('Error fetching test files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test files',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API endpoint to get test file content
app.get('/api/test-files/:id/content', (req, res) => {
  try {
    const { id } = req.params;
    const testsDir = path.join(__dirname, 'tests/generated');
    
    // Find the test file by ID
    const apiTestsPattern = path.join(testsDir, 'api-tests', '**/*.spec.ts');
    const uiTestsPattern = path.join(testsDir, '**/*.spec.ts');
    const projectsTestsPattern = path.join(__dirname, '../tests/projects/**/*.spec.ts');

    const allFiles = [
      ...glob.sync(apiTestsPattern),
      ...glob.sync(uiTestsPattern).filter(file => !file.includes('api-tests')),
      ...glob.sync(projectsTestsPattern)
    ];

    let testFile = null;
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath, '.spec.ts');
      const testId = filePath.includes('api-tests') ? `api-${fileName}` : `ui-${fileName}`;
      
      if (testId === id) {
        testFile = filePath;
        break;
      }
    }

    if (!testFile) {
      return res.status(404).json({ error: 'Test file not found' });
    }

    // Read the file content
    const content = fs.readFileSync(testFile, 'utf8');
    
    res.json({
      success: true,
      content: content,
      filePath: testFile,
      fileName: path.basename(testFile)
    });
  } catch (error) {
    console.error('Error reading test file content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read test file content',
      message: error.message
    });
  }
});

// API endpoint to save test file content
app.put('/api/test-files/:id/content', (req, res) => {
  try {
    const { id } = req.params;
    const { content, testName } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const testsDir = path.join(__dirname, 'tests/generated');
    
    // Find the test file by ID
    const apiTestsPattern = path.join(testsDir, 'api-tests', '**/*.spec.ts');
    const uiTestsPattern = path.join(testsDir, '**/*.spec.ts');
    const projectsTestsPattern = path.join(__dirname, '../tests/projects/**/*.spec.ts');

    const allFiles = [
      ...glob.sync(apiTestsPattern),
      ...glob.sync(uiTestsPattern).filter(file => !file.includes('api-tests')),
      ...glob.sync(projectsTestsPattern)
    ];

    let testFile = null;
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath, '.spec.ts');
      const testId = filePath.includes('api-tests') ? `api-${fileName}` : `ui-${fileName}`;
      
      if (testId === id) {
        testFile = filePath;
        break;
      }
    }

    if (!testFile) {
      return res.status(404).json({ error: 'Test file not found' });
    }

    // Write the new content directly without backup
    fs.writeFileSync(testFile, content, 'utf8');
    console.log(`Updated test file: ${testFile}`);
    
    res.json({
      success: true,
      message: 'Test file updated successfully',
      filePath: testFile
    });
  } catch (error) {
    console.error('Error saving test file content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save test file content',
      message: error.message
    });
  }
});

// API endpoint to delete test file
app.delete('/api/test-files/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const testsDir = path.join(__dirname, 'tests/generated');
    
    // Find the test file by ID
    const apiTestsPattern = path.join(testsDir, 'api-tests', '**/*.spec.ts');
    const uiTestsPattern = path.join(testsDir, '**/*.spec.ts');
    const projectsTestsPattern = path.join(__dirname, '../tests/projects/**/*.spec.ts');

    const allFiles = [
      ...glob.sync(apiTestsPattern),
      ...glob.sync(uiTestsPattern).filter(file => !file.includes('api-tests')),
      ...glob.sync(projectsTestsPattern)
    ];

    let testFile = null;
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath, '.spec.ts');
      const testId = filePath.includes('api-tests') ? `api-${fileName}` : `ui-${fileName}`;
      
      if (testId === id) {
        testFile = filePath;
        break;
      }
    }

    if (!testFile) {
      return res.status(404).json({ error: 'Test file not found' });
    }

    // Delete the file directly without backup
    fs.unlinkSync(testFile);
    console.log(`Deleted test file: ${testFile}`);
    
    res.json({
      success: true,
      message: 'Test file deleted successfully',
      filePath: testFile
    });
  } catch (error) {
    console.error('Error deleting test file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete test file',
      message: error.message
    });
  }
});

// API endpoint to create test suite
app.post('/api/test-suites', (req, res) => {
  try {
    const { suiteName, description, testType, selectedTestCases } = req.body;
    
    if (!suiteName || !selectedTestCases || selectedTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Suite name and test cases are required'
      });
    }

    // Generate unique ID for the test suite
    const testSuiteId = `suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const testSuite = {
      id: testSuiteId,
      name: suiteName,
      description: description || '',
      testType: testType || 'UI',
      testCases: selectedTestCases,
      createdAt: new Date().toISOString(),
      status: 'ready',
      totalTests: selectedTestCases.length,
      lastRun: null,
      results: {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: selectedTestCases.length
      }
    };

    // Save to file storage (using the existing FileStorage service)
    const FileStorage = require('./services/FileStorage');
    const fileStorage = new FileStorage();
    
    // Get existing test suites
    const existingSuites = fileStorage.getTestSuites();
    
    // Add new test suite
    existingSuites.push(testSuite);
    
    // Save back to file
    const saveResult = fileStorage.saveTestSuites(existingSuites);
    
    if (saveResult) {
      console.log('Test suite created:', testSuite);
      
      res.json({
        success: true,
        message: 'Test suite created successfully',
        testSuite: testSuite
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save test suite to file',
        message: 'Could not save test suite data'
      });
    }
  } catch (error) {
    console.error('Error creating test suite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test suite',
      message: error.message
    });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Storage: File-Based (No Database Required)`);
});

module.exports = app;
