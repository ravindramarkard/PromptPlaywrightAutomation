const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to automatically add global login functionality to existing test files
 */

const TEST_FILES_PATTERN = 'tests/**/*.spec.ts';
const AUTH_IMPORT = "import { skipLoginIfAuthenticated, performLogin } from '../test-utils/auth-helper';";

function addGlobalLoginToTestFile(filePath) {
  console.log(`📝 Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has auth helper import
    if (content.includes('auth-helper')) {
      console.log(`⏭️  Skipping ${filePath} - already has auth helper`);
      return;
    }
    
    // Add import statement after existing imports
    const importRegex = /(import.*from.*['"];?\s*)+/g;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertIndex) + '\n' + AUTH_IMPORT + '\n' + content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      content = AUTH_IMPORT + '\n\n' + content;
    }
    
    // Add beforeEach hook for global login
    const describeRegex = /(test\.describe\([^)]+\)\s*\{)/g;
    const describeMatch = content.match(describeRegex);
    
    if (describeMatch) {
      const firstDescribe = describeMatch[0];
      const firstDescribeIndex = content.indexOf(firstDescribe);
      const insertIndex = firstDescribeIndex + firstDescribe.length;
      
      const beforeEachHook = `
  test.beforeEach(async ({ page }) => {
    // Global login - first test will login, others will skip
    await skipLoginIfAuthenticated(page, async () => {
      await performLogin(page, {
        baseUrl: process.env.BASE_URL || 'http://localhost:5050',
        username: process.env.USERNAME || 'admin',
        password: process.env.PASSWORD || 'password'
      });
    });
  });`;
      
      content = content.slice(0, insertIndex) + beforeEachHook + '\n' + content.slice(insertIndex);
    }
    
    // Write the modified content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Adding global login functionality to test files...');
  
  const testFiles = glob.sync(TEST_FILES_PATTERN, { 
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/example-global-login.spec.ts']
  });
  
  console.log(`📁 Found ${testFiles.length} test files to process`);
  
  testFiles.forEach(filePath => {
    addGlobalLoginToTestFile(filePath);
  });
  
  console.log('✅ Global login setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Run your test suite - first test will login, others will skip');
  console.log('2. Check console logs to see login skipping in action');
  console.log('3. Verify that storageState.json is created for session reuse');
}

if (require.main === module) {
  main();
}

module.exports = { addGlobalLoginToTestFile };
