const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FileStorage = require('../services/FileStorage');
const CodeGenerator = require('../services/CodeGenerator');
const LLMService = require('../services/LLMService');
const path = require('path');
const fs = require('fs').promises;

// Initialize FileStorage instance
const fileStorage = new FileStorage();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Load endpoints from backend API
router.get('/endpoints', async (req, res) => {
  try {
    // Mock endpoints for demonstration - in real implementation, 
    // this would scan your actual API routes or load from a registry
    const mockEndpoints = [
      {
        id: 'ep1',
        method: 'GET',
        path: '/api/users',
        summary: 'Get all users',
        tags: ['users', 'api'],
        parameters: [],
        responses: { '200': { description: 'Success' } }
      },
      {
        id: 'ep2',
        method: 'POST',
        path: '/api/users',
        summary: 'Create a new user',
        tags: ['users', 'api'],
        parameters: [],
        responses: { '201': { description: 'Created' } }
      },
      {
        id: 'ep3',
        method: 'GET',
        path: '/api/users/{id}',
        summary: 'Get user by ID',
        tags: ['users', 'api'],
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': { description: 'Success' } }
      },
      {
        id: 'ep4',
        method: 'PUT',
        path: '/api/users/{id}',
        summary: 'Update user',
        tags: ['users', 'api'],
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': { description: 'Updated' } }
      },
      {
        id: 'ep5',
        method: 'DELETE',
        path: '/api/users/{id}',
        summary: 'Delete user',
        tags: ['users', 'api'],
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '204': { description: 'Deleted' } }
      }
    ];

    res.json({ endpoints: mockEndpoints });
  } catch (error) {
    console.error('Error loading endpoints from API:', error);
    res.status(500).json({ error: 'Failed to load endpoints from API' });
  }
});

// Load endpoints from environment
router.get('/endpoints/environment/:environmentId', async (req, res) => {
  try {
    const { environmentId } = req.params;
    const environment = await fileStorage.getEnvironmentById(environmentId);
    
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    // Check if environment has a swagger URL configured
    const swaggerUrl = environment.variables?.SWAGGER_URL || environment.swaggerUrl;
    
    if (!swaggerUrl) {
      return res.status(400).json({ error: 'Environment does not have a Swagger URL configured' });
    }

    // Fetch endpoints from the environment's swagger URL
    const endpoints = await fetchEndpointsFromSwagger(swaggerUrl);
    
    res.json({ endpoints });
  } catch (error) {
    console.error('Error loading endpoints from environment:', error);
    res.status(500).json({ error: 'Failed to load endpoints from environment' });
  }
});

// Load endpoints from Swagger URL
router.post('/endpoints/swagger', async (req, res) => {
  try {
    const { swaggerUrl } = req.body;
    
    if (!swaggerUrl) {
      return res.status(400).json({ error: 'Swagger URL is required' });
    }

    const endpoints = await fetchEndpointsFromSwagger(swaggerUrl);
    
    res.json({ endpoints });
  } catch (error) {
    console.error('Error loading endpoints from Swagger URL:', error);
    res.status(500).json({ error: 'Failed to load endpoints from Swagger URL' });
  }
});

// Upload and parse Swagger file
router.post('/endpoints/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf8');
    let swaggerSpec;
    
    try {
      swaggerSpec = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON file' });
    }

    const endpoints = parseSwaggerSpec(swaggerSpec);
    
    res.json({ endpoints });
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

