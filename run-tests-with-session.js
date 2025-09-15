#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test Runner with Session Management
 * Runs tests in the correct order to handle session sharing
 */

const TEST_ORDER = [
  'tests/spec1-login.spec.ts',
  'tests/spec2-admin.spec.ts', 
  'tests/spec3-pmi.spec.ts'
];

const STORAGE_STATE_PATH = 'storageState.json';

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function runCommand(command, description) {
  log(`🚀 ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`);
    return false;
  }
}

function checkSessionExists() {
  return fs.existsSync(STORAGE_STATE_PATH);
}

function clearSession() {
  if (fs.existsSync(STORAGE_STATE_PATH)) {
    fs.unlinkSync(STORAGE_STATE_PATH);
    log('🗑️ Cleared existing session');
  }
}

function runTestsInOrder() {
  log('🎯 Starting test execution with session management');
  
  // Clear any existing session
  clearSession();
  
  let allPassed = true;
  
  for (let i = 0; i < TEST_ORDER.length; i++) {
    const specFile = TEST_ORDER[i];
    const specName = path.basename(specFile, '.spec.ts');
    
    log(`📋 Running ${specName} (${i + 1}/${TEST_ORDER.length})`);
    
    // Set environment variables for test skipping
    process.env.SKIP_LOGIN_TESTS = i > 0 ? 'true' : 'false';
    process.env.RUN_LOGIN_TESTS = i === 0 ? 'true' : 'false';
    
    // Run the specific test file
    const command = `npx playwright test ${specFile} --reporter=line`;
    const success = runCommand(command, `Running ${specName}`);
    
    if (!success) {
      log(`❌ ${specName} failed, stopping execution`);
      allPassed = false;
      break;
    }
    
    // Check if session was created (for login tests)
    if (i === 0 && !checkSessionExists()) {
      log('⚠️ Login test completed but no session was saved');
    }
    
    log(`✅ ${specName} completed successfully`);
  }
  
  if (allPassed) {
    log('🎉 All tests completed successfully!');
  } else {
    log('💥 Some tests failed');
    process.exit(1);
  }
}

function runAllTests() {
  log('🎯 Running all tests with session management');
  
  // Set environment variables
  process.env.SKIP_LOGIN_TESTS = 'false';
  process.env.RUN_LOGIN_TESTS = 'true';
  
  const command = 'npx playwright test --reporter=line';
  const success = runCommand(command, 'Running all tests');
  
  if (!success) {
    log('💥 Tests failed');
    process.exit(1);
  }
  
  log('🎉 All tests completed!');
}

function runSpecificSpec(specName) {
  const specFile = TEST_ORDER.find(file => file.includes(specName));
  
  if (!specFile) {
    log(`❌ Spec '${specName}' not found`);
    log(`Available specs: ${TEST_ORDER.map(f => path.basename(f, '.spec.ts')).join(', ')}`);
    process.exit(1);
  }
  
  log(`🎯 Running specific spec: ${specName}`);
  
  // Check if session exists for non-login specs
  if (!specName.includes('login') && !checkSessionExists()) {
    log('⚠️ No session found, running login tests first...');
    
    // Run login tests first
    process.env.SKIP_LOGIN_TESTS = 'false';
    process.env.RUN_LOGIN_TESTS = 'true';
    
    const loginCommand = `npx playwright test ${TEST_ORDER[0]} --reporter=line`;
    const loginSuccess = runCommand(loginCommand, 'Running login tests');
    
    if (!loginSuccess) {
      log('❌ Login tests failed, cannot run dependent tests');
      process.exit(1);
    }
  }
  
  // Set environment for the specific spec
  process.env.SKIP_LOGIN_TESTS = specName.includes('login') ? 'false' : 'true';
  process.env.RUN_LOGIN_TESTS = specName.includes('login') ? 'true' : 'false';
  
  const command = `npx playwright test ${specFile} --reporter=line`;
  const success = runCommand(command, `Running ${specName}`);
  
  if (!success) {
    log(`💥 ${specName} failed`);
    process.exit(1);
  }
  
  log(`🎉 ${specName} completed successfully!`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'order':
    runTestsInOrder();
    break;
  case 'all':
    runAllTests();
    break;
  case 'spec':
    const specName = args[1];
    if (!specName) {
      log('❌ Please specify a spec name');
      log('Usage: node run-tests-with-session.js spec <spec-name>');
      log(`Available specs: ${TEST_ORDER.map(f => path.basename(f, '.spec.ts')).join(', ')}`);
      process.exit(1);
    }
    runSpecificSpec(specName);
    break;
  case 'clear':
    clearSession();
    log('✅ Session cleared');
    break;
  default:
    log('🎯 Test Runner with Session Management');
    log('');
    log('Usage:');
    log('  node run-tests-with-session.js order    - Run tests in correct order');
    log('  node run-tests-with-session.js all      - Run all tests');
    log('  node run-tests-with-session.js spec <name> - Run specific spec');
    log('  node run-tests-with-session.js clear    - Clear session');
    log('');
    log(`Available specs: ${TEST_ORDER.map(f => path.basename(f, '.spec.ts')).join(', ')}`);
    break;
}
