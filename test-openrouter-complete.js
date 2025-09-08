const axios = require('axios');

async function testCompleteOpenRouterIntegration() {
  const baseUrl = 'http://localhost:5001';
  
  console.log('🧪 Testing Complete OpenRouter Integration...\n');
  
  try {
    // 1. Test LLM Connection API
    console.log('1️⃣ Testing LLM Connection API...');
    const connectionResponse = await axios.post(`${baseUrl}/api/environments/test-llm-connection`, {
      provider: 'openrouter',
      llmType: 'cloud',
      apiKey: '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',
      model: 'deepseek/deepseek-chat-v3.1:free',
      baseUrl: 'https://openrouter.ai'
    });
    
    console.log('✅ Connection test result:', connectionResponse.data);
    
    // 2. Create a test environment with OpenRouter
    console.log('\n2️⃣ Creating test environment with OpenRouter...');
    const environmentData = {
      name: 'OpenRouter Test Environment',
      key: 'openrouter-test',
      description: 'Test environment for OpenRouter integration',
      variables: {
        BASE_URL: 'http://localhost:3000',
        TIMEOUT: 30000,
        BROWSER: 'chromium',
        HEADLESS: true
      },
      llmConfiguration: {
        enabled: true,
        provider: 'openrouter',
        apiKey: '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',
        model: 'deepseek/deepseek-chat-v3.1:free',
        baseUrl: 'https://openrouter.ai'
      }
    };
    
    const envResponse = await axios.post(`${baseUrl}/api/environments`, environmentData);
    console.log('✅ Environment created:', envResponse.data.name);
    
    // 3. Test code generation with OpenRouter
    console.log('\n3️⃣ Testing code generation with OpenRouter...');
    const codeGenResponse = await axios.post(`${baseUrl}/api/code-generation/generate`, {
      prompt: 'Create a simple login test for a website',
      environmentId: envResponse.data._id,
      testName: 'OpenRouter Login Test',
      testType: 'UI Test'
    });
    
    console.log('✅ Code generation successful!');
    console.log('\n📝 Generated code preview:');
    console.log('---');
    console.log(codeGenResponse.data.code.substring(0, 500) + '...');
    console.log('---');
    
    // 4. Clean up - delete the test environment
    console.log('\n4️⃣ Cleaning up test environment...');
    await axios.delete(`${baseUrl}/api/environments/${envResponse.data._id}`);
    console.log('✅ Test environment deleted');
    
    console.log('\n🎉 All OpenRouter integration tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteOpenRouterIntegration();
