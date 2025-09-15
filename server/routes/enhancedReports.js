const express = require('express');
const router = express.Router();
const EnhancedReportGenerator = require('../services/EnhancedReportGenerator');

const enhancedReportGenerator = new EnhancedReportGenerator();

// Generate fresh Allure report with cleanup
router.post('/allure/clean-generate', async (req, res) => {
  try {
    console.log('🧹 Generating fresh Allure report with cleanup...');
    
    const result = await enhancedReportGenerator.generateAllureReportWithCleanup();
    
    res.json({
      success: true,
      message: 'Allure report generated with cleanup',
      result: result
    });
  } catch (error) {
    console.error('Error generating Allure report with cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate fresh Playwright report with cleanup
router.post('/playwright/clean-generate', async (req, res) => {
  try {
    console.log('🧹 Generating fresh Playwright report with cleanup...');
    
    const result = await enhancedReportGenerator.generatePlaywrightReportWithCleanup();
    
    res.json({
      success: true,
      message: 'Playwright report generated with cleanup',
      result: result
    });
  } catch (error) {
    console.error('Error generating Playwright report with cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clean all old reports
router.post('/clean-all', async (req, res) => {
  try {
    console.log('🧹 Cleaning all old reports...');
    
    const result = await enhancedReportGenerator.cleanAllReports();
    
    res.json({
      success: true,
      message: 'All old reports cleaned successfully',
      result: result
    });
  } catch (error) {
    console.error('Error cleaning reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate fresh reports with cleanup
router.post('/fresh-generate', async (req, res) => {
  try {
    console.log('🔄 Generating fresh reports with cleanup...');
    
    const result = await enhancedReportGenerator.generateFreshReports();
    
    res.json({
      success: true,
      message: 'Fresh reports generated successfully',
      result: result
    });
  } catch (error) {
    console.error('Error generating fresh reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get report status
router.get('/status', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const allureReportPath = path.join(__dirname, '../services/reports/allure/index.html');
    const playwrightReportPath = path.join(__dirname, '../services/reports/playwright/index.html');
    
    const allureExists = await fs.access(allureReportPath).then(() => true).catch(() => false);
    const playwrightExists = await fs.access(playwrightReportPath).then(() => true).catch(() => false);
    
    res.json({
      success: true,
      reports: {
        allure: {
          available: allureExists,
          path: '/reports/allure/index.html',
          lastModified: allureExists ? (await fs.stat(allureReportPath)).mtime : null
        },
        playwright: {
          available: playwrightExists,
          path: '/reports/playwright/index.html',
          lastModified: playwrightExists ? (await fs.stat(playwrightReportPath)).mtime : null
        }
      }
    });
  } catch (error) {
    console.error('Error getting report status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
