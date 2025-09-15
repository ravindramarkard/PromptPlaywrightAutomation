const express = require('express');
const router = express.Router();
const DOMAnalyzer = require('../services/DOMAnalyzer');

// Analyze DOM for a given URL and steps
router.post('/analyze', async (req, res) => {
  try {
    const { url, steps = [] } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL is required for DOM analysis' 
      });
    }

    console.log(`Starting DOM analysis for URL: ${url}`);
    console.log(`Steps to analyze: ${steps.length}`);

    // Create DOM analyzer instance
    const analyzer = new DOMAnalyzer();
    
    // Perform analysis
    const analysisResult = await analyzer.analyzeUserJourney(url, steps);
    
    console.log('DOM analysis completed successfully');
    console.log(`Found ${analysisResult.elements?.length || 0} unique elements`);
    
    res.json({
      success: true,
      data: analysisResult,
      message: 'DOM analysis completed successfully'
    });
    
  } catch (error) {
    console.error('Error in DOM analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze DOM',
      error: error.message
    });
  }
});

// Get analysis status (for long-running analyses)
router.get('/status/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    // For now, we'll just return a simple status
    // In a real implementation, you might store analysis status in a database
    res.json({
      success: true,
      status: 'completed',
      analysisId
    });
    
  } catch (error) {
    console.error('Error getting analysis status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analysis status',
      error: error.message
    });
  }
});

module.exports = router;
