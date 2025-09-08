const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testId: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testSuiteId: {
    type: String,
    required: true
  },
  environmentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'skipped', 'pending', 'running'],
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number,
  errorMessage: String,
  stackTrace: String,
  screenshots: [{
    name: String,
    path: String,
    timestamp: Date
  }],
  videoPath: String,
  allureReportPath: String,
  playwrightReportPath: String,
  metadata: {
    browser: String,
    viewport: {
      width: Number,
      height: Number
    },
    userAgent: String,
    retryCount: {
      type: Number,
      default: 0
    }
  },
  steps: [{
    stepName: String,
    status: String,
    duration: Number,
    errorMessage: String,
    screenshot: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('TestResult', testResultSchema);
