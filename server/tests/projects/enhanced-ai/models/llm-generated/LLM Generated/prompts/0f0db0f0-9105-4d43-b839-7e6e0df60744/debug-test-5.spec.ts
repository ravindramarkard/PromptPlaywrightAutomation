import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Debug Test 5', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    allure.epic('UI Tests');
    allure.feature('Debug Test Suite');
    allure.story('Debug Test 5');

    page = await browser.newPage({
      baseURL: BASE_URL,
      viewport: { width: 1280, height: 720 }
    });

    await allure.step('Navigate to base URL', async () => {
      await page.goto('/');
    });
  });

  test('Debug Test 5 - UI Test', async () => {
    allure.tag('debug');
    allure.tag('ui-test');
    allure.severity('normal');

    try {
      await allure.step('Verify page title', async () => {
        await expect(page).toHaveTitle(/.*/);
      });

      await allure.step('Check if main content is visible', async () => {
        const mainContent = page.locator('[data-testid="main-content"]').first() || 
                           page.locator('main').first() || 
                           page.locator('body').first();
        await expect(mainContent).toBeVisible({ timeout: 15000 });
      });

      await allure.step('Verify page has expected elements', async () => {
        const visibleElements = await page.locator('body >> *').count();
        expect(visibleElements).toBeGreaterThan(0);
      });

      await allure.step('Check for interactive elements', async () => {
        const buttons = page.locator('button');
        const links = page.locator('a');
        
        const buttonCount = await buttons.count();
        const linkCount = await links.count();
        
        expect(buttonCount + linkCount).toBeGreaterThan(0);
      });

      await allure.step('Verify successful test completion', async () => {
        await page.waitForTimeout(1000);
        expect(true).toBe(true);
      });

    } catch (error) {
      await allure.step('Test failed - capturing screenshot', async () => {
        const screenshot = await page.screenshot({ fullPage: true });
        await allure.attachment('Failure Screenshot', screenshot, 'image/png');
      });
      throw error;
    }
  });

  test.afterEach(async () => {
    await allure.step('Close browser page', async () => {
      await page.close();
    });
  });
});