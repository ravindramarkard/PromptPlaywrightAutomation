import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('POST /api/v1/Activities', () => {
  test.beforeEach(async () => {
    await allure.tag('API Test');
    await allure.tag('POST');
    await allure.tag('Activities');
    test.setTimeout(30000);
  });

  test('should POST /api/v1/Activities', async ({ request }) => {
    allure.story('/api/v1/Activities');
    allure.description('POST /api/v1/Activities');
    
    const response = await request.post('http://localhost:3000/api/v1/Activities', {
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
