import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiPlay, FiGlobe, FiCode, FiRefreshCw } from 'react-icons/fi';
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
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
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
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;


const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #3b82f6;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #2563eb;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  
  &:hover:not(:disabled) {
    background-color: #e5e7eb;
  }
`;

const InfoBox = styled.div`
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const InfoText = styled.p`
  color: #0369a1;
  font-size: 14px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ContinueExecutionModal = ({ isOpen, onClose, prompt, onExecute }) => {
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchEnvironments();
    }
  }, [isOpen]);

  const fetchEnvironments = async () => {
    try {
      const response = await api.get('/environments');
      setEnvironments(response.data);
      if (response.data.length > 0) {
        setSelectedEnvironment(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast.error('Failed to fetch environments');
    }
  };

  const handleAnalyzeDOM = async () => {
    if (!prompt?.baseUrl) {
      toast.error('No base URL found in prompt');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.post('/dom-analyzer/analyze', {
        url: prompt.baseUrl,
        steps: prompt.parsedSteps || []
      });
      
      setAnalysisResult(response.data);
      toast.success('DOM analysis completed successfully');
    } catch (error) {
      console.error('Error analyzing DOM:', error);
      toast.error('Failed to analyze DOM');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedEnvironment) {
      toast.error('Please select an environment');
      return;
    }

    const environment = environments.find(env => env._id === selectedEnvironment);
    if (!environment) {
      toast.error('Selected environment not found');
      return;
    }

    setIsLoading(true);
    try {
      await onExecute(prompt._id, {
        environment,
        useExistingSession: true,
        analysisResult
      });
      onClose();
    } catch (error) {
      console.error('Error executing continue execution:', error);
      toast.error('Failed to execute continue execution');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !prompt) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiRefreshCw />
            Continue Execution
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX size={20} />
          </CloseButton>
        </ModalHeader>

        <InfoBox>
          <InfoText>
            <FiGlobe />
            This will continue execution using the existing session and perform DOM analysis for enhanced test generation.
          </InfoText>
        </InfoBox>

        <FormGroup>
          <Label>Prompt Details</Label>
          <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>
            <strong>Title:</strong> {prompt.title}<br/>
            <strong>Base URL:</strong> {prompt.baseUrl || 'Not specified'}<br/>
            <strong>Test Type:</strong> {prompt.testType || 'UI Test'}
          </div>
        </FormGroup>

        <FormGroup>
          <Label>Environment Configuration *</Label>
          <Select
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
          >
            <option value="">Select an environment</option>
            {environments.map((env) => (
              <option key={env._id} value={env._id}>
                {env.name} - {env.llmConfiguration?.model || 'No LLM configured'}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>DOM Analysis</Label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button
              onClick={handleAnalyzeDOM}
              disabled={isAnalyzing || !prompt.baseUrl}
              style={{ 
                backgroundColor: '#10b981', 
                color: 'white', 
                border: 'none',
                padding: '8px 16px'
              }}
            >
              {isAnalyzing ? <LoadingSpinner /> : <FiCode />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze DOM'}
            </Button>
            {analysisResult && (
              <span style={{ color: '#10b981', fontSize: '14px' }}>
                ✓ Analysis completed
              </span>
            )}
          </div>
          {!prompt.baseUrl && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              No base URL available for DOM analysis
            </div>
          )}
        </FormGroup>

        <ButtonGroup>
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleExecute}
            disabled={isLoading || !selectedEnvironment}
          >
            {isLoading ? <LoadingSpinner /> : <FiPlay />}
            {isLoading ? 'Executing...' : 'Continue Execution'}
          </PrimaryButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ContinueExecutionModal;
