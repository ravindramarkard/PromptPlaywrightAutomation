import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Orange-HR UI Tests', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    allure.epic('Orange-HR Application');
    allure.feature('UI Functionality');
    allure.story('Orange-HR Test Scenario');
    
    page = await browser.newPage({
      baseURL: BASE_URL
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Orange-HR test scenario', async () => {
    allure.tag('UI');
    allure.tag('Orange-HR');
    allure.severity('normal');

    try {
      allure.step('Navigate to Orange-HR login page', async () => {
        await expect(page).toHaveURL(BASE_URL);
        await expect(page).toHaveTitle('OrangeHRM');
      });

      // Since the prompt "fdsfds" doesn't provide specific test steps,
      // this is a placeholder test that verifies the login page loads correctly
      allure.step('Verify login page elements are visible', async () => {
        const usernameField = page.locator('[name="username"]');
        const passwordField = page.locator('[name="password"]');
        const loginButton = page.locator('button[type="submit"]');
        
        await expect(usernameField).toBeVisible();
        await expect(passwordField).toBeVisible();
        await expect(loginButton).toBeVisible();
      });

      allure.step('Verify page contains expected text elements', async () => {
        await expect(page.getByText('Username')).toBeVisible();
        await expect(page.getByText('Password')).toBeVisible();
        await expect(page.getByText('Login')).toBeVisible();
      });

      allure.step('Take success screenshot', async () => {
        await page.screenshot({ path: 'test-results/orange-hr-success.png', fullPage: true });
        allure.attachment('success-screenshot', Buffer.from(await page.screenshot()), 'image/png');
      });

    } catch (error) {
      allure.step('Test failed - capturing screenshot', async () => {
        await page.screenshot({ path: 'test-results/orange-hr-failure.png', fullPage: true });
        allure.attachment('failure-screenshot', Buffer.from(await page.screenshot()), 'image/png');
      });
      throw error;
    }
  });
});