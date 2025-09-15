import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCloud, FiSettings, FiUpload, FiPlay, FiDownload, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';

const APIContainer = styled.div`
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

const SectionDescription = styled.div`
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const LoadingOptions = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const OptionButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid ${props => props.active ? '#3498db' : '#ecf0f1'};
  border-radius: 8px;
  background-color: ${props => props.active ? '#3498db' : 'white'};
  color: ${props => props.active ? 'white' : '#7f8c8d'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #3498db;
    color: #3498db;
  }
  
  &.active {
    background-color: #3498db;
    color: white;
  }
`;

const Description = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 20px 0;
  line-height: 1.6;
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
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const GettingStarted = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StepList = styled.ol`
  padding-left: 20px;
  margin: 0;
`;

const StepItem = styled.li`
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 12px;
  line-height: 1.6;
`;

const StepSubItem = styled.div`
  margin-left: 16px;
  margin-top: 4px;
  font-size: 13px;
  color: #7f8c8d;
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

const CodeBlock = styled.pre`
  background-color: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  padding: 16px;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  color: #2c3e50;
  white-space: pre-wrap;
`;

const TabContainer = styled.div`
  margin-bottom: 20px;
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  
  &.active {
    color: #3498db;
    border-bottom-color: #3498db;
  }
  
  &:hover {
    color: #3498db;
  }
`;

const TabContent = styled.div`
  display: ${props => props.$active ? 'block' : 'none'};
  padding: 20px 0;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const FileInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const EndpointList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 20px;
`;

const EndpointItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const Checkbox = styled.input`
  margin-right: 12px;
  cursor: pointer;
`;

const MethodBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-right: 12px;
  min-width: 60px;
  text-align: center;
  background-color: ${props => props.color};
`;

const EndpointPath = styled.div`
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #2c3e50;
`;

const EndpointSummary = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
`;

const RadioGroup = styled.div`
  margin-bottom: 20px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;
  
  input {
    margin-right: 8px;
  }
`;

const Alert = styled.div`
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  
  &.error {
    background-color: #fdf2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }
  
  &.success {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
  }
  
  svg {
    margin-right: 8px;
    flex-shrink: 0;
  }
`;

const SelectionControls = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const SelectionInfo = styled.div`
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 12px;
`;

