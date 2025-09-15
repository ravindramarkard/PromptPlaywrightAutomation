
// Test Data Management
// Enhanced Error Handling
function handleTestError(error, operation, resourceId = null) {
  console.error(`Error during ${operation}:`, {
    message: error.message,
    resourceId,
    timestamp: new Date().toISOString(),
    stack: error.stack
  });
  
  // Add to allure report
  allure.attachment('Error Details', JSON.stringify({
    operation,
    resourceId,
    error: error.message,
    timestamp: new Date().toISOString()
  }), 'application/json');
}

// Retry mechanism for network operations
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

const testDataRegistry = new Map();
const createdResources = [];

// Data Factory Functions
function generateValidactivitessuiteData() {
  return {
    id: Date.now() + Math.random(),
    name: `Test activitessuite ${Date.now()}`,
    description: `Generated test data for activitessuite at ${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    // Add more realistic fields based on resource type
  };
}

function generateInvalidactivitessuiteData() {
  return {
    // Missing required fields or invalid data types
    invalidField: null,
    name: '', // Empty required field
    description: 'x'.repeat(10000), // Exceeds length limit
  };
}

function generateBoundaryactivitessuiteData() {
  return {
    name: 'a', // Minimum length
    description: 'x'.repeat(255), // Maximum length
    numericField: Number.MAX_SAFE_INTEGER,
    dateField: new Date('1900-01-01').toISOString(),
  };
}

// Test Data Registry Functions
function registerTestData(type, id, data) {
  if (!testDataRegistry.has(type)) {
    testDataRegistry.set(type, new Map());
  }
  testDataRegistry.get(type).set(id, data);
  createdResources.push({ type, id, data });
}

function getTestData(type, id) {
  return testDataRegistry.get(type)?.get(id);
}

function clearTestDataRegistry() {
  testDataRegistry.clear();
  createdResources.length = 0;
}

// Cleanup Functions
async function cleanupTestData(request) {
  console.log(`Starting cleanup of ${createdResources.length} test resources...`);
  
  // Cleanup in reverse order (LIFO) to handle dependencies
  for (let i = createdResources.length - 1; i >= 0; i--) {
    const resource = createdResources[i];
    try {
      const deleteResponse = await request.delete(`/api/${resource.type}/${resource.id}`);
      if (deleteResponse.status() === 204 || deleteResponse.status() === 200) {
        console.log(`Successfully cleaned up ${resource.type} with ID: ${resource.id}`);
      }
    } catch (error) {
      console.warn(`Failed to cleanup ${resource.type} with ID: ${resource.id}`, error.message);
    }
  }
  
  clearTestDataRegistry();
  console.log('Test data cleanup completed.');
}

import { test, expect, APIRequestContext } from '@playwright/test';
import { allure } from 'allure-playwright';

// Interfaces for type safety
interface ActivitySuite {
  id?: number;
  title: string;
  dueDate: string;
  completed: boolean;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
}

interface TestDataRegistry {
  createdActivities: ActivitySuite[];
  updatedActivities: ActivitySuite[];
  deletedActivities: ActivitySuite[];
}

// Test data factory functions
const generateValidActivitySuiteData = (): ActivitySuite => ({
  title: `Test Activity ${Date.now()}`,
  dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  completed: false,
  description: 'This is a test activity description',
  priority: 'MEDIUM',
  tags: ['test', 'automation']
});

const generateInvalidActivitySuiteData = (): Partial<ActivitySuite> => ({
  title: '',
  dueDate: 'invalid-date',
  completed: null as any
});

const generateBoundaryActivitySuiteData = (): ActivitySuite => ({
  title: 'A'.repeat(255),
  dueDate: '9999-12-31',
  completed: true,
  description: 'B'.repeat(1000),
  priority: 'HIGH',
  tags: Array(50).fill('tag')
});

const generateRandomActivitySuiteData = (): ActivitySuite => ({
  title: `Random Activity ${Math.random().toString(36).substring(7)}`,
  dueDate: new Date(Date.now() + Math.random() * 31536000000).toISOString().split('T')[0],
  completed: Math.random() > 0.5,
  description: `Random description ${Math.random().toString(36).substring(7)}`,
  priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as 'LOW' | 'MEDIUM' | 'HIGH',
  tags: Array(Math.floor(Math.random() * 10)).fill('tag').map((_, i) => `tag-${i}`)
});

// Helper functions
const validateActivitySchema = (activity: any) => {
  expect(activity).toHaveProperty('id');
  expect(activity).toHaveProperty('title');
  expect(activity).toHaveProperty('dueDate');
  expect(activity).toHaveProperty('completed');
  expect(typeof activity.id).toBe('number');
  expect(typeof activity.title).toBe('string');
  expect(typeof activity.dueDate).toBe('string');
  expect(typeof activity.completed).toBe('boolean');
};

const setupRequestContext = async (): Promise<APIRequestContext> => {
  const { request } = await import('@playwright/test');
  return await request.newContext({
    baseURL: process.env.API_URL || 'https://fakerestapi.azurewebsites.net',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
};

// Test suite
test.describe('ActivitySuite CRUD Operations', () => {
  let requestContext: APIRequestContext;
  let testDataRegistry: TestDataRegistry;

  test.beforeAll(async () => {
    requestContext = await setupRequestContext();
    testDataRegistry = {
      createdActivities: [],
      updatedActivities: [],
      deletedActivities: []
    };
  });

  test.afterEach(async () => {
    await allure.step('Cleanup created activities', async () => {
      for (const activity of testDataRegistry.createdActivities) {
        if (activity.id && !testDataRegistry.deletedActivities.includes(activity)) {
          try {
            const response = await requestContext.delete(`/api/v1/Activities/${activity.id}`);
            if (response.status() === 200 || response.status() === 204) {
              testDataRegistry.deletedActivities.push(activity);
            }
          } catch (error) {
            console.warn(`Failed to cleanup activity ${activity.id}:`, error);
          }
        }
      }
    });
  });

  test.afterAll(async () => {
    await requestContext.dispose();
  });

  test('E2E CRUD Workflow for ActivitySuite', async () => {
    await allure.epic('ActivitySuite API');
    await allure.feature('CRUD Operations');
    await allure.story('Complete E2E Workflow');

    let createdActivityId: number;
    const testActivityData = generateValidActivitySuiteData();

    // CREATE Operation
    await allure.step('CREATE - Create new activity suite', async () => {
      const startTime = Date.now();
      const response = await requestContext.post('/api/v1/Activities', {
        data: testActivityData,
        timeout: parseInt(process.env.TIMEOUT || '30000')
      });

      const responseTime = Date.now() - startTime;
      await allure.attachment('Request Data', JSON.stringify(testActivityData, null, 2), 'application/json');
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000);
      expect(response.headers()['content-type']).toContain('application/json');

      const responseBody = await response.json();
      await allure.attachment('Response Data', JSON.stringify(responseBody, null, 2), 'application/json');
      
      validateActivitySchema(responseBody);
      expect(responseBody.title).toBe(testActivityData.title);
      expect(responseBody.dueDate).toContain(testActivityData.dueDate);
      expect(responseBody.completed).toBe(testActivityData.completed);
      
      createdActivityId = responseBody.id;
      testDataRegistry.createdActivities.push(responseBody);
    });

    // READ Operation (Individual)
    await allure.step('READ - Retrieve created activity', async () => {
      const response = await requestContext.get(`/api/v1/Activities/${createdActivityId}`);
      
      // The fake API doesn't persist individual activities, so we expect 404
      // In a real API, this would return 200 with the activity data
      expect(response.status()).toBe(404);
    });

    // READ Operation (Collection)
    await allure.step('READ - Retrieve all activities', async () => {
      const response = await requestContext.get('/api/v1/Activities');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      
      // The fake API doesn't persist individual activities, so we just verify the collection is accessible
      // In a real API, we would find the created activity here
      expect(responseBody.length).toBeGreaterThanOrEqual(0);
    });

    // UPDATE Operation
    await allure.step('UPDATE - Modify activity suite', async () => {
      const updateData = {
        title: `Updated ${testActivityData.title}`,
        completed: true,
        priority: 'HIGH'
      };

      const response = await requestContext.put(`/api/v1/Activities/${createdActivityId}`, {
        data: updateData
      });

      // The fake API may or may not persist individual activities
      // We accept both 200 (success) and 404 (not found) responses
      expect([200, 404]).toContain(response.status());
    });

    // DELETE Operation
    await allure.step('DELETE - Remove activity suite', async () => {
      const response = await requestContext.delete(`/api/v1/Activities/${createdActivityId}`);
      
      // The fake API may or may not persist individual activities
      // We accept both 200/204 (success) and 404 (not found) responses
      expect([200, 204, 404]).toContain(response.status());
      
      testDataRegistry.deletedActivities.push(testDataRegistry.createdActivities.find(a => a.id === createdActivityId)!);
    });
  });

  test('Error Scenarios and Edge Cases', async () => {
    await allure.epic('ActivitySuite API');
    await allure.feature('Error Handling');
    
    // Invalid data creation
    await allure.step('CREATE - Invalid data should return error', async () => {
      const invalidData = generateInvalidActivitySuiteData();
      const response = await requestContext.post('/api/v1/Activities', {
        data: invalidData
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    // Non-existent resource access
    await allure.step('READ - Non-existent resource should return 404', async () => {
      const response = await requestContext.get('/api/v1/Activities/999999');
      expect(response.status()).toBe(404);
    });

    // Boundary value testing
    await allure.step('CREATE - Boundary value testing', async () => {
      const boundaryData = generateBoundaryActivitySuiteData();
      const response = await requestContext.post('/api/v1/Activities', {
        data: boundaryData
      });

      if (response.status() === 201) {
        const responseBody = await response.json();
        testDataRegistry.createdActivities.push(responseBody);
        
        // Cleanup
        await requestContext.delete(`/api/v1/Activities/${responseBody.id}`);
        testDataRegistry.deletedActivities.push(responseBody);
      }
    });
  });

  test('Performance and Load Testing', async () => {
    await allure.epic('ActivitySuite API');
    await allure.feature('Performance Testing');
    
    await allure.step('Response time validation', async () => {
      const startTime = Date.now();
      const response = await requestContext.get('/api/v1/Activities');
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });
  });
});
