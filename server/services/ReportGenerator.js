const fs = require('fs').promises;
const path = require('path');
const FileStorage = require('./FileStorage');

class ReportGenerator {
  constructor() {
    this.fileStorage = new FileStorage();
    this.reportsDir = path.join(__dirname, '..', 'allure-report');
    this.playwrightReportDir = path.join(this.reportsDir, 'playwright');
    this.allureReportDir = path.join(this.reportsDir, 'allure-report');
  }

  async ensureDirectories() {
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.mkdir(this.playwrightReportDir, { recursive: true });
    await fs.mkdir(this.allureReportDir, { recursive: true });
  }

  async generatePlaywrightReport() {
    try {
      await this.ensureDirectories();
      
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

      const htmlContent = this.generatePlaywrightHTML(reportData);
      const indexPath = path.join(this.playwrightReportDir, 'index.html');
      await fs.writeFile(indexPath, htmlContent);

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
        path: '/allure-report/index.html',
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
          path: '/allure-report/index.html' 
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
