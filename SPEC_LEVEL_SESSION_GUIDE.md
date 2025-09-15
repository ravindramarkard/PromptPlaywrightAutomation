# Spec-Level Session Management Guide

## Overview

This implementation provides **spec-level session management** for Playwright test suites where:
- **First test (spec1)** performs login and saves authentication state to `storageState.json`
- **Subsequent tests (spec2, spec3, etc.)** automatically load the saved session and skip login
- **No global setup required** - each spec file controls its own session management
- **Easy to switch between different apps** - just change the login logic in your spec files

## How It Works

### 1. Session Manager (`test-utils/session-manager.ts`)
- `SessionManager.hasSession()` - Checks if session file exists
- `SessionManager.saveSession()` - Saves current page context to `storageState.json`
- `SessionManager.loadSession()` - Loads session into new context
- `SessionManager.isAlreadyLoggedIn()` - Detects if user is already authenticated
- `shouldSkipLogin()` - Helper to check if login should be skipped

### 2. Playwright Configuration (`playwright.config.js`)
- Configured to use `storageState.json` for session reuse
- **No global setup** - session management is handled at spec level
- Storage state is automatically loaded for each test

### 3. Spec File Pattern
- Each spec file imports session management utilities
- First test performs login and saves session
- Subsequent tests check if already logged in and skip login if needed

## Files Created

### New Files:
- `test-utils/session-manager.ts` - Session management utilities
- `test-utils/spec-template-with-session.ts` - Template for new tests
- `tests/example-spec-level-session.spec.ts` - Example implementation
- `scripts/migrate-to-session-management.js` - Migration script for existing tests

### Modified Files:
- `playwright.config.js` - Removed global setup, kept storage state configuration
- `server/services/TestSuiteExecutor.js` - Removed global setup from test execution

## Usage Examples

### 1. Basic Spec File Pattern

```typescript
//tags: smoke
import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { createContextWithSession, saveSessionAfterLogin, shouldSkipLogin } from '../test-utils/session-manager';

const BASE_URL = process.env.BASE_URL || 'https://your-app.com/login';

test.describe('Your Test Suite', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    // Create context with session management
    const context = await createContextWithSession(browser, {
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Login Test - First test that performs login', async () => {
    try {
      // Check if already logged in
      const isLoggedIn = await shouldSkipLogin(page);
      if (isLoggedIn) {
        console.log('🚀 Already logged in, skipping login');
        return;
      }

      // Navigate to login page
      await page.goto(BASE_URL);
      
      // Perform login
      await page.fill('#username', 'your-username');
      await page.fill('#password', 'your-password');
      await page.click('#login-button');
      
      // Validate login
      await page.waitForURL('**/dashboard/**');
      
      // Save session for reuse
      await saveSessionAfterLogin(page);
      console.log('✅ Session saved for subsequent tests');
      
    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      throw error;
    }
  });

  test('Second Test - Should skip login', async () => {
    try {
      // Check if already logged in
      const isLoggedIn = await shouldSkipLogin(page);
      if (isLoggedIn) {
        console.log('🚀 Already logged in, skipping login');
        return;
      }

      // Navigate to protected page (should work without login)
      await page.goto(BASE_URL.replace('/login', '/dashboard'));
      
      // Verify access
      await expect(page.locator('h1')).toContainText('Dashboard');
      console.log('✅ Successfully accessed protected page without login');
      
    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      throw error;
    }
  });
});
```

### 2. Your Existing Spec File (Updated)

Here's how to update your existing spec file:

```typescript
//tags: smoke
import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { createContextWithSession, saveSessionAfterLogin, shouldSkipLogin } from '../test-utils/session-manager';

const BASE_URL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const BROWSER_TYPE = process.env.BROWSER_TYPE || 'chromium';
const HEADLESS_MODE = process.env.HEADLESS_MODE !== 'false';

test.describe('HR Test Login Only', () => {
  let page: any;

  test.beforeEach(async ({ browser }) => {
    await allure.tags('UI Test', 'Login', 'HR System');
    await allure.attachment('environment', JSON.stringify({
      baseUrl: BASE_URL,
      browserType: BROWSER_TYPE,
      headlessMode: HEADLESS_MODE
    }), 'application/json');

    // Create context with session management
    const context = await createContextWithSession(browser, {
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Generated from HR Test (Copy) Login Only', async () => {
    try {
      // Check if already logged in
      const isLoggedIn = await shouldSkipLogin(page);
      if (isLoggedIn) {
        console.log('🚀 Already logged in, skipping login');
        return;
      }

      await allure.step('1. Navigate to login URL', async () => {
        await page.goto(BASE_URL);
        await expect(page).toHaveURL(BASE_URL);
        await allure.attachment('Page URL', page.url(), 'text/plain');
      });

      await allure.step('2. Use credentials from website', async () => {
        await page.getByRole('textbox', { name: /username/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('textbox', { name: /username/i }).fill('Admin');
        
        await page.getByRole('textbox', { name: /password/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('textbox', { name: /password/i }).fill('admin123');
        
        await page.getByRole('button', { name: /login/i }).waitFor({ state: 'visible', timeout: 15000 });
        await page.getByRole('button', { name: /login/i }).click();
      });

      await allure.step('3. Validate successful login', async () => {
        await page.waitForURL('**/dashboard/**', { timeout: 30000 });
        
        await page.getByRole('heading', { name: /dashboard/i }).waitFor({ state: 'visible', timeout: 15000 });
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
        
        await page.getByRole('banner').waitFor({ state: 'visible', timeout: 15000 });
        await expect(page.getByRole('banner')).toBeVisible();
        
        await allure.attachment('Dashboard URL', page.url(), 'text/plain');
        await allure.attachment('Page Title', await page.title(), 'text/plain');
      });

      await allure.step('4. Save session for reuse', async () => {
        await saveSessionAfterLogin(page);
        console.log('✅ Session saved for subsequent tests');
      });

    } catch (error) {
      await allure.attachment('Error Screenshot', await page.screenshot(), 'image/png');
      await allure.attachment('Error Details', JSON.stringify({
        message: error.message,
        stack: error.stack
      }), 'application/json');
      throw error;
    }
  });
});
```

