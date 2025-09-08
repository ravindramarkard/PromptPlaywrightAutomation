import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://practicetestautomation.com/practice-test-login/';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('gg Test Suite', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.tags('UI Test', 'gg');
    await allure.feature('gg Test');
    await allure.story('Complete gg test implementation');

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    await page.goto(BASE_URL);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await allure.attachment('Failure Screenshot', screenshot, 'image/png');
    }
    await page.close();
  });

  test('gg - Complete Test', async () => {
    await allure.severity('critical');
    await allure.description('Complete gg test implementation');

    try {
      await allure.step('Verify page title', async () => {
        await expect(page).toHaveTitle('Test Login | Practice Test Automation');
      });

      await allure.step('Verify login form is visible', async () => {
        const loginForm = page.locator('#login');
        await expect(loginForm).toBeVisible();
      });

      await allure.step('Enter username', async () => {
        const usernameField = page.locator('#username');
        await usernameField.waitFor({ state: 'visible', timeout: 30000 });
        await usernameField.fill('student');
      });

      await allure.step('Enter password', async () => {
        const passwordField = page.locator('#password');
        await passwordField.waitFor({ state: 'visible', timeout: 30000 });
        await passwordField.fill('Password123');
      });

      await allure.step('Click submit button', async () => {
        const submitButton = page.locator('#submit');
        await submitButton.waitFor({ state: 'visible', timeout: 30000 });
        await submitButton.click();
      });

      await allure.step('Verify successful login redirect', async () => {
        await page.waitForURL('**/logged-in-successfully/', { timeout: 30000 });
        await expect(page).toHaveURL(/logged-in-successfully/);
      });

      await allure.step('Verify success message', async () => {
        const successMessage = page.locator('text=Congratulations student. You successfully logged in!');
        await successMessage.waitFor({ state: 'visible', timeout: 30000 });
        await expect(successMessage).toBeVisible();
      });

      await allure.step('Verify logout button is present', async () => {
        const logoutButton = page.locator('a:has-text("Log out")');
        await logoutButton.waitFor({ state: 'visible', timeout: 30000 });
        await expect(logoutButton).toBeVisible();
      });

    } catch (error) {
      const screenshot = await page.screenshot({ fullPage: true });
      await allure.attachment('Error Screenshot', screenshot, 'image/png');
      throw error;
    }
  });
});