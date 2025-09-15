const express = require('express');
const router = express.Router();
const ApiTestExecutor = require('../services/ApiTestExecutor');
const path = require('path');

const apiTestExecutor = new ApiTestExecutor();

// Execute single API test
router.post('/execute', async (req, res) => {
  try {
    const { testFile, environment, environmentConfig } = req.body;

    if (!testFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Test file path is required' 
      });
    }

    console.log(`🚀 API Test Execution Request:`, {
      testFile,
      environment,
      environmentConfig
    });

    // Default execution config
    const executionConfig = {
      environment: environment || 'test',
      timeout: 30000,
      retries: 1,
      tags: []
    };

    // Execute the API test
    const result = await apiTestExecutor.executeApiTest(
      testFile, 
      executionConfig, 
      environmentConfig
    );

    res.json({
      success: result.success,
      executionId: result.executionId,
      exitCode: result.exitCode,
      message: result.success ? 'API test executed successfully' : 'API test execution failed',
      executionDir: result.executionDir
    });

  } catch (error) {
    console.error('❌ API test execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute API test',
      error: error.message
    });
  }
});

// Get execution status
router.get('/status/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const status = await apiTestExecutor.getExecutionStatus(executionId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Execution not found'
      });
    }

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('❌ Error getting execution status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get execution status',
      error: error.message
    });
  }
});

// Get all execution statuses
router.get('/status', async (req, res) => {
  try {
    const statuses = await apiTestExecutor.getAllExecutionStatuses();
    
    res.json({
      success: true,
      statuses
    });

  } catch (error) {
    console.error('❌ Error getting all execution statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get execution statuses',
      error: error.message
    });
  }
});

// Execute multiple API tests
router.post('/execute-batch', async (req, res) => {
  try {
    const { testFiles, environment, environmentConfig } = req.body;

    if (!testFiles || !Array.isArray(testFiles) || testFiles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Test files array is required' 
      });
    }

    console.log(`🚀 Batch API Test Execution Request:`, {
      testFiles,
      environment,
      environmentConfig
    });

    const results = [];
    const executionConfig = {
      environment: environment || 'test',
      timeout: 30000,
      retries: 1,
      tags: []
    };

    // Execute tests sequentially to avoid conflicts
    for (const testFile of testFiles) {
      try {
        const result = await apiTestExecutor.executeApiTest(
          testFile, 
          executionConfig, 
          environmentConfig
        );
        results.push({
          testFile,
          success: result.success,
          executionId: result.executionId,
          exitCode: result.exitCode
        });
      } catch (error) {
        console.error(`❌ Error executing ${testFile}:`, error);
        results.push({
          testFile,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    res.json({
      success: successCount > 0,
      message: `Executed ${successCount}/${totalCount} API tests successfully`,
      results
    });

  } catch (error) {
    console.error('❌ Batch API test execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute batch API tests',
      error: error.message
    });
  }
});

module.exports = router;
