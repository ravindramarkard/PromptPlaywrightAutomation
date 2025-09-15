# Global Login Implementation Guide

## Overview

This implementation provides a global login mechanism for Playwright test suites where:
- **First test (spec1)** performs login and saves authentication state
- **Subsequent tests (spec2, spec3, etc.)** skip login and reuse the authenticated session
- **No redundant login operations** across test files in the same suite

## How It Works

### 1. Global Setup (`global-setup.ts`)
- Runs before all tests in a suite
- Performs initial authentication
- Saves authentication state to `storageState.json`
- Sets up environment variables for test reuse

### 2. Playwright Configuration (`playwright.config.js`)
- Configured to use `storageState.json` for session reuse
- Global setup is enabled for all test runs
- Storage state is automatically loaded for each test

### 3. Auth Helper (`test-utils/auth-helper.ts`)
- `isAlreadyLoggedIn()` - Detects if user is already authenticated
- `skipLoginIfAuthenticated()` - Skips login if already logged in
- `performLogin()` - Performs login when needed

## Files Created/Modified

### New Files:
- `global-setup.ts` - Global authentication setup
- `test-utils/auth-helper.ts` - Login detection utilities
- `test-utils/test-template.ts` - Template for new tests
- `tests/example-global-login.spec.ts` - Example implementation
- `scripts/add-global-login.js` - Migration script for existing tests

### Modified Files:
- `playwright.config.js` - Added global setup configuration
- `server/services/TestSuiteExecutor.js` - Added global setup to test execution

## Usage Examples

### 1. New Test Files (Recommended)

```typescript
import { test, expect } from '@playwright/test';
import { skipLoginIfAuthenticated, performLogin } from '../test-utils/auth-helper';

test.describe('Your Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // First test will login, others will skip
    await skipLoginIfAuthenticated(page, async () => {
      await performLogin(page, {
        baseUrl: process.env.BASE_URL || 'http://localhost:5050',
        username: process.env.USERNAME || 'admin',
        password: process.env.PASSWORD || 'password'
      });
    });
  });

  test('Test 1 - Login will be performed', async ({ page }) => {
    // Your test logic here
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Test 2 - Login will be skipped', async ({ page }) => {
    // Your test logic here
    await page.goto('/settings');
    await expect(page).toHaveURL(/settings/);
  });
});
```

### 2. Manual Login Control

```typescript
test('Test with manual login control', async ({ page }) => {
  await skipLoginIfAuthenticated(page, async () => {
    console.log('🔐 Performing login...');
    await performLogin(page);
  });

  // Your test logic here
});
```

### 3. Migrating Existing Tests

Run the migration script to automatically add global login to existing tests:

```bash
node scripts/add-global-login.js
```

## Environment Variables

Set these environment variables for authentication:

```bash
# Required
BASE_URL=http://localhost:5050
USERNAME=admin
PASSWORD=password

# Optional
LOGIN_URL=http://localhost:5050/login  # Custom login URL
```

## Test Execution Flow

### Sequential Execution:
1. **Global Setup** runs first, performs login, saves `storageState.json`
2. **Test 1** loads `storageState.json`, skips login, runs test
3. **Test 2** loads `storageState.json`, skips login, runs test
4. **Test 3** loads `storageState.json`, skips login, runs test
5. **All tests** run in single browser session with shared authentication

### Parallel Execution:
1. **Global Setup** runs first, performs login, saves `storageState.json`
2. **All tests** start simultaneously, each loads `storageState.json`
3. **Each test** skips login and runs with authenticated session
4. **Tests run** in parallel with shared authentication state

## Console Output

You'll see these messages during execution:

```
🔐 Starting global authentication setup...
🌐 Navigating to login page: http://localhost:5050/login
📝 Filling email/username field...
🔒 Filling password field...
🚀 Submitting login form...
✅ Login successful - redirected from login page
💾 Authentication state saved to: /path/to/storageState.json

🧪 Running first test - should perform login
🚀 User is already logged in, skipping login step
✅ First test completed - user is now logged in

🧪 Running second test - should skip login
🚀 User is already logged in, skipping login step
✅ Second test completed - login was skipped
```

## Benefits

1. **Faster Test Execution** - No redundant login operations
2. **Consistent Authentication** - All tests use the same login session
3. **Reduced Server Load** - Fewer authentication requests
4. **Better Test Reliability** - Less chance of login-related failures
5. **Easier Maintenance** - Centralized login logic

## Troubleshooting

### Issue: Tests still performing login
**Solution:** Check that `storageState.json` is being created and `playwright.config.js` has `storageState: 'storageState.json'`

### Issue: Login detection not working
**Solution:** Update the `isAlreadyLoggedIn()` function in `auth-helper.ts` to match your app's authenticated state indicators

### Issue: Global setup failing
**Solution:** Check environment variables and login form selectors in `global-setup.ts`

### Issue: Storage state not persisting
**Solution:** Ensure the test execution directory has write permissions and `storageState.json` is not being deleted

## Advanced Configuration

### Custom Login Detection

Modify `isAlreadyLoggedIn()` in `auth-helper.ts`:

```typescript
export async function isAlreadyLoggedIn(page: Page): Promise<boolean> {
  // Add your custom indicators
  const indicators = [
    'text=Logout',
    '[data-testid="user-menu"]',
    '.authenticated-content',
    // Add more indicators specific to your app
  ];
  
  // Your custom logic here
}
```

### Custom Login Function

Modify `performLogin()` in `auth-helper.ts`:

```typescript
export async function performLogin(page: Page, options = {}): Promise<void> {
  // Your custom login logic here
  await page.goto('/custom-login');
  await page.fill('#custom-username', options.username);
  await page.fill('#custom-password', options.password);
  await page.click('#custom-submit');
}
```

## Testing the Implementation

1. **Run the example test:**
   ```bash
   npx playwright test tests/example-global-login.spec.ts
   ```

2. **Check console output** for login skipping messages

3. **Verify storageState.json** is created in the project root

4. **Run your test suite** and observe the behavior

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify environment variables are set correctly
3. Ensure your login form selectors match the implementation
4. Check that `storageState.json` is being created and used

The global login implementation should significantly improve your test execution speed and reliability by eliminating redundant login operations across test files.
