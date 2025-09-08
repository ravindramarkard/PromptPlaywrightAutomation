import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCloud, FiSettings, FiUpload, FiPlay, FiDownload } from 'react-icons/fi';
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

const APITestGenerator = () => {
  const [loadingMethod, setLoadingMethod] = useState('api');
  const [apiUrl, setApiUrl] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');

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

  const handleLoadFromAPI = async () => {
    if (!apiUrl) {
      toast.error('Please enter an API URL');
      return;
    }

    try {
      setLoading(true);
      // Mock API loading - in real implementation, this would load from Swagger/OpenAPI
      const mockEndpoints = [
        { method: 'GET', path: '/api/users', expectedStatus: 200 },
        { method: 'POST', path: '/api/users', expectedStatus: 201 },
        { method: 'GET', path: '/api/users/{id}', expectedStatus: 200 },
        { method: 'PUT', path: '/api/users/{id}', expectedStatus: 200 },
        { method: 'DELETE', path: '/api/users/{id}', expectedStatus: 204 }
      ];

      const response = await api.post('/code-generation/generate-api-test', {
        endpoints: mockEndpoints,
        environmentId: selectedEnvironment
      });

      setGeneratedCode(response.data.testCode);
      toast.success('API test code generated successfully');
    } catch (error) {
      console.error('Error generating API test:', error);
      toast.error('Failed to generate API test');
    } finally {
      setLoading(false);
    }
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
        <Subtitle>Generate automated test cases from your API endpoints using AI</Subtitle>
      </Header>

      <MainContent>
        <Section>
          <SectionTitle>
            <SectionIcon>
              <FiCloud />
            </SectionIcon>
            Load Endpoints from API
          </SectionTitle>
          
          <LoadingOptions>
            <OptionButton
              active={loadingMethod === 'api'}
              onClick={() => setLoadingMethod('api')}
            >
              <FiCloud />
              FROM API
            </OptionButton>
            <OptionButton
              active={loadingMethod === 'environment'}
              onClick={() => setLoadingMethod('environment')}
            >
              <FiSettings />
              FROM ENVIRONMENT
            </OptionButton>
            <OptionButton
              active={loadingMethod === 'upload'}
              onClick={() => setLoadingMethod('upload')}
            >
              <FiUpload />
              UPLOAD FILE
            </OptionButton>
          </LoadingOptions>

          {loadingMethod === 'api' && (
            <>
              <Description>
                Load endpoints directly from the backend API's Swagger specification
              </Description>
              <Input
                type="url"
                placeholder="Enter API URL (e.g., https://api.example.com/swagger.json)"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <Button
                className="primary"
                onClick={handleLoadFromAPI}
                disabled={loading}
              >
                <FiCloud />
                {loading ? 'Loading...' : 'LOAD FROM API'}
              </Button>
            </>
          )}

          {loadingMethod === 'environment' && (
            <>
              <Description>
                Load from a configured environment's Swagger URL
              </Description>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              >
                <option value="">Select Environment</option>
                {environments.map(env => (
                  <option key={env._id} value={env._id}>
                    {env.name} ({env.key})
                  </option>
                ))}
              </select>
              <Button
                className="primary"
                onClick={handleLoadFromAPI}
                disabled={!selectedEnvironment || loading}
              >
                <FiSettings />
                {loading ? 'Loading...' : 'LOAD FROM ENVIRONMENT'}
              </Button>
            </>
          )}

          {loadingMethod === 'upload' && (
            <>
              <Description>
                Upload a Swagger/OpenAPI JSON file
              </Description>
              <input
                type="file"
                accept=".json"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              />
              <Button
                className="primary"
                onClick={handleLoadFromAPI}
                disabled={loading}
              >
                <FiUpload />
                {loading ? 'Processing...' : 'UPLOAD FILE'}
              </Button>
            </>
          )}
        </Section>

        <Section>
          <SectionTitle>
            <SectionIcon>
              <FiPlay />
            </SectionIcon>
            Getting Started
          </SectionTitle>
          
          <StepList>
            <StepItem>
              <strong>Choose a method to load endpoints:</strong>
              <StepSubItem>From API: Load endpoints directly from the backend API</StepSubItem>
              <StepSubItem>From Environment: Load from a configured environment's Swagger URL</StepSubItem>
              <StepSubItem>Upload File: Upload a Swagger/OpenAPI JSON file</StepSubItem>
            </StepItem>
            <StepItem>
              <strong>Select the endpoints you want to test by checking the checkboxes</strong>
            </StepItem>
            <StepItem>
              <strong>Choose between "Generate Individual Tests" or "Generate E2E Suite"</strong>
            </StepItem>
            <StepItem>
              <strong>For E2E suites, enter a resource name (e.g., "test-suite")</strong>
            </StepItem>
            <StepItem>
              <strong>Click "Save Test File" to save the generated tests as Playwright files</strong>
            </StepItem>
          </StepList>
        </Section>
      </MainContent>

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
