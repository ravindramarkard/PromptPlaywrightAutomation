import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiZap, FiCode, FiPlay, FiDownload, FiCopy, FiToggleLeft, FiToggleRight, FiSettings, FiCpu } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-toastify';
import api from '../config/axios';

const EnhancedContainer = styled.div`
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
`;

const TitleIcon = styled.span`
  margin-right: 12px;
  color: #3498db;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
`;

const SectionIcon = styled.span`
  margin-right: 8px;
  color: #3498db;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &.primary {
    background-color: #3498db;
    color: white;
    
    &:hover {
      background-color: #2980b9;
    }
  }
  
  &.secondary {
    background-color: #95a5a6;
    color: white;
    
    &:hover {
      background-color: #7f8c8d;
    }
  }
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const GeneratedCode = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CodeActions = styled.div`
  display: flex;
  gap: 8px;
`;

const CodeBlock = styled.div`
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const FeatureCard = styled.div`
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  text-align: center;
  border: 2px solid ${props => props.selected ? '#3498db' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #3498db;
    background-color: #ecf0f1;
  }
`;

const FeatureIcon = styled.div`
  font-size: 24px;
  color: #3498db;
  margin-bottom: 8px;
`;

const FeatureTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
`;

const FeatureDescription = styled.p`
  font-size: 12px;
  color: #7f8c8d;
  margin: 0;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ToggleLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin: 0;
`;

const ToggleButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'enabled'
})`
  width: 50px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: ${props => props.enabled ? '#3498db' : '#bdc3c7'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: ${props => props.enabled ? 'flex-end' : 'flex-start'};
  padding: 2px;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.enabled ? '#2980b9' : '#95a5a6'};
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #7f8c8d;
  margin: 0;
  font-style: italic;
`;

const EnvironmentCard = styled.div`
  background: ${props => props.selected ? '#e8f4fd' : '#f8f9fa'};
  border: 2px solid ${props => props.selected ? '#3498db' : 'transparent'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #3498db;
    background-color: #e8f4fd;
  }
`;

const EnvironmentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const EnvironmentName = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const EnvironmentDetails = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  margin-left: 24px;
`;

const LLMConfig = styled.div`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
  border-left: 4px solid #3498db;
`;

const LLMProvider = styled.div`
  font-size: 12px;
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 4px;
`;

const LLMModel = styled.div`
  font-size: 11px;
  color: #7f8c8d;
`;

const ParsedSteps = styled.div`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
  border-left: 4px solid #27ae60;
`;

const StepsTitle = styled.h5`
  font-size: 12px;
  color: #2c3e50;
  margin: 0 0 8px 0;
  font-weight: 600;
`;

const StepItem = styled.div`
  font-size: 11px;
  color: #7f8c8d;
  margin-bottom: 4px;
  padding-left: 12px;
  position: relative;
  
  &:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #27ae60;
  }
`;

