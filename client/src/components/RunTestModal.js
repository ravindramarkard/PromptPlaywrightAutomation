import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiX, FiPlay, FiZap } from 'react-icons/fi';
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
  max-width: 500px;
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

const TestInfo = styled.div`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const TestName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;

const TestType = styled.div`
  font-size: 14px;
  color: #6b7280;
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

const ConfigurationSummary = styled.div`
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const SummaryTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #0369a1;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
  color: #0c4a6e;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SummaryLabel = styled.span`
  font-weight: 500;
`;

const SummaryValue = styled.span`
  color: #0369a1;
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
    background-color: #10b981;
    color: white;

    &:hover {
      background-color: #059669;
    }

    &:disabled {
      background-color: #d1d5db;
      cursor: not-allowed;
    }
  }
`;

const RunTestModal = ({ isOpen, onClose, test, onTestRun }) => {
  const [config, setConfig] = useState({
    environment: '',
    browser: 'chromium',
    headless: false,
    retries: 0,
    timeout: 30000
  });
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEnvironments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/environments');
      const envs = Array.isArray(response.data) ? response.data : (response.data.environments || []);
      setEnvironments(envs);
      
      // Set default environment to the first available one
      if (envs.length > 0 && config.environment === '') {
        const defaultEnv = envs[0];
        setConfig(prev => ({
          ...prev,
          environment: defaultEnv.key || defaultEnv.name
        }));
        setSelectedEnvironment(defaultEnv);
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast.error('Failed to load environments');
    } finally {
      setLoading(false);
    }
  }, [config.environment]);

  useEffect(() => {
    if (isOpen) {
      fetchEnvironments();
    }
  }, [isOpen, fetchEnvironments]);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If environment is being changed, update selectedEnvironment
    if (field === 'environment') {
      const env = environments.find(e => (e.key || e.name) === value);
      setSelectedEnvironment(env || null);
    }
  };

  const handleRunTest = async () => {
    if (!test) return;

    setLoading(true);
    try {
      // Ensure test has required properties with fallbacks
      const safeTest = {
        testId: test.id || test.testId || 'unknown',
        testName: test.name || test.testName || 'Unknown Test',
        testType: test.type || test.testType || 'Unknown'
      };

      const testConfig = {
        testId: safeTest.testId,
        promptId: test.promptId,
        environment: config.environment,
        environmentConfig: selectedEnvironment, // Pass full environment object with variables
        browser: config.browser,
        headless: config.headless,
        retries: parseInt(config.retries),
        timeout: parseInt(config.timeout)
      };

      // Call the test execution API
      const response = await api.post('/test-execution/run', testConfig);
      
      toast.success('Test execution started successfully!');
      onTestRun && onTestRun(response.data);
      onClose();
    } catch (error) {
      console.error('Error running test:', error);
      toast.error('Failed to start test execution');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !test) return null;

  // Ensure test has required properties with fallbacks
  const safeTest = {
    testId: test.id || test.testId || 'unknown',
    testName: test.name || test.testName || 'Unknown Test',
    testType: test.type || test.testType || 'Unknown'
  };

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
            <FiZap />
            Run Test Configuration
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <TestInfo>
            <TestName>{safeTest.testName} ({safeTest.testType})</TestName>
            <TestType>Test ID: {safeTest.testId}</TestType>
          </TestInfo>

          <FormGroup>
            <Label>Environment</Label>
            <Select
              value={config.environment}
              onChange={(e) => handleConfigChange('environment', e.target.value)}
              disabled={environments.length === 0}
            >
              {environments.length > 0 ? (
                environments.map(env => (
                  <option key={env._id} value={env.key || env.name}>
                    {env.name}
                  </option>
                ))
              ) : (
                <option value="">{loading ? 'Loading environments...' : 'No environments available'}</option>
              )}
            </Select>
            {environments.length === 0 && !loading && (
              <div style={{ 
                fontSize: '12px', 
                color: '#dc3545', 
                marginTop: '4px' 
              }}>
                Please create an environment first in the Environments page
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Browser</Label>
            <Select
              value={config.browser}
              onChange={(e) => handleConfigChange('browser', e.target.value)}
            >
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit (Safari)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <ToggleContainer>
              <ToggleLabel>Run in Headless Mode</ToggleLabel>
              <ToggleSwitch
                active={config.headless}
                onClick={() => handleConfigChange('headless', !config.headless)}
              />
            </ToggleContainer>
          </FormGroup>

          <FormGroup>
            <Label>Retries</Label>
            <Input
              type="number"
              min="0"
              max="5"
              value={config.retries}
              onChange={(e) => handleConfigChange('retries', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Timeout (ms)</Label>
            <Input
              type="number"
              min="1000"
              max="300000"
              value={config.timeout}
              onChange={(e) => handleConfigChange('timeout', e.target.value)}
            />
          </FormGroup>

          <ConfigurationSummary>
            <SummaryTitle>Configuration Summary</SummaryTitle>
            <SummaryItem>
              <SummaryLabel>Test:</SummaryLabel>
              <SummaryValue>{safeTest.testName.toLowerCase().replace(/\s+/g, '-')}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Type:</SummaryLabel>
              <SummaryValue>{safeTest.testType}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Environment:</SummaryLabel>
              <SummaryValue>{config.environment}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Browser:</SummaryLabel>
              <SummaryValue>{config.browser}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Headless:</SummaryLabel>
              <SummaryValue>{config.headless ? 'Yes' : 'No'}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Retries:</SummaryLabel>
              <SummaryValue>{config.retries}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Timeout:</SummaryLabel>
              <SummaryValue>{config.timeout}ms</SummaryValue>
            </SummaryItem>
          </ConfigurationSummary>
        </ModalBody>

        <ModalFooter>
          <Button className="secondary" onClick={onClose}>
            CANCEL
          </Button>
          <Button 
            className="primary" 
            onClick={handleRunTest}
            disabled={loading}
          >
            <FiPlay />
            {loading ? 'STARTING...' : 'RUN TEST'}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default RunTestModal;
