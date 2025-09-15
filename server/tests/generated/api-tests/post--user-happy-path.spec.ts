import { test, expect, APIRequestContext, APIResponse } from '@playwright/test';
import { allure } from 'allure-playwright';



test.describe('POST /user - happy-path', () => {
  let requestContext: APIRequestContext;
  const baseURL = process.env.BASE_URL || 'https://petstore.swagger.io/';
  const timeout = parseInt(process.env.TIMEOUT || '30000');

  test.beforeAll(async () => {
    const { request } = await import('@playwright/test');
    requestContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout
    });
  });

  test.afterAll(async () => {
    if (requestContext) {
      await requestContext.dispose();
    }
  });

  test('happy-path: create user with valid data', async () => {
    await allure.description('Test the happy path scenario for creating a user with valid data');
    await allure.tags('api', 'user', 'create', 'happy-path');

    const testUserData = {
      id: Math.floor(Math.random() * 10000),
      username: `testuser_${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      email: `testuser_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      phone: '+1234567890',
      userStatus: 1
    };

    const startTime = Date.now();
    let response: APIResponse;

    try {
      response = await requestContext.post('/user', {
        data: testUserData,
        timeout: timeout
      });

      const responseTime = Date.now() - startTime;

      await allure.step('Validate response status', async () => {
        expect(response!.status(), 'Response status should be 200').toBe(200);
      });

      await allure.step('Validate response headers', async () => {
        const contentType = response!.headers()['content-type'];
        expect(contentType, 'Content-Type should be application/json').toContain('application/json');
      });

      await allure.step('Validate response body structure', async () => {
        const responseBody = await response!.json();
        
        expect(responseBody).toHaveProperty('code');
        expect(responseBody).toHaveProperty('type');
        expect(responseBody).toHaveProperty('message');
        
        expect(typeof responseBody.code).toBe('number');
        expect(typeof responseBody.type).toBe('string');
        expect(typeof responseBody.message).toBe('string');
      });

      await allure.step('Validate response performance', async () => {
        expect(responseTime, 'Response time should be less than 2000ms').toBeLessThan(2000);
      });

      await allure.step('Log request and response details', async () => {
        await allure.attachment('Request Data', JSON.stringify(testUserData, null, 2), 'application/json');
        await allure.attachment('Response Body', JSON.stringify(await response!.json(), null, 2), 'application/json');
        await allure.attachment('Response Headers', JSON.stringify(response!.headers(), null, 2), 'application/json');
        await allure.attachment('Performance Metrics', JSON.stringify({ responseTime }, null, 2), 'application/json');
      });

    } catch (error: unknown) {
      await allure.step('Error handling', async () => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await allure.attachment('Error Details', errorMessage, 'text/plain');
        throw error;
      });
    }
  });

  test('happy-path: create user with minimal required fields', async () => {
    await allure.description('Test creating user with only required fields');
    await allure.tags('api', 'user', 'create', 'minimal');

    const minimalUserData = {
      id: Math.floor(Math.random() * 10000),
      username: `minimal_${Date.now()}`,
      email: `minimal_${Date.now()}@example.com`
    };

    const response: APIResponse = await requestContext.post('/user', {
      data: minimalUserData
    });

    expect(response!.status()).toBe(200);
    
    const responseBody = await response!.json();
    expect(responseBody).toHaveProperty('code');
    expect(responseBody.code).toBe(200);
  });

  test('negative-test: create user with missing required fields', async () => {
    await allure.description('Test error handling for missing required fields');
    await allure.tags('api', 'user', 'create', 'negative');

    const invalidUserData = {
      id: Math.floor(Math.random() * 10000),
      firstName: 'Test'
      // Missing username and email
    };

    const response: APIResponse = await requestContext.post('/user', {
      data: invalidUserData
    });

    expect(response!.status()).not.toBe(200);
  });

  test('edge-case: create user with boundary values', async () => {
    await allure.description('Test boundary values for user creation');
    await allure.tags('api', 'user', 'create', 'edge-case');

    const boundaryUserData = {
      id: 0, // Minimum ID
      username: 'a', // Minimum length
      firstName: 'A'.repeat(50), // Maximum reasonable length
      email: `test_${'a'.repeat(240)}@example.com`, // Long email
      userStatus: 0 // Minimum status
    };

    const response: APIResponse = await requestContext.post('/user', {
      data: boundaryUserData
    });

    expect(response!.status()).toBe(200);
  });

  test('security: create user with special characters', async () => {
    await allure.description('Test handling of special characters in user data');
    await allure.tags('api', 'user', 'create', 'security');

    const securityUserData = {
      id: Math.floor(Math.random() * 10000),
      username: `test<script>alert('xss')</script>_${Date.now()}`,
      firstName: 'Test; DROP TABLE users; --',
      email: `test${Date.now()}@example.com`,
      password: 'Password123!@#$%^&*()'
    };

    const response: APIResponse = await requestContext.post('/user', {
      data: securityUserData
    });

    expect(response!.status()).toBe(200);
  });

  test('performance: create user with large payload', async () => {
    await allure.description('Test performance with large user data payload');
    await allure.tags('api', 'user', 'create', 'performance');

    const largeUserData = {
      id: Math.floor(Math.random() * 10000),
      username: `large_${Date.now()}`,
      firstName: 'Large'.repeat(100),
      lastName: 'Payload'.repeat(100),
      email: `large_${Date.now()}@example.com`,
      password: 'A'.repeat(500),
      phone: '+1'.repeat(50),
      userStatus: 1,
      additionalData: {
        metadata: Array(100).fill(0).map((_, i) => ({ key: `param${i}`, value: `value${i}` })),
        preferences: Array(50).fill(0).reduce((acc, _, i) => {
          acc[`preference${i}`] = `value${i}`.repeat(10);
          return acc;
        }, {})
      }
    };

    const startTime = Date.now();
    const response: APIResponse = await requestContext.post('/user', {
      data: largeUserData
    });
    const responseTime = Date.now() - startTime;

    expect(response!.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000);
  });
});