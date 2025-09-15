const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Generic file operations
  async readFile(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filename}:`, error);
      return [];
    }
  }

  async writeFile(filename, data) {
    try {
      const filePath = path.join(this.dataDir, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing file ${filename}:`, error);
      return false;
    }
  }

  // Prompt operations
  async createPrompt(promptData) {
    const prompts = await this.readFile('prompts.json');
    const newPrompt = {
      _id: uuidv4(),
      ...promptData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    prompts.push(newPrompt);
    await this.writeFile('prompts.json', prompts);
    return newPrompt;
  }

  async getPrompts(query = {}) {
    let prompts = await this.readFile('prompts.json');
    
    // Apply filters
    if (query.projectId) {
      prompts = prompts.filter(p => p.projectId === query.projectId);
    }
    if (query.modelId) {
      prompts = prompts.filter(p => p.modelId === query.modelId);
    }
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      prompts = prompts.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.promptContent.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 1000; // Increased default limit to show all prompts
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedPrompts = prompts.slice(startIndex, endIndex);
    
    return {
      prompts: paginatedPrompts,
      total: prompts.length,
      totalPages: Math.ceil(prompts.length / limit),
      currentPage: page
    };
  }

  async getPromptById(id) {
    const prompts = await this.readFile('prompts.json');
    return prompts.find(p => p._id === id);
  }

  async updatePrompt(id, updateData) {
    const prompts = await this.readFile('prompts.json');
    const index = prompts.findIndex(p => p._id === id);
    
    if (index === -1) {
      return null;
    }

    prompts[index] = {
      ...prompts[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.writeFile('prompts.json', prompts);
    return prompts[index];
  }

  async deletePrompt(id) {
    const prompts = await this.readFile('prompts.json');
    const filteredPrompts = prompts.filter(p => p._id !== id);
    await this.writeFile('prompts.json', filteredPrompts);
    return true;
  }

  // Environment operations
  async createEnvironment(envData) {
    const environments = await this.readFile('environments.json');
    const newEnv = {
      _id: uuidv4(),
      ...envData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    environments.push(newEnv);
    await this.writeFile('environments.json', environments);
    return newEnv;
  }

  async getEnvironments() {
    return await this.readFile('environments.json');
  }

  async getEnvironmentById(id) {
    const environments = await this.readFile('environments.json');
    return environments.find(e => e._id === id);
  }

  async getEnvironmentByKey(key) {
    const environments = await this.readFile('environments.json');
    return environments.find(e => e.key === key);
  }

  async updateEnvironment(id, updateData) {
    const environments = await this.readFile('environments.json');
    const index = environments.findIndex(e => e._id === id);
    
    if (index === -1) {
      return null;
    }

    environments[index] = {
      ...environments[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.writeFile('environments.json', environments);
    return environments[index];
  }

  async deleteEnvironment(id) {
    const environments = await this.readFile('environments.json');
    const filteredEnvs = environments.filter(e => e._id !== id);
    await this.writeFile('environments.json', filteredEnvs);
    return true;
  }

  // Test Suite operations
  async createTestSuite(suiteData) {
    const testSuites = await this.readFile('testSuites.json');
    const newSuite = {
      _id: uuidv4(),
      ...suiteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    testSuites.push(newSuite);
    await this.writeFile('testSuites.json', testSuites);
    return newSuite;
  }

  async getTestSuites() {
    return await this.readFile('testSuites.json');
  }

  async getTestSuiteById(id) {
    const testSuites = await this.readFile('testSuites.json');
    return testSuites.find(s => s._id === id);
  }

  async updateTestSuite(id, updateData) {
    const testSuites = await this.readFile('testSuites.json');
    const index = testSuites.findIndex(s => s._id === id);
    
    if (index === -1) {
      return null;
    }

    testSuites[index] = {
      ...testSuites[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.writeFile('testSuites.json', testSuites);
    return testSuites[index];
  }

  async deleteTestSuite(id) {
    const testSuites = await this.readFile('testSuites.json');
    const filteredSuites = testSuites.filter(s => s._id !== id);
    await this.writeFile('testSuites.json', filteredSuites);
    return true;
  }

  // Synchronous versions for compatibility
  getTestSuites() {
    try {
      const filePath = path.join(this.dataDir, 'testSuites.json');
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading test suites:', error);
      return [];
    }
  }

  saveTestSuites(testSuites) {
    try {
      const filePath = path.join(this.dataDir, 'testSuites.json');
      fs.writeFileSync(filePath, JSON.stringify(testSuites, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving test suites:', error);
      return false;
    }
  }

  // Test Result operations
  async createTestResult(resultData) {
    const testResults = await this.readFile('testResults.json');
    const newResult = {
      _id: uuidv4(),
      ...resultData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    testResults.push(newResult);
    await this.writeFile('testResults.json', testResults);
    return newResult;
  }

  async getTestResults() {
    return await this.readFile('testResults.json');
  }

  async getTestResultById(id) {
    const testResults = await this.readFile('testResults.json');
    return testResults.find(r => r._id === id);
  }

  async updateTestResult(id, updateData) {
    const testResults = await this.readFile('testResults.json');
    const index = testResults.findIndex(r => r._id === id);
    
    if (index === -1) {
      return null;
    }

    testResults[index] = {
      ...testResults[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.writeFile('testResults.json', testResults);
    return testResults[index];
  }

  async deleteTestResult(id) {
    const testResults = await this.readFile('testResults.json');
    const filteredResults = testResults.filter(r => r._id !== id);
    await this.writeFile('testResults.json', filteredResults);
    return true;
  }

  // Statistics
  async getStats() {
    const prompts = await this.readFile('prompts.json');
    const testSuites = await this.readFile('testSuites.json');
    const environments = await this.readFile('environments.json');
    const testResults = await this.readFile('testResults.json');

    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      totalPrompts: prompts.length,
      totalSuites: testSuites.length,
      totalEnvironments: environments.length,
      totalTests,
      successRate: Math.round(successRate * 100) / 100
    };
  }
}

module.exports = FileStorage;
