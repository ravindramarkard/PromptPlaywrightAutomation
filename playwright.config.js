// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',

  /* Global setup for session management - only when not running test suites */
  globalSetup: process.env.SKIP_GLOBAL_SETUP ? undefined : require.resolve('./global-setup.ts'),

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'server/reports/playwright' }],
    ['allure-playwright', { 
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: false
    }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL,

    storageState: 'storageState.json', // 🔑 reuse logged-in session
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Browser launch options for better performance */
    launchOptions: {
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    },
    
    /* Viewport settings for consistent rendering */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Reduce action timeout for faster feedback */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use system Chrome for better performance
        channel: 'chrome',
        // Additional performance optimizations
        launchOptions: {
          // args: [
          //   '--disable-background-timer-throttling',
          //   '--disable-backgrounding-occluded-windows',
          //   '--disable-renderer-backgrounding',
          //   '--disable-features=TranslateUI',
          //   '--disable-ipc-flooding-protection',
          //   '--disable-background-networking',
          //   '--disable-default-apps',
          //   '--disable-extensions',
          //   '--disable-sync',
          //   '--disable-translate',
          //   '--hide-scrollbars',
          //   '--mute-audio',
          //   '--no-first-run',
          //   '--no-default-browser-check',
          //   '--disable-gpu-sandbox',
          //   '--disable-software-rasterizer',
          //   '--disable-dev-shm-usage',
          //   '--no-sandbox',
          //   '--disable-setuid-sandbox',
          //   '--disable-web-security',
          //   '--disable-features=VizDisplayCompositor'
          // ],
          ignoreDefaultArgs: ['--enable-automation'],
        }
      },
    },

    // API Testing Project
    {
      name: 'api',
      testDir: './server/tests',
      testMatch: '**/generated/api-tests/**/*.spec.ts',
      use: {
        // API tests don't need browser-specific settings
        baseURL: process.env.API_URL || 'https://fakerestapi.azurewebsites.net',
        // API-specific timeouts
        actionTimeout: 30000,
        navigationTimeout: 30000,
        // No browser launch options needed for API tests
        launchOptions: undefined,
        // No viewport needed for API tests
        viewport: undefined,
        // No storage state needed for API tests
        storageState: undefined,
        // No trace needed for API tests
        trace: 'off',
        // No screenshot needed for API tests
        screenshot: 'off',
        // No video needed for API tests
        video: 'off',
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
