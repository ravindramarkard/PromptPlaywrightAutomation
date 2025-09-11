const fs = require('fs').promises;
const path = require('path');
const FileStorage = require('./FileStorage');

class ReportGenerator {
  constructor() {
    this.fileStorage = new FileStorage();
    // Align with server static mount: app.use('/reports', express.static(path.join(__dirname, 'reports')))
    this.reportsDir = path.join(__dirname, 'reports');
    this.playwrightReportDir = path.join(this.reportsDir, 'playwright');
    this.allureReportDir = path.join(this.reportsDir, 'allure');
  }

  async ensureDirectories() {
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.mkdir(this.playwrightReportDir, { recursive: true });
    await fs.mkdir(this.allureReportDir, { recursive: true });
  }

  async generatePlaywrightReport() {
    try {
      await this.ensureDirectories();
      
      // If Playwright's native HTML report exists at project root, mirror it
      const rootPlaywrightReport = path.join(__dirname, '..', '..', 'playwright-report');
      try {
        // Remove existing directory to avoid stale files
        await fs.rm(this.playwrightReportDir, { recursive: true, force: true });
      } catch {}
      await fs.mkdir(this.playwrightReportDir, { recursive: true });
      try {
        // Node 16+ supports fs.cp with recursive
        await fs.cp(rootPlaywrightReport, this.playwrightReportDir, { recursive: true, force: true });
      } catch (e) {
        // If copy fails or report doesn't exist, fall back to minimal report below
        console.warn('Copy of Playwright HTML report failed or not found, generating minimal report instead:', e.message);
      }
      
      const testResults = await this.fileStorage.getTestResults();
      const completedTests = testResults.filter(test => test.status === 'passed' || test.status === 'failed');
      
      const reportData = {
        summary: {
          total: testResults.length,
          passed: testResults.filter(t => t.status === 'passed').length,
          failed: testResults.filter(t => t.status === 'failed').length,
          running: testResults.filter(t => t.status === 'running').length,
          duration: completedTests.reduce((sum, test) => sum + (test.results?.duration || 0), 0)
        },
        tests: completedTests.map(test => ({
          id: test._id,
          name: test.testName,
          status: test.status,
          duration: test.results?.duration || 0,
          browser: test.browser,
          headless: test.headless,
          environment: test.environment,
          createdAt: test.createdAt,
          completedAt: test.completedAt,
          steps: test.results?.steps || [],
          error: test.results?.error || null,
          screenshots: test.results?.screenshots || []
        }))
      };

      // If the copied report does not have index.html, write a minimal one
      const indexPath = path.join(this.playwrightReportDir, 'index.html');
      let needMinimal = false;
      try {
        await fs.access(indexPath);
      } catch {
        needMinimal = true;
      }
      if (needMinimal) {
        const htmlContent = this.generatePlaywrightHTML(reportData);
        await fs.writeFile(indexPath, htmlContent);
      }

      return {
        success: true,
        path: '/reports/playwright/index.html',
        message: 'Playwright report generated successfully'
      };
    } catch (error) {
      console.error('Error generating Playwright report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generatePlaywrightHTML(data) {
    const rows = data.tests.map(t => `
      <tr>
        <td>${t.name || ''}</td>
        <td>${t.status}</td>
        <td>${Math.round((t.duration || 0) / 1000)}s</td>
        <td>${t.browser || ''} ${t.headless ? '(headless)' : ''}</td>
        <td>${t.environment || ''}</td>
        <td>${t.error ? `<pre>${String(t.error)}</pre>` : ''}</td>
      </tr>
    `).join('');
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Playwright Report</title>
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
  <h1>Playwright Report</h1>
  <div class="summary">
    <strong>Total:</strong> ${data.summary.total} &nbsp; 
    <strong class="passed">Passed:</strong> ${data.summary.passed} &nbsp; 
    <strong class="failed">Failed:</strong> ${data.summary.failed} &nbsp; 
    <strong>Running:</strong> ${data.summary.running} &nbsp; 
    <strong>Duration:</strong> ${Math.round((data.summary.duration || 0) / 1000)}s
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
  
 
  async generateAllureReport() {
    try {
      await this.ensureDirectories();
      
      const testResults = await this.fileStorage.getTestResults();
      const completedTests = testResults.filter(test => test.status === 'passed' || test.status === 'failed');
      
      const allureData = {
        summary: {
          total: testResults.length,
          passed: testResults.filter(t => t.status === 'passed').length,
          failed: testResults.filter(t => t.status === 'failed').length,
          broken: 0,
          skipped: 0,
          unknown: 0
        },
        tests: completedTests.map(test => ({
          uuid: test._id,
          name: test.testName,
          fullName: `${test.testType} - ${test.testName}`,
          status: test.status === 'passed' ? 'passed' : 'failed',
          duration: test.results?.duration || 0,
          startTime: new Date(test.createdAt).getTime(),
          stopTime: new Date(test.completedAt).getTime(),
          parameters: [
            { name: 'browser', value: test.browser },
            { name: 'headless', value: test.headless.toString() },
            { name: 'environment', value: test.environment }
          ],
          steps: test.results?.steps || [],
          attachments: test.results?.screenshots || []
        }))
      };

      const htmlContent = this.generateAllureHTML(allureData);
      const indexPath = path.join(this.allureReportDir, 'index.html');
      await fs.writeFile(indexPath, htmlContent);

      return {
        success: true,
        path: '/reports/allure/index.html',
        message: 'Allure report generated successfully'
      };
    } catch (error) {
      console.error('Error generating Allure report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateAllureHTML(data) {
    // Minimal synthetic Allure-like summary page
    const rows = data.tests.map(t => `
      <tr>
        <td>${t.name || ''}</td>
        <td>${t.status}</td>
        <td>${Math.round((t.duration || 0) / 1000)}s</td>
        <td>${t.parameters?.map(p => `${p.name}: ${p.value}`).join('<br/>') || ''}</td>
      </tr>
    `).join('');
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Allure Report (Lite)</title>
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
  <h1>Allure Report (Lite)</h1>
  <div class="summary">
    <strong>Total:</strong> ${data.summary.total} &nbsp; 
    <strong class="passed">Passed:</strong> ${data.summary.passed} &nbsp; 
    <strong class="failed">Failed:</strong> ${data.summary.failed} &nbsp; 
  </div>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Duration</th>
        <th>Parameters</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
  }
  
  
  async getReportStatus() {
    try {
      await this.ensureDirectories();
      
      const playwrightExists = await this.checkFileExists(path.join(this.playwrightReportDir, 'index.html'));
      const allureExists = await this.checkFileExists(path.join(this.allureReportDir, 'index.html'));
      
      return {
        playwright: { 
          available: playwrightExists, 
          path: '/reports/playwright/index.html' 
        },
        allure: { 
          available: allureExists, 
          path: '/reports/allure/index.html' 
        }
      };
    } catch (error) {
      console.error('Error checking report status:', error);
      return {
        playwright: { available: false, path: '/reports/playwright/index.html' },
        allure: { available: false, path: '/reports/allure/index.html' }
      };
    }
  }

  async checkFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = ReportGenerator;
