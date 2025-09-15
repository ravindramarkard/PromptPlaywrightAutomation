import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiFolder, FiPlay, FiExternalLink } from 'react-icons/fi';
import api from '../config/axios';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #7f8c8d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f8f9fa;
    color: #495057;
  }
`;

const TestSuiteInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #7f8c8d;
  font-size: 14px;
`;

const Description = styled.p`
  margin: 8px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.4;
`;

const Form = styled.form`
  padding: 0 24px 24px 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const HelperText = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.4;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ToggleLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ToggleTitle = styled.span`
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;


const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #3498db;
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 16px 0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
`;

const WarningText = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #f39c12;
  line-height: 1.4;
`;

const EnvironmentInfo = styled.div`
  margin-top: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const EnvironmentInfoTitle = styled.div`
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 8px;
`;

const EnvironmentInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  color: #495057;
`;

const EnvironmentInfoLabel = styled.span`
  font-weight: 500;
`;

const EnvironmentInfoValue = styled.span`
  color: #7f8c8d;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: none;
  color: #3498db;
  border: 1px solid #3498db;
  
  &:hover:not(:disabled) {
    background-color: #f8f9fa;
  }
`;

const ExecuteButton = styled(Button)`
  background-color: #27ae60;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #229954;
  }
`;

