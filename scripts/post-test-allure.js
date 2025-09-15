#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * Post-test script to automatically generate Allure report
 * This script runs after Playwright tests complete
 */
async function generateAllureReport() {
  console.log('🔄 Auto-generating Allure report...');
  
  const projectRoot = path.join(__dirname, '..');
  const allureResultsDir = path.join(projectRoot, 'allure-results');
  const allureReportDir = path.join(projectRoot, 'server', 'reports', 'allure');
  
  return new Promise((resolve, reject) => {
    const allureCommand = spawn('npx', [
      'allure', 
      'generate', 
      allureResultsDir, 
      '--clean', 
      '-o', 
      allureReportDir
    ], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    allureCommand.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Allure report auto-generated successfully');
        console.log('📊 Report available at: http://localhost:5051/reports/allure/index.html');
        resolve();
      } else {
        console.log('⚠️ Allure report auto-generation failed with code:', code);
        reject(new Error(`Allure generation failed with code ${code}`));
      }
    });

    allureCommand.on('error', (error) => {
      console.log('⚠️ Allure command error:', error.message);
      reject(error);
    });
  });
}

// Run the script
if (require.main === module) {
  generateAllureReport()
    .then(() => {
      console.log('🎉 Post-test Allure generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Post-test Allure generation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateAllureReport };