import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiSave, FiZap, FiCheckCircle, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #ecf0f1;
    color: #2c3e50;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
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
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #ecf0f1;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const ToggleLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.enabled ? '#3498db' : '#7f8c8d'};
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.enabled ? '#2980b9' : '#3498db'};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid #ecf0f1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button`
  padding: 10px 20px;
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

const CreateEnvironmentModal = ({ onClose, onSubmit }) => {
  const [testingLLM, setTestingLLM] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    variables: {
      BASE_URL: process.env.BASE_URL || 'http://localhost:5050',
      API_URL: '',
      USERNAME: '',
      PASSWORD: '',
      TIMEOUT: 30000,
      BROWSER: 'chromium',
      HEADLESS: true,
      RETRIES: 2
    },
    jiraIntegration: {
      enabled: false,
      url: '',
      username: '',
      password: '',
      projectKey: ''
    },
    llmConfiguration: {
      enabled: false,
      provider: 'openai',
      llmProvider: '', // For local models (e.g., "Ollama", "LM Studio")
      apiKey: '',
      model: '',
      baseUrl: ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleToggle = (section, field) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  const handleTestLLMConnection = async () => {
    if (!formData.llmConfiguration.enabled) {
      toast.warning('Please enable LLM integration first');
      return;
    }

    const { provider, llmProvider, apiKey, model, baseUrl } = formData.llmConfiguration;
    
    // For local models, check if llmProvider is provided
    if (provider === 'local' && !llmProvider) {
      toast.error('Please provide LLM Provider for local models');
      return;
    }
    
    // For non-local models, check if API key is provided
    if (provider !== 'local' && !apiKey) {
      toast.error('Please provide API key');
      return;
    }

    setTestingLLM(true);
    try {
      const response = await api.post('/environments/test-llm-connection', {
        provider: provider === 'local' ? 'local' : provider,
        llmType: provider === 'local' ? llmProvider : provider,
        apiKey: provider === 'local' ? (apiKey || '') : apiKey,
        model,
        baseUrl
      });

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error testing LLM connection:', error);
      toast.error('Failed to test LLM connection');
    } finally {
      setTestingLLM(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.key) {
      alert('Name and Key are required');
      return;
    }
    
    onSubmit(formData);
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create New Environment</ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label htmlFor="name">Environment Name *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Development, Staging, Production"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="key">Environment Key *</Label>
              <Input
                type="text"
                id="key"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                placeholder="e.g., dev, staging, prod"
                required
              />
              <small style={{ color: '#7f8c8d', fontSize: '12px' }}>
                Unique identifier (e.g., dev, staging, prod)
              </small>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe this environment"
              />
            </FormGroup>

            <SectionTitle>Environment Variables</SectionTitle>
            
            <Grid>
              <FormGroup>
                <Label htmlFor="BASE_URL">Base URL *</Label>
                <Input
                  type="url"
                  id="BASE_URL"
                  name="variables.BASE_URL"
                  value={formData.variables.BASE_URL}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="API_URL">API URL</Label>
                <Input
                  type="url"
                  id="API_URL"
                  name="variables.API_URL"
                  value={formData.variables.API_URL}
                  onChange={handleInputChange}
                  placeholder="https://api.example.com"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="USERNAME">Username</Label>
                <Input
                  type="text"
                  id="USERNAME"
                  name="variables.USERNAME"
                  value={formData.variables.USERNAME}
                  onChange={handleInputChange}
                  placeholder="testuser"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="PASSWORD">Password</Label>
                <Input
                  type="password"
                  id="PASSWORD"
                  name="variables.PASSWORD"
                  value={formData.variables.PASSWORD}
                  onChange={handleInputChange}
                  placeholder="password"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="TIMEOUT">Timeout (ms)</Label>
                <Input
                  type="number"
                  id="TIMEOUT"
                  name="variables.TIMEOUT"
                  value={formData.variables.TIMEOUT}
                  onChange={handleInputChange}
                  placeholder="30000"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="BROWSER">Browser</Label>
                <select
                  id="BROWSER"
                  name="variables.BROWSER"
                  value={formData.variables.BROWSER}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="chromium">Chromium</option>
                  <option value="firefox">Firefox</option>
                  <option value="webkit">WebKit</option>
                </select>
              </FormGroup>
            </Grid>

            <ToggleContainer>
              <ToggleLabel>Headless Mode</ToggleLabel>
              <ToggleButton
                type="button"
                enabled={formData.variables.HEADLESS}
                onClick={() => handleToggle('variables', 'HEADLESS')}
              >
                {formData.variables.HEADLESS ? <FiToggleRight /> : <FiToggleLeft />}
              </ToggleButton>
            </ToggleContainer>

            <SectionTitle>Jira Integration</SectionTitle>
            
            <ToggleContainer>
              <ToggleLabel>Enable Jira</ToggleLabel>
              <ToggleButton
                type="button"
                enabled={formData.jiraIntegration.enabled}
                onClick={() => handleToggle('jiraIntegration', 'enabled')}
              >
                {formData.jiraIntegration.enabled ? <FiToggleRight /> : <FiToggleLeft />}
              </ToggleButton>
            </ToggleContainer>

            {formData.jiraIntegration.enabled && (
              <Grid>
                <FormGroup>
                  <Label htmlFor="jiraUrl">Jira URL</Label>
                  <Input
                    type="url"
                    id="jiraUrl"
                    name="jiraIntegration.url"
                    value={formData.jiraIntegration.url}
                    onChange={handleInputChange}
                    placeholder="https://company.atlassian.net"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="jiraUsername">Username</Label>
                  <Input
                    type="text"
                    id="jiraUsername"
                    name="jiraIntegration.username"
                    value={formData.jiraIntegration.username}
                    onChange={handleInputChange}
                    placeholder="username@company.com"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="jiraPassword">Password/Token</Label>
                  <Input
                    type="password"
                    id="jiraPassword"
                    name="jiraIntegration.password"
                    value={formData.jiraIntegration.password}
                    onChange={handleInputChange}
                    placeholder="API token or password"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="jiraProjectKey">Project Key</Label>
                  <Input
                    type="text"
                    id="jiraProjectKey"
                    name="jiraIntegration.projectKey"
                    value={formData.jiraIntegration.projectKey}
                    onChange={handleInputChange}
                    placeholder="PROJ"
                  />
                </FormGroup>
              </Grid>
            )}

            <SectionTitle>LLM Configuration</SectionTitle>
            
            <ToggleContainer>
              <ToggleLabel>Enable LLM for this environment</ToggleLabel>
              <ToggleButton
                type="button"
                enabled={formData.llmConfiguration.enabled}
                onClick={() => handleToggle('llmConfiguration', 'enabled')}
              >
                {formData.llmConfiguration.enabled ? <FiToggleRight /> : <FiToggleLeft />}
              </ToggleButton>
            </ToggleContainer>

            {formData.llmConfiguration.enabled && (
              <Grid>
                <FormGroup>
                  <Label htmlFor="llmProvider">Provider</Label>
                  <select
                    id="llmProvider"
                    name="llmConfiguration.provider"
                    value={formData.llmConfiguration.provider}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="claude">Claude</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="local">Local</option>
                  </select>
                </FormGroup>

                {formData.llmConfiguration.provider === 'local' && (
                  <FormGroup>
                    <Label htmlFor="llmLlmProvider">LLM Provider</Label>
                    <Input
                      type="text"
                      id="llmLlmProvider"
                      name="llmConfiguration.llmProvider"
                      value={formData.llmConfiguration.llmProvider}
                      onChange={handleInputChange}
                      placeholder="e.g., Ollama, LM Studio, vLLM"
                    />
                  </FormGroup>
                )}
                
                <FormGroup>
                  <Label htmlFor="llmModel">Model</Label>
                  <Input
                    type="text"
                    id="llmModel"
                    name="llmConfiguration.model"
                    value={formData.llmConfiguration.model}
                    onChange={handleInputChange}
                    placeholder={formData.llmConfiguration.provider === 'openrouter' ? 'deepseek/deepseek-chat-v3.1:free, meta-llama/llama-3.1-8b-instruct:free, etc.' : 'gpt-4, claude-3, etc.'}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="llmApiKey">
                    API Key
                    {formData.llmConfiguration.provider === 'local' && (
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '5px' }}>
                        (Optional for local models)
                      </span>
                    )}
                  </Label>
                  <Input
                    type="password"
                    id="llmApiKey"
                    name="llmConfiguration.apiKey"
                    value={formData.llmConfiguration.apiKey}
                    onChange={handleInputChange}
                    placeholder={formData.llmConfiguration.provider === 'local' ? 'API key (optional)' : 'Your API key'}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="llmBaseUrl">Base URL</Label>
                  <Input
                    type="url"
                    id="llmBaseUrl"
                    name="llmConfiguration.baseUrl"
                    value={formData.llmConfiguration.baseUrl}
                    onChange={handleInputChange}
                    placeholder="https://api.openai.com/v1"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Button
                    type="button"
                    className="secondary"
                    onClick={handleTestLLMConnection}
                    disabled={testingLLM}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginTop: '8px'
                    }}
                  >
                    <FiZap />
                    {testingLLM ? 'Testing...' : 'Test LLM Connection'}
                  </Button>
                </FormGroup>
              </Grid>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="primary"
            >
              <FiSave />
              Create Environment
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateEnvironmentModal;
