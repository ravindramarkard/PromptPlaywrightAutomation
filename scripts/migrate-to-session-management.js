const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to migrate existing test files to use spec-level session management
 */

const TEST_FILES_PATTERN = 'tests/**/*.spec.ts';
const SESSION_IMPORT = "import { SessionManager, createContextWithSession, saveSessionAfterLogin, shouldSkipLogin } from '../test-utils/session-manager';";

function migrateTestFile(filePath) {
  console.log(`📝 Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has session manager import
    if (content.includes('session-manager')) {
      console.log(`⏭️  Skipping ${filePath} - already has session manager`);
      return;
    }
    
    // Add import statement after existing imports
    const importRegex = /(import.*from.*['"];?\s*)+/g;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertIndex) + '\n' + SESSION_IMPORT + '\n' + content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      content = SESSION_IMPORT + '\n\n' + content;
    }
    
    // Update beforeEach to use createContextWithSession
    content = content.replace(
      /const context = await browser\.newContext\(\{[\s\S]*?\}\);/g,
      `const context = await createContextWithSession(browser, {
      viewport: { width: 1920, height: 1080 }
    });`
    );
    
    // Add session check at the beginning of each test
    content = content.replace(
      /(test\('[^']+', async \(\) => \{)/g,
      `$1
    try {
      await allure.step('1. Check if already logged in', async () => {
        const isLoggedIn = await shouldSkipLogin(page);
        if (isLoggedIn) {
          console.log('🚀 Already logged in, skipping login');
          return;
        }
      });`
    );
    
    // Add session save after login validation
    content = content.replace(
      /(await page\.context\(\)\.storageState\(\{ path: 'storageState\.json' \}\);\s*)/g,
      `await saveSessionAfterLogin(page);
      console.log('✅ Session saved for subsequent tests');`
    );
    
    // Write the modified content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Migrating test files to use spec-level session management...');
  
  const testFiles = glob.sync(TEST_FILES_PATTERN, { 
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/example-*.spec.ts']
  });
  
  console.log(`📁 Found ${testFiles.length} test files to process`);
  
  testFiles.forEach(filePath => {
    migrateTestFile(filePath);
  });
  
  console.log('✅ Migration complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the updated test files');
  console.log('2. Update login logic in your tests to use the new session management');
  console.log('3. Run your test suite - first test will login and save session, others will skip');
  console.log('4. Check console logs to see session management in action');
}

if (require.main === module) {
  main();
}

module.exports = { migrateTestFile };
