const express = require('express');
const router = express.Router();
const FileStorage = require('../services/FileStorage');
const fs = require('fs-extra');
const path = require('path');

const fileStorage = new FileStorage();

// Cache for generated tests to reduce scanning frequency
let generatedTestsCache = null;
let lastScanTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

// Get all test suites
router.get('/', async (req, res) => {
  try {
    // Get traditional test suites
    const traditionalTestSuites = await fileStorage.getTestSuites();
    
    // Scan for all generated test files (with caching)
    const generatedTests = await getCachedGeneratedTests();
    
    // Combine both types
    const allTestSuites = [
      ...traditionalTestSuites,
      ...generatedTests
    ];
    
    res.json({
      testSuites: allTestSuites,
      total: allTestSuites.length,
      generated: generatedTests.length,
      traditional: traditionalTestSuites.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cached function to get generated tests
async function getCachedGeneratedTests() {
  const now = Date.now();
  
  // Return cached result if still valid
  if (generatedTestsCache && (now - lastScanTime) < CACHE_DURATION) {
    return generatedTestsCache;
  }
  
  // Scan and cache new results
  generatedTestsCache = await scanGeneratedTests();
  lastScanTime = now;
  
  return generatedTestsCache;
}

// Helper function to scan for generated test files
async function scanGeneratedTests() {
  const testSuites = [];
  
  try {
    // Use glob pattern to find all .spec.ts files
    const glob = require('glob');
    const pattern = path.join(__dirname, '../../tests/projects/**/*.spec.ts');
    
    console.log('Scanning for test files with pattern:', pattern);
    
    const testFiles = await new Promise((resolve, reject) => {
      glob(pattern, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
    
    console.log(`Found ${testFiles.length} test files`);
    
    for (const testPath of testFiles) {
      try {
        const testName = path.basename(testPath, '.spec.ts');
        const stat = await fs.stat(testPath);
        
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
        
        // Read test file to extract metadata
        const testContent = await fs.readFile(testPath, 'utf8');
        const testType = extractTestType(testContent);
        const tags = extractTags(testContent);
        
        testSuites.push({
          id: `${project}-${model}-${modelName}-${promptId}-${testName}`,
          name: testName,
          description: `Generated test from ${project}/${modelName}`,
          type: testType,
          tags: tags,
          project: project,
          model: modelName,
          promptId: promptId,
          filePath: testPath,
          relativePath: path.relative(process.cwd(), testPath),
          createdAt: stat.mtime.toISOString(),
          updatedAt: stat.mtime.toISOString(),
          status: 'active',
          isGenerated: true,
          source: project === 'enhanced-ai' ? 'Enhanced AI Generator' : 'Prompts'
        });
      } catch (fileError) {
        console.error(`Error processing test file ${testPath}:`, fileError);
      }
    }
  } catch (error) {
    console.error('Error scanning generated tests:', error);
  }
  
  console.log(`Found ${testSuites.length} generated test files`);
  return testSuites;
}

// Helper function to extract test type from test content
function extractTestType(content) {
  if (content.includes('test.describe') && content.includes('UI Test')) return 'UI Test';
  if (content.includes('test.describe') && content.includes('API Test')) return 'API Test';
  if (content.includes('test.describe') && content.includes('HR')) return 'HR Test';
  if (content.includes('test.describe') && content.includes('Login')) return 'Login Test';
  return 'UI Test';
}

// Helper function to extract tags from test content
function extractTags(content) {
  const tags = [];
  if (content.includes('allure.tag')) {
    const tagMatches = content.match(/allure\.tag\(['"`]([^'"`]+)['"`]\)/g);
    if (tagMatches) {
      tagMatches.forEach(match => {
        const tag = match.match(/allure\.tag\(['"`]([^'"`]+)['"`]\)/)[1];
        if (tag) tags.push(tag);
      });
    }
  }
  return tags;
}

// Get single test suite
router.get('/:id', async (req, res) => {
  try {
    const testSuite = await fileStorage.getTestSuiteById(req.params.id);
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    res.json(testSuite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get spec content for a test suite
router.get('/:id/spec', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, get all test suites to find the one with matching ID
    const testSuites = await scanGeneratedTests();
    const testSuite = testSuites.find(ts => ts.id === id);
    
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    
    if (!testSuite.filePath) {
      return res.status(404).json({ error: 'Test file path not found' });
    }
    
    // Read the spec file content
    try {
      const specContent = await fs.readFile(testSuite.filePath, 'utf8');
      res.json({
        specContent,
        testName: testSuite.name,
        filePath: testSuite.filePath,
        testType: testSuite.type,
        source: testSuite.source
      });
    } catch (fileError) {
      console.error('Error reading spec file:', fileError);
      res.status(500).json({ error: 'Failed to read spec file' });
    }
  } catch (error) {
    console.error('Error fetching spec content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update spec content for a test suite
router.put('/:id/spec', async (req, res) => {
  try {
    const { id } = req.params;
    const { specContent, testName } = req.body;
    
    if (!specContent) {
      return res.status(400).json({ error: 'Spec content is required' });
    }
    
    // First, get all test suites to find the one with matching ID
    const testSuites = await scanGeneratedTests();
    const testSuite = testSuites.find(ts => ts.id === id);
    
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    
    if (!testSuite.filePath) {
      return res.status(404).json({ error: 'Test file path not found' });
    }
    
    // Validate spec content (basic TypeScript/JavaScript validation)
    if (!specContent.includes('import') || !specContent.includes('test')) {
      return res.status(400).json({ 
        error: 'Invalid spec content. Must contain import statements and test functions.' 
      });
    }
    
    // Create backup of original file
    const backupPath = testSuite.filePath + '.backup.' + Date.now();
    try {
      await fs.copy(testSuite.filePath, backupPath);
      console.log(`Backup created: ${backupPath}`);
    } catch (backupError) {
      console.warn('Could not create backup:', backupError.message);
    }
    
    // Write the updated spec content
    try {
      await fs.writeFile(testSuite.filePath, specContent, 'utf8');
      
      // Update file modification time
      const stats = await fs.stat(testSuite.filePath);
      
      res.json({
        success: true,
        message: 'Spec file updated successfully',
        testName: testName || testSuite.name,
        filePath: testSuite.filePath,
        backupPath: backupPath,
        updatedAt: stats.mtime.toISOString(),
        specContent: specContent
      });
    } catch (writeError) {
      console.error('Error writing spec file:', writeError);
      res.status(500).json({ error: 'Failed to write spec file' });
    }
  } catch (error) {
    console.error('Error updating spec content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new test suite
router.post('/', async (req, res) => {
  try {
    const testSuite = await fileStorage.createTestSuite(req.body);
    res.status(201).json(testSuite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update test suite
router.put('/:id', async (req, res) => {
  try {
    const testSuite = await fileStorage.updateTestSuite(req.params.id, req.body);
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    res.json(testSuite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete test suite
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the test suite in the generated tests
    const testSuites = await scanGeneratedTests();
    const testSuite = testSuites.find(ts => ts.id === id);
    
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    
    // Delete the actual test file
    if (testSuite.filePath) {
      const fs = require('fs-extra');
      const path = require('path');
      
      // Check if file exists before deleting
      if (await fs.pathExists(testSuite.filePath)) {
        await fs.remove(testSuite.filePath);
        console.log(`Deleted test file: ${testSuite.filePath}`);
      }
      
      // Also delete any backup files
      const backupPattern = `${testSuite.filePath}.backup.*`;
      const glob = require('glob');
      const backupFiles = await new Promise((resolve, reject) => {
        glob(backupPattern, (err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
      
      for (const backupFile of backupFiles) {
        await fs.remove(backupFile);
        console.log(`Deleted backup file: ${backupFile}`);
      }
    }
    
    // Invalidate cache after deletion
    generatedTestsCache = null;
    lastScanTime = 0;
    
    res.json({ message: 'Test suite deleted successfully' });
  } catch (error) {
    console.error('Error deleting test suite:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;