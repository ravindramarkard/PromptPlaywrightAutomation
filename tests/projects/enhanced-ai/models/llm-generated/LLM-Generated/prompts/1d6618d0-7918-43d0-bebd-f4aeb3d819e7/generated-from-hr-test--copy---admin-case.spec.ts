import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('HR Admin User Creation Test', () => {
  test.beforeEach(async ({ page }) => {
    await allure.attachment('Base URL', BASE_URL, 'text/plain');
    await allure.attachment('Browser Type', BROWSER_TYPE, 'text/plain');
    await allure.attachment('Headless Mode', HEADLESS_MODE.toString(), 'text/plain');

    await page.goto(BASE_URL);
    
    // Login first (assuming standard OrangeHRM login)
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for dashboard to load
    await page.waitForSelector('.oxd-brand-banner', { timeout: 30000 });
  });

  test('should create a new admin user successfully', async ({ page }) => {
    try {
      await allure.tag('UI Test');
      await allure.tag('Admin User Creation');
      await allure.attachment('Test Name', 'Generated from HR Test (Copy)- Admin Case', 'text/plain');

      // Step 1: Click Admin from left sidebar
      await allure.step('Click Admin from left sidebar', async () => {
        const adminLink = page.getByRole('link', { name: 'Admin' }).first();
        await adminLink.waitFor({ state: 'visible', timeout: 15000 });
        await adminLink.click();
        await page.waitForSelector('.oxd-table-filter', { timeout: 15000 });
        await allure.attachment('Admin Page Loaded', 'Admin page loaded successfully', 'text/plain');
      });

      // Step 2: Click on Add button
      await allure.step('Click on Add button', async () => {
        const addButton = page.getByRole('button', { name: 'Add' }).first();
        await addButton.waitFor({ state: 'visible', timeout: 15000 });
        await addButton.click();
        await page.waitForSelector('.oxd-form', { timeout: 15000 });
        await allure.attachment('Add User Form', 'Add user form loaded', 'text/plain');
      });

      // Step 3: Select User Role: Admin
      await allure.step('Select User Role: Admin', async () => {
        const userRoleDropdown = page.getByRole('combobox', { name: 'User Role' }).first();
        await userRoleDropdown.waitFor({ state: 'visible', timeout: 15000 });
        await userRoleDropdown.scrollIntoViewIfNeeded();
        await userRoleDropdown.click({ timeout: 10000 });
        
        await page.waitForSelector('[role="option"]', { timeout: 10000 });
        const adminOption = page.getByRole('option', { name: 'Admin' }).first();
        await adminOption.waitFor({ state: 'visible', timeout: 10000 });
        await adminOption.click();
        
        await expect(userRoleDropdown).toContainText('Admin', { timeout: 5000 });
        await allure.attachment('User Role Selected', 'Admin role selected', 'text/plain');
      });

      // Step 4: Enter Employee Name
      await allure.step('Enter Employee Name: FirstAutomation123', async () => {
        const employeeNameInput = page.getByPlaceholder('Type for hints...').first();
        await employeeNameInput.waitFor({ state: 'visible', timeout: 15000 });
        await employeeNameInput.fill('FirstAutomation123');
        await allure.attachment('Employee Name Entered', 'FirstAutomation123', 'text/plain');
      });

      // Step 5: Select Status: Enabled
      await allure.step('Select Status: Enabled', async () => {
        const statusDropdown = page.getByRole('combobox', { name: 'Status' }).first();
        await statusDropdown.waitFor({ state: 'visible', timeout: 15000 });
        await statusDropdown.scrollIntoViewIfNeeded();
        await statusDropdown.click({ timeout: 10000 });
        
        await page.waitForSelector('[role="option"]', { timeout: 10000 });
        const enabledOption = page.getByRole('option', { name: 'Enabled' }).first();
        await enabledOption.waitFor({ state: 'visible', timeout: 10000 });
        await enabledOption.click();
        
        await expect(statusDropdown).toContainText('Enabled', { timeout: 5000 });
        await allure.attachment('Status Selected', 'Enabled status selected', 'text/plain');
      });

      // Step 6: Enter Username
      await allure.step('Enter Username: ravi11', async () => {
        const usernameInput = page.getByRole('textbox', { name: 'Username' }).first();
        await usernameInput.waitFor({ state: 'visible', timeout: 15000 });
        await usernameInput.fill('ravi11');
        await allure.attachment('Username Entered', 'ravi11', 'text/plain');
      });

      // Step 7: Enter Password
      await allure.step('Enter Password: ravi12311', async () => {
        const passwordInput = page.getByRole('textbox', { name: /password/i }).first();
        await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
        await passwordInput.fill('ravi12311');
        await allure.attachment('Password Entered', 'ravi12311', 'text/plain');
      });

      // Step 8: Enter Confirm Password
      await allure.step('Enter Confirm Password: ravi123343', async () => {
        const confirmPasswordInput = page.getByRole('textbox', { name: /confirm password/i }).first();
        await confirmPasswordInput.waitFor({ state: 'visible', timeout: 15000 });
        await confirmPasswordInput.fill('ravi123343');
        await allure.attachment('Confirm Password Entered', 'ravi123343', 'text/plain');
      });

      // Step 9: Click on Save button
      await allure.step('Click on Save button', async () => {
        const saveButton = page.getByRole('button', { name: 'Save' }).first();
        await saveButton.waitFor({ state: 'visible', timeout: 15000 });
        await saveButton.click();
        await allure.attachment('Save Button Clicked', 'Save action initiated', 'text/plain');
      });

      // Step 10: Validate successful user creation
      await allure.step('Validate successful user creation', async () => {
        // Wait for success message or redirect
        await page.waitForSelector('.oxd-toast', { timeout: 20000 });
        
        const successMessage = page.locator('.oxd-toast').first();
        await successMessage.waitFor({ state: 'visible', timeout: 15000 });
        
        await expect(successMessage).toContainText(/successfully|saved|created/i, { timeout: 10000 });
        await allure.attachment('User Creation Status', 'User created successfully', 'text/plain');
        
        // Additional validation - check if redirected to user list
        await page.waitForSelector('.oxd-table-card', { timeout: 15000 });
        const userTable = page.locator('.oxd-table-card').first();
        await expect(userTable).toBeVisible({ timeout: 10000 });
      });

    } catch (error) {
      await allure.attachment('Error', error.message, 'text/plain');
      const screenshot = await page.screenshot();
      await allure.attachment('Screenshot on Failure', screenshot, 'image/png');
      throw error;
    }
  });

  test.afterEach(async ({ page }) => {
    // Cleanup - logout after test
    const userDropdown = page.locator('.oxd-userdropdown-tab').first();
    if (await userDropdown.isVisible()) {
      await userDropdown.click();
      const logoutLink = page.getByRole('menuitem', { name: 'Logout' }).first();
      await logoutLink.waitFor({ state: 'visible', timeout: 10000 });
      await logoutLink.click();
    }
  });
});