import { Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Session Manager for spec-level session storage
 * This allows you to control session storage at the spec file level
 */

export class SessionManager {
  private static sessionFilePath = 'storageState.json';
  private static sessionExists = false;

  /**
   * Check if a session file exists
   */
  static hasSession(): boolean {
    return fs.existsSync(this.sessionFilePath);
  }

  /**
   * Save current page context to session file
   */
  static async saveSession(page: Page): Promise<void> {
    try {
      await page.context().storageState({ path: this.sessionFilePath });
      this.sessionExists = true;
      console.log(`💾 Session saved to: ${this.sessionFilePath}`);
    } catch (error) {
      console.error('❌ Failed to save session:', error);
    }
  }

  /**
   * Load session into a new context
   */
  static async loadSession(browser: any): Promise<BrowserContext> {
    if (!this.hasSession()) {
      console.log('⚠️ No session file found, creating new context');
      return await browser.newContext();
    }

    try {
      const context = await browser.newContext({
        storageState: this.sessionFilePath
      });
      console.log(`🔄 Session loaded from: ${this.sessionFilePath}`);
      return context;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      return await browser.newContext();
    }
  }

  /**
   * Clear session file
   */
  static clearSession(): void {
    if (fs.existsSync(this.sessionFilePath)) {
      fs.unlinkSync(this.sessionFilePath);
      this.sessionExists = false;
      console.log('🗑️ Session cleared');
    }
  }

  /**
   * Check if user is already logged in by looking for common authenticated state indicators
   */
  static async isAlreadyLoggedIn(page: Page): Promise<boolean> {
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
      
      if (!isOnLoginPage && !currentUrl.includes('/login') && currentUrl !== 'about:blank') {
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
  static async skipLoginIfAuthenticated(page: Page, loginFunction: () => Promise<void>): Promise<void> {
    const isLoggedIn = await this.isAlreadyLoggedIn(page);
    
    if (isLoggedIn) {
      console.log('🚀 User is already logged in, skipping login step');
      return;
    }
    
    console.log('🔐 User is not logged in, performing login...');
    await loginFunction();
  }
}

/**
 * Helper function to create a context with session management
 */
export async function createContextWithSession(browser: any, options: any = {}): Promise<BrowserContext> {
  return await SessionManager.loadSession(browser);
}

/**
 * Helper function to save session after login
 */
export async function saveSessionAfterLogin(page: Page): Promise<void> {
  await SessionManager.saveSession(page);
}

/**
 * Helper function to check if login is needed
 */
export async function shouldSkipLogin(page: Page): Promise<boolean> {
  return await SessionManager.isAlreadyLoggedIn(page);
}
