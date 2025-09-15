import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiSettings, FiGlobe, FiMonitor, FiCheckCircle, FiZap } from 'react-icons/fi';
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

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const ToggleLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${props => props.active ? '#3b82f6' : '#d1d5db'};
  border-radius: 12px;
  transition: background-color 0.2s;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.active ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: left 0.2s;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 24px 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  &:first-child {
    margin-top: 0;
  }
`;

const VariablesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;

  &.secondary {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background-color: #e5e7eb;
    }
  }

  &.primary {
    background-color: #3b82f6;
    color: white;

    &:hover {
      background-color: #2563eb;
    }

    &:disabled {
      background-color: #d1d5db;
      cursor: not-allowed;
    }
  }
`;

const EditEnvironmentModal = ({ isOpen, onClose, environment, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    status: 'active',
    variables: {
      BASE_URL: '',
      BROWSER: 'chromium',
      TIMEOUT: 30000,
      HEADLESS: true
    },
    jiraIntegration: {
      enabled: false,
      url: '',
      username: '',
      apiToken: ''
    },
    llmConfiguration: {
      enabled: false,
      provider: 'openai',
      llmProvider: '', // For local models (e.g., "Ollama", "LM Studio")
      apiKey: '',
      model: 'gpt-3.5-turbo',
      baseUrl: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [testingLLM, setTestingLLM] = useState(false);

  useEffect(() => {
    if (isOpen && environment) {
      setFormData({
        name: environment.name || '',
        key: environment.key || '',
        description: environment.description || '',
        status: environment.status || 'active',
        variables: {
          BASE_URL: environment.variables?.BASE_URL || '',
          API_URL: environment.variables?.API_URL || '',
          USERNAME: environment.variables?.USERNAME || '',
          PASSWORD: environment.variables?.PASSWORD || '',
          TIMEOUT: environment.variables?.TIMEOUT || 30000,
          BROWSER: environment.variables?.BROWSER || 'chromium',
          HEADLESS: Boolean(environment.variables?.HEADLESS),
          RETRIES: environment.variables?.RETRIES || 2
        },
        jiraIntegration: {
          enabled: environment.jiraIntegration?.enabled || false,
          url: environment.jiraIntegration?.url || '',
          username: environment.jiraIntegration?.username || '',
          apiToken: environment.jiraIntegration?.apiToken || ''
        },
        llmConfiguration: {
          enabled: environment.llmConfiguration?.enabled || false,
          provider: environment.llmConfiguration?.provider || 'openai',
          llmProvider: environment.llmConfiguration?.llmProvider || '',
          apiKey: environment.llmConfiguration?.apiKey || '',
          model: environment.llmConfiguration?.model || 'gpt-3.5-turbo',
          baseUrl: environment.llmConfiguration?.baseUrl || ''
        }
      });
    }
  }, [isOpen, environment]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!environment) return;

    setLoading(true);
    try {
      await onUpdate(environment._id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating environment:', error);
      toast.error('Failed to update environment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !environment) return null;

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiSettings />
            Edit Environment
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX size={20} />
          </CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <SectionTitle>
              <FiGlobe />
              Basic Information
            </SectionTitle>

            <FormGroup>
              <Label>Environment Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Development, Staging, Production"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Environment Key</Label>
              <Input
                type="text"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value)}
                placeholder="e.g., dev, staging, prod"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe this environment..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormGroup>

            <SectionTitle>
              <FiMonitor />
              Test Variables
            </SectionTitle>

            <VariablesGrid>
              <FormGroup>
                <Label>Base URL</Label>
                <Input
                  type="url"
                  value={formData.variables.BASE_URL}
                  onChange={(e) => handleInputChange('variables.BASE_URL', e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>API URL</Label>
                <Input
                  type="url"
                  value={formData.variables.API_URL}
                  onChange={(e) => handleInputChange('variables.API_URL', e.target.value)}
                  placeholder="https://api.example.com"
                />
              </FormGroup>

              <FormGroup>
                <Label>Username</Label>
                <Input
                  type="text"
                  value={formData.variables.USERNAME}
                  onChange={(e) => handleInputChange('variables.USERNAME', e.target.value)}
                  placeholder="testuser"
                />
              </FormGroup>

              <FormGroup>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.variables.PASSWORD}
                  onChange={(e) => handleInputChange('variables.PASSWORD', e.target.value)}
                  placeholder="password"
                />
              </FormGroup>

              <FormGroup>
                <Label>Browser</Label>
                <Select
                  value={formData.variables.BROWSER}
                  onChange={(e) => handleInputChange('variables.BROWSER', e.target.value)}
                >
                  <option value="chromium">Chromium</option>
                  <option value="firefox">Firefox</option>
                  <option value="webkit">WebKit (Safari)</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Timeout (ms)</Label>
                <Input
                  type="number"
                  value={formData.variables.TIMEOUT}
                  onChange={(e) => handleInputChange('variables.TIMEOUT', parseInt(e.target.value))}
                  min="1000"
                  max="300000"
                />
              </FormGroup>

              <FormGroup>
                <Label>Retries</Label>
                <Input
                  type="number"
                  value={formData.variables.RETRIES}
                  onChange={(e) => handleInputChange('variables.RETRIES', parseInt(e.target.value))}
                  min="0"
                  max="10"
                />
              </FormGroup>

              <FormGroup>
                <ToggleContainer>
                  <ToggleLabel>Headless Mode</ToggleLabel>
                  <ToggleSwitch
                    active={formData.variables.HEADLESS}
                    onClick={() => handleInputChange('variables.HEADLESS', !formData.variables.HEADLESS)}
                  />
                </ToggleContainer>
              </FormGroup>
            </VariablesGrid>

            <SectionTitle>
              <FiSettings />
              Jira Integration
            </SectionTitle>

            <ToggleContainer style={{ marginBottom: '16px' }}>
              <ToggleLabel>Enable Jira Integration</ToggleLabel>
              <ToggleSwitch
                active={formData.jiraIntegration.enabled}
                onClick={() => handleInputChange('jiraIntegration.enabled', !formData.jiraIntegration.enabled)}
              />
            </ToggleContainer>

            {formData.jiraIntegration.enabled && (
              <>
                <FormGroup>
                  <Label>Jira URL</Label>
                  <Input
                    type="url"
                    value={formData.jiraIntegration.url}
                    onChange={(e) => handleInputChange('jiraIntegration.url', e.target.value)}
                    placeholder="https://yourcompany.atlassian.net"
                  />
                </FormGroup>

                <VariablesGrid>
                  <FormGroup>
                    <Label>Username</Label>
                    <Input
                      type="text"
                      value={formData.jiraIntegration.username}
                      onChange={(e) => handleInputChange('jiraIntegration.username', e.target.value)}
                      placeholder="your-email@company.com"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>API Token</Label>
                    <Input
                      type="password"
                      value={formData.jiraIntegration.apiToken}
                      onChange={(e) => handleInputChange('jiraIntegration.apiToken', e.target.value)}
                      placeholder="Your Jira API token"
                    />
                  </FormGroup>
                </VariablesGrid>
              </>
            )}

            <SectionTitle>
              <FiSettings />
              LLM Configuration
            </SectionTitle>

            <ToggleContainer style={{ marginBottom: '16px' }}>
              <ToggleLabel>Enable LLM Integration</ToggleLabel>
              <ToggleSwitch
                active={formData.llmConfiguration.enabled}
                onClick={() => handleInputChange('llmConfiguration.enabled', !formData.llmConfiguration.enabled)}
              />
            </ToggleContainer>

            {formData.llmConfiguration.enabled && (
              <>
                <VariablesGrid>
                  <FormGroup>
                    <Label>Provider</Label>
                    <Select
                      value={formData.llmConfiguration.provider}
                      onChange={(e) => handleInputChange('llmConfiguration.provider', e.target.value)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="claude">Claude</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="local">Local Model</option>
                    </Select>
                  </FormGroup>

                  {formData.llmConfiguration.provider === 'local' && (
                    <FormGroup>
                      <Label>LLM Provider</Label>
                      <Input
                        type="text"
                        value={formData.llmConfiguration.llmProvider}
                        onChange={(e) => handleInputChange('llmConfiguration.llmProvider', e.target.value)}
                        placeholder="e.g., Ollama, LM Studio, vLLM"
                      />
                    </FormGroup>
                  )}

                  <FormGroup>
                    <Label>Model</Label>
                    <Input
                      type="text"
                      value={formData.llmConfiguration.model}
                      onChange={(e) => handleInputChange('llmConfiguration.model', e.target.value)}
                      placeholder={formData.llmConfiguration.provider === 'openrouter' ? 'deepseek/deepseek-chat-v3.1:free, meta-llama/llama-3.1-8b-instruct:free, etc.' : 'gpt-3.5-turbo'}
                    />
                  </FormGroup>
                </VariablesGrid>

                <FormGroup>
                  <Label>
                    API Key
                    {formData.llmConfiguration.provider === 'local' && (
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '5px' }}>
                        (Optional for local models)
                      </span>
                    )}
                  </Label>
                  <Input
                    type="password"
                    value={formData.llmConfiguration.apiKey}
                    onChange={(e) => handleInputChange('llmConfiguration.apiKey', e.target.value)}
                    placeholder={formData.llmConfiguration.provider === 'local' ? 'API key (optional)' : 'Your API key'}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Base URL</Label>
                  <Input
                    type="url"
                    value={formData.llmConfiguration.baseUrl}
                    onChange={(e) => handleInputChange('llmConfiguration.baseUrl', e.target.value)}
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
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button type="button" className="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Environment'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default EditEnvironmentModal;
