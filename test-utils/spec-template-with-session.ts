//tags: smoke
import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { SessionManager, createContextWithSession, saveSessionAfterLogin, shouldSkipLogin } from '../test-utils/session-manager';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Your Test Suite with Session Management', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.tags('UI Test', 'Login', 'Your App');
    await allure.attachment('environment', JSON.stringify({
      baseUrl: BASE_URL,
      browserType: BROWSER_TYPE,
      headlessMode: HEADLESS_MODE
    }), 'application/json');

    // Create context with session management
    const context = await createContextWithSession(browser, {
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Login Test - First test that performs login', async () => {
    try {
      await allure.step('1. Check if already logged in', async () => {
        const isLoggedIn = await shouldSkipLogin(page);
        if (isLoggedIn) {
          console.log('🚀 Already logged in, skipping login');
          return;
        }
      });

      await allure.step('2. Navigate to login URL', async () => {
        await page.goto(BASE_URL);
        await expect(page).toHaveURL(BASE_URL);
        await allure.attachment('Page URL', page.url(), 'text/plain');
      });

      await allure.step('3. Perform login', async () => {
        // Your login logic here
        await page.getByRole('textbox', { name: /username/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('textbox', { name: /username/i }).fill('your-username');
        
        await page.getByRole('textbox', { name: /password/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('textbox', { name: /password/i }).fill('your-password');
        
        await page.getByRole('button', { name: /login/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('button', { name: /login/i }).click();
      });

      await allure.step('4. Validate successful login', async () => {
        // Your validation logic here
        await page.waitForURL('**/dashboard/**', { timeout: 30000 });
        await page.getByRole('heading', { name: /dashboard/i }).waitFor({ state: 'visible', timeout: 15000 });
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
        
        await allure.attachment('Dashboard URL', page.url(), 'text/plain');
        await allure.attachment('Page Title', await page.title(), 'text/plain');
      });

      await allure.step('5. Save session for reuse', async () => {
        await saveSessionAfterLogin(page);
        console.log('✅ Session saved for subsequent tests');
      });

    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      await allure.attachment('Error Details', JSON.stringify({
        message: error.message,
        stack: error.stack
      }), 'application/json');
      throw error;
    }
  });

  test('Second Test - Should skip login using saved session', async () => {
    try {
      await allure.step('1. Check if already logged in', async () => {
        const isLoggedIn = await shouldSkipLogin(page);
        if (isLoggedIn) {
          console.log('🚀 Already logged in, skipping login');
          return;
        }
      });

      await allure.step('2. Navigate to protected page', async () => {
        // Navigate to any protected page - should work without login
        await page.goto(BASE_URL.replace('/login', '/dashboard'));
        await expect(page).toHaveURL(/dashboard/);
        await allure.attachment('Protected Page URL', page.url(), 'text/plain');
      });

      await allure.step('3. Verify access to protected content', async () => {
        // Your test logic here
        await page.getByRole('heading', { name: /dashboard/i }).waitFor({ state: 'visible', timeout: 15000 });
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
        console.log('✅ Successfully accessed protected page without login');
      });

    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      await allure.attachment('Error Details', JSON.stringify({
        message: error.message,
        stack: error.stack
      }), 'application/json');
      throw error;
    }
  });

  test('Third Test - Should also skip login', async () => {
    try {
      await allure.step('1. Check if already logged in', async () => {
        const isLoggedIn = await shouldSkipLogin(page);
        if (isLoggedIn) {
          console.log('🚀 Already logged in, skipping login');
          return;
        }
      });

      await allure.step('2. Navigate to another protected page', async () => {
        // Navigate to another protected page
        await page.goto(BASE_URL.replace('/login', '/settings'));
        await expect(page).toHaveURL(/settings/);
        await allure.attachment('Settings URL', page.url(), 'text/plain');
      });

      await allure.step('3. Verify access to settings', async () => {
        // Your test logic here
        await page.waitForLoadState('networkidle');
        console.log('✅ Successfully accessed settings page without login');
      });

    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      await allure.attachment('Error Details', JSON.stringify({
        message: error.message,
        stack: error.stack
      }), 'application/json');
      throw error;
    }
  });
});
