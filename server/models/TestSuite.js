const mongoose = require('mongoose');

const testSuiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  testType: {
    type: String,
    enum: ['UI', 'API', 'E2E'],
    required: true
  },
  projectId: {
    type: String,
    required: true
  },
  environmentId: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  testFiles: [{
    fileName: String,
    filePath: String,
    testCount: Number,
    lastRun: Date,
    status: {
      type: String,
      enum: ['pending', 'running', 'passed', 'failed', 'skipped'],
      default: 'pending'
    }
  }],
  executionHistory: [{
    runId: String,
    startTime: Date,
    endTime: Date,
    status: String,
    totalTests: Number,
    passed: Number,
    failed: Number,
    skipped: Number,
    duration: Number,
    reportPath: String
  }],
  configuration: {
    baseUrl: String,
    timeout: {
      type: Number,
      default: 30000
    },
    browser: {
      type: String,
      default: 'chromium'
    },
    headless: {
      type: Boolean,
      default: true
    },
    retries: {
      type: Number,
      default: 2
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestSuite', testSuiteSchema);
