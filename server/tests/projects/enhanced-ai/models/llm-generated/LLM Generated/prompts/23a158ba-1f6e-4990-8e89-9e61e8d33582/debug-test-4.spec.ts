import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Debug Test 4', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.epic('UI Tests');
    await allure.feature('Debug Test 4');
    await allure.story('Debug Test 4 Execution');
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    await page.goto(BASE_URL);
  });

  test('Debug Test 4 - UI Test', async () => {
    await allure.severity('critical');
    await allure.tag('debug');
    await allure.tag('ui-test');
    
    try {
      await allure.step('Verify page title', async () => {
        await page.waitForLoadState('networkidle');
        const title = await page.title();
        expect(title).toBeTruthy();
        await allure.attachment('Page Title', title, 'text/plain');
      });

      await allure.step('Check for main content container', async () => {
        const mainContainer = page.locator('[data-testid="main-container"]').first() || 
                             page.locator('main').first() || 
                             page.locator('.app-container').first() ||
                             page.locator('#root').first();
        await expect(mainContainer).toBeVisible({ timeout: 30000 });
        await allure.attachment('Main Container Screenshot', await mainContainer.screenshot(), 'image/png');
      });

      await allure.step('Verify page has interactive elements', async () => {
        const buttons = page.locator('button');
        const links = page.locator('a');
        const inputs = page.locator('input');
        
        const buttonCount = await buttons.count();
        const linkCount = await links.count();
        const inputCount = await inputs.count();
        
        expect(buttonCount + linkCount + inputCount).toBeGreaterThan(0);
        
        await allure.attachment('Interactive Elements Count', 
          `Buttons: ${buttonCount}, Links: ${linkCount}, Inputs: ${inputCount}`, 
          'text/plain'
        );
      });

      await allure.step('Check for visible text content', async () => {
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
        expect(bodyText.length).toBeGreaterThan(0);
        
        await allure.attachment('Body Text Content', bodyText.substring(0, 500) + '...', 'text/plain');
      });

      await allure.step('Verify responsive layout', async () => {
        const viewport = page.viewportSize();
        const bodyWidth = await page.evaluate(() => document.body.clientWidth);
        expect(bodyWidth).toBeGreaterThan(0);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width);
        
        await allure.attachment('Viewport Size', JSON.stringify(viewport), 'application/json');
        await allure.attachment('Body Width', bodyWidth.toString(), 'text/plain');
      });

      await allure.step('Final validation - page is fully loaded', async () => {
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        
        const readyState = await page.evaluate(() => document.readyState);
        expect(readyState).toBe('complete');
        
        await allure.attachment('Page Ready State', readyState, 'text/plain');
        await allure.attachment('Final Page Screenshot', await page.screenshot(), 'image/png');
      });

    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      await allure.attachment('Error Details', error.message, 'text/plain');
      await allure.attachment('Page URL', page.url(), 'text/plain');
      throw error;
    }
  });

  test.afterEach(async () => {
    await page.close();
  });
});