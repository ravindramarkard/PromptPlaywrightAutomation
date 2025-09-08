import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { APIRequestContext } from '@playwright/test';

test.describe('HR Test', () => {
  test.beforeEach(async ({ page }) => {
    allure.epic('UI Test');
    allure.feature('Automated Test Generation');
    allure.story('Generated from AI Prompt');
    
    // Set default timeout
    test.setTimeout(30000);
    
    // Set base URL from environment
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    // Navigate to base URL with proper error handling
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
    } catch (error) {
      console.error('Failed to navigate to base URL:', error);
      throw error;
    }
  });


  test('should execute test steps', async ({ page, request }) => {
    allure.description('Automated test generated from AI prompt with 1 steps');
    allure.severity('normal');
    allure.owner('AI Test Generator');

    // Step 1: Navigate to button
    await allure.step('Step 1: Navigate to button', async () => {
    try {
      await page.goto('http://localhost:3000/button', { waitUntil: 'networkidle' });
    } catch (error) {
      console.error('Step 1 failed:', error);
      throw error;
    }
    });
  });
  test.afterEach(async ({ page }) => {
    // Take screenshot on failure
    if (test.info().status === 'failed') {
      await page.screenshot({ 
        path: `test-results/screenshots/failure-${Date.now()}.png`,
        fullPage: true 
      });
    }
  });
});

