const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  promptContent: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    enum: ['UI Test', 'API Test', 'E2E Test'],
    default: 'UI Test'
  },
  tags: [{
    type: String,
    trim: true
  }],
  additionalContext: {
    type: String,
    trim: true
  },
  baseUrl: {
    type: String,
    trim: true
  },
  additionalInformation: {
    type: String,
    trim: true
  },
  projectId: {
    type: String,
    required: true
  },
  modelId: {
    type: String,
    required: true
  },
  modelName: {
    type: String,
    required: true
  },
  promptId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  generatedTests: [{
    testId: String,
    testName: String,
    filePath: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    parsedSteps: [{
      action: String,
      target: String,
      value: String,
      assertion: String
    }],
    llmResponse: String,
    filePath: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prompt', promptSchema);
