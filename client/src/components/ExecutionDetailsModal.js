import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiX, FiClock, FiCheckCircle, FiXCircle, FiFileText, FiDownload } from 'react-icons/fi';

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
  max-width: 800px;
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
  cursor: pointer;
  color: #7f8c8d;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
    color: #2c3e50;
  }
`;

const Content = styled.div`
  padding: 0 24px 24px 24px;
`;

const StatusCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatusLabel = styled.span`
  font-weight: 500;
  color: #2c3e50;
`;

const StatusValue = styled.span`
  color: #7f8c8d;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch(props.status) {
      case 'running': return 'background: #f39c12; color: white;';
      case 'completed': return 'background: #27ae60; color: white;';
      case 'failed': return 'background: #e74c3c; color: white;';
      case 'not_found': return 'background: #95a5a6; color: white;';
      default: return 'background: #95a5a6; color: white;';
    }
  }}
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TestList = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
`;

const TestItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TestStatus = styled.span`
  ${props => {
    switch(props.status) {
      case 'passed': return 'color: #27ae60;';
      case 'failed': return 'color: #e74c3c;';
      case 'running': return 'color: #f39c12;';
      default: return 'color: #7f8c8d;';
    }
  }}
`;

const ReportLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2980b9;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #f5c6cb;
`;

const ExecutionDetailsModal = ({ isOpen, onClose, executionId }) => {
  const [executionDetails, setExecutionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExecutionDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5051/api/test-execution/suite-status/${executionId}`);
      const data = await response.json();
      
      if (data.success) {
        setExecutionDetails(data.status);
      } else {
        setError(data.message || 'Failed to fetch execution details');
      }
    } catch (err) {
      setError('Failed to fetch execution details: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    if (isOpen && executionId) {
      fetchExecutionDetails();
    }
  }, [isOpen, executionId, fetchExecutionDetails]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getTestStatusIcon = (status) => {
    switch(status) {
      case 'passed': return <FiCheckCircle />;
      case 'failed': return <FiXCircle />;
      case 'running': return <FiClock />;
      default: return <FiClock />;
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiFileText />
            Execution Details
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <Content>
          {loading && (
            <LoadingMessage>
              <FiClock />
              Loading execution details...
            </LoadingMessage>
          )}

          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}

          {executionDetails && !loading && (
            <>
              <StatusCard>
                <StatusRow>
                  <StatusLabel>Execution ID:</StatusLabel>
                  <StatusValue>{executionId}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Status:</StatusLabel>
                  <StatusBadge status={executionDetails.status}>
                    {executionDetails.status?.toUpperCase() || 'UNKNOWN'}
                  </StatusBadge>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Test Suite:</StatusLabel>
                  <StatusValue>{executionDetails.testSuite || 'N/A'}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Started At:</StatusLabel>
                  <StatusValue>{formatDate(executionDetails.startedAt)}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Completed At:</StatusLabel>
                  <StatusValue>{formatDate(executionDetails.completedAt)}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Total Tests:</StatusLabel>
                  <StatusValue>{executionDetails.totalTests || 0}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Completed Tests:</StatusLabel>
                  <StatusValue>{executionDetails.completedTests || 0}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Current Test:</StatusLabel>
                  <StatusValue>{executionDetails.currentTest || 'N/A'}</StatusValue>
                </StatusRow>
              </StatusCard>

              {executionDetails.results && (
                <Section>
                  <SectionTitle>
                    <FiFileText />
                    Test Results
                  </SectionTitle>
                  <TestList>
                    {executionDetails.results.tests?.map((test, index) => (
                      <TestItem key={index}>
                        <TestStatus status={test.status}>
                          {getTestStatusIcon(test.status)}
                        </TestStatus>
                        <span>{test.title || `Test ${index + 1}`}</span>
                        <span style={{ marginLeft: 'auto', color: '#7f8c8d' }}>
                          {test.duration ? `${test.duration}ms` : ''}
                        </span>
                      </TestItem>
                    )) || (
                      <div style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                        No test results available yet
                      </div>
                    )}
                  </TestList>
                </Section>
              )}

              {executionDetails.reports && (
                <Section>
                  <SectionTitle>
                    <FiDownload />
                    Reports
                  </SectionTitle>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {executionDetails.reports.html && (
                      <ReportLink href={executionDetails.reports.html} target="_blank">
                        <FiFileText />
                        HTML Report
                      </ReportLink>
                    )}
                    {executionDetails.reports.json && (
                      <ReportLink href={executionDetails.reports.json} target="_blank">
                        <FiFileText />
                        JSON Report
                      </ReportLink>
                    )}
                    {executionDetails.reports.allure && (
                      <ReportLink href={executionDetails.reports.allure} target="_blank">
                        <FiFileText />
                        Allure Report
                      </ReportLink>
                    )}
                  </div>
                </Section>
              )}

              {executionDetails.error && (
                <Section>
                  <SectionTitle>
                    <FiXCircle />
                    Error Details
                  </SectionTitle>
                  <ErrorMessage>
                    {executionDetails.error}
                  </ErrorMessage>
                </Section>
              )}
            </>
          )}
        </Content>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ExecutionDetailsModal;