const RunTestSuiteModal = ({ 
  isOpen, 
  onClose, 
  testSuite, 
  onExecute 
}) => {
  const [formData, setFormData] = useState({
    environmentOverride: '',
    browser: 'chromium',
    tagFilter: '',
    headlessMode: true,
    executionMode: 'sequential',
    workers: 1,
    parallelMode: false,
    jiraIntegration: false
  });
  const [executing, setExecuting] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);

  useEffect(() => {
    if (testSuite) {
      setFormData(prev => ({
        ...prev,
        // Reset form when test suite changes
        environmentOverride: '',
        tagFilter: ''
      }));
    }
  }, [testSuite]);

  useEffect(() => {
    if (isOpen) {
      fetchEnvironments();
    }
  }, [isOpen]);

  const fetchEnvironments = async () => {
    setLoadingEnvironments(true);
    try {
      const response = await api.get('/environments');
      if (response.data && Array.isArray(response.data)) {
        setEnvironments(response.data);
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
    } finally {
      setLoadingEnvironments(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setExecuting(true);
    
    try {
      // Get the selected environment object
      const selectedEnvironment = formData.environmentOverride 
        ? environments.find(env => env._id === formData.environmentOverride)
        : null;

      // Prepare execution configuration for the new API
      const executionConfig = {
        testSuiteId: testSuite.id,
        executionMode: formData.executionMode,
        workers: formData.executionMode === 'parallel' ? formData.workers : 1,
        useGlobalLogin: false, // Disable global login for now
        environment: formData.environmentOverride ? 'custom' : 'test',
        environmentConfig: selectedEnvironment, // Pass full environment object with variables
        browser: formData.browser,
        headless: formData.headlessMode,
        tags: formData.tagFilter ? [formData.tagFilter] : [],
        parallel: formData.parallelMode
      };

      console.log('🚀 Executing test suite with config:', executionConfig);

      // Start execution and get execution ID from backend
      const response = await api.post('/test-execution/run-suite', executionConfig);
      
      if (response.data.success) {
        console.log('✅ Test suite execution started:', response.data);
        
        // Call onExecute with the actual execution ID from backend
        onExecute({
          ...executionConfig,
          executionId: response.data.executionId,
          testSuite: response.data.testSuite || testSuite,
          config: response.data.config || executionConfig,
          reports: response.data.reports
        });
      } else {
        throw new Error(response.data.message || 'Failed to start test suite execution');
      }
    } catch (error) {
      console.error('❌ Error executing test suite:', error);
      alert(`Failed to start test suite execution: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'environmentOverride' && value) {
      // When environment is selected, update browser and headless mode from environment settings
      const selectedEnv = environments.find(env => env._id === value);
      if (selectedEnv && selectedEnv.variables) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          browser: selectedEnv.variables.BROWSER || prev.browser,
          headlessMode: selectedEnv.variables.HEADLESS === true || selectedEnv.variables.HEADLESS === 'true'
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen || !testSuite) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <ModalTitle>Run Test Suite</ModalTitle>
            <TestSuiteInfo>
              <FiFolder />
              {testSuite.name}
            </TestSuiteInfo>
            <Description>
              Override environment and execution settings for this run
            </Description>
          </div>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="environmentOverride">Environment Override</Label>
            <Select
              id="environmentOverride"
              name="environmentOverride"
              value={formData.environmentOverride}
              onChange={handleInputChange}
              disabled={loadingEnvironments}
            >
              <option value="">Environment Override</option>
              {environments.map((env) => (
                <option key={env._id} value={env._id}>
                  {env.name}
                </option>
              ))}
            </Select>
            <HelperText>
              {loadingEnvironments 
                ? 'Loading environments...' 
                : 'Will use suite\'s configured environment.'
              }
            </HelperText>
            {formData.environmentOverride && (
              <EnvironmentInfo>
                <EnvironmentInfoTitle>Selected Environment Details</EnvironmentInfoTitle>
                {(() => {
                  const selectedEnv = environments.find(env => env._id === formData.environmentOverride);
                  if (!selectedEnv) return null;
                  
                  return (
                    <>
                      <EnvironmentInfoItem>
                        <EnvironmentInfoLabel>Name:</EnvironmentInfoLabel>
                        <EnvironmentInfoValue>{selectedEnv.name}</EnvironmentInfoValue>
                      </EnvironmentInfoItem>
                      <EnvironmentInfoItem>
                        <EnvironmentInfoLabel>Description:</EnvironmentInfoLabel>
                        <EnvironmentInfoValue>{selectedEnv.description || 'No description'}</EnvironmentInfoValue>
                      </EnvironmentInfoItem>
                      <EnvironmentInfoItem>
                        <EnvironmentInfoLabel>Base URL:</EnvironmentInfoLabel>
                        <EnvironmentInfoValue>{selectedEnv.variables?.BASE_URL || 'Not set'}</EnvironmentInfoValue>
                      </EnvironmentInfoItem>
                      <EnvironmentInfoItem>
                        <EnvironmentInfoLabel>Browser:</EnvironmentInfoLabel>
                        <EnvironmentInfoValue>{selectedEnv.variables?.BROWSER || 'Not set'}</EnvironmentInfoValue>
                      </EnvironmentInfoItem>
                      <EnvironmentInfoItem>
                        <EnvironmentInfoLabel>Headless:</EnvironmentInfoLabel>
                        <EnvironmentInfoValue>{selectedEnv.variables?.HEADLESS ? 'Yes' : 'No'}</EnvironmentInfoValue>
                      </EnvironmentInfoItem>
                    </>
                  );
                })()}
              </EnvironmentInfo>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="browser">Browser</Label>
            <Select
              id="browser"
              name="browser"
              value={formData.browser}
              onChange={handleInputChange}
            >
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit</option>
              <option value="edge">Microsoft Edge</option>
            </Select>
            <HelperText>
              {formData.environmentOverride 
                ? 'Browser will be overridden by selected environment settings'
                : 'Select browser for test execution'
              }
            </HelperText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="executionMode">Execution Mode</Label>
            <Select
              id="executionMode"
              name="executionMode"
              value={formData.executionMode}
              onChange={handleInputChange}
            >
              <option value="sequential">Sequential Execution</option>
              <option value="parallel">Parallel Execution</option>
            </Select>
            <HelperText>
              Sequential: Run tests one after another. Parallel: Run tests simultaneously with multiple workers.
            </HelperText>
          </FormGroup>

          {formData.executionMode === 'parallel' && (
            <FormGroup>
              <Label htmlFor="workers">Number of Workers</Label>
              <Select
                id="workers"
                name="workers"
                value={formData.workers}
                onChange={handleInputChange}
              >
                <option value={1}>1 Worker</option>
                <option value={2}>2 Workers</option>
                <option value={4}>4 Workers</option>
                <option value={6}>6 Workers</option>
                <option value={8}>8 Workers</option>
              </Select>
              <HelperText>
                More workers = faster execution but higher resource usage.
              </HelperText>
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="tagFilter">Filter by Tags (optional)</Label>
            <Select
              id="tagFilter"
              name="tagFilter"
              value={formData.tagFilter}
              onChange={handleInputChange}
            >
              <option value="">Filter by Tags (optional)</option>
              <option value="smoke">Smoke Tests</option>
              <option value="regression">Regression Tests</option>
              <option value="critical">Critical Tests</option>
              <option value="ui">UI Tests</option>
              <option value="api">API Tests</option>
            </Select>
            <HelperText>
              Will run all tests in the suite (no tag filter).
            </HelperText>
          </FormGroup>

          <ToggleContainer>
            <ToggleLabel>
              <ToggleTitle>Run in Headless Mode</ToggleTitle>
            </ToggleLabel>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                name="headlessMode"
                checked={formData.headlessMode}
                onChange={handleInputChange}
              />
              <ToggleSlider />
            </ToggleSwitch>
          </ToggleContainer>

          <ToggleContainer>
            <ToggleLabel>
              <ToggleTitle>Run in Parallel</ToggleTitle>
            </ToggleLabel>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                name="parallelMode"
                checked={formData.parallelMode}
                onChange={handleInputChange}
              />
              <ToggleSlider />
            </ToggleSwitch>
          </ToggleContainer>

          <SectionHeader>
            <FiExternalLink />
            Jira Integration
          </SectionHeader>

          <ToggleContainer>
            <ToggleLabel>
              <ToggleTitle>Log failures to Jira (Not configured)</ToggleTitle>
            </ToggleLabel>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                name="jiraIntegration"
                checked={formData.jiraIntegration}
                onChange={handleInputChange}
                disabled
              />
              <ToggleSlider />
            </ToggleSwitch>
          </ToggleContainer>
          <WarningText>
            Configure Jira integration in Environment settings to enable this feature.
          </WarningText>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              CANCEL
            </CancelButton>
            <ExecuteButton type="submit" disabled={executing}>
              <FiPlay />
              {executing ? 'EXECUTING...' : 'EXECUTE SUITE'}
            </ExecuteButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default RunTestSuiteModal;
