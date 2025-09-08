const express = require('express');
const router = express.Router();
const FileStorage = require('../services/FileStorage');
const ReportGenerator = require('../services/ReportGenerator');

const fileStorage = new FileStorage();
const reportGenerator = new ReportGenerator();

// Get all test results
router.get('/', async (req, res) => {
  try {
    const testResults = await fileStorage.getTestResults();
    res.json(testResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single test result
router.get('/:id', async (req, res) => {
  try {
    const testResult = await fileStorage.getTestResultById(req.params.id);
    if (!testResult) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new test result
router.post('/', async (req, res) => {
  try {
    const testResult = await fileStorage.createTestResult(req.body);
    res.status(201).json(testResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await fileStorage.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get execution summary (for Results page)
router.get('/summary/execution', async (req, res) => {
  try {
    const testResults = await fileStorage.getTestResults();
    
    // Calculate statistics from test results
    const totalTests = testResults.length;
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const running = testResults.filter(r => r.status === 'running').length;
    const successRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
    
    // Calculate average duration
    const completedTests = testResults.filter(r => r.results && r.results.duration);
    const averageDuration = completedTests.length > 0 
      ? Math.round(completedTests.reduce((sum, r) => sum + r.results.duration, 0) / completedTests.length)
      : 0;

    const stats = {
      totalTests,
      passed,
      failed,
      running,
      skipped: 0, // Not implemented yet
      successRate,
      averageDuration
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available reports
router.get('/reports/available', async (req, res) => {
  try {
    const reports = await reportGenerator.getReportStatus();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute all tests
router.post('/execute', async (req, res) => {
  try {
    const { testSuiteId, environmentId } = req.body;
    
    // Mock execution - in real implementation, trigger test execution
    res.json({
      success: true,
      message: 'Test execution started',
      executionId: 'mock-execution-id'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Playwright report
router.post('/generate-playwright-report', async (req, res) => {
  try {
    const result = await reportGenerator.generatePlaywrightReport();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Allure report
router.post('/generate-allure-report', async (req, res) => {
  try {
    const result = await reportGenerator.generateAllureReport();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;