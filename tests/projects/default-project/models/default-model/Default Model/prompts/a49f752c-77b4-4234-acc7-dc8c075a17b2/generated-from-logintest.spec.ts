import { test, expect } from '@playwright/test';
// Note: allure-playwright import removed due to API compatibility issues
// import { allure } from 'allure-playwright';

import { APIRequestContext } from '@playwright/test';


// Auto-waiting navigation helper with multiple strategies
async function navigateWithAutoWait(page, url) {
  const strategies = [
    { waitUntil: 'domcontentloaded' },
    { waitUntil: 'load' },
    { waitUntil: 'networkidle' }
  ];
  
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const strategy of strategies) {
      try {
        await page.goto(url, strategy);
        await page.waitForLoadState('networkidle').catch(() => console.log('Network idle timeout, continuing...'));
        console.log('Navigation successful with strategy:', strategy.waitUntil);
        return;
      } catch (error) {
        console.log('Navigation attempt failed:', error.message);
        await page.waitForTimeout(500 * (attempt + 1)); // Reduced backoff
      }
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
    
    await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], .modal, .popup');
      dialogs.forEach(dialog => {
        if (dialog.style) dialog.style.display = 'none';
      });
    });
    
    console.log('Test cleanup completed');
  } catch (error) {
    console.error('Error during test cleanup:', error.message);
  }
}
test.describe('Generated from logintest', () => {
  // Auto-waiting navigation helper function
  const navigateWithAutoWait = async (page, url) => {
    const navigationStrategies = [
      { waitUntil: 'domcontentloaded', timeout: 30000 },
      { waitUntil: 'load', timeout: 45000 },
      { waitUntil: 'networkidle', timeout: 60000 }
    ];
    
    for (let i = 0; i < navigationStrategies.length; i++) {
      try {
        await page.goto(url, navigationStrategies[i]);
        console.log(`Navigation successful with strategy: ${JSON.stringify(navigationStrategies[i])}`);
        
        // Additional wait for page stability
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        return;
      } catch (error) {
        console.log(`Navigation strategy ${i + 1} failed: ${error.message}`);
        if (i === navigationStrategies.length - 1) {
          throw new Error(`All navigation strategies failed: ${error.message}`);
        }
      }
    }
  };

  test('should execute test steps', async ({ page, request }) => {
    test.setTimeout(90000);

    // Test description: Automated test generated from AI prompt with 7 steps
    // Severity: normal
    // Owner: AI Test Generator

    // Auto-navigate to base URL at test start
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await navigateWithAutoWait(page, baseUrl);

    try {

    // Step 1: Navigate to button
    await test.step('Step 1: Navigate to button', async () => {
      try {
      await page.goto('http://localhost:3000/button', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => console.log('Network idle timeout, continuing...'));
      } catch (error) {
        console.error('Step 1 failed:', error);
        throw error;
      }
      });

    // Step 2: Fill input with value
    await test.step('Step 2: Fill input with value', async () => {
      try {
      // Auto-waiting and self-healing fill with multiple strategies
      const fillElement = async () => {
        const selectors = [
          'text=input',
          'input[name="input"]',
          '#input',
          'input[placeholder*="input"]',
          'input[type="text"][id*="input"]',
          'input[type="password"][id*="input"]',
          'input[type="email"][id*="input"]',
          'textarea[name="input"]',
          '[data-testid*="input"]'
        ];
        
        for (let i = 0; i < selectors.length; i++) {
          try {
            const element = page.locator(selectors[i]).first();
            await element.waitFor({ state: 'visible' });
            await element.clear();
            await element.fill('test value');
            console.log(`Successfully filled using selector: ${selectors[i]}`);
            return;
          } catch (error) {
            console.log(`Selector ${selectors[i]} failed: ${error.message}`);
            if (i === selectors.length - 1) throw error;
          }
        }
      };
      
      // Retry mechanism with reduced backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await fillElement();
          break;
        } catch (error) {
          console.log(`Fill attempt ${attempt} failed: ${error.message}`);
          if (attempt === 3) throw new Error(`Failed to fill element after 3 attempts: ${error.message}`);
          await page.waitForTimeout(attempt * 500); // Reduced backoff time
        }
      }
      } catch (error) {
        console.error('Step 2 failed:', error);
        throw error;
      }
      });

    // Step 3: Fill input with value
    await test.step('Step 3: Fill input with value', async () => {
      try {
      // Auto-waiting and self-healing fill with multiple strategies
      const fillElement = async () => {
        const selectors = [
          'text=input',
          'input[name="input"]',
          '#input',
          'input[placeholder*="input"]',
          'input[type="text"][id*="input"]',
          'input[type="password"][id*="input"]',
          'input[type="email"][id*="input"]',
          'textarea[name="input"]',
          '[data-testid*="input"]'
        ];
        
        for (let i = 0; i < selectors.length; i++) {
          try {
            const element = page.locator(selectors[i]).first();
            await element.waitFor({ state: 'visible' });
            await element.clear();
            await element.fill('test value');
            console.log(`Successfully filled using selector: ${selectors[i]}`);
            return;
          } catch (error) {
            console.log(`Selector ${selectors[i]} failed: ${error.message}`);
            if (i === selectors.length - 1) throw error;
          }
        }
      };
      
      // Retry mechanism with reduced backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await fillElement();
          break;
        } catch (error) {
          console.log(`Fill attempt ${attempt} failed: ${error.message}`);
          if (attempt === 3) throw new Error(`Failed to fill element after 3 attempts: ${error.message}`);
          await page.waitForTimeout(attempt * 500); // Reduced backoff time
        }
      }
      } catch (error) {
        console.error('Step 3 failed:', error);
        throw error;
      }
      });

    // Step 4: Push Submit button
    await test.step('Step 4: Push Submit button', async () => {
      try {
      // TODO: Implement step: Push Submit button
      console.log('Step not implemented:', 'Push Submit button');
      } catch (error) {
        console.error('Step 4 failed:', error);
        throw error;
      }
      });

    // Step 5: Assert new page URL contains practicetestautomation.com/logged-in-successfully/
    await test.step('Step 5: Assert new page URL contains practicetestautomation.com/logged-in-successfully/', async () => {
      try {
      await page.waitForSelector('new page URL contains practicetestautomation.com/logged-in-successfully/', { state: 'visible' });
      await expect(page.locator('new page URL contains practicetestautomation.com/logged-in-successfully/')).toContainText();
      } catch (error) {
        console.error('Step 5 failed:', error);
        throw error;
      }
      });

    // Step 6: Assert new page contains expected text ('Congratulations' or 'successfully logged in')
    await test.step('Step 6: Assert new page contains expected text ('Congratulations' or 'successfully logged in')', async () => {
      try {
      await page.waitForSelector('text=text', { state: 'visible' });
      await expect(page.locator('text=text')).toContainText();
      } catch (error) {
        console.error('Step 6 failed:', error);
        throw error;
      }
      });

    // Step 7: Assert button Log out is displayed on the new page
    await test.step('Step 7: Assert button Log out is displayed on the new page', async () => {
      try {
      await page.waitForSelector('text=button', { state: 'visible' });
      await expect(page.locator('text=button')).toBeVisible();
      } catch (error) {
        console.error('Step 7 failed:', error);
        throw error;
      }
      });
      console.log('Test completed successfully');
    } catch (error) {
      console.error('Test failed:', error.message);
      await handleTestCleanup(page, test.info());
      throw error;
    }
  });
  // Auto-cleanup and reporting helper
  const handleTestCleanup = async (page, testInfo) => {
    try {
      if (testInfo.status === 'failed') {
        await page.screenshot({ 
          path: `test-results/screenshots/failure-${Date.now()}.png`,
          fullPage: true 
        });
        console.log('Screenshot captured for failed test');
      }
    } catch (error) {
      console.log('Failed to capture screenshot:', error.message);
    }
  };
});