// Generate API tests
router.post('/generate', async (req, res) => {
  try {
    const { endpoints, testType, resourceName, environmentId, useLLM = false, testVariations = ['happy-path'] } = req.body;
    
    if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
      return res.status(400).json({ error: 'At least one endpoint is required' });
    }

    if (testType === 'e2e' && !resourceName) {
      return res.status(400).json({ error: 'Resource name is required for E2E tests' });
    }

    // Get environment if specified
    let environment = null;
    if (environmentId) {
      environment = await fileStorage.getEnvironmentById(environmentId);
    }

    const codeGenerator = new CodeGenerator();
    let filesCreated = 0;
    let testCode = '';

    if (testType === 'individual') {
      // Generate individual test files for each endpoint
      for (const endpoint of endpoints) {
        if (useLLM) {
          // Generate LLM-powered tests with variations
          for (const variation of testVariations) {
            const endpointPath = endpoint.path || endpoint.url || '/unknown';
            const fileName = `${endpoint.method.toLowerCase()}-${endpointPath.replace(/[^a-zA-Z0-9]/g, '-')}-${variation}.spec.ts`;
            const code = await generateLLMAPITest(endpoint, environment, variation);
            
            // Save the test file
            const filePath = await saveTestFile(fileName, code, 'api-tests');
            filesCreated++;
            
            if (testCode) testCode += '\n\n';
            testCode += code;
          }
        } else {
          // Generate standard test
          const endpointPath = endpoint.path || endpoint.url || '/unknown';
          const fileName = `${endpoint.method.toLowerCase()}-${endpointPath.replace(/[^a-zA-Z0-9]/g, '-')}.spec.ts`;
          const code = generateIndividualAPITest(endpoint, environment);
          
          // Save the test file
          const filePath = await saveTestFile(fileName, code, 'api-tests');
          filesCreated++;
          
          if (testCode) testCode += '\n\n';
          testCode += code;
        }
      }
    } else {
      // Generate E2E test suite
      const fileName = `${resourceName}-e2e.spec.ts`;
      let code;
      
      if (useLLM) {
        code = await generateLLME2EAPITestSuite(endpoints, resourceName, environment);
      } else {
        code = generateE2EAPITestSuite(endpoints, resourceName, environment);
      }
      
      // Save the test file
      const filePath = await saveTestFile(fileName, code, 'api-tests');
      filesCreated = 1;
      testCode = code;
    }

    res.json({
      success: true,
      testCode,
      filesCreated,
      message: `Successfully generated ${filesCreated} test file(s)`
    });
  } catch (error) {
    console.error('Error generating API tests:', error);
    res.status(500).json({ error: 'Failed to generate API tests' });
  }
});

