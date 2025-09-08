import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE === 'true';

test.describe('HR Test', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.epic('HR Management System');
    await allure.feature('Authentication');
    await allure.story('User Login');

    try {
      page = await browser.newPage({
        baseURL: BASE_URL,
        viewport: { width: 1280, height: 720 }
      });

      await allure.step('Navigate to login page', async () => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      });
    } catch (error) {
      await allure.step('Setup failed', async () => {
        await allure.attachment('setup-failure.png', await page.screenshot(), 'image/png');
        throw error;
      });
    }
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Login with Admin credentials', async () => {
    await allure.tag('UI');
    await allure.tag('Authentication');
    await allure.severity('critical');

    try {
      await allure.step('Enter username', async () => {
        const usernameInput = page.locator('[name="username"]');
        await expect(usernameInput).toBeVisible();
        await usernameInput.fill('Admin');
      });

      await allure.step('Enter password', async () => {
        const passwordInput = page.locator('[name="password"]');
        await expect(passwordInput).toBeVisible();
        await passwordInput.fill('admin123');
      });

      await allure.step('Click login button', async () => {
        const loginButton = page.locator('button:has-text("Login")');
        await expect(loginButton).toBeEnabled();
        await loginButton.click();
      });

      await allure.step('Verify successful login', async () => {
        await page.waitForURL('**/dashboard/index');
        const dashboardHeader = page.locator('h6:has-text("Dashboard")');
        await expect(dashboardHeader).toBeVisible({ timeout: 10000 });
        
        const userDropdown = page.locator('.oxd-userdropdown-tab');
        await expect(userDropdown).toBeVisible();
      });

      await allure.step('Capture success screenshot', async () => {
        await allure.attachment('login-success.png', await page.screenshot(), 'image/png');
      });

    } catch (error) {
      await allure.step('Test failed', async () => {
        await allure.attachment('failure-screenshot.png', await page.screenshot(), 'image/png');
        throw error;
      });
    }
  });
});