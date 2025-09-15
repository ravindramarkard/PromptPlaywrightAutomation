import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://www.google.com/';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Google Search Test', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    try {
      allure.epic('Google Search');
      allure.feature('Search Functionality');
      allure.story('Search for AI Tech');
      
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      
      page = await context.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      allure.attachment('Page Loaded', 'Navigated to Google homepage', 'text/plain');
    } catch (error) {
      allure.attachment('Setup Error', `Failed to initialize test: ${error.message}`, 'text/plain');
      throw error;
    }
  });

  test('Search for AI Tech on Google', async () => {
    try {
      allure.severity('critical');
      allure.tag('search');
      allure.tag('google');
      
      // Step 1: Verify Google homepage is loaded
      await expect(page).toHaveURL(BASE_URL);
      await expect(page).toHaveTitle('Google');
      
      allure.attachment('Homepage Verification', 'Google homepage loaded successfully', 'text/plain');
      
      // Step 2: Wait for search input to be visible
      const searchInput = page.locator('textarea[name="q"], input[name="q"], [role="searchbox"]').first();
      await searchInput.waitFor({ state: 'visible', timeout: 30000 });
      await searchInput.scrollIntoViewIfNeeded();
      
      allure.attachment('Search Input Found', 'Search input element located and visible', 'text/plain');
      
      // Step 3: Type search query
      await searchInput.fill('AI Tech');
      await page.waitForTimeout(1000);
      
      allure.attachment('Search Query Entered', 'Typed "AI Tech" into search box', 'text/plain');
      
      // Step 4: Submit search using Google Search button
      const searchButton = page.locator('input[name="btnK"], input.gNO89b, [role="button"][aria-label*="بحث Google"], [value*="بحث Google"]').first();
      await searchButton.waitFor({ state: 'visible', timeout: 15000 });
      await searchButton.scrollIntoViewIfNeeded();
      
      // Take screenshot before clicking
      await allure.attachment('Before Search Click', await page.screenshot(), 'image/png');
      
      await searchButton.click({ timeout: 10000 });
      
      // Step 5: Wait for search results to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Verify search results page
      await expect(page).toHaveURL(/search/);
      await expect(page.locator('#search, [role="main"]')).toBeVisible();
      
      allure.attachment('Search Results Loaded', 'Search results page loaded successfully', 'text/plain');
      await allure.attachment('Search Results Page', await page.screenshot(), 'image/png');
      
      // Verify search query is reflected in results
      const searchQueryIndicator = page.locator('[aria-label*="AI Tech"], [value*="AI Tech"], .vOY7J');
      await expect(searchQueryIndicator.first()).toBeVisible({ timeout: 10000 });
      
      allure.attachment('Search Completed', 'Successfully searched for "AI Tech"', 'text/plain');
      
    } catch (error) {
      allure.attachment('Test Failure', `Test failed at step: ${error.message}`, 'text/plain');
      await allure.attachment('Failure Screenshot', await page.screenshot(), 'image/png');
      throw error;
    }
  });

  test.afterEach(async () => {
    try {
      if (page) {
        await page.close();
        allure.attachment('Browser Closed', 'Browser instance closed successfully', 'text/plain');
      }
    } catch (error) {
      allure.attachment('Teardown Error', `Failed to close browser: ${error.message}`, 'text/plain');
    }
  });
});