import { test, expect } from '@playwright/test';
import { skipLoginIfAuthenticated, performLogin } from './auth-helper';

/**
 * Template for creating tests that use global login functionality
 * 
 * Usage:
 * 1. Import this template in your test files
 * 2. Use skipLoginIfAuthenticated() to wrap your login logic
 * 3. The first test will perform login, subsequent tests will skip it
 */

test.describe('Your Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // This will be called before each test
    // The first test will perform login, others will skip
    await skipLoginIfAuthenticated(page, async () => {
      await performLogin(page, {
        baseUrl: process.env.BASE_URL || 'http://localhost:5050',
        username: process.env.USERNAME || 'admin',
        password: process.env.PASSWORD || 'password'
      });
    });
  });

  test('Test 1 - Login will be performed', async ({ page }) => {
    // Your test logic here
    // This test will perform login since it's the first one
    console.log('🧪 Test 1 - Login will be performed');
    
    // Example: Navigate to a protected page
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Test 2 - Login will be skipped', async ({ page }) => {
    // Your test logic here
    // This test will skip login since Test 1 already logged in
    console.log('🧪 Test 2 - Login will be skipped');
    
    // Example: Navigate to another protected page
    await page.goto('/settings');
    await expect(page).toHaveURL(/settings/);
  });

  test('Test 3 - Login will also be skipped', async ({ page }) => {
    // Your test logic here
    // This test will also skip login
    console.log('🧪 Test 3 - Login will also be skipped');
    
    // Example: Navigate to another protected page
    await page.goto('/profile');
    await expect(page).toHaveURL(/profile/);
  });
});

/**
 * Alternative approach - Manual login control per test
 */
test.describe('Manual Login Control', () => {
  test('Test with manual login control', async ({ page }) => {
    // Check if already logged in
    const isLoggedIn = await skipLoginIfAuthenticated(page, async () => {
      // This will only run if not already logged in
      console.log('🔐 Performing login...');
      await performLogin(page);
    });

    // Your test logic here
    console.log('🧪 Test with manual login control');
  });
});
