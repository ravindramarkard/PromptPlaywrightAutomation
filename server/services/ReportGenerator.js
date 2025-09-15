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
      const apiExists = await this.checkFileExists(path.join(this.reportsDir, 'api', 'index.html'));
      
      return {
        playwright: { 
          available: playwrightExists, 
          path: 'http://localhost:5051/reports/playwright/index.html' 
        },
        allure: { 
          available: allureExists, 
          path: 'http://localhost:5051/reports/allure/index.html' 
        },
        api: { 
          available: apiExists, 
          path: 'http://localhost:5051/reports/api/index.html' 
        }
      };
    } catch (error) {
      console.error('Error checking report status:', error);
      return {
        playwright: { available: false, path: 'http://localhost:5051/reports/playwright/index.html' },
        allure: { available: false, path: 'http://localhost:5051/reports/allure/index.html' },
        api: { available: false, path: 'http://localhost:5051/reports/api/index.html' }
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

  async generateApiReport() {
    try {
      await this.ensureDirectories();
      
      const apiReportDir = path.join(this.reportsDir, 'api');
      await fs.mkdir(apiReportDir, { recursive: true });
      
      const testResults = await this.fileStorage.getTestResults();
      const apiTests = testResults.filter(test => test.testType === 'API Test' || test.testType === 'API');
      
      const reportData = {
        summary: {
          total: apiTests.length,
          passed: apiTests.filter(t => t.status === 'passed').length,
          failed: apiTests.filter(t => t.status === 'failed').length,
          running: apiTests.filter(t => t.status === 'running').length,
          duration: apiTests.reduce((sum, test) => sum + (test.results?.duration || 0), 0)
        },
        tests: apiTests.map(test => ({
          name: test.testName || 'Unnamed API Test',
          status: test.status,
          duration: test.results?.duration || 0,
          endpoint: test.results?.endpoint || 'Unknown',
          method: test.results?.method || 'Unknown',
          statusCode: test.results?.statusCode || 'N/A',
          createdAt: test.createdAt,
          completedAt: test.completedAt
        }))
      };
      
      const htmlContent = this.generateApiHTML(reportData);
      await fs.writeFile(path.join(apiReportDir, 'index.html'), htmlContent);
      
      console.log('API report generated successfully');
      return true;
    } catch (error) {
      console.error('Error generating API report:', error);
      return false;
    }
  }

  generateApiHTML(data) {
    const rows = data.tests.map(t => `
      <tr>
        <td>${t.name || ''}</td>
        <td><span class="method">${t.method || ''}</span></td>
        <td><span class="endpoint">${t.endpoint || ''}</span></td>
        <td>${t.statusCode || 'N/A'}</td>
        <td class="${t.status}">${t.status}</td>
        <td>${Math.round((t.duration || 0) / 1000)}s</td>
        <td>${new Date(t.createdAt).toLocaleString()}</td>
      </tr>
    `).join('');
    
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>API Test Report</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; background: #f8f9fa; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e9ecef; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat-card { background: #f8f9fa; padding: 16px; border-radius: 6px; text-align: center; min-width: 120px; }
    .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
    .stat-label { font-size: 14px; color: #6c757d; }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .running { color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px; border-bottom: 1px solid #dee2e6; text-align: left; }
    th { background: #f8f9fa; font-weight: 600; }
    .method { font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
    .endpoint { font-family: monospace; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>API Test Report</h1>
      <p>Comprehensive API testing results and performance metrics</p>
    </div>
    
    <div class="summary">
      <div class="stat-card">
        <div class="stat-number">${data.summary.total}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card">
        <div class="stat-number passed">${data.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number failed">${data.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.running}</div>
        <div class="stat-label">Running</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Math.round(data.summary.duration / 1000)}s</div>
        <div class="stat-label">Total Duration</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Method</th>
          <th>Endpoint</th>
          <th>Status Code</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }

  async isReportAvailable(reportType) {
    try {
      const reportPath = reportType === 'playwright' ? this.playwrightReportDir : 
                        reportType === 'api' ? path.join(this.reportsDir, 'api') : this.allureReportDir;
      const indexPath = path.join(reportPath, 'index.html');
      await fs.access(indexPath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = ReportGenerator;
