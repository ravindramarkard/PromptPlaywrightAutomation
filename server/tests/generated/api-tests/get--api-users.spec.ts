import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('GET /api/users', () => {
  test.beforeEach(async () => {
    await allure.tag('API Test');
    await allure.tag('GET');
    await allure.tag('users');
    await allure.tag('api');
    test.setTimeout(30000);
  });

  test('should handle GET request', async ({ request }) => {
    allure.story('/api/users');
    allure.description('Get all users');
    
    const response = await request.get('https://practicetestautomation.com/practice-test-login//api/users', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    expect(response.status()).toBe(200);
    
    if (response.status() >= 200 && response.status() < 300) {
      const contentType = response.headers()['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    }
  });
});
