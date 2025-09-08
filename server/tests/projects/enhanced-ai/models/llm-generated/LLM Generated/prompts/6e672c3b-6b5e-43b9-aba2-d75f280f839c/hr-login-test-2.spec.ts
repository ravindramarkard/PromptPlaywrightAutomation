import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('HR Login Test 2', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('HR Management System');
    await allure.feature('Authentication');
    await allure.story('User Login');
    
    await page.setDefaultTimeout(30000);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      const screenshot = await page.screenshot();
      await allure.attachment('Screenshot on Failure', screenshot, 'image/png');
    }
  });

  test('Navigate to login page and login with Admin/admin123', async ({ page }) => {
    await allure.tag('UI');
    await allure.tag('Login');
    await allure.severity('critical');

    try {
      // Step 1: Navigate to login page
      await allure.step('Navigate to login page', async () => {
        await page.goto(BASE_URL);
        await expect(page).toHaveURL(BASE_URL);
        await expect(page).toHaveTitle('OrangeHRM');
      });

      // Step 2: Wait for login form to be visible
      await allure.step('Wait for login form', async () => {
        await page.waitForSelector('[data-testid="login-form"]', { state: 'visible' });
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      });

      // Step 3: Fill username
      await allure.step('Fill username field', async () => {
        const usernameInput = page.locator('[name="username"]');
        await expect(usernameInput).toBeVisible();
        await usernameInput.fill('Admin');
        await expect(usernameInput).toHaveValue('Admin');
      });

      // Step 4: Fill password
      await allure.step('Fill password field', async () => {
        const passwordInput = page.locator('[name="password"]');
        await expect(passwordInput).toBeVisible();
        await passwordInput.fill('admin123');
        await expect(passwordInput).toHaveValue('admin123');
      });

      // Step 5: Click login button
      await allure.step('Click login button', async () => {
        const loginButton = page.locator('[type="submit"]');
        await expect(loginButton).toBeVisible();
        await loginButton.click();
      });

      // Step 6: Verify successful login
      await allure.step('Verify successful login', async () => {
        await page.waitForURL('**/dashboard/index**');
        await expect(page).toHaveURL(/dashboard/);
        
        // Wait for dashboard elements to load
        await page.waitForSelector('[data-testid="dashboard-widget"]', { state: 'visible' });
        await expect(page.locator('[data-testid="dashboard-widget"]')).toBeVisible();
        
        // Verify user menu is visible
        await page.waitForSelector('[data-testid="user-dropdown"]', { state: 'visible' });
        await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible();
      });

      await allure.attachment('Login Success', 'User successfully logged in with Admin credentials', 'text/plain');

    } catch (error) {
      await allure.attachment('Error Details', error.message, 'text/plain');
      throw error;
    }
  });
});