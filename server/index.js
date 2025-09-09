const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const promptRoutes = require('./routes/prompts');
const testSuiteRoutes = require('./routes/testSuites');
const environmentRoutes = require('./routes/environments');
const testResultRoutes = require('./routes/testResults');
const codeGenerationRoutes = require('./routes/codeGeneration');
const testExecutionRoutes = require('./routes/testExecution');
const apiTestGeneratorRoutes = require('./routes/apiTestGenerator');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve report files
app.use('/reports', express.static(path.join(__dirname, 'reports')));

console.log('Using File-Based Storage (No Database Required)');

// API Routes
app.use('/api/prompts', promptRoutes);
app.use('/api/test-suites', testSuiteRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/code-generation', codeGenerationRoutes);
app.use('/api/test-execution', testExecutionRoutes);
app.use('/api/api-test-generator', apiTestGeneratorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Storage: File-Based (No Database Required)`);
});

module.exports = app;