const EnhancedAIGenerator = () => {
  const [formData, setFormData] = useState({
    testName: '',
    testType: 'UI Test',
    promptContent: '',
    baseUrl: '',
    features: [],
    environmentId: '',
    useLLM: false,
    options: {
      includeComments: true,
      addAssertions: true,
      generatePageObjects: false,
      addDataDrivenTests: false,
      includeScreenshots: true,
      addRetryLogic: true,
      includeAllureReport: true,
      addTestDescription: true,
      includeTestSteps: true
    }
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [parsedSteps, setParsedSteps] = useState([]);
  const [parsingSteps, setParsingSteps] = useState(false);

  const availableFeatures = [
    {
      id: 'comments',
      title: 'Smart Comments',
      description: 'Add intelligent comments',
      icon: '💬'
    },
    {
      id: 'assertions',
      title: 'Auto Assertions',
      description: 'Generate assertions automatically',
      icon: '✅'
    },
    {
      id: 'pageObjects',
      title: 'Page Objects',
      description: 'Generate page object models',
      icon: '📄'
    },
    {
      id: 'dataDriven',
      title: 'Data Driven',
      description: 'Create data-driven tests',
      icon: '📊'
    },
    {
      id: 'screenshots',
      title: 'Screenshots',
      description: 'Add screenshot capture',
      icon: '📸'
    },
    {
      id: 'retry',
      title: 'Retry Logic',
      description: 'Add retry mechanisms',
      icon: '🔄'
    }
  ];

  const fetchEnvironments = async () => {
    try {
      const response = await api.get('/environments');
      const envs = Array.isArray(response.data) ? response.data : response.data.environments || [];
      setEnvironments(envs);
      
      // Auto-select first environment with LLM enabled
      const llmEnv = envs.find(env => env.llmConfiguration?.enabled);
      if (llmEnv) {
        setSelectedEnvironment(llmEnv);
        setFormData(prev => ({ ...prev, environmentId: llmEnv._id }));
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast.error('Failed to fetch environments');
    }
  };

  const parsePromptSteps = useCallback(async () => {
    if (!formData.promptContent) return;
    
    try {
      setParsingSteps(true);
      const response = await api.post('/prompts/parse', {
        promptContent: formData.promptContent
      });
      setParsedSteps(response.data.parsedSteps || []);
    } catch (error) {
      console.error('Error parsing steps:', error);
      setParsedSteps([]);
      if (error.code === 'ECONNABORTED') {
        toast.error('Step parsing timed out. Please try again.');
      } else {
        toast.error('Failed to parse steps. Proceeding without step parsing.');
      }
    } finally {
      setParsingSteps(false);
    }
  }, [formData.promptContent]);

  // Fetch environments on component mount
  useEffect(() => {
    fetchEnvironments();
  }, []);

  // Parse steps when prompt content changes
  useEffect(() => {
    if (formData.promptContent && formData.useLLM) {
      parsePromptSteps();
    }
  }, [formData.promptContent, formData.useLLM, parsePromptSteps]);

  const handleEnvironmentSelect = (environment) => {
    setSelectedEnvironment(environment);
    setFormData(prev => ({ ...prev, environmentId: environment._id }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('options.')) {
      const optionName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          [optionName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFeatureToggle = (featureId) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(id => id !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleGenerateCode = async () => {
    if (!formData.promptContent) {
      toast.error('Please enter a prompt');
      return;
    }

    if (formData.useLLM && !selectedEnvironment) {
      toast.error('Please select an LLM environment to generate code');
      return;
    }

    try {
      setLoading(true);
      
      // Get the environment object for LLM generation
      const environment = selectedEnvironment || null;
      
      // Always parse steps when using LLM to ensure we have the latest parsed steps
      let stepsToSend = parsedSteps;
      if (formData.useLLM) {
        try {
          console.log('Parsing steps for LLM generation...');
          const parseResponse = await api.post('/prompts/parse', {
            promptContent: formData.promptContent
          });
          stepsToSend = parseResponse.data.parsedSteps || [];
          console.log('Parsed steps:', stepsToSend);
          
          // Update the parsed steps state
          setParsedSteps(stepsToSend);
        } catch (parseError) {
          console.warn('Failed to parse steps, proceeding without them:', parseError);
          toast.warning('Failed to parse steps, proceeding with basic generation');
        }
      }
      
      console.log('Generating code with:', {
        useLLM: formData.useLLM,
        environment: environment?.name,
        stepCount: stepsToSend.length,
        parsedSteps: stepsToSend
      });
      
      // Enforce LLM generation for Enhanced Test - no template fallback allowed
      if (!environment) {
        toast.error('Please select an LLM environment to generate enhanced tests');
        return;
      }
      
      console.log('Enforcing direct LLM generation for Enhanced Test');
      
      // Always use direct LLM generation for Enhanced Test button
      const response = await api.post('/code-generation/generate-llm-playwright', {
        promptContent: formData.promptContent,
        testName: formData.testName,
        testType: formData.testType,
        environment: environment, // Pass the full environment object
        parsedSteps: stepsToSend, // Send parsed steps to LLM
        baseUrl: formData.baseUrl // Pass the prompt's baseUrl to take priority
      });
      
      setGeneratedCode(response.data.testCode);
      const generationMethod = response.data.metadata?.generatedWith || 'LLM';
      const llmProvider = environment?.llmConfiguration?.provider || 'LLM';
      const stepCount = stepsToSend.length;
      const browserLaunch = response.data.browserLaunch;
      
      // Always show LLM success message since we enforce LLM generation
      toast.success(`🤖 ${generationMethod} code generated using ${llmProvider} with ${stepCount} parsed steps`);
      
      // Handle browser launch result
      if (browserLaunch) {
        if (browserLaunch.success || browserLaunch.launched) {
          toast.success(`🚀 Browser test launched successfully! Check your browser window.`);
        } else {
          toast.warning(`⚠️ Test generated but browser launch failed: ${browserLaunch.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
      
      let errorMessage = 'Failed to generate test code';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check the backend logs.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check the backend.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard');
  };

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.testName || 'enhanced-test'}.spec.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Test file downloaded');
  };

  return (
    <EnhancedContainer>
      <Header>
        <Title>
          <TitleIcon>
            <FiZap />
          </TitleIcon>
          Enhanced AI Generator
        </Title>
        <Subtitle>Advanced AI-powered test generation with intelligent features</Subtitle>
      </Header>

      <MainContent>
        <Section>
          <SectionTitle>
            <SectionIcon>
              <FiCode />
            </SectionIcon>
            Test Configuration
          </SectionTitle>
          
          <FormGroup>
            <Label htmlFor="testName">Test Name</Label>
            <Input
              type="text"
              id="testName"
              name="testName"
              value={formData.testName}
              onChange={handleInputChange}
              placeholder="Enter test name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="testType">Test Type</Label>
            <Select
              id="testType"
              name="testType"
              value={formData.testType}
              onChange={handleInputChange}
            >
              <option value="UI Test">UI Test</option>
              <option value="API Test">API Test</option>
              <option value="E2E Test">E2E Test</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <ToggleContainer>
              <ToggleLabel>Use LLM for Code Generation</ToggleLabel>
              <ToggleButton
                type="button"
                enabled={formData.useLLM}
                onClick={() => setFormData(prev => ({ ...prev, useLLM: !prev.useLLM }))}
              >
                {formData.useLLM ? <FiToggleRight /> : <FiToggleLeft />}
              </ToggleButton>
            </ToggleContainer>
            <HelpText>
              Enable to use configured LLM provider for intelligent code generation
            </HelpText>
          </FormGroup>

          {formData.useLLM && (
            <FormGroup>
              <Label>
                🤖 Select LLM Environment
                {selectedEnvironment && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#28a745', 
                    marginLeft: '8px',
                    fontWeight: 'normal'
                  }}>
                    ✓ {selectedEnvironment.name} selected
                  </span>
                )}
              </Label>
              {environments.filter(env => env.llmConfiguration?.enabled).length === 0 ? (
                <div style={{ 
                  padding: '16px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffeaa7', 
                  borderRadius: '6px',
                  color: '#856404',
                  fontSize: '14px'
                }}>
                  <FiSettings style={{ marginRight: '8px' }} />
                  No environments with LLM configuration found. Please create an environment with LLM enabled first.
                </div>
              ) : (
                <div>
                  {environments
                    .filter(env => env.llmConfiguration?.enabled)
                    .map((environment) => (
                      <EnvironmentCard
                        key={environment._id}
                        selected={selectedEnvironment?._id === environment._id}
                        onClick={() => handleEnvironmentSelect(environment)}
                      >
                        <EnvironmentHeader>
                          <FiCpu />
                          <EnvironmentName>{environment.name}</EnvironmentName>
                          {selectedEnvironment?._id === environment._id && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#28a745',
                              marginLeft: '8px'
                            }}>
                              ✓ Selected
                            </span>
                          )}
                        </EnvironmentHeader>
                        <EnvironmentDetails>
                          <div>Base URL: {environment.llmConfiguration.baseUrl || 'Not set'}</div>
                          <LLMConfig>
                            <LLMProvider>
                              Provider: {environment.llmConfiguration.provider}
                            </LLMProvider>
                            <LLMModel>
                              Model: {environment.llmConfiguration.model}
                            </LLMModel>
                            {environment.llmConfiguration.llmProvider && (
                              <LLMModel>
                                LLM Provider: {environment.llmConfiguration.llmProvider}
                              </LLMModel>
                            )}
                          </LLMConfig>
                        </EnvironmentDetails>
                      </EnvironmentCard>
                    ))}
                </div>
              )}
            </FormGroup>
          )}

          {formData.useLLM && (
            <FormGroup>
              <Label>
                📝 Parsed Steps 
                {parsedSteps.length > 0 && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#28a745', 
                    marginLeft: '8px',
                    fontWeight: 'normal'
                  }}>
                    ({parsedSteps.length} steps ready for LLM)
                  </span>
                )}
              </Label>
              {parsedSteps.length > 0 ? (
                <ParsedSteps>
                  <StepsTitle>🤖 AI will generate code for these parsed steps:</StepsTitle>
                  {parsedSteps.map((step, index) => (
                    <div key={index} style={{ 
                      marginBottom: '8px', 
                      padding: '12px', 
                      background: '#e8f5e8', 
                      borderRadius: '6px',
                      border: '1px solid #c3e6c3'
                    }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#2c3e50',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          background: '#28a745',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          marginRight: '8px'
                        }}>
                          {index + 1}
                        </span>
                        Step {index + 1}: {step.action?.toUpperCase() || 'UNKNOWN'}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#495057',
                        marginBottom: '6px',
                        fontStyle: 'italic'
                      }}>
                        "{step.originalText}"
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {step.target && (
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#6c757d',
                            fontFamily: 'monospace',
                            background: '#f8f9fa',
                            padding: '4px 6px',
                            borderRadius: '3px',
                            border: '1px solid #dee2e6'
                          }}>
                            🎯 Target: {step.target}
                          </div>
                        )}
                        {step.value && (
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#6c757d',
                            fontFamily: 'monospace',
                            background: '#f8f9fa',
                            padding: '4px 6px',
                            borderRadius: '3px',
                            border: '1px solid #dee2e6'
                          }}>
                            📝 Value: {step.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {parsingSteps && (
                    <StepItem>Parsing steps...</StepItem>
                  )}
                </ParsedSteps>
              ) : (
                <div style={{ 
                  padding: '16px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffeaa7', 
                  borderRadius: '6px',
                  color: '#856404',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  <FiCode style={{ marginRight: '8px' }} />
                  Enter a prompt above to see parsed steps that will be sent to the LLM
                </div>
              )}
            </FormGroup>
          )}
          
          <FormGroup>
            <Label htmlFor="promptContent">AI Prompt</Label>
            <TextArea
              id="promptContent"
              name="promptContent"
              value={formData.promptContent}
              onChange={handleInputChange}
              placeholder="Describe your test scenario in natural language..."
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="baseUrl">Base URL (Optional)</Label>
            <Input
              type="url"
              id="baseUrl"
              name="baseUrl"
              value={formData.baseUrl}
              onChange={handleInputChange}
              placeholder="https://example.com (overrides environment base URL)"
            />
            <HelpText>
              If provided, this URL will be used instead of the environment's base URL for test generation
            </HelpText>
          </FormGroup>
          
          <Button
            className="primary"
            onClick={handleGenerateCode}
            disabled={loading || !formData.promptContent}
          >
            <FiZap />
            {loading ? 'Generating...' : 'Generate Enhanced Test'}
          </Button>
        </Section>

        <Section>
          <SectionTitle>
            <SectionIcon>
              <FiPlay />
            </SectionIcon>
            AI Features
          </SectionTitle>
          
          <FeatureGrid>
            {availableFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                selected={formData.features.includes(feature.id)}
                onClick={() => handleFeatureToggle(feature.id)}
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeatureGrid>
          
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '12px', color: '#2c3e50' }}>Advanced Options</h4>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.includeComments"
                checked={formData.options.includeComments}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Include intelligent comments
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.addAssertions"
                checked={formData.options.addAssertions}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Add automatic assertions
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.generatePageObjects"
                checked={formData.options.generatePageObjects}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Generate page object models
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.addDataDrivenTests"
                checked={formData.options.addDataDrivenTests}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Create data-driven tests
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.includeScreenshots"
                checked={formData.options.includeScreenshots}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Include screenshot capture
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.addRetryLogic"
                checked={formData.options.addRetryLogic}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Add retry logic
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.includeAllureReport"
                checked={formData.options.includeAllureReport}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Include Allure reporting
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.addTestDescription"
                checked={formData.options.addTestDescription}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Add test descriptions
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="options.includeTestSteps"
                checked={formData.options.includeTestSteps}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Include test step annotations
            </label>
          </div>
        </Section>
      </MainContent>

      {generatedCode && (
        <GeneratedCode>
          <CodeHeader>
            <h3>Generated Enhanced Test Code</h3>
            <CodeActions>
              <Button
                className="secondary"
                onClick={handleCopyCode}
              >
                <FiCopy />
                Copy Code
              </Button>
              <Button
                className="primary"
                onClick={handleDownloadCode}
              >
                <FiDownload />
                Download
              </Button>
            </CodeActions>
          </CodeHeader>
          <CodeBlock>
            <SyntaxHighlighter
              language="typescript"
              style={tomorrow}
              customStyle={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '1.4'
              }}
            >
              {generatedCode}
            </SyntaxHighlighter>
          </CodeBlock>
        </GeneratedCode>
      )}
    </EnhancedContainer>
  );
};

export default EnhancedAIGenerator;
