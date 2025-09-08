import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('HR Login Test', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    try {
      allure.epic('HR Management System');
      allure.feature('Authentication');
      allure.story('User Login');
      
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      page = await context.newPage();
      
      allure.addParameter('Base URL', BASE_URL);
      allure.addParameter('Browser', BROWSER_TYPE);
      allure.addParameter('Headless Mode', HEADLESS_MODE.toString());
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await allure.attachment('Page Screenshot', await page.screenshot(), 'image/png');
    } catch (error) {
      await allure.attachment('Initialization Error', error.toString(), 'text/plain');
      throw error;
    }
  });

  test('Login with Admin credentials', async () => {
    try {
      allure.severity('critical');
      allure.tag('login');
      allure.tag('authentication');
      allure.tag('smoke');

      // Verify login page is loaded
      await expect(page).toHaveURL(BASE_URL);
      await expect(page).toHaveTitle('OrangeHRM');
      
      // Wait for login form to be visible
      await page.waitForSelector('[data-testid="login-form"]', { timeout: 30000 });
      
      // Fill username
      await page.locator('[name="username"]').fill('Admin');
      await allure.attachment('Username Filled', await page.screenshot(), 'image/png');
      
      // Fill password
      await page.locator('[name="password"]').fill('admin123');
      await allure.attachment('Password Filled', await page.screenshot(), 'image/png');
      
      // Click login button
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for navigation and dashboard to load
      await page.waitForURL('**/dashboard/index**', { timeout: 30000 });
      await page.waitForSelector('[data-testid="dashboard-widget"]', { timeout: 30000 });
      
      // Verify successful login
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.locator('[data-testid="dashboard-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="welcome-header"]')).toContainText('Welcome');
      
      await allure.attachment('Login Success', await page.screenshot(), 'image/png');
      allure.addParameter('Username', 'Admin');
      allure.addParameter('Password', 'admin123 (masked)');
      
    } catch (error) {
      await allure.attachment('Test Failure Screenshot', await page.screenshot(), 'image/png');
      await allure.attachment('Error Details', error.toString(), 'text/plain');
      throw error;
    }
  });

  test.afterEach(async () => {
    try {
      await page.close();
    } catch (error) {
      console.error('Error during teardown:', error);
    }
  });
});