// Helper function to fetch endpoints from Swagger URL
async function fetchEndpointsFromSwagger(swaggerUrl) {
  try {
    const response = await axios.get(swaggerUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    return parseSwaggerSpec(response.data);
  } catch (error) {
    throw new Error(`Failed to fetch Swagger spec: ${error.message}`);
  }
}

// Helper function to parse Swagger specification
function parseSwaggerSpec(swaggerSpec) {
  const endpoints = [];
  
  if (!swaggerSpec.paths) {
    throw new Error('Invalid Swagger specification: missing paths');
  }

  Object.entries(swaggerSpec.paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        const endpoint = {
          id: `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          method: method.toUpperCase(),
          path: path,
          summary: operation.summary || `${method.toUpperCase()} ${path}`,
          description: operation.description || '',
          tags: operation.tags || [],
          parameters: operation.parameters || [],
          responses: operation.responses || {}
        };
        
        endpoints.push(endpoint);
      }
    });
  });

  return endpoints;
}

// Helper function to generate individual API test
function generateIndividualAPITest(endpoint, environment) {
  const baseUrl = environment?.variables?.BASE_URL || 'http://localhost:3000';
  const timeout = environment?.variables?.TIMEOUT || 30000;
  
  const expectedStatus = getExpectedStatus(endpoint);
  const endpointPath = endpoint.path || endpoint.url || '/unknown';
  const testName = `${endpoint.method} ${endpointPath}`;
  
  return `import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('${testName}', () => {
  test.beforeEach(async () => {
    await allure.tag('API Test');
    await allure.tag('${endpoint.method}');
    ${(endpoint.tags || []).map(tag => `await allure.tag('${tag}');`).join('\n    ')}
    test.setTimeout(${timeout});
  });

  test('should ${endpoint.summary || `handle ${endpoint.method} request`}', async ({ request }) => {
    allure.story('${endpointPath}');
    allure.description('${endpoint.description || endpoint.summary || `Test ${endpoint.method} ${endpointPath}`}');
    
    const response = await request.${endpoint.method.toLowerCase()}('${baseUrl}${endpointPath}', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    expect(response.status()).toBe(${expectedStatus});
    
    if (response.status() >= 200 && response.status() < 300) {
      const contentType = response.headers()['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    }
  });
});
`;
}

// Helper function to generate E2E API test suite
function generateE2EAPITestSuite(endpoints, resourceName, environment) {
  const baseUrl = environment?.variables?.BASE_URL || 'http://localhost:3000';
  const timeout = environment?.variables?.TIMEOUT || 30000;
  
  // Analyze and sort endpoints by CRUD operation type
  const crudOperations = {
    create: endpoints.filter(ep => ep.method.toUpperCase() === 'POST'),
    read: endpoints.filter(ep => ep.method.toUpperCase() === 'GET'),
    update: endpoints.filter(ep => ['PUT', 'PATCH'].includes(ep.method.toUpperCase())),
    delete: endpoints.filter(ep => ep.method.toUpperCase() === 'DELETE')
  };
  
  // Sort endpoints in logical CRUD order
  const sortedEndpoints = [
    ...crudOperations.create,
    ...crudOperations.read,
    ...crudOperations.update,
    ...crudOperations.delete
  ];
  
  let code = `import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('${resourceName} E2E API Test Suite', () => {
  test.beforeEach(async () => {
    await allure.tag('API Test');
    await allure.tag('E2E');
    await allure.tag('${resourceName}');
    test.setTimeout(${timeout});
  });

  test('should execute complete ${resourceName} CRUD workflow', async ({ request }) => {
    await allure.story('${resourceName} E2E CRUD Workflow');
    await allure.description('End-to-end test covering complete CRUD lifecycle for ${resourceName}');
    
    // Test data object to store and pass data between operations
    const testData = {
      created: {},
      updated: {},
      ids: [],
      responses: []
    };
    
    // Generate realistic test data
    const createData = {
      name: \`Test ${resourceName} \${Date.now()}\`,
      description: \`Generated test data for ${resourceName} E2E testing\`,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    const updateData = {
      name: \`Updated Test ${resourceName} \${Date.now()}\`,
      description: \`Updated test data for ${resourceName} E2E testing\`,
      status: 'updated',
      updatedAt: new Date().toISOString()
    };
    
`;

  sortedEndpoints.forEach((endpoint, index) => {
    const expectedStatus = getExpectedStatus(endpoint);
    const method = endpoint.method.toUpperCase();
    const originalPath = endpoint.path || endpoint.url || '/unknown';
    const isPathParam = originalPath.includes('{') || originalPath.includes(':');
    
    // Replace path parameters with stored IDs
    let endpointPath = originalPath;
    if (isPathParam && method !== 'POST') {
      endpointPath = originalPath.replace(/\{[^}]+\}/g, '${testData.created.id || testData.ids[0] || "1"}');
      endpointPath = endpointPath.replace(/:([^/]+)/g, '${testData.created.id || testData.ids[0] || "1"}');
    }
    
    code += `    // Step ${index + 1}: ${method} ${originalPath}
`;
    code += `    await allure.step('${method} ${originalPath}', async () => {
`;
    code += `      console.log('Executing: ${method} ${endpointPath}');
`;
    
    // Build request options based on method
    code += `      const requestOptions = {
`;
    code += `        headers: {
`;
    code += `          'Content-Type': 'application/json',
`;
    code += `          'Accept': 'application/json'
`;
    code += `        }`;
    
    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (method === 'POST') {
        code += `,
        data: createData`;
      } else {
        code += `,
        data: { ...testData.created, ...updateData }`;
      }
    }
    
    code += `
      };
`;
    code += `      
`;
    code += `      const response${index + 1} = await request.${method.toLowerCase()}(\`${baseUrl}${endpointPath}\`, requestOptions);
`;
    code += `      
`;
    code += `      // Store response for debugging
`;
    code += `      testData.responses.push({
`;
    code += `        method: '${method}',
`;
    code += `        path: '${originalPath}',
`;
    code += `        status: response${index + 1}.status(),
`;
    code += `        timestamp: new Date().toISOString()
`;
    code += `      });
`;
    code += `      
`;
    code += `      // Assert expected status
`;
    code += `      expect(response${index + 1}.status()).toBe(${expectedStatus});
`;
    code += `      console.log('✓ ${method} ${originalPath} - Status:', response${index + 1}.status());
`;
    
    // Handle response data based on operation type
    if (method === 'POST') {
      code += `      
`;
      code += `      // Store created resource data
`;
      code += `      if (response${index + 1}.status() >= 200 && response${index + 1}.status() < 300) {
`;
      code += `        const createdData = await response${index + 1}.json();
`;
      code += `        testData.created = createdData;
`;
      code += `        
`;
      code += `        // Extract and store ID for future operations
`;
      code += `        if (createdData.id) {
`;
      code += `          testData.ids.push(createdData.id);
`;
      code += `          console.log('✓ Created ${resourceName} with ID:', createdData.id);
`;
      code += `        }
`;
      code += `        
`;
      code += `        // Validate created data matches input
`;
      code += `        expect(createdData.name).toBe(createData.name);
`;
      code += `        expect(createdData.description).toBe(createData.description);
`;
      code += `        expect(createdData).toHaveProperty('id');
`;
      code += `        expect(createdData).toHaveProperty('createdAt');
`;
      code += `      }
`;
    } else if (method === 'GET') {
      code += `      
`;
      code += `      // Validate retrieved data
`;
      code += `      if (response${index + 1}.status() === 200) {
`;
      code += `        const retrievedData = await response${index + 1}.json();
`;
      code += `        
`;
      code += `        // For individual GET, validate against created data
`;
      code += `        if (testData.created.id && !Array.isArray(retrievedData)) {
`;
      code += `          expect(retrievedData.id).toBe(testData.created.id);
`;
      code += `          expect(retrievedData.name).toBe(testData.created.name || testData.updated.name);
`;
      code += `          console.log('✓ Retrieved ${resourceName} matches expected data');
`;
      code += `        }
`;
      code += `        
`;
      code += `        // For collection GET, validate structure
`;
      code += `        if (Array.isArray(retrievedData)) {
`;
      code += `          expect(Array.isArray(retrievedData)).toBe(true);
`;
      code += `          console.log('✓ Retrieved ${resourceName} collection with', retrievedData.length, 'items');
`;
      code += `        }
`;
      code += `      }
`;
    } else if (['PUT', 'PATCH'].includes(method)) {
      code += `      
`;
      code += `      // Store updated resource data
`;
      code += `      if (response${index + 1}.status() >= 200 && response${index + 1}.status() < 300) {
`;
      code += `        const updatedData = await response${index + 1}.json();
`;
      code += `        testData.updated = updatedData;
`;
      code += `        
`;
      code += `        // Validate updated data
`;
      code += `        expect(updatedData.id).toBe(testData.created.id);
`;
      code += `        expect(updatedData.name).toBe(updateData.name);
`;
      code += `        expect(updatedData.description).toBe(updateData.description);
`;
      code += `        expect(updatedData).toHaveProperty('updatedAt');
`;
      code += `        console.log('✓ Updated ${resourceName} successfully');
`;
      code += `      }
`;
    } else if (method === 'DELETE') {
      code += `      
`;
      code += `      // Validate deletion
`;
      code += `      if (response${index + 1}.status() >= 200 && response${index + 1}.status() < 300) {
`;
      code += `        console.log('✓ Deleted ${resourceName} successfully');
`;
      code += `        
`;
      code += `        // Verify resource no longer exists (optional follow-up GET)
`;
      code += `        try {
`;
      code += `          const verifyResponse = await request.get(\`${baseUrl}${endpointPath}\`);
`;
      code += `          expect(verifyResponse.status()).toBe(404);
`;
      code += `          console.log('✓ Confirmed ${resourceName} deletion - resource not found');
`;
      code += `        } catch (error) {
`;
      code += `          console.log('Note: Could not verify deletion with GET request');
`;
      code += `        }
`;
      code += `      }
`;
    }
    
    code += `    });
`;
    code += `    
`;
  });

  code += `    // Final validation and cleanup
`;
  code += `    console.log('\n📊 E2E Test Summary:');
`;
  code += `    console.log('- Operations executed:', testData.responses.length);
`;
  code += `    console.log('- Created resources:', testData.ids.length);
`;
  code += `    console.log('- Test data flow successful');
`;
  code += `    
`;
  code += `    // Log all responses for debugging
`;
  code += `    testData.responses.forEach((resp, idx) => {
`;
  code += `      console.log(\`\${idx + 1}. \${resp.method} \${resp.path} - Status: \${resp.status}\`);
`;
  code += `    });
`;
  code += `    
`;
  code += `    console.log('✅ ${resourceName} E2E CRUD workflow completed successfully');
`;
  code += `  });
`;
  code += `});
`;

  return code;
}

// Helper function to get expected status code
function getExpectedStatus(endpoint) {
  const responses = endpoint.responses || {};
  
  // Look for success status codes in order of preference
  const successCodes = ['200', '201', '202', '204'];
  
  for (const code of successCodes) {
    if (responses[code]) {
      return parseInt(code);
    }
  }
  
  // Default based on method
  switch (endpoint.method.toUpperCase()) {
    case 'POST':
      return 201;
    case 'DELETE':
      return 204;
    default:
      return 200;
  }
}

// Helper function to save test file
async function saveTestFile(fileName, code, category = 'api-tests') {
  try {
    const testsDir = path.join(process.cwd(), 'tests', 'generated', category);
    
    // Ensure directory exists
    await fs.mkdir(testsDir, { recursive: true });
    
    const filePath = path.join(testsDir, fileName);
    await fs.writeFile(filePath, code, 'utf8');
    
    console.log(`Test file saved: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving test file:', error);
    throw error;
  }
}

// LLM-powered test generation functions
async function generateLLMAPITest(endpoint, environment, variation = 'happy-path') {
  console.log('=== generateLLMAPITest called ===');
  console.log('Environment:', environment ? 'provided' : 'null');
  console.log('Full environment object:', JSON.stringify(environment, null, 2));
  console.log('Environment LLM config:', environment?.llmConfiguration);
  
  const llmService = new LLMService();
  const baseUrl = environment?.variables?.BASE_URL || 'http://localhost:3000';
  const timeout = environment?.variables?.TIMEOUT || 30000;
  
  const prompt = createAPITestPrompt(endpoint, variation, baseUrl);
  console.log('Generated prompt length:', prompt.length);
  
  try {
    console.log('Calling LLMService.generateCode...');
    const generatedCode = await llmService.generateCode(prompt, environment, {
      testType: 'api',
      variation: variation
    });
    
    console.log('LLM generation successful, code length:', generatedCode.length);
    return postProcessAPITestCode(generatedCode, endpoint, variation, timeout);
  } catch (error) {
    console.error('Error generating LLM API test:', error.message);
    console.error('Full error:', error);
    
    // Provide specific error messages for common issues
    if (error.response?.status === 429) {
      console.warn('LLM service rate limit exceeded. Falling back to standard generation.');
    } else if (error.response?.status === 401) {
      console.warn('LLM service authentication failed. Falling back to standard generation.');
    } else if (error.response?.status === 403) {
      console.warn('LLM service access forbidden. Falling back to standard generation.');
    } else if (error.message.includes('LLM configuration not found')) {
      console.warn('Selected environment does not have LLM configuration. Falling back to standard generation.');
    }
    
    // Fallback to standard generation
    console.log('Falling back to standard generation...');
    return generateIndividualAPITest(endpoint, environment);
  }
}

async function generateLLME2EAPITestSuite(endpoints, resourceName, environment) {
  const llmService = new LLMService();
  const baseUrl = environment?.variables?.BASE_URL || 'http://localhost:3000';
  const timeout = environment?.variables?.TIMEOUT || 30000;
  
  const prompt = createE2ETestPrompt(endpoints, resourceName, baseUrl);
  
  try {
    const generatedCode = await llmService.generateCode(prompt, environment, {
      testType: 'e2e-api',
      resourceName: resourceName
    });
    
    return postProcessE2ETestCode(generatedCode, endpoints, resourceName, timeout);
  } catch (error) {
    console.error('Error generating LLM E2E test:', error);
    // Fallback to standard generation
    return generateE2EAPITestSuite(endpoints, resourceName, environment);
  }
}

function createAPITestPrompt(endpoint, variation, baseUrl) {
  const variationPrompts = {
    'happy-path': `Generate comprehensive API tests for successful scenarios:
    - Valid request with all required parameters
    - Successful response validation (status, headers, body structure)
    - Schema validation for response data
    - Business logic assertions
    - Data consistency checks`,
    
    'error-cases': `Generate API tests covering all error scenarios:
    - 400 Bad Request: Invalid parameters, malformed JSON, missing required fields
    - 401 Unauthorized: Missing or invalid authentication tokens
    - 403 Forbidden: Insufficient permissions, access denied
    - 404 Not Found: Non-existent resources, invalid endpoints
    - 422 Unprocessable Entity: Validation errors, business rule violations
    - 429 Too Many Requests: Rate limiting scenarios
    - 500 Internal Server Error: Server-side error handling
    - Network errors and timeout scenarios`,
    
    'edge-cases': `Generate API tests for boundary and edge conditions:
    - Boundary values: minimum/maximum lengths, numeric limits
    - Empty and null data: empty strings, null values, empty arrays/objects
    - Special characters: Unicode, SQL injection attempts, XSS payloads
    - Large payloads: Maximum allowed data sizes
    - Concurrent requests: Race conditions, data consistency
    - Malformed requests: Invalid JSON, wrong content types
    - Missing optional parameters vs required parameters`,
    
    'security': `Generate security-focused API tests:
    - Authentication bypass attempts
    - Authorization escalation tests
    - Input validation and sanitization
    - SQL injection prevention
    - XSS attack prevention
    - CSRF protection validation
    - Rate limiting enforcement
    - Sensitive data exposure checks
    - Token expiration and refresh scenarios`,
    
    'performance': `Generate performance and reliability tests:
    - Response time assertions (< 2s for normal, < 5s for complex)
    - Concurrent request handling
    - Load testing with multiple simultaneous requests
    - Memory usage validation
    - Timeout handling and retry mechanisms
    - Large dataset processing
    - Caching behavior validation
    - Database connection pooling effects`,
    
    'boundary-conditions': `Generate tests for data boundary conditions:
    - String length limits (empty, 1 char, max length, over limit)
    - Numeric boundaries (min, max, zero, negative, decimal precision)
    - Date/time boundaries (past, future, invalid formats)
    - Array size limits (empty, single item, max size, over limit)
    - File upload limits (size, type, corrupted files)
    - Pagination boundaries (first page, last page, invalid page numbers)`,
    
    'data-validation': `Generate comprehensive data validation tests:
    - Required field validation
    - Data type validation (string, number, boolean, array, object)
    - Format validation (email, phone, URL, date, UUID)
    - Range validation (min/max values, length constraints)
    - Pattern validation (regex patterns, custom formats)
    - Cross-field validation (dependent fields, conditional requirements)
    - Business rule validation (unique constraints, referential integrity)`
  };
  
  const variationPrompt = variationPrompts[variation] || variationPrompts['happy-path'];
  
  return `Create a Playwright API test for the following endpoint:

Endpoint: ${endpoint.method} ${endpoint.path || endpoint.url || '/unknown'}
Summary: ${endpoint.summary || 'API endpoint'}
Description: ${endpoint.description || ''}
Base URL: ${baseUrl}
Parameters: ${JSON.stringify(endpoint.parameters || [], null, 2)}
Responses: ${JSON.stringify(endpoint.responses || {}, null, 2)}

Test Variation: ${variation}
${variationPrompt}

Requirements:
1. Use Playwright's request fixture for API testing
2. **Comprehensive Response Assertions:**
   - Status code validation with specific expected codes
   - Response headers validation (Content-Type, Cache-Control, etc.)
   - Response body structure and data type validation
   - Response time assertions (< 2000ms for normal operations)
   - Content-Length and encoding validation

3. **Schema Validation:**
   - JSON schema validation for response bodies
   - Required field presence validation
   - Data type validation (string, number, boolean, array, object)
   - Format validation (email, date, UUID, URL patterns)
   - Enum value validation where applicable
   - Nested object and array structure validation

4. **Business Logic Assertions:**
   - Domain-specific validation rules
   - Cross-field validation and dependencies
   - Data consistency checks
   - Referential integrity validation
   - Business rule compliance (e.g., unique constraints)
   - State transition validation

5. **Error Handling and Validation:**
   - Proper HTTP status code assertions for error scenarios
   - Error message format and content validation
   - Error response schema validation
   - Graceful handling of network timeouts and failures
   - Retry mechanism testing where applicable

6. **Security Assertions:**
   - Authentication token validation
   - Authorization level verification
   - Sensitive data exposure prevention
   - Input sanitization verification
   - CORS header validation

7. **Performance and Reliability:**
   - Response time thresholds
   - Memory usage monitoring
   - Concurrent request handling
   - Rate limiting compliance
   - Caching behavior validation

8. **Test Data Management:**
   - Generate realistic and varied test data
   - Handle test data dependencies
   - Implement proper test data cleanup
   - Use data factories for consistent test data

9. **Reporting and Debugging:**
   - Include allure reporting tags and descriptions
   - Add detailed logging for request/response data
   - Implement step-by-step test execution logging
   - Add screenshots for UI-related API tests
   - Include performance metrics in reports

10. **Code Quality:**
    - Follow DRY principles with reusable helper functions
    - Implement proper async/await patterns
    - Add comprehensive error handling
    - Include TypeScript types where applicable
    - Add JSDoc comments for complex logic

Generate a complete, production-ready test file with extensive assertions that validate not just the API response, but also the business logic, data integrity, and system behavior.`;
}

function createE2ETestPrompt(endpoints, resourceName, baseUrl) {
  const endpointsList = endpoints.map(ep => `${ep.method} ${ep.path} - ${ep.summary || ''}`).join('\n');
  
  // Analyze endpoints to identify CRUD operations
  const crudOperations = {
    create: endpoints.filter(ep => ep.method.toUpperCase() === 'POST'),
    read: endpoints.filter(ep => ep.method.toUpperCase() === 'GET'),
    update: endpoints.filter(ep => ['PUT', 'PATCH'].includes(ep.method.toUpperCase())),
    delete: endpoints.filter(ep => ep.method.toUpperCase() === 'DELETE')
  };
  
  return `Create a comprehensive E2E API test suite for CRUD operations on the '${resourceName}' resource.

Available Endpoints:
${endpointsList}

CRUD Operations Analysis:
- CREATE: ${crudOperations.create.map(ep => `${ep.method} ${ep.path}`).join(', ') || 'None detected'}
- READ: ${crudOperations.read.map(ep => `${ep.method} ${ep.path}`).join(', ') || 'None detected'}
- UPDATE: ${crudOperations.update.map(ep => `${ep.method} ${ep.path}`).join(', ') || 'None detected'}
- DELETE: ${crudOperations.delete.map(ep => `${ep.method} ${ep.path}`).join(', ') || 'None detected'}

Base URL: ${baseUrl}

Requirements:
1. Create a complete CRUD workflow test with proper data flow:
   a) CREATE: Generate realistic test data and create a new ${resourceName}
      - Store the created resource ID and other key fields
      - Validate response structure and required fields
      - Assert proper status codes (201/200)
   
   b) READ: Retrieve the created ${resourceName} using stored ID
      - Verify all fields match the created data
      - Test both individual GET and collection GET endpoints
      - Validate response schemas and data types
   
   c) UPDATE: Modify the ${resourceName} with new data
      - Use stored ID from CREATE operation
      - Generate updated test data (partial or full)
      - Verify updated fields while preserving unchanged ones
      - Store any new data for subsequent operations
   
   d) DELETE: Remove the ${resourceName}
      - Use stored ID from previous operations
      - Verify successful deletion (204/200 status)
      - Confirm resource no longer exists (404 on subsequent GET)

2. Advanced Data Flow Management:
   - Implement a testData object to store and pass data between steps
   - Handle nested resources and relationships
   - Support array responses and extract IDs from collections
   - Manage dependencies between different resource types
   - Handle pagination in list operations

3. Comprehensive Test Coverage:
   - Test all available endpoints in logical CRUD sequence
   - Include edge cases: empty responses, large datasets, special characters
   - Validate business rules and constraints
   - Test error scenarios: invalid IDs, missing required fields
   - Include boundary testing for numeric and string fields

4. **Advanced Test Data Management:**
   - **Data Factories:** Create reusable data generation functions
     * generateValid${resourceName}Data() - for valid test data
     * generateInvalid${resourceName}Data() - for error testing
     * generateBoundary${resourceName}Data() - for edge cases
     * generateRandom${resourceName}Data() - for varied testing
   
   - **Data Dependencies:** Handle complex relationships
     * Track parent-child resource relationships
     * Manage foreign key dependencies
     * Handle cascading operations and cleanup
     * Support bulk operations and batch processing
   
   - **Data State Management:**
     * Implement testDataRegistry to track all created resources
     * Store resource states (created, updated, deleted)
     * Handle data versioning and history
     * Support rollback operations for failed tests
   
   - **Data Cleanup and Isolation:**
     * Implement comprehensive cleanup in afterEach/afterAll hooks
     * Use unique identifiers to prevent test interference
     * Support parallel test execution with isolated data
     * Handle orphaned data and cleanup failures gracefully

5. **Production-Ready Features:**
   - Add proper Playwright imports and setup with request context
   - Include allure reporting with detailed steps and attachments
   - Implement retry logic for network-dependent operations
   - Add comprehensive logging and debugging information
   - Include performance assertions and timing validations
   - Handle authentication and authorization if required
   - Add health checks and environment validation
   - Support multiple environments (dev, staging, prod)

6. **Error Handling and Recovery:**
   - Implement graceful error handling for each CRUD operation
   - Add retry mechanisms for transient failures
   - Handle partial failures in multi-step operations
   - Include detailed error reporting and diagnostics
   - Support test continuation after non-critical failures

7. **Code Quality and Maintainability:**
   - Use async/await properly throughout
   - Include proper error handling and try-catch blocks
   - Add meaningful test descriptions and comments
   - Follow consistent naming conventions
   - Include JSDoc comments for complex functions
   - Implement helper functions for common operations
   - Use TypeScript interfaces for data structures
   - Add code documentation and usage examples

8. **Test Data Examples:**
   Generate realistic test data that includes:
   - Valid data with all required fields
   - Invalid data for negative testing
   - Boundary values and edge cases
   - Special characters and internationalization
   - Large datasets for performance testing
   - Nested objects and complex data structures

Generate a complete, production-ready E2E test suite that demonstrates the full lifecycle of the ${resourceName} resource with enterprise-grade test data management, comprehensive cleanup procedures, and robust error handling.`;
}

function postProcessAPITestCode(generatedCode, endpoint, variation, timeout) {
  // Ensure proper imports and structure
  let processedCode = generatedCode;
  
  // Add timeout if not present
  if (!processedCode.includes('test.setTimeout')) {
    processedCode = processedCode.replace(
      /test\.beforeEach\(async \(\) => \{/,
      `test.beforeEach(async () => {
    test.setTimeout(${timeout});`
    );
  }
  
  // Add variation tag
  if (!processedCode.includes(`await allure.tag('${variation}')`)) {
    processedCode = processedCode.replace(
      /await allure\.tag\('API Test'\);/,
      `await allure.tag('API Test');
    await allure.tag('${variation}');`
    );
  }
  
  return processedCode;
}

function postProcessE2ETestCode(generatedCode, endpoints, resourceName, timeout) {
  // Ensure proper imports and structure
  let processedCode = generatedCode;
  
  // Add comprehensive test data management imports
  if (!processedCode.includes('// Test Data Management')) {
    const dataManagementCode = `
// Test Data Management
const testDataRegistry = new Map();
const createdResources = [];

// Data Factory Functions
function generateValid${resourceName}Data() {
  return {
    id: Date.now() + Math.random(),
    name: \`Test ${resourceName} \${Date.now()}\`,
    description: \`Generated test data for ${resourceName} at \${new Date().toISOString()}\`,
    createdAt: new Date().toISOString(),
    // Add more realistic fields based on resource type
  };
}

function generateInvalid${resourceName}Data() {
  return {
    // Missing required fields or invalid data types
    invalidField: null,
    name: '', // Empty required field
    description: 'x'.repeat(10000), // Exceeds length limit
  };
}

function generateBoundary${resourceName}Data() {
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
  console.log(\`Starting cleanup of \${createdResources.length} test resources...\`);
  
  // Cleanup in reverse order (LIFO) to handle dependencies
  for (let i = createdResources.length - 1; i >= 0; i--) {
    const resource = createdResources[i];
    try {
      const deleteResponse = await request.delete(\`/api/\${resource.type}/\${resource.id}\`);
      if (deleteResponse.status() === 204 || deleteResponse.status() === 200) {
        console.log(\`Successfully cleaned up \${resource.type} with ID: \${resource.id}\`);
      }
    } catch (error) {
      console.warn(\`Failed to cleanup \${resource.type} with ID: \${resource.id}\`, error.message);
    }
  }
  
  clearTestDataRegistry();
  console.log('Test data cleanup completed.');
}
`;
    
    processedCode = dataManagementCode + processedCode;
  }
  
  // Add timeout if not present
  if (!processedCode.includes('test.setTimeout')) {
    processedCode = processedCode.replace(
      /test\.beforeEach\(async \(\) => \{/,
      `test.beforeEach(async () => {
    test.setTimeout(${timeout});`
    );
  }
  
  // Add comprehensive cleanup in afterEach
  if (!processedCode.includes('test.afterEach')) {
    processedCode = processedCode.replace(
      /test\.beforeEach\(async \(\) => \{[\s\S]*?\}\);/,
      `$&

  test.afterEach(async ({ request }) => {
    // Cleanup test data after each test
    await cleanupTestData(request);
  });`
    );
  }
  
  // Add resource tag
  if (!processedCode.includes(`await allure.tag('${resourceName}')`)) {
    processedCode = processedCode.replace(
      /await allure\.tag\('E2E'\);/,
      `await allure.tag('E2E');
    await allure.tag('${resourceName}');
    await allure.tag('CRUD-Workflow');`
    );
  }
  
  // Add comprehensive error handling
  if (!processedCode.includes('// Enhanced Error Handling')) {
    const errorHandlingCode = `
// Enhanced Error Handling
function handleTestError(error, operation, resourceId = null) {
  console.error(\`Error during \${operation}:\`, {
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
      console.log(\`Attempt \${attempt} failed, retrying in \${delay}ms...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}
`;
    
    processedCode = processedCode.replace(
      /\/\/ Test Data Management/,
      `// Test Data Management${errorHandlingCode}`
    );
  }
  
  return processedCode;
}

module.exports = router;