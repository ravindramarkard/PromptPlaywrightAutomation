import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';


test.describe('POST /pet - happy-path', () => {
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
    id: Math.floor(Math.random() * 1000),
    name: 'Test Pet',
    tag: { name: 'Test Tag' },
    photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    status: 'available'
  };

  const invalidTestData = {
    id: Math.floor(Math.random() * 1000),
    name: '',
    tag: null,
    photoUrls: [],
    status: ''
  };

  test('happy-path Test', async () => {
    
    // Prepare request details
    const requestDetails = {
      method: 'POST',
      url: 'https://petstore.swagger.io/pet',
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
    const response = await requestContext.post('/pet', {
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
    
    const response = await requestContext.post('/pet', { data: testData });
    expect([200, 201, 400, 404]).toContain(response.status());
    expect(await response.json()).toMatchObject({
      id: testData.id,
      name: testData.name,
      tag: testData.tag,
      photoUrls: testData.photoUrls,
      status: testData.status
    });
  });

  test('Request Validation', async () => {
    const response = await requestContext.post('/pet', { data: invalidTestData });
    expect([200, 201, 400, 404]).toContain(response.status());
    expect(await response.json()).toMatchObject({
      code: 'Invalid Request',
      message: 'Validation Failed'
    });
  });

  test('Response Validation', async () => {
    const response = await requestContext.post('/pet', { data: testData });
    expect([200, 201, 400, 404]).toContain(response.status());
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toMatchObject({
      id: testData.id,
      name: testData.name,
      tag: testData.tag,
      photoUrls: testData.photoUrls,
      status: testData.status
    });
  });

  test('Error Handling', async () => {
    const response = await requestContext.post('/pet', { data: invalidTestData });
    expect([200, 201, 400, 404]).toContain(response.status());
    expect(await response.json()).toMatchObject({
      code: 'Invalid Request',
      message: 'Validation Failed'
    });
  });

  test('Performance', async () => {
    const startTime = Date.now();
    const response = await requestContext.post('/pet', { data: testData });
    const endTime = Date.now();
    expect([200, 201, 400, 404]).toContain(response.status());
    expect(endTime - startTime).toBeLessThan(2000);
  });

  test('Schema Validation', async () => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        tag: { $ref: '#/definitions/tag' },
        photoUrls: { type: 'array', items: { type: 'string' } },
        status: { enum: ['available', 'pending', 'sold'] }
      },
      required: ['id', 'name', 'tag', 'photoUrls', 'status']
    };

    const response = await requestContext.post('/pet', { data: testData });
    expect([200, 201, 400, 404]).toContain(response.status());
    expect(await response.json()).toMatchSchema(schema);
  });

  test('Authentication Handling', async () => {
    const authHeader = 'Basic ' + btoa('username:password');
    const response = await requestContext.post('/pet', { data: testData, headers: { Authorization: authHeader } });
    expect([200, 201, 400, 404]).toContain(response.status());
  });
});
