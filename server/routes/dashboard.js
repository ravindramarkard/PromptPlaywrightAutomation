const express = require('express');
const router = express.Router();

// Get recent activity data
router.get('/recent-activity', async (req, res) => {
  try {
    // This could be enhanced to fetch real data from database
    // For now, returning static recent activities
    const recentActivities = [
      {
        id: 1,
        title: 'Fixed LLM Environment Selection - Now shows all 4 environments',
        time: '5 minutes ago',
        type: 'fix',
        color: '#27ae60',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: 'Enhanced API Test Generation with Ollama support',
        time: '10 minutes ago',
        type: 'generation',
        color: '#9b59b6',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        title: 'Fixed duplicate variable declarations in generated tests',
        time: '15 minutes ago',
        type: 'fix',
        color: '#e74c3c',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        title: 'Updated frontend LLM connection parameters',
        time: '20 minutes ago',
        type: 'update',
        color: '#3498db',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        title: 'Fixed Ollama local connection issues',
        time: '25 minutes ago',
        type: 'fix',
        color: '#f39c12',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 6,
        title: 'Enhanced API test reports with detailed sections',
        time: '30 minutes ago',
        type: 'enhancement',
        color: '#2ecc71',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 7,
        title: 'Fixed Playwright conflict between root and server',
        time: '35 minutes ago',
        type: 'fix',
        color: '#e67e22',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString()
      },
      {
        id: 8,
        title: 'Implemented API test execution using Playwright',
        time: '40 minutes ago',
        type: 'feature',
        color: '#8e44ad',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    ];

    res.json({
      success: true,
      activities: recentActivities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // This could be enhanced to fetch real statistics from database
    const stats = {
      totalPrompts: 15,
      totalTests: 8,
      uiTests: 4,
      apiTests: 4,
      totalSuites: 4,
      totalEnvironments: 4,
      recentExecutions: 8,
      successRate: 85.5
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;