const APITestGenerator = () => {
  const [loadingMethod, setLoadingMethod] = useState('api');
  const [apiUrl, setApiUrl] = useState('');
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState(new Set());
  const [testType, setTestType] = useState('individual');
  const [resourceName, setResourceName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [useLLM, setUseLLM] = useState(false);
  const [testVariations, setTestVariations] = useState(['happy-path']);
  const [availableVariations] = useState([
    { value: 'happy-path', label: 'Happy Path', description: 'Test successful scenarios with valid data and proper assertions' },
    { value: 'error-cases', label: 'Error Cases', description: 'Test all error scenarios (400, 401, 403, 404, 422, 500) with proper error handling' },
    { value: 'edge-cases', label: 'Edge Cases', description: 'Test boundary values, empty data, null values, and malformed requests' },
    { value: 'security', label: 'Security Tests', description: 'Test authentication, authorization, input validation, and security vulnerabilities' },
    { value: 'performance', label: 'Performance Tests', description: 'Test response times, concurrent requests, and performance assertions' },
    { value: 'boundary-conditions', label: 'Boundary Conditions', description: 'Test data limits, string lengths, numeric boundaries, and size constraints' },
    { value: 'data-validation', label: 'Data Validation', description: 'Test field validation, data types, formats, and business rule validation' }
  ]);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      const response = await api.get('/environments');
      setEnvironments(response.data);
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const loadEndpoints = async () => {
    setLoading(true);
    setError('');
    setEndpoints([]);
    setSelectedEndpoints(new Set());

    try {
      let response;
      
      switch (loadingMethod) {
        case 'api':
          response = await api.get('/api-test-generator/endpoints');
          break;
        case 'environment':
          if (!selectedEnvironment) {
            throw new Error('Please select an environment');
          }
          response = await api.get(`/api-test-generator/endpoints/environment/${selectedEnvironment}`);
          break;
        case 'swagger':
          if (!swaggerUrl) {
            throw new Error('Please enter a Swagger URL');
          }
          response = await api.post('/api-test-generator/endpoints/swagger', {
            swaggerUrl
          });
          break;
        case 'upload':
          if (!uploadedFile) {
            throw new Error('Please upload a file');
          }
          const formData = new FormData();
          formData.append('file', uploadedFile);
          response = await api.post('/api-test-generator/endpoints/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          break;
        default:
          throw new Error('Invalid loading method');
      }

      setEndpoints(response.data.endpoints || []);
      toast.success(`Loaded ${response.data.endpoints?.length || 0} endpoints`);
    } catch (err) {
      let errorMessage = err.message;
      
      // Handle specific error types
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Request timed out. API generation with LLM can take up to 2 minutes. Please try again or use standard generation.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred during generation. Please check the server logs.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please ensure the server is running.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEndpointSelection = (endpointId, checked) => {
    const newSelected = new Set(selectedEndpoints);
    if (checked) {
      newSelected.add(endpointId);
    } else {
      newSelected.delete(endpointId);
    }
    setSelectedEndpoints(newSelected);
  };

  const selectAllEndpoints = () => {
    setSelectedEndpoints(new Set(endpoints.map(ep => ep.id)));
  };

  const deselectAllEndpoints = () => {
    setSelectedEndpoints(new Set());
  };

  const generateTests = async () => {
    if (selectedEndpoints.size === 0) {
      setError('Please select at least one endpoint');
      toast.error('Please select at least one endpoint');
      return;
    }

    if (testType === 'e2e' && !resourceName.trim()) {
      setError('Please enter a resource name for E2E suite');
      toast.error('Please enter a resource name for E2E suite');
      return;
    }

    if (useLLM && !selectedEnvironment) {
      setError('Please select an LLM-enabled environment for AI-enhanced generation');
      toast.error('Please select an LLM-enabled environment for AI-enhanced generation');
      return;
    }

    if (useLLM && selectedEnvironment) {
      const selectedEnv = environments.find(env => env._id === selectedEnvironment);
      if (!selectedEnv || !selectedEnv.llmConfiguration || !selectedEnv.llmConfiguration.enabled) {
        setError('Selected environment does not have valid LLM configuration');
        toast.error('Selected environment does not have valid LLM configuration');
        return;
      }
      
      // For non-local models, check if API key is provided
      if (selectedEnv.llmConfiguration.provider !== 'local' && !selectedEnv.llmConfiguration.apiKey) {
        setError('Selected environment requires an API key for non-local models');
        toast.error('Selected environment requires an API key for non-local models');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const selectedEndpointData = endpoints.filter(ep => selectedEndpoints.has(ep.id));
      
      const response = await api.post('/api-test-generator/generate', {
        endpoints: selectedEndpointData,
        testType,
        resourceName: testType === 'e2e' ? resourceName : undefined,
        environmentId: selectedEnvironment,
        useLLM,
        testVariations: useLLM ? testVariations : ['happy-path']
      });

      setGeneratedCode(response.data.testCode);
      setSuccess(`Successfully generated ${response.data.filesCreated} test file(s)`);
      toast.success(`Successfully generated ${response.data.filesCreated} test file(s)`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      setUploadedFile(file);
      setError('');
      toast.success(`File ${file.name} uploaded successfully`);
    } else {
      setError('Please upload a valid JSON file');
      toast.error('Please upload a valid JSON file');
      setUploadedFile(null);
    }
  };

  const getMethodBadgeColor = (method) => {
    const colors = {
      GET: '#27ae60',
      POST: '#3498db',
      PUT: '#f39c12',
      DELETE: '#e74c3c',
      PATCH: '#9b59b6'
    };
    return colors[method] || '#95a5a6';
  };

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-test.spec.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Test file downloaded');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard');
  };

  return (
    <APIContainer>
      <Header>
        <Title>
          <TitleIcon>
            <FiCloud />
          </TitleIcon>
          API Test Generator
        </Title>
        <Subtitle>Generate robust automated test cases from your API endpoints</Subtitle>
      </Header>

      {error && (
        <Alert className="error">
          <FiX />
          {error}
        </Alert>
      )}

      {success && (
        <Alert className="success">
          <FiCheck />
          {success}
        </Alert>
      )}

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiCloud />
          </SectionIcon>
          Step 1: Choose Endpoint Loading Method
        </SectionTitle>
        
        <TabContainer>
          <TabList>
            <Tab 
              className={loadingMethod === 'api' ? 'active' : ''}
              onClick={() => setLoadingMethod('api')}
            >
              From API
            </Tab>
            <Tab 
              className={loadingMethod === 'environment' ? 'active' : ''}
              onClick={() => setLoadingMethod('environment')}
            >
              From Environment
            </Tab>
            <Tab 
              className={loadingMethod === 'swagger' ? 'active' : ''}
              onClick={() => setLoadingMethod('swagger')}
            >
              Swagger URL
            </Tab>
            <Tab 
              className={loadingMethod === 'upload' ? 'active' : ''}
              onClick={() => setLoadingMethod('upload')}
            >
              Upload File
            </Tab>
          </TabList>

          <TabContent $active={loadingMethod === 'api'}>
            <SectionDescription>
              Load endpoints directly from the backend API
            </SectionDescription>
          </TabContent>

          <TabContent $active={loadingMethod === 'environment'}>
            <SectionDescription>
              Load from a configured environment's Swagger URL
            </SectionDescription>
            <Select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
            >
              <option value="">Choose an environment</option>
              {environments.map((env) => (
                <option key={env._id} value={env._id}>
                  {env.name} - {env.baseUrl}
                </option>
              ))}
            </Select>
          </TabContent>

          <TabContent $active={loadingMethod === 'swagger'}>
            <SectionDescription>
              Enter your Swagger/OpenAPI URL
            </SectionDescription>
            <Input
              type="text"
              placeholder="https://api.example.com/swagger.json"
              value={swaggerUrl}
              onChange={(e) => setSwaggerUrl(e.target.value)}
            />
          </TabContent>

          <TabContent $active={loadingMethod === 'upload'}>
            <SectionDescription>
              Upload a Swagger/OpenAPI JSON file
            </SectionDescription>
            <FileInput
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
            />
            {uploadedFile && (
              <div style={{ color: '#16a34a', fontSize: '14px', marginTop: '-12px', marginBottom: '16px' }}>
                ✓ {uploadedFile.name} uploaded
              </div>
            )}
          </TabContent>
        </TabContainer>

        <Button
          className="primary"
          onClick={loadEndpoints}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? (
            <>
              <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
              Loading Endpoints...
            </>
          ) : (
            <>
              <FiDownload />
              Load Endpoints
            </>
          )}
        </Button>
      </Section>

      {endpoints.length > 0 && (
        <Section>
          <SectionTitle>
            <SectionIcon>
              <FiSettings />
            </SectionIcon>
            Step 2: Select Endpoints
            <SelectionControls style={{ marginLeft: 'auto' }}>
              <Button
                className="secondary"
                onClick={selectAllEndpoints}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Select All
              </Button>
              <Button
                className="secondary"
                onClick={deselectAllEndpoints}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Deselect All
              </Button>
            </SelectionControls>
          </SectionTitle>
          
          <EndpointList>
            {endpoints.map((endpoint) => (
              <EndpointItem key={endpoint.id}>
                <Checkbox
                  type="checkbox"
                  checked={selectedEndpoints.has(endpoint.id)}
                  onChange={(e) => handleEndpointSelection(endpoint.id, e.target.checked)}
                />
                <MethodBadge color={getMethodBadgeColor(endpoint.method)}>
                  {endpoint.method}
                </MethodBadge>
                <div style={{ flex: 1 }}>
                  <EndpointPath>{endpoint.path}</EndpointPath>
                  {endpoint.summary && (
                    <EndpointSummary>{endpoint.summary}</EndpointSummary>
                  )}
                </div>
                {endpoint.tags && endpoint.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {endpoint.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '3px',
                          fontSize: '11px',
                          color: '#666'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </EndpointItem>
            ))}
          </EndpointList>
          
          <SelectionInfo>
            {selectedEndpoints.size} of {endpoints.length} endpoints selected
          </SelectionInfo>
        </Section>
      )}

      {selectedEndpoints.size > 0 && (
        <Section>
          <SectionTitle>
            <SectionIcon>
              <FiPlay />
            </SectionIcon>
            Step 3: Configure Test Generation
          </SectionTitle>
          
          <RadioGroup>
            <div style={{ marginBottom: '12px', fontWeight: '500', color: '#2c3e50' }}>
              Test Generation Type
            </div>
            <RadioOption>
              <input
                type="radio"
                value="individual"
                checked={testType === 'individual'}
                onChange={(e) => setTestType(e.target.value)}
              />
              Generate Individual Tests
            </RadioOption>
            <RadioOption>
              <input
                type="radio"
                value="e2e"
                checked={testType === 'e2e'}
                onChange={(e) => setTestType(e.target.value)}
              />
              Generate E2E Suite
            </RadioOption>
          </RadioGroup>

          {testType === 'e2e' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Resource Name
              </div>
              <Input
                type="text"
                placeholder="e.g., user-management, product-catalog"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '-12px' }}>
                This will be used as the test suite name and file prefix
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px', fontWeight: '500', color: '#2c3e50' }}>
              Test Generation Mode
            </div>
            <RadioGroup>
              <RadioOption>
                <input
                  type="radio"
                  value={false}
                  checked={!useLLM}
                  onChange={() => setUseLLM(false)}
                />
                Standard Generation
              </RadioOption>
              <RadioOption>
                <input
                  type="radio"
                  value={true}
                  checked={useLLM}
                  onChange={() => setUseLLM(true)}
                />
                AI-Enhanced Generation
              </RadioOption>
            </RadioGroup>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '-8px' }}>
              AI-Enhanced mode generates diverse test cases with different assertions and edge cases
            </div>
          </div>

          {useLLM && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  LLM Environment Selection
                </div>
                <Select
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  style={{ marginBottom: '8px' }}
                >
                  <option value="">Choose an LLM-enabled environment</option>
                  {environments
                    .filter(env => env.llmConfiguration && env.llmConfiguration.enabled)
                    .map((env) => (
                    <option key={env._id} value={env._id}>
                      {env.name} - {env.baseUrl}
                    </option>
                  ))}
                </Select>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                  Select an environment with LLM configuration for AI-enhanced test generation.
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Test Variations
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {availableVariations.map((variation) => (
                    <label key={variation.value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={testVariations.includes(variation.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTestVariations([...testVariations, variation.value]);
                          } else {
                            setTestVariations(testVariations.filter(v => v !== variation.value));
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#2c3e50' }}>{variation.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                  Select which types of test cases to generate. More variations create comprehensive test coverage.
                </div>
              </div>
            </>
          )}

          <Button
            className="primary"
            onClick={generateTests}
            disabled={loading}
            style={{ width: '100%', padding: '16px 24px', fontSize: '16px' }}
          >
            {loading ? (
              <>
                <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                Generating Tests...
              </>
            ) : (
              <>
                <FiCheck />
                Save Test File{selectedEndpoints.size > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </Section>
      )}

      {generatedCode && (
        <GeneratedCode>
          <CodeHeader>
            <h3>Generated API Test Code</h3>
            <CodeActions>
              <Button
                className="secondary"
                onClick={handleCopyCode}
              >
                <FiDownload />
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
          <CodeBlock>{generatedCode}</CodeBlock>
        </GeneratedCode>
      )}
    </APIContainer>
  );
};

export default APITestGenerator;
