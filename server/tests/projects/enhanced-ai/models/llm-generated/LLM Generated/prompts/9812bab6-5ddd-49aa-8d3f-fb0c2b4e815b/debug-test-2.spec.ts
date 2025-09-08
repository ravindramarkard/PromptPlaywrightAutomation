import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Debug Test 2', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.parentSuite('UI Tests');
    await allure.suite('Debug Test 2');
    
    page = await browser.newPage({
      baseURL: BASE_URL,
      viewport: { width: 1280, height: 720 }
    });
    
    await allure.step('Navigate to base URL', async () => {
      try {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      } catch (error) {
        await allure.attachment('Navigation Error', JSON.stringify(error), 'application/json');
        throw error;
      }
    });
  });

  test('Debug Test 2 - UI Test', async () => {
    await allure.tags('ui', 'debug', 'smoke');
    await allure.displayName('Debug Test 2 - UI Verification');
    await allure.description('Comprehensive UI test for debugging purposes');

    try {
      await allure.step('Verify page title', async () => {
        await expect(page).toHaveTitle(/.*/);
        const title = await page.title();
        await allure.attachment('Page Title', title, 'text/plain');
      });

      await allure.step('Check for visible elements', async () => {
        const bodyVisible = await page.isVisible('body');
        expect(bodyVisible).toBeTruthy();
        
        const mainContent = await page.locator('main, [data-testid="main-content"], .main, #main').first();
        await expect(mainContent).toBeVisible({ timeout: 10000 });
      });

      await allure.step('Verify page content structure', async () => {
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
        expect(headings).toBeGreaterThan(0);
        
        const links = await page.locator('a').count();
        expect(links).toBeGreaterThan(0);
        
        await allure.attachment('Headings Count', headings.toString(), 'text/plain');
        await allure.attachment('Links Count', links.toString(), 'text/plain');
      });

      await allure.step('Check for interactive elements', async () => {
        const buttons = await page.locator('button, [role="button"], input[type="button"], input[type="submit"]');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          await expect(buttons.first()).toBeVisible();
          await allure.attachment('Buttons Found', buttonCount.toString(), 'text/plain');
        }
      });

      await allure.step('Verify responsive design elements', async () => {
        const viewportMeta = await page.locator('meta[name="viewport"]').isVisible();
        expect(viewportMeta).toBeTruthy();
      });

      await allure.step('Final page health check', async () => {
        const consoleErrors: string[] = [];
        page.on('console', (msg: any) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        await page.reload();
        await page.waitForLoadState('networkidle');
        
        if (consoleErrors.length > 0) {
          await allure.attachment('Console Errors', consoleErrors.join('\n'), 'text/plain');
        }
        
        expect(consoleErrors.length).toBe(0);
      });

    } catch (error) {
      await allure.step('Test Failed - Capturing Screenshot', async () => {
        const screenshot = await page.screenshot({ fullPage: true });
        await allure.attachment('Failure Screenshot', screenshot, 'image/png');
        
        const pageSource = await page.content();
        await allure.attachment('Page Source', pageSource, 'text/html');
        
        await allure.attachment('Error Details', JSON.stringify({
          message: error.message,
          stack: error.stack
        }, null, 2), 'application/json');
      });
      
      throw error;
    }
  });

  test.afterEach(async () => {
    await allure.step('Cleanup and close page', async () => {
      if (page) {
        await page.close();
      }
    });
  });
});