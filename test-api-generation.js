const axios = require('axios');

async function testAPIGeneration() {
  try {
    // Get available environments
    console.log('Checking available environments...');
    const envResponse = await axios.get('http://localhost:3000/api/environments');
    const environments = envResponse.data;
    console.log('Available environments:', environments.length);
    
    // Check if we have an LLM-enabled environment
    let testEnvironmentId = null;
    for (const env of environments) {
      console.log(`Checking environment: ${env.name} (${env._id})`);
      console.log('LLM Config:', env.llmConfiguration);
      
      if (env.llmConfiguration && env.llmConfiguration.provider && env.llmConfiguration.apiKey && env._id) {
        testEnvironmentId = env._id;
        console.log(`✅ Found LLM-enabled environment: ${env.name} (${env._id})`);
        console.log('LLM Config:', {
          provider: env.llmConfiguration.provider,
          model: env.llmConfiguration.model,
          hasApiKey: !!env.llmConfiguration.apiKey
        });
        break;
      }
    }
    
    if (!testEnvironmentId) {
      console.log('❌ No LLM-enabled environment found.');
      console.log('Please create an environment with LLM configuration first.');
      return;
    }
    
    const testEndpoints = [{
      method: 'GET',
      url: '/api/users',
      description: 'Get all users',
      tags: ['users', 'api']
    }];
    
    console.log('\n==================================================\n');
    
    // Test standard generation
    console.log('Testing Standard Generation...');
    const standardResponse = await axios.post('http://localhost:3000/api/api-test-generator/generate', {
      endpoints: testEndpoints,
      testType: 'individual',
      useLLM: false,
      testVariations: ['happy-path'],
      environmentId: testEnvironmentId
    });
    
    console.log('Standard Generation Response:');
    console.log('Success:', standardResponse.data.success);
    console.log('Files Created:', standardResponse.data.filesCreated);
    console.log('Code Length:', standardResponse.data.generatedCode?.length || 0);
    console.log('Code Preview:', standardResponse.data.generatedCode?.substring(0, 200) + '...');
    
    console.log('\n==================================================\n');
    
    // Test LLM generation
    console.log('Testing LLM Generation...');
    const llmResponse = await axios.post('http://localhost:3000/api/api-test-generator/generate', {
      endpoints: testEndpoints,
      testType: 'individual',
      useLLM: true,
      testVariations: ['happy-path'],
      environmentId: testEnvironmentId
    });
    
    console.log('LLM Generation Response:');
    console.log('Success:', llmResponse.data.success);
    console.log('Files Created:', llmResponse.data.filesCreated);
    console.log('Code Length:', llmResponse.data.generatedCode?.length || 0);
    console.log('Code Preview:', llmResponse.data.generatedCode?.substring(0, 200) + '...');
    
    console.log('\n==================================================\n');
    
    // Compare results
    if (standardResponse.data.generatedCode === llmResponse.data.generatedCode) {
      console.log('❌ ISSUE: Standard and LLM generation produce identical output!');
      console.log('This means LLM generation is falling back to standard generation.');
    } else {
      console.log('✅ SUCCESS: LLM generation produces different output than standard generation!');
      console.log('LLM generation is working properly.');
    }
    
  } catch (error) {
    console.error('Error testing API generation:', error.response?.data || error.message);
    if (error.response) {
      console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPIGeneration();