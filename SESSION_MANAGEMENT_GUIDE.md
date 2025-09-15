# Session Management Guide

This guide explains how to use the session management system to skip login tests when a valid session already exists.

## 🎯 Problem Solved

- **Spec1**: Runs login tests and saves session state
- **Spec2**: Skips login tests, only runs admin page tests (reuses session from Spec1)
- **Spec3**: Skips login tests, only runs PMI page tests (reuses session from Spec1)

## 🚀 Quick Start

### Run Tests in Order (Recommended)
```bash
npm run test:session
```

### Run Individual Specs
```bash
# Run only login tests
npm run test:login

# Run only admin tests (will run login first if no session exists)
npm run test:admin

# Run only PMI tests (will run login first if no session exists)
npm run test:pmi
```

### Clear Session
```bash
npm run test:clear
```

## 📁 File Structure

```
├── tests/
│   ├── spec1-login.spec.ts      # Login tests (saves session)
│   ├── spec2-admin.spec.ts      # Admin tests (reuses session)
│   └── spec3-pmi.spec.ts        # PMI tests (reuses session)
├── test-utils/
│   ├── session-manager.ts       # Session management utilities
│   └── test-skipper.ts          # Test skipping logic
├── global-setup.ts              # Global setup for session management
├── run-tests-with-session.js    # Test runner script
└── storageState.json            # Session state file (auto-generated)
```

## 🔧 How It Works

### 1. Session Detection
The system checks for existing session state in `storageState.json` and validates it.

### 2. Login State Detection
Tests check if the user is already logged in by looking for:
- Logout buttons/links
- User profile elements
- Dashboard elements
- Authenticated-only content

### 3. Test Skipping Logic
- **Login tests**: Skip if user is already logged in
- **Admin/PMI tests**: Skip if no valid session exists
- **Dependency checks**: Skip if required tests haven't passed

### 4. Session Sharing
- Session state is saved after successful login
- Subsequent tests reuse the saved session
- Tests run faster by avoiding redundant login steps

## 📝 Test Writing Guidelines

### Login Tests (Spec1)
```typescript
import { loginTest } from '../test-utils/test-skipper';

loginTest('should perform login successfully', async ({ page }) => {
  // Login logic here
  // Session will be automatically saved
});
```

### Admin Tests (Spec2)
```typescript
import { adminTest } from '../test-utils/test-skipper';

adminTest('should access admin dashboard', async ({ page }) => {
  // Admin test logic here
  // Will skip if no session exists
});
```

### PMI Tests (Spec3)
```typescript
import { pmiTest } from '../test-utils/test-skipper';

pmiTest('should access PMI dashboard', async ({ page }) => {
  // PMI test logic here
  // Will skip if no session exists
});
```

## ⚙️ Configuration

### Environment Variables
```bash
# Login credentials
LOGIN_EMAIL=test@example.com
LOGIN_PASSWORD=password123

# Base URL
BASE_URL=http://localhost:3000

# Test execution control
SKIP_LOGIN_TESTS=false
RUN_LOGIN_TESTS=true
```

### Playwright Config
```javascript
module.exports = defineConfig({
  globalSetup: require.resolve('./global-setup.ts'),
  use: {
    storageState: 'storageState.json', // Session state file
    // ... other config
  }
});
```

## 🎯 Test Execution Flow

### First Run (No Session)
1. **Spec1**: Runs login tests → Saves session
2. **Spec2**: Detects session → Skips login → Runs admin tests
3. **Spec3**: Detects session → Skips login → Runs PMI tests

### Subsequent Runs (Session Exists)
1. **Spec1**: Detects logged in → Skips login tests
2. **Spec2**: Detects session → Skips login → Runs admin tests
3. **Spec3**: Detects session → Skips login → Runs PMI tests

## 🔍 Debugging

### Check Session State
```bash
# View session file
cat storageState.json

# Clear session
npm run test:clear
```

### Debug Test Skipping
Add debug logs to see why tests are being skipped:
```typescript
console.log('Session exists:', TestSkipper.hasValidSession());
console.log('User logged in:', await TestSkipper.isAlreadyLoggedIn(page));
```

### Manual Session Creation
```bash
# Run only login tests to create session
npm run test:login

# Then run other tests
npm run test:admin
npm run test:pmi
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests not skipping login**
   - Check if `storageState.json` exists and is valid
   - Verify login detection selectors match your app
   - Check console logs for skip reasons

2. **Session not being saved**
   - Ensure login tests complete successfully
   - Check if `storageState.json` is being created
   - Verify file permissions

3. **Tests failing after session skip**
   - Check if session is still valid
   - Verify page navigation after login
   - Check for session timeout

### Debug Commands
```bash
# Run with debug output
DEBUG=pw:api npx playwright test

# Run specific test with verbose output
npx playwright test tests/spec1-login.spec.ts --reporter=line --verbose

# Check session file
ls -la storageState.json
```

## 📊 Benefits

- **Faster Execution**: Skip redundant login steps
- **Better Reliability**: Reuse valid sessions
- **Cleaner Tests**: Focus on business logic, not authentication
- **Parallel Execution**: Tests can run independently with shared session
- **Easy Maintenance**: Centralized session management

## 🔄 Advanced Usage

### Custom Test Skipping
```typescript
import { conditionalTest } from '../test-utils/test-skipper';

conditionalTest('custom test', {
  requiresLogin: true,
  skipIfLoggedIn: false,
  dependsOn: ['login'],
  testType: 'custom'
}, async ({ page }) => {
  // Custom test logic
});
```

### Manual Session Management
```typescript
import { TestSkipper } from '../test-utils/test-skipper';

// Check session
if (TestSkipper.hasValidSession()) {
  console.log('Session exists');
}

// Mark test as passed
TestSkipper.markTestPassed('login');

// Clear session
TestSkipper.clearSession();
```

This system ensures efficient test execution by reusing authentication sessions across multiple test specs! 🎉
