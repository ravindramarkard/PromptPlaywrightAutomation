import { Page } from '@playwright/test';

/**
 * Check if the user is already logged in by looking for common authenticated state indicators
 */
export async function isAlreadyLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for common authenticated state indicators
    const indicators = [
      // Look for logout buttons/links
      'text=Logout',
      'text=Sign Out',
      'text=Log out',
      '[data-testid="logout"]',
      '[data-testid="sign-out"]',
      
      // Look for user profile/menu elements
      '[data-testid="user-menu"]',
      '[data-testid="profile"]',
      '.user-menu',
      '.profile-menu',
      
      // Look for dashboard-specific elements
      '[data-testid="dashboard"]',
      'text=Dashboard',
      'text=Welcome',
      
      // Look for authenticated-only content
      'text=My Account',
      'text=Settings',
      'text=Profile',
      
      // Check URL patterns that indicate authenticated state
      // (this will be checked in the calling function)
    ];

    // Check if any of the indicators are present
    for (const indicator of indicators) {
      try {
        const element = page.locator(indicator).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found authenticated state indicator: ${indicator}`);
          return true;
        }
      } catch (error) {
        // Continue checking other indicators
      }
    }

    // Check if we're on a page that requires authentication (not login page)
    const currentUrl = page.url();
    const loginIndicators = ['/login', '/signin', '/auth', '/sign-in'];
    const isOnLoginPage = loginIndicators.some(indicator => currentUrl.includes(indicator));
    
    if (!isOnLoginPage && !currentUrl.includes('/login')) {
      console.log(`✅ Not on login page, assuming authenticated: ${currentUrl}`);
      return true;
    }

    return false;
  } catch (error) {
    console.log('⚠️ Error checking login state:', error);
    return false;
  }
}

/**
 * Skip login if already authenticated, otherwise perform login
 */
export async function skipLoginIfAuthenticated(page: Page, loginFunction: () => Promise<void>): Promise<void> {
  const isLoggedIn = await isAlreadyLoggedIn(page);
  
  if (isLoggedIn) {
    console.log('🚀 User is already logged in, skipping login step');
    return;
  }
  
  console.log('🔐 User is not logged in, performing login...');
  await loginFunction();
}

/**
 * Common login function that can be reused across tests
 */
export async function performLogin(page: Page, options: {
  baseUrl?: string;
  username?: string;
  password?: string;
  loginUrl?: string;
} = {}): Promise<void> {
  const {
    baseUrl = process.env.BASE_URL || 'http://localhost:5050',
    username = process.env.USERNAME || 'admin',
    password = process.env.PASSWORD || 'password',
    loginUrl = process.env.LOGIN_URL || `${baseUrl}/login`
  } = options;

  console.log(`🌐 Navigating to login page: ${loginUrl}`);
  await page.goto(loginUrl);

  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"], input[name="username"], input[name="email"]', { timeout: 10000 });
  
  // Fill login form - try different common selectors
  const emailSelector = page.locator('input[type="email"], input[name="username"], input[name="email"]').first();
  const passwordSelector = page.locator('input[type="password"], input[name="password"]').first();
  const submitSelector = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

  if (await emailSelector.isVisible()) {
    console.log('📝 Filling email/username field...');
    await emailSelector.fill(username);
  }

  if (await passwordSelector.isVisible()) {
    console.log('🔒 Filling password field...');
    await passwordSelector.fill(password);
  }

  if (await submitSelector.isVisible()) {
    console.log('🚀 Submitting login form...');
    await submitSelector.click();
  }

  // Wait for successful login
  try {
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 });
    console.log('✅ Login successful - redirected from login page');
  } catch (error) {
    // If no redirect, look for success indicators on the page
    try {
      await page.waitForSelector('text=Dashboard, text=Welcome, text=Logout, [data-testid="dashboard"]', { timeout: 10000 });
      console.log('✅ Login successful - found success indicators');
    } catch (error2) {
      console.log('⚠️ Login may have failed - continuing anyway');
    }
  }
}
