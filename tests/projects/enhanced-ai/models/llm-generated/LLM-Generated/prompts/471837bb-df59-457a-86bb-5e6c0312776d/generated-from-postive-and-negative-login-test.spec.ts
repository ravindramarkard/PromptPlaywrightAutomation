import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://practicetestautomation.com/practice-test-login/';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('Login Tests - Positive and Negative Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await allure.attachment('Test Configuration', JSON.stringify({
      baseUrl: BASE_URL,
      browser: BROWSER_TYPE,
      headless: HEADLESS_MODE,
      timestamp: new Date().toISOString()
    }), 'application/json');

    await page.goto(BASE_URL);
    await allure.attachment('Page Loaded', `Navigated to ${BASE_URL}`, 'text/plain');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot();
      await allure.attachment('Failure Screenshot', screenshot, 'image/png');
    }
  });

  test('TC1: Negative username test - invalid username with valid password', async ({ page }) => {
    await allure.attachment('Test Case', 'Negative username test - invalid username with valid password', 'text/plain');
    
    try {
      // Type incorrect username
      await page.locator('#username').fill('incorrectUser');
      await allure.attachment('Username Entered', 'incorrectUser', 'text/plain');

      // Type valid password
      await page.locator('#password').fill('Password123');
      await allure.attachment('Password Entered', 'Password123 (masked)', 'text/plain');

      // Click submit button
      await page.locator('#submit').click();
      await allure.attachment('Submit Clicked', 'Submit button clicked', 'text/plain');

      // Verify error message is displayed
      const errorMessage = page.locator('#error');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await allure.attachment('Error Message Visible', 'Error message is displayed', 'text/plain');

      // Verify error message text
      await expect(errorMessage).toHaveText('Your username is invalid!');
      await allure.attachment('Error Message Text', 'Your username is invalid!', 'text/plain');

    } catch (error) {
      await allure.attachment('Test Failure', `Test failed with error: ${error.message}`, 'text/plain');
      throw error;
    }
  });

  test('TC2: Negative password test - valid username with invalid password', async ({ page }) => {
    await allure.attachment('Test Case', 'Negative password test - valid username with invalid password', 'text/plain');
    
    try {
      // Type valid username
      await page.locator('#username').fill('student');
      await allure.attachment('Username Entered', 'student', 'text/plain');

      // Type incorrect password
      await page.locator('#password').fill('incorrectPassword');
      await allure.attachment('Password Entered', 'incorrectPassword (masked)', 'text/plain');

      // Click submit button
      await page.locator('#submit').click();
      await allure.attachment('Submit Clicked', 'Submit button clicked', 'text/plain');

      // Verify error message is displayed
      const errorMessage = page.locator('#error');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await allure.attachment('Error Message Visible', 'Error message is displayed', 'text/plain');

      // Verify error message text
      await expect(errorMessage).toHaveText('Your password is invalid!');
      await allure.attachment('Error Message Text', 'Your password is invalid!', 'text/plain');

    } catch (error) {
      await allure.attachment('Test Failure', `Test failed with error: ${error.message}`, 'text/plain');
      throw error;
    }
  });

  test('TC3: Positive Login test - valid credentials', async ({ page }) => {
    await allure.attachment('Test Case', 'Positive Login test - valid credentials', 'text/plain');
    
    try {
      // Type valid username
      await page.locator('#username').fill('student');
      await allure.attachment('Username Entered', 'student', 'text/plain');

      // Type valid password
      await page.locator('#password').fill('Password123');
      await allure.attachment('Password Entered', 'Password123 (masked)', 'text/plain');

      // Click submit button
      await page.locator('#submit').click();
      await allure.attachment('Submit Clicked', 'Submit button clicked', 'text/plain');

      // Verify URL contains expected path
      await expect(page).toHaveURL(/practicetestautomation\.com\/logged-in-successfully\//);
      await allure.attachment('URL Verified', 'URL contains practicetestautomation.com/logged-in-successfully/', 'text/plain');

      // Verify success text is present
      const successText = page.locator('text=Congratulations').or(page.locator('text=successfully logged in'));
      await expect(successText).toBeVisible({ timeout: 10000 });
      await allure.attachment('Success Text Found', 'Congratulations or successfully logged in text is displayed', 'text/plain');

      // Verify Log out button is displayed
      const logoutButton = page.getByRole('link', { name: 'Log out' });
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
      await allure.attachment('Logout Button Visible', 'Log out button is displayed', 'text/plain');

    } catch (error) {
      await allure.attachment('Test Failure', `Test failed with error: ${error.message}`, 'text/plain');
      throw error;
    }
  });
});