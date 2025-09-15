import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Setup for Playwright Tests
 * Handles session management and test skipping logic
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Create storage state file if it doesn't exist
  const storageStatePath = 'storageState.json';
  
  // Check if we need to run login tests
  const shouldRunLoginTests = process.env.RUN_LOGIN_TESTS === 'true' || !fs.existsSync(storageStatePath);
  
  if (shouldRunLoginTests) {
    console.log('🔐 Login tests will be run during test execution...');
  } else {
    console.log('✅ Session already exists, login tests will be skipped');
  }
  
  // Set environment variable for test skipping
  process.env.SKIP_LOGIN_TESTS = shouldRunLoginTests ? 'false' : 'true';
  
  console.log('✅ Global setup completed');
}


export default globalSetup;