## Migration Steps

### 1. Automatic Migration (Recommended)

Run the migration script to automatically update your existing test files:

```bash
node scripts/migrate-to-session-management.js
```

### 2. Manual Migration

1. **Add imports** to your spec files:
   ```typescript
   import { createContextWithSession, saveSessionAfterLogin, shouldSkipLogin } from '../test-utils/session-manager';
   ```

2. **Update beforeEach** to use session management:
   ```typescript
   test.beforeEach(async ({ browser }) => {
     const context = await createContextWithSession(browser, {
       viewport: { width: 1920, height: 1080 }
     });
     page = await context.newPage();
   });
   ```

3. **Add session check** at the beginning of each test:
   ```typescript
   test('Your Test', async () => {
     const isLoggedIn = await shouldSkipLogin(page);
     if (isLoggedIn) {
       console.log('🚀 Already logged in, skipping login');
       return;
     }
     // Your test logic here
   });
   ```

4. **Add session save** after successful login:
   ```typescript
   // After login validation
   await saveSessionAfterLogin(page);
   console.log('✅ Session saved for subsequent tests');
   ```

## Environment Variables

Set these environment variables for your tests:

```bash
# Required
BASE_URL=https://your-app.com/login
USERNAME=your-username
PASSWORD=your-password

# Optional
BROWSER_TYPE=chromium
HEADLESS_MODE=false
```

## Test Execution Flow

### Sequential Execution:
1. **Test 1** loads empty context, performs login, saves `storageState.json`
2. **Test 2** loads `storageState.json`, skips login, runs test
3. **Test 3** loads `storageState.json`, skips login, runs test
4. **All tests** run in single browser session with shared authentication

### Parallel Execution:
1. **Test 1** loads empty context, performs login, saves `storageState.json`
2. **Test 2** loads `storageState.json`, skips login, runs test
3. **Test 3** loads `storageState.json`, skips login, runs test
4. **Tests run** in parallel with shared authentication state

## Console Output

You'll see these messages during execution:

```
🚀 Already logged in, skipping login
✅ Session saved for subsequent tests
🚀 Already logged in, skipping login
✅ Successfully accessed protected page without login
```

## Benefits

1. **Spec-Level Control** - Each spec file controls its own session management
2. **Easy App Switching** - Just change login logic in spec files
3. **No Global Dependencies** - No need to modify global setup for different apps
4. **Faster Test Execution** - No redundant login operations
5. **Flexible Configuration** - Easy to customize per spec file

## Switching Between Different Apps

To switch to a different app, just update your spec file:

```typescript
// For App A
const BASE_URL = 'https://app-a.com/login';
// Login logic for App A

// For App B  
const BASE_URL = 'https://app-b.com/login';
// Login logic for App B
```

No need to modify global setup or configuration files!

## Troubleshooting

### Issue: Tests still performing login
**Solution:** Check that `storageState.json` is being created and `shouldSkipLogin()` is being called

### Issue: Session not persisting
**Solution:** Ensure `saveSessionAfterLogin()` is called after successful login

### Issue: Login detection not working
**Solution:** Update the `isAlreadyLoggedIn()` function in `session-manager.ts` to match your app's indicators

## Testing the Implementation

1. **Run the example test:**
   ```bash
   npx playwright test tests/example-spec-level-session.spec.ts
   ```

2. **Check console output** for session management messages

3. **Verify storageState.json** is created in the project root

4. **Run your test suite** and observe the behavior

The spec-level session management provides maximum flexibility while maintaining the benefits of session reuse across tests!
