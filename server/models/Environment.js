const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  variables: {
    BASE_URL: {
      type: String,
      required: true
    },
    API_URL: String,
    USERNAME: String,
    PASSWORD: String,
    TIMEOUT: {
      type: Number,
      default: 30000
    },
    BROWSER: {
      type: String,
      default: 'chromium'
    },
    HEADLESS: {
      type: Boolean,
      default: true
    },
    RETRIES: {
      type: Number,
      default: 2
    }
  },
  jiraIntegration: {
    enabled: {
      type: Boolean,
      default: false
    },
    url: String,
    username: String,
    password: String,
    projectKey: String
  },
  llmConfiguration: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['openai', 'claude', 'openrouter', 'local'],
      default: 'openai'
    },
    apiKey: String,
    model: String,
    baseUrl: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Environment', environmentSchema);
