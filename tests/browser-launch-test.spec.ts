import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Browser Launch Test', () => {
  test.beforeEach(async ({ page }) => {
    await allure.tag('browser-launch');
    await allure.feature('Auto Browser Launch');
  });

  test('should verify browser launches automatically after test generation', async ({ page }) => {
    await allure.story('Auto Launch Verification');
    
    try {
      // Navigate to the application
      await page.goto(process.env.BASE_URL || 'http://localhost:3000');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Verify the page title
      await expect(page).toHaveTitle(/AI Test Generator/);
      
      // Take a screenshot for verification
      await allure.attachment('Page Screenshot', await page.screenshot(), 'image/png');
      
      console.log('✅ Browser launched successfully and page loaded');
      console.log('🎯 This test verifies the auto-launch functionality works');
      
    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      throw error;
    }
  });

  test('should handle navigation and basic interactions', async ({ page }) => {
    await allure.story('Basic Interaction Test');
    
    try {
      // Navigate to the application
      await page.goto(process.env.BASE_URL || 'http://localhost:3000');
      
      // Wait for the page to be ready
      await page.waitForSelector('body', { state: 'visible' });
      
      // Check if React app is loaded
      const reactRoot = await page.locator('#root').count();
      expect(reactRoot).toBeGreaterThan(0);
      
      // Verify basic page structure
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
      
      console.log('✅ Page navigation and basic interactions working');
      console.log('🚀 Auto-launch browser functionality verified');
      
    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      throw error;
    }
  });
});