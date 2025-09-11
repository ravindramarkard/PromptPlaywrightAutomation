import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = env.BASE_URL;
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE === 'true';

test.use({
    baseURL: BASE_URL,
    browserName: BROWSER_TYPE as 'chromium' | 'firefox' | 'webkit',
    headless: HEADLESS_MODE,
  });
test.describe('Generated from App login', () => {
  

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      allure.attachment('Screenshot', screenshot, 'image/png');
    }
  });

  test('Test case-1: Login into app', async ({ page }) => {
    try {
      // Enter username in textfield with: test22
      await page.getByPlaceholder('Username').fill(process.env.USERNAME);

      // Enter password in textfield with: pass123
      await page.getByPlaceholder('Password').fill(process.env.PASSWORD);

      // Click on Log in button
      await page.getByRole('button', { name: 'Log In' }).click();

      // Verify Logged in success
      await page.waitForSelector('.presight-logo', { timeout: 30000 });
      await expect(page.getByRole('link', { name: 'presight' })).toBeVisible();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  });

  test('Test case-2: Create a new case', async ({ page }) => {
    try {
      // Click on Create new case button
      await page.getByRole('button', { name: 'Create New Case' }).click();

      // Enter text for casename : autosep11
      await page.getByLabel('Case Name').fill('autosep11');

      // Enter text for Description : autotestspt11
      await page.getByLabel('Description').fill('autotestspt11');

      // Click on save button
      await page.getByRole('button', { name: 'Save' }).click();

      // Verify case creation success
      await page.waitForSelector('.case-success-message', { timeout: 30000 });
      await expect(page.getByText('Case created successfully')).toBeVisible();
    } catch (error) {
      console.error('Case creation failed:', error);
      throw error;
    }
  });
});