import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Skipper Utility
 * Handles skipping tests based on session state and test dependencies
 */

export interface TestConfig {
  requiresLogin?: boolean;
  skipIfLoggedIn?: boolean;
  dependsOn?: string[];
  testType?: 'login' | 'admin' | 'pmi' | 'general';
}

export class TestSkipper {
  private static sessionFilePath = 'storageState.json';
  private static testResults: Map<string, boolean> = new Map();

  /**
   * Check if session exists and is valid
   */
  static hasValidSession(): boolean {
    if (!fs.existsSync(this.sessionFilePath)) {
      return false;
    }

    try {
      const sessionData = JSON.parse(fs.readFileSync(this.sessionFilePath, 'utf8'));
      return sessionData && sessionData.cookies && sessionData.cookies.length > 0;
    } catch (error) {
      console.log('⚠️ Invalid session file, will need to login');
      return false;
    }
  }

  /**
   * Check if user is already logged in on the current page
   */
  static async isAlreadyLoggedIn(page: Page): Promise<boolean> {
    try {
      // Check for common authenticated state indicators
      const indicators = [
        'text=Logout',
        'text=Sign Out',
        'text=Log out',
        '[data-testid="logout"]',
        '[data-testid="sign-out"]',
        '[data-testid="user-menu"]',
        '[data-testid="profile"]',
        '.user-menu',
        '.profile-menu',
        '[data-testid="dashboard"]',
        'text=Dashboard',
        'text=Welcome',
        'text=My Account',
        'text=Settings',
        'text=Profile',
      ];

      for (const indicator of indicators) {
        try {
          const element = page.locator(indicator).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`✅ Found authenticated state indicator: ${indicator}`);
            return true;
          }
        } catch (error) {
          // Continue checking other indicators
        }
      }

      // Check if we're on a page that requires authentication (not login page)
      const currentUrl = page.url();
      const loginIndicators = ['/login', '/signin', '/auth', '/sign-in'];
      const isOnLoginPage = loginIndicators.some(indicator => currentUrl.includes(indicator));
      
      if (!isOnLoginPage && !currentUrl.includes('/login') && currentUrl !== 'about:blank') {
        console.log(`✅ Not on login page, assuming authenticated: ${currentUrl}`);
        return true;
      }

      return false;
    } catch (error) {
      console.log('⚠️ Error checking login state:', error);
      return false;
    }
  }

  /**
   * Skip test if conditions are met
   */
  static async skipTestIfNeeded(page: Page, config: TestConfig): Promise<boolean> {
    const { requiresLogin = false, skipIfLoggedIn = false, dependsOn = [] } = config;

    // Check if we should skip because user is already logged in
    if (skipIfLoggedIn) {
      const isLoggedIn = await this.isAlreadyLoggedIn(page);
      if (isLoggedIn) {
        console.log('🚀 User is already logged in, skipping login test');
        return true;
      }
    }

    // Check if we should skip because login is required but session doesn't exist
    if (requiresLogin && !this.hasValidSession()) {
      console.log('⚠️ Login required but no valid session found, skipping test');
      return true;
    }

    // Check dependencies
    for (const dependency of dependsOn) {
      if (!this.testResults.get(dependency)) {
        console.log(`⚠️ Test depends on '${dependency}' which hasn't passed, skipping test`);
        return true;
      }
    }

    return false;
  }

  /**
   * Mark a test as passed
   */
  static markTestPassed(testName: string): void {
    this.testResults.set(testName, true);
    console.log(`✅ Test '${testName}' marked as passed`);
  }

  /**
   * Mark a test as failed
   */
  static markTestFailed(testName: string): void {
    this.testResults.set(testName, false);
    console.log(`❌ Test '${testName}' marked as failed`);
  }

  /**
   * Clear all test results
   */
  static clearTestResults(): void {
    this.testResults.clear();
    console.log('🗑️ Test results cleared');
  }

  /**
   * Get test results
   */
  static getTestResults(): Map<string, boolean> {
    return new Map(this.testResults);
  }
}

/**
 * Decorator function to skip tests based on configuration
 */
export function skipIf(condition: (page: Page) => Promise<boolean>, reason: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const page = args[0]; // Assuming first argument is page
      
      if (await condition(page)) {
        console.log(`⏭️ Skipping test '${propertyKey}': ${reason}`);
        test.skip();
        return;
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Helper function to create conditional test
 */
export function conditionalTest(name: string, config: TestConfig, testFn: (page: Page) => Promise<void>) {
  test(name, async ({ page }) => {
    const shouldSkip = await TestSkipper.skipTestIfNeeded(page, config);
    
    if (shouldSkip) {
      test.skip();
      return;
    }
    
    await testFn(page);
  });
}

/**
 * Helper function for login tests
 */
export function loginTest(name: string, testFn: (page: Page) => Promise<void>) {
  conditionalTest(name, { 
    requiresLogin: false, 
    skipIfLoggedIn: true,
    testType: 'login' 
  }, testFn);
}

/**
 * Helper function for admin tests
 */
export function adminTest(name: string, testFn: (page: Page) => Promise<void>) {
  conditionalTest(name, { 
    requiresLogin: true, 
    dependsOn: ['login'],
    testType: 'admin' 
  }, testFn);
}

/**
 * Helper function for PMI tests
 */
export function pmiTest(name: string, testFn: (page: Page) => Promise<void>) {
  conditionalTest(name, { 
    requiresLogin: true, 
    dependsOn: ['login'],
    testType: 'pmi' 
  }, testFn);
}

/**
 * Helper function for general tests
 */
export function generalTest(name: string, testFn: (page: Page) => Promise<void>) {
  conditionalTest(name, { 
    requiresLogin: false,
    testType: 'general' 
  }, testFn);
}
