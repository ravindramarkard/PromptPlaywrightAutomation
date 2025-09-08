import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Debug Test', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    allure.epic('UI Test');
    allure.feature('Debug Test');
    allure.story('Debug functionality verification');

    page = await browser.newPage({
      baseURL: BASE_URL,
      viewport: { width: 1280, height: 720 }
    });

    await allure.step('Navigate to base URL', async () => {
      await page.goto('/', { timeout: 30000 });
    });
  });

  test('Debug Test - Verify basic functionality', async () => {
    try {
      await allure.step('Verify page title', async () => {
        await page.waitForLoadState('domcontentloaded');
        const title = await page.title();
        expect(title).toBeTruthy();
        await allure.attachment('Page Title', title, 'text/plain');
      });

      await allure.step('Check for visible elements on the page', async () => {
        const bodyVisible = await page.isVisible('body');
        expect(bodyVisible).toBeTruthy();

        // Look for common UI elements
        const buttons = await page.$$('button');
        expect(buttons.length).toBeGreaterThan(0);

        const links = await page.$$('a');
        expect(links.length).toBeGreaterThan(0);
      });

      await allure.step('Verify page content is accessible', async () => {
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
        expect(pageText.length).toBeGreaterThan(0);
      });

      await allure.step('Check for responsive design elements', async () => {
        const viewportMeta = await page.$('meta[name="viewport"]');
        expect(viewportMeta).toBeTruthy();
      });

      await allure.step('Verify no console errors', async () => {
        const consoleErrors: any[] = [];
        page.on('console', (msg: any) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Refresh page to capture any initial errors
        await page.reload({ waitUntil: 'networkidle' });
        
        expect(consoleErrors.length).toBe(0);
        if (consoleErrors.length > 0) {
          await allure.attachment('Console Errors', consoleErrors.join('\n'), 'text/plain');
        }
      });

      await allure.step('Take success screenshot', async () => {
        await page.screenshot({ path: 'test-results/debug-test-success.png', fullPage: true });
        await allure.attachment('Success Screenshot', await page.screenshot(), 'image/png');
      });

    } catch (error) {
      await allure.step('Test failed - capturing screenshot', async () => {
        await page.screenshot({ path: 'test-results/debug-test-failure.png', fullPage: true });
        await allure.attachment('Failure Screenshot', await page.screenshot(), 'image/png');
        await allure.attachment('Error Details', error instanceof Error ? error.stack || error.message : String(error), 'text/plain');
      });
      throw error;
    }
  });

  test.afterEach(async () => {
    await allure.step('Close browser page', async () => {
      if (page) {
        await page.close();
      }
    });
  });
});