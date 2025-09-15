#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Enhanced test runner that automatically generates Allure reports
 * This script ensures Allure reports are always available after test execution
 */
class TestRunnerWithAllure {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.allureResultsDir = path.join(this.projectRoot, 'allure-results');
    this.allureReportDir = path.join(this.projectRoot, 'server', 'reports', 'allure');
  }

  async clearOldAllureResults() {
    try {
      console.log('🧹 Clearing old Allure results...');
      const allureResultsExists = await fs.access(this.allureResultsDir).then(() => true).catch(() => false);
      
      if (allureResultsExists) {
        await fs.rm(this.allureResultsDir, { recursive: true, force: true });
        console.log('✅ Old Allure results cleared');
      }
    } catch (error) {
      console.log('⚠️ Failed to clear old results:', error.message);
    }
  }

  async runPlaywrightTests(args = []) {
    console.log('🚀 Starting Playwright tests with auto-Allure generation...');
    
    return new Promise((resolve, reject) => {
      const testCommand = spawn('npx', ['playwright', 'test', '--reporter=list,allure-playwright', ...args], {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      testCommand.on('close', (code) => {
        console.log(`📊 Playwright tests completed with code: ${code}`);
        resolve(code);
      });

      testCommand.on('error', (error) => {
        console.error('❌ Playwright test execution failed:', error.message);
        reject(error);
      });
    });
  }

  async clearOldAllureReport() {
    try {
      console.log('🧹 Clearing old Allure report directory...');
      const allureReportExists = await fs.access(this.allureReportDir).then(() => true).catch(() => false);
      
      if (allureReportExists) {
        await fs.rm(this.allureReportDir, { recursive: true, force: true });
        console.log('✅ Old Allure report directory cleared');
      }
    } catch (error) {
      console.log('⚠️ Failed to clear old report directory:', error.message);
    }
  }

  async generateAllureReport() {
    console.log('🔄 Auto-generating Allure report...');
    
    // Clear old report directory first
    await this.clearOldAllureReport();
    
    // Check if allure-results exists
    const allureResultsExists = await fs.access(this.allureResultsDir).then(() => true).catch(() => false);
    
    if (!allureResultsExists) {
      console.log('⚠️ No allure-results directory found, creating empty report...');
      await this.createEmptyAllureReport();
      return;
    }
    
    return new Promise((resolve, reject) => {
      const allureCommand = spawn('npx', [
        'allure', 
        'generate', 
        this.allureResultsDir, 
        '--clean', 
        '-o', 
        this.allureReportDir
      ], {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      allureCommand.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Allure report auto-generated successfully');
          console.log('📊 Report available at: http://localhost:5051/reports/allure/index.html');
          resolve();
        } else {
          console.log('⚠️ Allure report generation failed, creating fallback report...');
          this.createEmptyAllureReport().then(resolve).catch(reject);
        }
      });

      allureCommand.on('error', (error) => {
        console.log('⚠️ Allure command error, creating fallback report...', error.message);
        this.createEmptyAllureReport().then(resolve).catch(reject);
      });
    });
  }

  async createEmptyAllureReport() {
    console.log('📝 Creating fallback Allure report...');
    
    // Ensure report directory exists
    await fs.mkdir(this.allureReportDir, { recursive: true });
    
    const emptyReportHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Allure Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .message { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info { color: #0066cc; }
    </style>
</head>
<body>
    <h1>Allure Report</h1>
    <div class="message">
        <p class="info">No test results available yet.</p>
        <p>Run some tests to see detailed Allure reports here.</p>
        <p><strong>Tip:</strong> Use <code>npm run test:playwright</code> to run tests with automatic report generation.</p>
    </div>
</body>
</html>`;
    
    await fs.writeFile(path.join(this.allureReportDir, 'index.html'), emptyReportHTML);
    console.log('✅ Fallback Allure report created');
  }

  async run(args = []) {
    try {
      // Clear old Allure results to ensure fresh data
      await this.clearOldAllureResults();
      
      // Run Playwright tests
      const testExitCode = await this.runPlaywrightTests(args);
      
      // Always generate Allure report regardless of test results
      await this.generateAllureReport();
      
      console.log('🎉 Test execution and report generation completed');
      return testExitCode;
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      
      // Still try to generate a report even if tests failed
      try {
        await this.generateAllureReport();
      } catch (reportError) {
        console.error('❌ Report generation also failed:', reportError.message);
      }
      
      throw error;
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const runner = new TestRunnerWithAllure();
  const args = process.argv.slice(2);
  
  runner.run(args)
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestRunnerWithAllure;