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
    // Try to get data from reports first (most recent)
    let stats = await getStatsFromReports();
    
    // If no report data available, fall back to test results
    if (!stats || stats.totalTests === 0) {
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

      stats = {
        totalTests,
        passed,
        failed,
        running,
        skipped: 0, // Not implemented yet
        successRate,
        averageDuration
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to extract stats from HTML reports
async function getStatsFromReports() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Try Allure report first (usually more up-to-date)
    const allureReportPath = path.join(__dirname, '../services/reports/allure/index.html');
    
    try {
      const allureContent = await fs.readFile(allureReportPath, 'utf8');
      const allureStats = parseAllureReport(allureContent);
      if (allureStats && allureStats.totalTests > 0) {
        console.log('📊 Using Allure report data:', allureStats);
        return allureStats;
      }
    } catch (error) {
      console.log('⚠️ Could not read Allure report:', error.message);
    }
    
    // Try Playwright report as fallback
    const playwrightReportPath = path.join(__dirname, '../services/reports/playwright/index.html');
    
    try {
      const playwrightContent = await fs.readFile(playwrightReportPath, 'utf8');
      const playwrightStats = await parsePlaywrightReport(playwrightContent);
      if (playwrightStats && playwrightStats.totalTests > 0) {
        console.log('📊 Using Playwright report data:', playwrightStats);
        return playwrightStats;
      }
    } catch (error) {
      console.log('⚠️ Could not read Playwright report:', error.message);
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ Error reading reports:', error.message);
    return null;
  }
}

// Parse Allure report HTML to extract statistics
function parseAllureReport(htmlContent) {
  try {
    // Look for summary section with statistics including skipped tests and success rate
    const summaryMatch = htmlContent.match(/<strong>Total:<\/strong>\s*(\d+).*?<strong class="passed">Passed:<\/strong>\s*(\d+).*?<strong class="failed">Failed:<\/strong>\s*(\d+).*?<strong class="skipped">Skipped:<\/strong>\s*(\d+).*?<strong class="success-rate">Success Rate:<\/strong>\s*(\d+)%/s);
    
    if (summaryMatch) {
      const totalTests = parseInt(summaryMatch[1]);
      const passed = parseInt(summaryMatch[2]);
      const failed = parseInt(summaryMatch[3]);
      const skipped = parseInt(summaryMatch[4]);
      const successRate = parseInt(summaryMatch[5]);
      
      // Parse individual test data for detailed analysis - improved regex
      const testRows = htmlContent.match(/<tr>\s*<td>([^<]+)<\/td>\s*<td class="([^"]+)">([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>[\s\S]*?<\/td>\s*<\/tr>/g) || [];
      
      const testDetails = testRows.map(row => {
        const match = row.match(/<tr>\s*<td>([^<]+)<\/td>\s*<td class="([^"]+)">([^<]+)<\/td>\s*<td>([^<]+)<\/td>/);
        
        if (match) {
          return {
            name: match[1],
            status: match[3],
            duration: parseDuration(match[4])
          };
        }
        
        return {
          name: 'Unknown',
          status: 'unknown',
          duration: 0
        };
      });
      
      // Calculate detailed statistics
      const statusDistribution = calculateStatusDistribution(testDetails);
      const durationDistribution = calculateDurationDistribution(testDetails);
      const severityDistribution = calculateSeverityDistribution(testDetails);
      
      return {
        totalTests,
        passed,
        failed,
        running: 0,
        skipped: skipped,
        successRate,
        averageDuration: calculateAverageDuration(testDetails),
        statusDistribution,
        durationDistribution,
        severityDistribution,
        testDetails: testDetails.slice(0, 10) // Last 10 tests for recent activity
      };
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ Error parsing Allure report:', error.message);
    return null;
  }
}

// Parse Playwright report HTML to extract statistics
async function parsePlaywrightReport(htmlContent) {
  try {
    // Since Playwright reports are React applications with embedded data,
    // we'll try to extract data from the actual test results instead
    return await getStatsFromTestResults();
  } catch (error) {
    console.log('⚠️ Error parsing Playwright report:', error.message);
    return null;
  }
}

// Get statistics from actual test results in the database/file system
async function getStatsFromTestResults() {
  try {
    // Get test results from file storage
    const testResults = await fileStorage.getTestResults();
    
    if (!testResults || testResults.length === 0) {
      return null;
    }
    
    // Calculate statistics from actual test data
    const totalTests = testResults.length;
    const passed = testResults.filter(test => test.status === 'passed').length;
    const failed = testResults.filter(test => test.status === 'failed').length;
    const skipped = testResults.filter(test => test.status === 'skipped').length;
    const running = testResults.filter(test => test.status === 'running').length;
    
    const successRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
    
    // Transform test results for detailed analysis
    const testDetails = testResults.map(test => ({
      name: test.testName || 'Unknown Test',
      status: test.status || 'unknown',
      duration: test.results?.duration || 0
    }));
    
    // Calculate detailed statistics
    const statusDistribution = calculateStatusDistribution(testDetails);
    const durationDistribution = calculateDurationDistribution(testDetails);
    const severityDistribution = calculateSeverityDistribution(testDetails);
    
    return {
      totalTests,
      passed,
      failed,
      running,
      skipped,
      successRate,
      averageDuration: calculateAverageDuration(testDetails),
      statusDistribution,
      durationDistribution,
      severityDistribution,
      testDetails: testDetails.slice(0, 10) // Last 10 tests for recent activity
    };
  } catch (error) {
    console.log('⚠️ Error getting stats from test results:', error.message);
    return null;
  }
}

// Helper function to parse duration strings (e.g., "6s", "1.2s", "500ms")
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  
  const match = durationStr.match(/(\d+(?:\.\d+)?)\s*(s|ms)/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    return unit === 's' ? value * 1000 : value;
  }
  return 0;
}

// Calculate status distribution for pie chart
function calculateStatusDistribution(testDetails) {
  const distribution = {
    passed: 0,
    failed: 0,
    broken: 0,
    skipped: 0,
    unknown: 0
  };
  
  testDetails.forEach(test => {
    const status = test.status.toLowerCase();
    if (distribution.hasOwnProperty(status)) {
      distribution[status]++;
    } else {
      distribution.unknown++;
    }
  });
  
  return distribution;
}

// Calculate duration distribution for bar chart
function calculateDurationDistribution(testDetails) {
  const ranges = [
    { label: '0s', min: 0, max: 200, count: 0 },
    { label: '200ms', min: 200, max: 400, count: 0 },
    { label: '400ms', min: 400, max: 600, count: 0 },
    { label: '600ms', min: 600, max: 800, count: 0 },
    { label: '800ms', min: 800, max: 1000, count: 0 },
    { label: '1s', min: 1000, max: 1200, count: 0 },
    { label: '1s', min: 1200, max: 1400, count: 0 },
    { label: '1s', min: 1400, max: 1600, count: 0 },
    { label: '1s', min: 1600, max: 2000, count: 0 }
  ];
  
  testDetails.forEach(test => {
    const duration = test.duration;
    for (let range of ranges) {
      if (duration >= range.min && duration < range.max) {
        range.count++;
        break;
      }
    }
  });
  
  return ranges;
}

// Calculate severity distribution (mock data based on test names)
function calculateSeverityDistribution(testDetails) {
  const severity = {
    blocker: 0,
    critical: 0,
    normal: 0,
    minor: 0,
    trivial: 0
  };
  
  testDetails.forEach(test => {
    const name = test.name.toLowerCase();
    if (name.includes('critical') || name.includes('blocker')) {
      severity.blocker++;
    } else if (name.includes('error') || name.includes('fail')) {
      severity.critical++;
    } else if (name.includes('minor') || name.includes('low')) {
      severity.minor++;
    } else if (name.includes('trivial') || name.includes('simple')) {
      severity.trivial++;
    } else {
      severity.normal++;
    }
  });
  
  return severity;
}

// Calculate average duration
function calculateAverageDuration(testDetails) {
  if (testDetails.length === 0) return 0;
  
  const totalDuration = testDetails.reduce((sum, test) => sum + test.duration, 0);
  return Math.round(totalDuration / testDetails.length);
}

// Generate mock test details based on summary statistics
function generateMockTestDetails(totalTests, passed, failed) {
  const testDetails = [];
  
  // Generate passed tests
  for (let i = 0; i < passed; i++) {
    testDetails.push({
      name: `Test ${i + 1} - Passed`,
      status: 'passed',
      duration: Math.random() * 5000 + 1000 // 1-6 seconds
    });
  }
  
  // Generate failed tests
  for (let i = 0; i < failed; i++) {
    testDetails.push({
      name: `Test ${i + 1} - Failed`,
      status: 'failed',
      duration: Math.random() * 3000 + 500 // 0.5-3.5 seconds
    });
  }
  
  // Generate remaining tests as skipped
  const remaining = totalTests - passed - failed;
  for (let i = 0; i < remaining; i++) {
    testDetails.push({
      name: `Test ${i + 1} - Skipped`,
      status: 'skipped',
      duration: 0
    });
  }
  
  return testDetails;
}

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

// Refresh both reports with latest data
router.post('/refresh-reports', async (req, res) => {
  try {
    console.log('🔄 Refreshing reports with latest data...');
    
    const playwrightResult = await reportGenerator.generatePlaywrightReport();
    const allureResult = await reportGenerator.generateAllureReport();
    
    // Get the latest statistics after refreshing reports
    const latestStats = await getStatsFromReports();
    
    res.json({
      success: true,
      message: 'Reports refreshed successfully',
      playwright: playwrightResult,
      allure: allureResult,
      stats: latestStats
    });
  } catch (error) {
    console.error('Error refreshing reports:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get latest statistics from reports
router.get('/stats/from-reports', async (req, res) => {
  try {
    const stats = await getStatsFromReports();
    
    if (stats) {
      res.json({
        success: true,
        stats: stats
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No report data available'
      });
    }
  } catch (error) {
    console.error('Error getting stats from reports:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;