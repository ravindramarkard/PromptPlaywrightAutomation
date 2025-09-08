import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Debug Test 3', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.tms('Debug Test 3', 'UI Test');
    await allure.feature('Debug Test Functionality');
    await allure.story('Verify basic application functionality');

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should perform basic debug test operations', async () => {
    await allure.severity('critical');
    await allure.tag('debug');
    await allure.tag('ui-test');

    try {
      // Step 1: Verify page title
      await allure.step('Verify page title', async () => {
        const title = await page.title();
        expect(title).toBeTruthy();
        await allure.attachment('Page Title', title, 'text/plain');
      });

      // Step 2: Check if main content is visible
      await allure.step('Check main content visibility', async () => {
        const mainContent = page.locator('[data-testid="main-content"]').first() || 
                           page.locator('main').first() || 
                           page.locator('body').first();
        await expect(mainContent).toBeVisible({ timeout: 10000 });
      });

      // Step 3: Verify navigation elements
      await allure.step('Verify navigation elements', async () => {
        const navElements = page.locator('[data-testid="nav-item"]') || 
                           page.locator('nav a') || 
                           page.getByRole('navigation').locator('a');
        const count = await navElements.count();
        expect(count).toBeGreaterThan(0);
      });

      // Step 4: Check for interactive elements
      await allure.step('Check interactive elements', async () => {
        const buttons = page.locator('[data-testid="button"]') || 
                       page.getByRole('button') || 
                       page.locator('button');
        const links = page.locator('[data-testid="link"]') || 
                     page.getByRole('link') || 
                     page.locator('a');
        
        const buttonCount = await buttons.count();
        const linkCount = await links.count();
        
        expect(buttonCount + linkCount).toBeGreaterThan(0);
      });

      // Step 5: Verify page responsiveness
      await allure.step('Verify page responsiveness', async () => {
        const viewportMeta = await page.locator('meta[name="viewport"]');
        await expect(viewportMeta).toBeAttached();
      });

      await allure.attachment('Final Screenshot', await page.screenshot(), 'image/png');

    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      await allure.attachment('Error Details', error.message, 'text/plain');
      throw error;
    }
  });

  test.afterEach(async () => {
    await page.close();
  });
});