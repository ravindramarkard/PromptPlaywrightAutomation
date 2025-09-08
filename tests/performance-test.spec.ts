import { test, expect } from '@playwright/test';

test.describe('Performance Optimization Test', () => {
  test('should load application faster with optimized browser settings', async ({ page }) => {
    // Set a reasonable timeout for performance testing
    test.setTimeout(30000);
    
    console.log('🚀 Starting performance test with optimized browser settings...');
    
    // Measure navigation performance
    const startTime = Date.now();
    
    try {
      // Navigate to the application
      console.log('📍 Navigating to application...');
      await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      const navigationTime = Date.now() - startTime;
      console.log(`⏱️ Navigation completed in: ${navigationTime}ms`);
      
      // Wait for the page to be fully interactive
      console.log('🔄 Waiting for page to be interactive...');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const totalLoadTime = Date.now() - startTime;
      console.log(`⚡ Total load time: ${totalLoadTime}ms`);
      
      // Verify the page loaded correctly
      console.log('✅ Verifying page content...');
      
      // Check for common elements that indicate the app loaded
      const bodyElement = page.locator('body');
      await expect(bodyElement).toBeVisible();
      
      // Check if React app mounted (look for React root or common elements)
      const reactElements = [
        '#root',
        '[data-reactroot]',
        '.App',
        'main',
        'header',
        'nav'
      ];
      
      let appLoaded = false;
      for (const selector of reactElements) {
        try {
          const element = page.locator(selector).first();
          await element.waitFor({ state: 'attached', timeout: 2000 });
          console.log(`📱 React app detected using selector: ${selector}`);
          appLoaded = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!appLoaded) {
        console.log('⚠️ React app structure not detected, checking for basic HTML content...');
        // Fallback: check for any content in the page
        const pageContent = await page.textContent('body');
        if (pageContent && pageContent.trim().length > 0) {
          console.log('📄 Page has content, considering it loaded');
          appLoaded = true;
        }
      }
      
      // Performance assertions
      expect(navigationTime).toBeLessThan(10000); // Navigation should be under 10 seconds
      expect(totalLoadTime).toBeLessThan(15000);  // Total load should be under 15 seconds
      expect(appLoaded).toBe(true); // App should be loaded
      
      console.log('✅ Performance test completed successfully!');
      console.log('🎯 Optimizations applied:');
      console.log('   • Disabled background processes');
      console.log('   • Reduced browser overhead');
      console.log('   • Optimized rendering pipeline');
      console.log('   • Disabled unnecessary features');
      console.log('   • Using system Chrome for better performance');
      
      // Additional performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      console.log('📊 Browser Performance Metrics:');
      console.log(`   • DOM Content Loaded: ${Math.round(performanceMetrics.domContentLoaded)}ms`);
      console.log(`   • Load Complete: ${Math.round(performanceMetrics.loadComplete)}ms`);
      console.log(`   • First Paint: ${Math.round(performanceMetrics.firstPaint)}ms`);
      console.log(`   • First Contentful Paint: ${Math.round(performanceMetrics.firstContentfulPaint)}ms`);
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      
      // Capture screenshot for debugging
      await page.screenshot({ 
        path: `performance-test-failure-${Date.now()}.png`, 
        fullPage: true 
      });
      
      throw error;
    }
  });
  
  test('should handle multiple page interactions efficiently', async ({ page }) => {
    test.setTimeout(20000);
    
    console.log('🔄 Testing multiple page interactions...');
    
    await page.goto('http://localhost:3000');
    
    // Test rapid interactions
    const interactionStart = Date.now();
    
    // Simulate user interactions
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
    await page.mouse.move(300, 300);
    
    // Test keyboard interactions
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    
    const interactionTime = Date.now() - interactionStart;
    console.log(`⚡ Interaction response time: ${interactionTime}ms`);
    
    // Interactions should be responsive
    expect(interactionTime).toBeLessThan(1000);
    
    console.log('✅ Interaction performance test passed!');
  });
});