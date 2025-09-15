const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const FileStorage = require('./FileStorage');

class EnhancedReportGenerator {
  constructor() {
    this.fileStorage = new FileStorage();
    this.reportsDir = path.join(__dirname, 'reports');
    this.playwrightReportDir = path.join(this.reportsDir, 'playwright');
    this.allureReportDir = path.join(this.reportsDir, 'allure');
    this.allureResultsDir = path.join(__dirname, '..', '..', 'allure-results');
  }

  async ensureDirectories() {
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.mkdir(this.playwrightReportDir, { recursive: true });
    await fs.mkdir(this.allureReportDir, { recursive: true });
  }

  // Generate Allure report with cleanup
  async generateAllureReportWithCleanup() {
    try {
      console.log('🧹 Cleaning and generating Allure report...');
      
      // Clean old Allure results and generate new report
      const allureCommand = spawn('npx', [
        'allure', 
        'generate', 
        this.allureResultsDir, 
        '--clean', 
        '-o', 
        this.allureReportDir
      ], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'pipe'
      });

      return new Promise((resolve, reject) => {
        let output = '';
        let errorOutput = '';

        allureCommand.stdout.on('data', (data) => {
          output += data.toString();
        });

        allureCommand.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        allureCommand.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Allure report generated successfully with cleanup');
            console.log('📊 Allure output:', output);
            resolve({
              success: true,
              path: '/reports/allure/index.html',
              message: 'Allure report generated successfully with cleanup',
              output: output
            });
          } else {
            console.log('⚠️ Allure report generation failed:', errorOutput);
            reject(new Error(`Allure generation failed: ${errorOutput}`));
          }
        });

        allureCommand.on('error', (error) => {
          console.log('⚠️ Allure command error:', error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error generating Allure report with cleanup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate Playwright report with cleanup
  async generatePlaywrightReportWithCleanup() {
    try {
      console.log('🧹 Cleaning and generating Playwright report...');
      
      await this.ensureDirectories();
      
      // Clean old Playwright report directory
      try {
        await fs.rm(this.playwrightReportDir, { recursive: true, force: true });
        console.log('🧹 Cleaned old Playwright report directory');
      } catch (error) {
        console.log('⚠️ Could not clean Playwright report directory:', error.message);
      }
      
      await fs.mkdir(this.playwrightReportDir, { recursive: true });
      
      // Always generate a simple report that can be parsed
      const testResults = await this.fileStorage.getTestResults();
      const reportData = this.generateMinimalPlaywrightReport(testResults);
      const indexPath = path.join(this.playwrightReportDir, 'index.html');
      await fs.writeFile(indexPath, reportData);
      console.log('✅ Generated simple Playwright report');

      return {
        success: true,
        path: '/reports/playwright/index.html',
        message: 'Playwright report generated successfully with cleanup'
      };
    } catch (error) {
      console.error('Error generating Playwright report with cleanup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate minimal Playwright report HTML
  generateMinimalPlaywrightReport(testResults) {
    const completedTests = testResults.filter(test => test.status === 'passed' || test.status === 'failed');
    
    const rows = completedTests.map(test => `
      <tr>
        <td>${test.testName || 'Unknown Test'}</td>
        <td class="${test.status}">${test.status}</td>
        <td>${Math.round((test.results?.duration || 0) / 1000)}s</td>
        <td>${test.browser || 'chromium'} ${test.headless ? '(headless)' : ''}</td>
        <td>${test.environment || 'development'}</td>
        <td>${test.results?.error ? `<pre>${String(test.results.error)}</pre>` : ''}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Playwright Test Report</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; }
    .summary { margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #fafafa; }
    .passed { color: #1a7f37; }
    .failed { color: #d1242f; }
  </style>
</head>
<body>
  <h1>Playwright Test Report</h1>
  <div class="summary">
    <strong>Total:</strong> ${testResults.length} &nbsp; 
    <strong class="passed">Passed:</strong> ${testResults.filter(t => t.status === 'passed').length} &nbsp; 
    <strong class="failed">Failed:</strong> ${testResults.filter(t => t.status === 'failed').length} &nbsp; 
  </div>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Duration</th>
        <th>Browser</th>
        <th>Environment</th>
        <th>Error</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
  }

  // Clean all old reports
  async cleanAllReports() {
    try {
      console.log('🧹 Cleaning all old reports...');
      
      // Clean Allure reports
      try {
        await fs.rm(this.allureReportDir, { recursive: true, force: true });
        console.log('✅ Cleaned Allure report directory');
      } catch (error) {
        console.log('⚠️ Could not clean Allure report directory:', error.message);
      }
      
      // Clean Playwright reports
      try {
        await fs.rm(this.playwrightReportDir, { recursive: true, force: true });
        console.log('✅ Cleaned Playwright report directory');
      } catch (error) {
        console.log('⚠️ Could not clean Playwright report directory:', error.message);
      }
      
      // Clean Allure results directory
      try {
        await fs.rm(this.allureResultsDir, { recursive: true, force: true });
        console.log('✅ Cleaned Allure results directory');
      } catch (error) {
        console.log('⚠️ Could not clean Allure results directory:', error.message);
      }
      
      return {
        success: true,
        message: 'All old reports cleaned successfully'
      };
    } catch (error) {
      console.error('Error cleaning reports:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate fresh reports with cleanup
  async generateFreshReports() {
    try {
      console.log('🔄 Generating fresh reports with cleanup...');
      
      // Clean all old reports first
      await this.cleanAllReports();
      
      // Generate new reports - make Allure optional
      let allureResult = { success: false, message: 'Allure not available' };
      let playwrightResult = { success: false, message: 'Playwright generation failed' };
      
      try {
        console.log('📊 Generating Playwright report...');
        playwrightResult = await this.generatePlaywrightReportWithCleanup();
        console.log('✅ Playwright report generated successfully');
      } catch (error) {
        console.log('⚠️ Playwright report generation failed:', error.message);
        playwrightResult = { success: false, error: error.message };
      }
      
      try {
        console.log('📊 Attempting Allure report generation...');
        allureResult = await this.generateAllureReportWithCleanup();
        console.log('✅ Allure report generated successfully');
      } catch (error) {
        console.log('⚠️ Allure report generation failed (this is expected if Allure is not installed):', error.message);
        allureResult = { success: false, message: 'Allure not available - this is normal if Allure is not installed' };
      }
      
      return {
        success: true,
        message: 'Fresh reports generated successfully',
        allure: allureResult,
        playwright: playwrightResult
      };
    } catch (error) {
      console.error('Error generating fresh reports:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = EnhancedReportGenerator;
