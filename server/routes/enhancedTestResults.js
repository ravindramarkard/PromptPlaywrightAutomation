const express = require('express');
const router = express.Router();
const FileStorage = require('../services/FileStorage');
const ReportGenerator = require('../services/ReportGenerator');
const fs = require('fs').promises;
const path = require('path');

const fileStorage = new FileStorage();
const reportGenerator = new ReportGenerator();

// Get enhanced execution summary with detailed analytics
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
        skipped: 0,
        successRate,
        averageDuration
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed analytics from reports
router.get('/analytics/from-reports', async (req, res) => {
  try {
    const analytics = await getAnalyticsFromReports();
    
    if (analytics) {
      res.json({
        success: true,
        analytics: analytics
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No analytics data available'
      });
    }
  } catch (error) {
    console.error('Error getting analytics from reports:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Helper function to extract analytics from HTML reports
async function getAnalyticsFromReports() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Try Allure report first (usually more up-to-date)
    const allureReportPath = path.join(__dirname, '../services/reports/allure/index.html');
    
    try {
      const allureContent = await fs.readFile(allureReportPath, 'utf8');
      const allureAnalytics = parseAllureReportForAnalytics(allureContent);
      if (allureAnalytics && allureAnalytics.totalTests > 0) {
        console.log('📊 Using Allure analytics data:', allureAnalytics);
        return allureAnalytics;
      }
    } catch (error) {
      console.log('⚠️ Could not read Allure report:', error.message);
    }
    
    // Try Playwright report as fallback
    const playwrightReportPath = path.join(__dirname, '../services/reports/playwright/index.html');
    
    try {
      const playwrightContent = await fs.readFile(playwrightReportPath, 'utf8');
      const playwrightAnalytics = await parsePlaywrightReportForAnalytics(playwrightContent);
      if (playwrightAnalytics && playwrightAnalytics.totalTests > 0) {
        console.log('📊 Using Playwright analytics data:', playwrightAnalytics);
        return playwrightAnalytics;
      }
    } catch (error) {
      console.log('⚠️ Could not read Playwright report:', error.message);
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ Error reading reports for analytics:', error.message);
    return null;
  }
}

// Parse Allure report HTML to extract detailed analytics
function parseAllureReportForAnalytics(htmlContent) {
  try {
    // Look for summary section with statistics including skipped tests and success rate
    const summaryMatch = htmlContent.match(/<strong>Total:<\/strong>\s*(\d+).*?<strong class="passed">Passed:<\/strong>\s*(\d+).*?<strong class="failed">Failed:<\/strong>\s*(\d+).*?<strong class="skipped">Skipped:<\/strong>\s*(\d+).*?<strong class="success-rate">Success Rate:<\/strong>\s*(\d+)%/s);
    
    if (summaryMatch) {
      const totalTests = parseInt(summaryMatch[1]);
      const passed = parseInt(summaryMatch[2]);
      const failed = parseInt(summaryMatch[3]);
      const skipped = parseInt(summaryMatch[4]);
      const successRate = parseInt(summaryMatch[5]);
      
      // Generate mock detailed data based on the summary statistics
      const mockTestDetails = generateMockTestDetails(totalTests, passed, failed);
      
      // Calculate detailed statistics
      const statusDistribution = calculateStatusDistribution(mockTestDetails);
      const durationDistribution = calculateDurationDistribution(mockTestDetails);
      const severityDistribution = calculateSeverityDistribution(mockTestDetails);
      
      return {
        totalTests,
        passed,
        failed,
        running: 0,
        skipped: skipped,
        successRate,
        averageDuration: calculateAverageDuration(mockTestDetails),
        statusDistribution,
        durationDistribution,
        severityDistribution,
        testDetails: mockTestDetails.slice(0, 10) // Last 10 tests for recent activity
      };
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ Error parsing Allure report for analytics:', error.message);
    return null;
  }
}

// Get statistics from stored test results
async function getStatsFromTestResults() {
  try {
    const testResults = await fileStorage.getTestResults();
    
    if (!testResults || testResults.length === 0) {
      return null;
    }

    // Calculate statistics
    const totalTests = testResults.length;
    const passed = testResults.filter(test => test.status === 'passed').length;
    const failed = testResults.filter(test => test.status === 'failed').length;
    const skipped = testResults.filter(test => test.status === 'skipped').length;
    const running = testResults.filter(test => test.status === 'running').length;
    const successRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

    // Transform test details
    const testDetails = testResults.map(test => ({
      id: test.id || test.name,
      name: test.name,
      status: test.status,
      duration: test.duration || 0,
      severity: test.severity || 'medium',
      timestamp: test.timestamp || new Date().toISOString(),
      error: test.error || null
    }));

    // Calculate distributions
    const statusDistribution = {
      passed,
      failed,
      skipped,
      running
    };

    const durationDistribution = {
      '0-1s': testDetails.filter(t => t.duration <= 1000).length,
      '1-5s': testDetails.filter(t => t.duration > 1000 && t.duration <= 5000).length,
      '5-10s': testDetails.filter(t => t.duration > 5000 && t.duration <= 10000).length,
      '10s+': testDetails.filter(t => t.duration > 10000).length
    };

    const severityDistribution = {
      low: testDetails.filter(t => t.severity === 'low').length,
      medium: testDetails.filter(t => t.severity === 'medium').length,
      high: testDetails.filter(t => t.severity === 'high').length,
      critical: testDetails.filter(t => t.severity === 'critical').length
    };

    return {
      totalTests,
      passed,
      failed,
      skipped,
      running,
      successRate,
      statusDistribution,
      durationDistribution,
      severityDistribution,
      testDetails
    };
  } catch (error) {
    console.log('⚠️ Error getting stats from test results:', error.message);
    return null;
  }
}

// Parse Playwright report HTML to extract detailed analytics
async function parsePlaywrightReportForAnalytics(htmlContent) {
  try {
    // Since Playwright reports are React applications with embedded data,
    // we'll try to extract data from the actual test results instead
    const stats = await getStatsFromTestResults();
    
    if (stats && stats.totalTests > 0) {
      // Generate mock detailed data based on the actual statistics
      const mockTestDetails = generateMockTestDetails(stats.totalTests, stats.passed, stats.failed);
      
      // Calculate detailed statistics
      const statusDistribution = calculateStatusDistribution(mockTestDetails);
      const durationDistribution = calculateDurationDistribution(mockTestDetails);
      const severityDistribution = calculateSeverityDistribution(mockTestDetails);
      
      return {
        totalTests: stats.totalTests,
        passed: stats.passed,
        failed: stats.failed,
        running: stats.running || 0,
        skipped: stats.skipped || 0,
        successRate: stats.successRate,
        averageDuration: calculateAverageDuration(mockTestDetails),
        statusDistribution,
        durationDistribution,
        severityDistribution,
        testDetails: mockTestDetails.slice(0, 10) // Last 10 tests for recent activity
      };
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ Error parsing Playwright report for analytics:', error.message);
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

module.exports = router;
