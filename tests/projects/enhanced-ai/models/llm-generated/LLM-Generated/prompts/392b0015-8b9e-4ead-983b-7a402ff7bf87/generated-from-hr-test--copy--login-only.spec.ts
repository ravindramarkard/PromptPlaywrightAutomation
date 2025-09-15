//tags: smoke
import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('HR Test Login Only', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.tags('UI Test', 'Login', 'HR System');
    await allure.attachment('environment', JSON.stringify({
      baseUrl: BASE_URL,
      browserType: BROWSER_TYPE,
      headlessMode: HEADLESS_MODE
    }), 'application/json');

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Generated from HR Test (Copy) Login Only', async () => {
    try {
      await allure.step('1. Navigate to login URL', async () => {
        await page.goto(BASE_URL);
       // await expect(page).toHaveURL(BASE_URL);
        await allure.attachment('Page URL', page.url(), 'text/plain');
      });

      await allure.step('2. Use credentials from website', async () => {
        await page.getByRole('textbox', { name: /username/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('textbox', { name: /username/i }).fill('Admin');
        
        await page.getByRole('textbox', { name: /password/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('textbox', { name: /password/i }).fill('admin123');
        
        await page.getByRole('button', { name: /login/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('button', { name: /login/i }).click();
      });

      await allure.step('3. Validate successful login', async () => {
        await page.waitForURL('**/dashboard/**', { timeout: 30000 });
        
        await page.getByRole('heading', { name: /dashboard/i }).waitFor({ state: 'visible', timeout: 15000 });
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
        
        await page.getByRole('banner').waitFor({ state: 'visible', timeout: 15000 });
        await expect(page.getByRole('banner')).toBeVisible();
        
        await allure.attachment('Dashboard URL', page.url(), 'text/plain');
        await allure.attachment('Page Title', await page.title(), 'text/plain');
// Save session storage/cookies to file
  await page.context().storageState({ path: 'storageState.json' });
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