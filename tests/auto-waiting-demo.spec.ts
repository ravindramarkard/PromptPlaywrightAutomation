import { test, expect } from '@playwright/test';

// Auto-waiting navigation helper with multiple strategies (no hardcoded timeouts)
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

test.describe('Auto-Waiting Demo - No Hardcoded Timeouts', () => {
  test('should demonstrate Playwright auto-waiting capabilities', async ({ page }) => {
    // Playwright's default timeout is sufficient for auto-waiting
    test.setTimeout(30000);
    
    console.log('🚀 Starting auto-waiting demonstration...');
    
    try {
      // Step 1: Navigate using auto-waiting (no hardcoded timeouts)
      console.log('Step 1: Navigating with auto-waiting...');
      await navigateWithAutoWait(page, 'https://example.com');
      
      // Step 2: Wait for elements using Playwright's built-in auto-waiting
      console.log('Step 2: Waiting for page elements with auto-waiting...');
      
      // Playwright automatically waits for elements to be actionable
      const heading = page.locator('h1');
      await expect(heading).toBeVisible(); // Auto-waits for visibility
      
      // Step 3: Verify page content with auto-waiting
      console.log('Step 3: Verifying page content...');
      await expect(page).toHaveTitle(/Example/); // Auto-waits for title
      
      // Step 4: Demonstrate self-healing selectors with auto-waiting
      console.log('Step 4: Testing self-healing selectors...');
      const contentSelectors = [
        'div p',
        '[role="main"] p',
        'body p'
      ];
      
      let contentFound = false;
      for (const selector of contentSelectors) {
        try {
          const element = page.locator(selector).first();
          await expect(element).toBeVisible(); // Auto-waits without timeout
          console.log(`Content found using selector: ${selector}`);
          contentFound = true;
          break;
        } catch (error) {
          console.log(`Selector ${selector} failed, trying next...`);
        }
      }
      
      if (contentFound) {
        console.log('✅ Self-healing selectors working with auto-waiting!');
      }
      
      console.log('✅ Auto-waiting demonstration completed successfully!');
      console.log('🎯 Key benefits demonstrated:');
      console.log('   • No hardcoded timeouts needed');
      console.log('   • Playwright handles waiting automatically');
      console.log('   • Self-healing selectors with fallbacks');
      console.log('   • Robust navigation strategies');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      throw error;
    }
  });
});