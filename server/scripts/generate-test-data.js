const FileStorage = require('../services/FileStorage');
const path = require('path');

async function generateTestData() {
  console.log('📊 Generating test data for reports...');
  
  const fileStorage = new FileStorage();
  
  // Generate some test results
  const testResults = [];
  
  // Generate 31 passed tests
  for (let i = 1; i <= 31; i++) {
    testResults.push({
      _id: `test-${i}`,
      testId: `test-${i}`,
      testName: `Test ${i} - Passed`,
      testType: 'UI Test',
      environment: 'development',
      browser: 'chromium',
      headless: true,
      status: 'passed',
      startedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      completedAt: new Date().toISOString(),
      results: {
        duration: Math.random() * 5000 + 1000, // 1-6 seconds
        steps: [
          { name: 'Navigate to page', status: 'passed' },
          { name: 'Click button', status: 'passed' },
          { name: 'Verify result', status: 'passed' }
        ]
      },
      logs: []
    });
  }
  
  // Generate 73 failed tests
  for (let i = 32; i <= 104; i++) {
    testResults.push({
      _id: `test-${i}`,
      testId: `test-${i}`,
      testName: `Test ${i} - Failed`,
      testType: 'UI Test',
      environment: 'development',
      browser: 'chromium',
      headless: true,
      status: 'failed',
      startedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      completedAt: new Date().toISOString(),
      results: {
        duration: Math.random() * 3000 + 500, // 0.5-3.5 seconds
        error: `Test ${i} failed: Element not found`,
        steps: [
          { name: 'Navigate to page', status: 'passed' },
          { name: 'Click button', status: 'failed' },
          { name: 'Verify result', status: 'skipped' }
        ]
      },
      logs: []
    });
  }
  
  // Generate 119 more tests (total 223)
  for (let i = 105; i <= 223; i++) {
    const status = Math.random() > 0.5 ? 'passed' : 'failed';
    testResults.push({
      _id: `test-${i}`,
      testId: `test-${i}`,
      testName: `Test ${i} - ${status === 'passed' ? 'Passed' : 'Failed'}`,
      testType: 'UI Test',
      environment: 'development',
      browser: 'chromium',
      headless: true,
      status: status,
      startedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      completedAt: new Date().toISOString(),
      results: {
        duration: Math.random() * 4000 + 1000, // 1-5 seconds
        steps: [
          { name: 'Navigate to page', status: 'passed' },
          { name: 'Perform action', status: status },
          { name: 'Verify result', status: status }
        ]
      },
      logs: []
    });
  }
  
  // Save test results one by one
  for (const testResult of testResults) {
    await fileStorage.createTestResult(testResult);
  }
  
  console.log(`✅ Generated ${testResults.length} test results`);
  console.log(`📊 Passed: ${testResults.filter(t => t.status === 'passed').length}`);
  console.log(`📊 Failed: ${testResults.filter(t => t.status === 'failed').length}`);
  
  return testResults;
}

// Run if called directly
if (require.main === module) {
  generateTestData()
    .then(() => {
      console.log('✅ Test data generation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error generating test data:', error);
      process.exit(1);
    });
}

module.exports = generateTestData;
