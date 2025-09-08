import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Debug Test 6', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    allure.epic('UI Tests');
    allure.feature('Debug Test Suite');
    allure.story('Debug Test 6');

    page = await browser.newPage({
      baseURL: BASE_URL,
      viewport: { width: 1280, height: 720 }
    });

    await allure.step('Navigate to base URL', async () => {
      await page.goto('/');
    });
  });

  test('Debug Test 6 - UI Test', async () => {
    allure.severity('normal');
    allure.tag('debug');
    allure.tag('ui-test');

    try {
      await allure.step('Verify page title', async () => {
        await expect(page).toHaveTitle(/.*/);
        await allure.attachment('Page Title', await page.title(), 'text/plain');
      });

      await allure.step('Check if page is loaded', async () => {
        const bodyVisible = await page.waitForSelector('body', { timeout: 30000 });
        expect(bodyVisible).toBeTruthy();
      });

      await allure.step('Verify page content', async () => {
        const mainContent = await page.locator('body').textContent();
        expect(mainContent).toBeTruthy();
        await allure.attachment('Page Content', mainContent || '', 'text/plain');
      });

      await allure.step('Capture final screenshot', async () => {
        const screenshot = await page.screenshot();
        await allure.attachment('Final State', screenshot, 'image/png');
      });

    } catch (error) {
      await allure.step('Test Failed - Capturing Screenshot', async () => {
        const screenshot = await page.screenshot();
        await allure.attachment('Failure Screenshot', screenshot, 'image/png');
        throw error;
      });
    }
  });

  test.afterEach(async () => {
    await allure.step('Close browser page', async () => {
      await page.close();
    });
  });
});