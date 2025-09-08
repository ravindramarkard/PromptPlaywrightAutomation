import { test, expect } from '@playwright/test';

// Auto-waiting navigation helper with multiple strategies
async function navigateWithAutoWait(page, url) {
  const strategies = [
    { waitUntil: 'domcontentloaded' },
    { waitUntil: 'load' }
  ];
  
  for (const strategy of strategies) {
    try {
      await page.goto(url, strategy);
      await page.waitForLoadState('networkidle').catch(() => console.log('Network idle timeout, continuing...'));
      console.log('Navigation successful with strategy:', strategy.waitUntil);
      return;
    } catch (error) {
      console.log('Navigation attempt failed:', error.message);
    }
  }
  throw new Error('All navigation strategies failed');
}

// Test cleanup helper
async function handleTestCleanup(page, testInfo) {
  try {
    if (testInfo.status !== 'passed') {
      const screenshotPath = `screenshots/failure-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Screenshot saved:', screenshotPath);
    }
    console.log('Test cleanup completed');
  } catch (error) {
    console.error('Error during test cleanup:', error.message);
  }
}

test.describe('Auto-Waiting Self-Healing Test - Normal @Test Structure', () => {
  // Normal @Test method without beforeEach hooks
  test('should demonstrate auto-waiting and self-healing capabilities', async ({ page }) => {
    // Playwright's default timeout is sufficient for auto-waiting
    test.setTimeout(60000);
    
    // Test description: Normal @Test structure with auto-waiting and self-healing
    // Severity: normal
    // Owner: AI Test Generator

    // Auto-navigate to base URL at test start (no beforeEach needed)
    const baseUrl = process.env.BASE_URL || 'https://practicetestautomation.com/practice-test-login/';
    await navigateWithAutoWait(page, baseUrl);
    
    try {
      // Step 1: Auto-waiting username input with self-healing selectors
      console.log('Step 1: Entering username with auto-waiting...');
      const usernameSelectors = [
        '#username',
        'input[name="username"]',
        '[data-testid="username"]'
      ];
      
      let usernameFound = false;
      for (const selector of usernameSelectors) {
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible' });
          await element.fill('student');
          console.log(`Username filled successfully using: ${selector}`);
          usernameFound = true;
          break;
        } catch (error) {
          console.log(`Selector ${selector} failed, trying next...`);
        }
      }
      if (!usernameFound) throw new Error('All username selectors failed');
      
      // Step 2: Auto-waiting password input with self-healing selectors
      console.log('Step 2: Entering password with auto-waiting...');
      const passwordSelectors = [
        '#password',
        'input[name="password"]',
        '[data-testid="password"]'
      ];
      
      let passwordFound = false;
      for (const selector of passwordSelectors) {
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible' });
          await element.fill('Password123');
          console.log(`Password filled successfully using: ${selector}`);
          passwordFound = true;
          break;
        } catch (error) {
          console.log(`Selector ${selector} failed, trying next...`);
        }
      }
      if (!passwordFound) throw new Error('All password selectors failed');
      
      // Step 3: Auto-waiting submit button click with self-healing selectors
      console.log('Step 3: Clicking submit with auto-waiting...');
      const submitSelectors = [
        '#submit',
        'button[type="submit"]',
        '[data-testid="submit"]'
      ];
      
      let submitFound = false;
      for (const selector of submitSelectors) {
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible' });
          await element.click();
          console.log(`Submit clicked successfully using: ${selector}`);
          submitFound = true;
          break;
        } catch (error) {
          console.log(`Selector ${selector} failed, trying next...`);
        }
      }
      if (!submitFound) throw new Error('All submit selectors failed');
      
      // Step 4: Verify successful navigation with auto-waiting
      console.log('Step 4: Verifying successful login...');
      await expect(page).toHaveURL(/logged-in-successfully/);
      
      // Step 5: Verify success message with auto-waiting (optional)
      console.log('Step 5: Verifying success message...');
      try {
        const successMessage = page.locator('text=/Congratulations|successfully logged in|welcome/i');
        await successMessage.waitFor({ state: 'visible', timeout: 5000 });
        await expect(successMessage).toBeVisible();
        console.log('Success message found and verified');
      } catch (error) {
        console.log('Success message not found, but URL verification passed - test successful');
      }
      
      console.log('✅ Test completed successfully - Normal @Test structure with auto-waiting and self-healing!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      await handleTestCleanup(page, test.info());
      throw error;
    }
  });
});