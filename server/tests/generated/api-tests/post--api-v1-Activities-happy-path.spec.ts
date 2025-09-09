import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

// Define the Activity interface based on the schema
interface Activity {
  id: number;
  title: string;
  dueDate: string; // ISO date string
  completed: boolean;
}

// Test data factory for creating activities
const createActivityData = (): Omit<Activity, 'id'> => ({
  title: `Test Activity ${Date.now()}`,
  dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  completed: false
});

test.describe('POST /api/v1/Activities - Happy Path', () => {
  test.beforeEach(async () => {
    test.setTimeout(30000);
    await allure.tag('API');
    await allure.tag('Activities');
    await allure.tag('Happy Path');
    await allure.description('Test the creation of activities via POST /api/v1/Activities endpoint');
  });

  test('should create a new activity with valid data', async ({ request }) => {
    // Arrange
    const activityData = createActivityData();
    const startTime = Date.now();
    
    // Act
    const response = await request.post('/api/v1/Activities', {
      data: activityData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    // Attach request and response data to Allure report
    await allure.step('API Request', async () => {
      await allure.attachment('Request Body', JSON.stringify(activityData, null, 2), 'application/json');
    });
    
    await allure.step('API Response', async () => {
      await allure.attachment('Response Body', await response.text(), 'application/json');
    });

    // Assert - Status Code
    expect(response.status()).toBe(200);
    await allure.step('Validate Status Code', async () => {
      await allure.attachment('Expected Status', '200', 'text/plain');
      await allure.attachment('Actual Status', response.status().toString(), 'text/plain');
    });

    // Assert - Response Time
    expect(responseTime).toBeLessThan(2000);
    await allure.step('Validate Response Time', async () => {
      await allure.attachment('Response Time (ms)', responseTime.toString(), 'text/plain');
    });

    // Assert - Headers
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
    await allure.step('Validate Headers', async () => {
      await allure.attachment('Content-Type Header', contentType, 'text/plain');
    });

    // Assert - Response Body Structure
    const responseBody = await response.json() as Activity;
    
    // Validate required fields exist
    expect(responseBody).toHaveProperty('id');
    expect(responseBody).toHaveProperty('title');
    expect(responseBody).toHaveProperty('dueDate');
    expect(responseBody).toHaveProperty('completed');
    
    // Validate data types
    expect(typeof responseBody.id).toBe('number');
    expect(typeof responseBody.title).toBe('string');
    expect(typeof responseBody.dueDate).toBe('string');
    expect(typeof responseBody.completed).toBe('boolean');
    
    // Validate content matches request
    expect(responseBody.title).toBe(activityData.title);
    expect(responseBody.dueDate).toBe(activityData.dueDate);
    expect(responseBody.completed).toBe(activityData.completed);
    
    await allure.step('Validate Response Body Structure', async () => {
      await allure.attachment('Response Schema Validation', JSON.stringify({
        hasId: responseBody.hasOwnProperty('id'),
        hasTitle: responseBody.hasOwnProperty('title'),
        hasDueDate: responseBody.hasOwnProperty('dueDate'),
        hasCompleted: responseBody.hasOwnProperty('completed'),
        idType: typeof responseBody.id,
        titleType: typeof responseBody.title,
        dueDateType: typeof responseBody.dueDate,
        completedType: typeof responseBody.completed
      }, null, 2), 'application/json');
    });

    // Assert - Business Logic Validation
    // Validate that ID is positive
    expect(responseBody.id).toBeGreaterThan(0);
    
    // Validate date format (ISO 8601)
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(responseBody.dueDate).toMatch(dateRegex);
    
    // Validate title is not empty
    expect(responseBody.title).not.toBe('');
    
    await allure.step('Validate Business Rules', async () => {
      await allure.attachment('Business Validation', JSON.stringify({
        isIdPositive: responseBody.id > 0,
        isDateValidFormat: dateRegex.test(responseBody.dueDate),
        isTitleNotEmpty: responseBody.title.length > 0
      }, null, 2), 'application/json');
    });

    // Assert - Data Consistency
    // Verify that the created activity can be retrieved
    const getResponse = await request.get(`/api/v1/Activities/${responseBody.id}`);
    expect(getResponse.status()).toBe(200);
    
    const getActivity = await getResponse.json() as Activity;
    expect(getActivity).toEqual(responseBody);
    
    await allure.step('Validate Data Consistency', async () => {
      await allure.attachment('Retrieved Activity', JSON.stringify(getActivity, null, 2), 'application/json');
    });
  });

  test('should handle multiple concurrent activity creations', async ({ request }) => {
    // Arrange
    const activities = Array(3).fill(null).map(() => createActivityData());
    
    // Act
    const responses = await Promise.all(
      activities.map(activity => 
        request.post('/api/v1/Activities', {
          data: activity
        })
      )
    );
    
    // Assert
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json() as Activity;
      expect(responseBody.title).toBe(activities[i].title);
      expect(responseBody.dueDate).toBe(activities[i].dueDate);
      expect(responseBody.completed).toBe(activities[i].completed);
    }
    
    await allure.step('Concurrent Requests Validation', async () => {
      await allure.attachment('Number of Requests', responses.length.toString(), 'text/plain');
      await allure.attachment('All Status 200', responses.every(r => r.status() === 200).toString(), 'text/plain');
    });
  });

  test('should maintain data integrity with special characters in title', async ({ request }) => {
    // Arrange
    const specialTitle = "Test Activity with Special Characters: áéíóú @#$%^&*()_+{}|[]\\:\"<>?;'`,.~";
    const activityData = {
      title: specialTitle,
      dueDate: new Date(Date.now() + 172800000).toISOString(), // In 2 days
      completed: false
    };
    
    // Act
    const response = await request.post('/api/v1/Activities', {
      data: activityData
    });
    
    // Assert
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json() as Activity;
    expect(responseBody.title).toBe(activityData.title);
    
    // Verify the special characters are preserved
    expect(responseBody.title).toContain('áéíóú');
    expect(responseBody.title).toContain('@#$%^&*()');
    
    await allure.step('Special Characters Validation', async () => {
      await allure.attachment('Original Title', activityData.title, 'text/plain');
      await allure.attachment('Stored Title', responseBody.title, 'text/plain');
    });
  });
});
