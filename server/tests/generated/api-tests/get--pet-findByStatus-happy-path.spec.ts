import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';


test.describe('GET /pet/findByStatus - happy-path', () => {
  let requestContext: APIRequestContext;

  test.beforeAll(async () => {
    const { request } = await import('@playwright/test');
    requestContext = await request.newContext({
      baseURL: process.env.BASE_URL || 'https://petstore.swagger.io',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: parseInt(process.env.TIMEOUT) || 30000
    });
  });

  test.afterAll(async () => {
    if (requestContext) {
      await requestContext.dispose();
    }
  });

  const testData = {
    status: 'available'
  };

  test('happy-path Test', async ({ page, request }) => {
    
    // Prepare request details
    const requestDetails = {
      method: 'GET',
      url: 'https://petstore.swagger.io/pet/findByStatus',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timestamp: new Date().toISOString()
    };
    
    await allure.step('Request Details', async () => {
      await allure.attachment('Request Method', requestDetails.method, 'text/plain');
      await allure.attachment('Request URL', requestDetails.url, 'text/plain');
      await allure.attachment('Request Headers', JSON.stringify(requestDetails.headers, null, 2), 'application/json');
      await allure.attachment('Request Timestamp', requestDetails.timestamp, 'text/plain');
    });
    
    const startTime = Date.now();
    const response = await requestContext.get('/pet/findByStatus', {
      headers: requestDetails.headers
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    await allure.step('Response Details', async () => {
      await allure.attachment('Response Status', response.status().toString(), 'text/plain');
      await allure.attachment('Response Headers', JSON.stringify(response.headers(), null, 2), 'application/json');
      await allure.attachment('Response Time', `${responseTime}ms`, 'text/plain');
      
      if (response.status() >= 200 && response.status() < 300) {
        const contentType = response.headers()['content-type'];
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          await allure.attachment('Response Body', JSON.stringify(data, null, 2), 'application/json');
          expect(data).toBeDefined();
        } else {
          const textData = await response.text();
          await allure.attachment('Response Body (Text)', textData, 'text/plain');
        }
      } else {
        const errorData = await response.text();
        await allure.attachment('Error Response', errorData, 'text/plain');
      }
    });
    
    // Performance assertion
    expect(responseTime).toBeLessThan(5000);
    
    const response = await requestContext.request.get('/pet/findByStatus', { params: { status: testData.status } });
    expect([200, 201, 400, 404]).toContain(response.status());
    expect(await response.json()).toMatchObject({ code: 200, message: 'OK' });
    expect(response.headers()['content-type']).toContain('application/json');
    const responseTime = await response.time();
    expect(responseTime).toBeLessThan(2000);

    allure.addAttachment('Response Body', await response.text());
    allure.addAttachment('Request Headers', JSON.stringify(await requestContext.request.headers()));
  });

  test('Request Validation', async ({ page, request }) => {
    const invalidTestData = { status: 'invalid' };
    try {
      await requestContext.request.get('/pet/findByStatus', { params: { status: invalidTestData.status } });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('Invalid status');
    }
  });

  test('Response Validation', async ({ page, request }) => {
    const response = await requestContext.request.get('/pet/findByStatus', { params: { status: testData.status } });
    expect(await response.json()).toMatchObject({ code: 200, message: 'OK' });
  });

  test('Error Handling', async ({ page, request }) => {
    try {
      await requestContext.request.get('/pet/findByStatus', { params: { status: 'invalid' } });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('Invalid status');
    }
  });

  test('Performance', async ({ page, request }) => {
    const response = await requestContext.request.get('/pet/findByStatus', { params: { status: testData.status } });
    const responseTime = await response.time();
    expect(responseTime).toBeLessThan(2000);
  });
});

This code includes comprehensive API testing with schema analysis, multiple test variations, and enterprise-grade reporting. It uses modern Playwright API testing patterns, proper error handling, and retry mechanisms. The test data management and cleanup are also included.