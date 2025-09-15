import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiClock, FiExternalLink, FiX, FiRefreshCw } from 'react-icons/fi';

const StatusCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  gap: 8px;
`;

const StatusBadge = styled.div`
  background: ${props => {
    switch(props.status) {
      case 'starting': return '#3498db';
      case 'running': return '#f39c12';
      case 'completed': return '#27ae60';
      case 'failed': return '#e74c3c';
      case 'timeout': return '#e67e22';
      case 'pending': return '#95a5a6';
      default: return '#95a5a6';
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch(props.variant) {
      case 'primary':
        return `
          background: #3498db;
          color: white;
          &:hover {
            background: #2980b9;
          }
        `;
      case 'secondary':
        return `
          background: #ecf0f1;
          color: #2c3e50;
          &:hover {
            background: #d5dbdb;
          }
        `;
      case 'close':
        return `
          background: #e74c3c;
          color: white;
          &:hover {
            background: #c0392b;
          }
        `;
      default:
        return `
          background: #ecf0f1;
          color: #2c3e50;
          &:hover {
            background: #d5dbdb;
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ProgressInfo = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const ProgressText = styled.div`
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const TestExecutionStatus = ({ 
  executionId, 
  onClose, 
  onViewDetails, 
  onRefresh,
  onExecutionComplete,
  isVisible = true 
}) => {
  const [status, setStatus] = useState('running');
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [totalTests, setTotalTests] = useState(0);
  const [completedTests, setCompletedTests] = useState(0);

  useEffect(() => {
    if (!executionId) return;

    console.log('🔄 TestExecutionStatus useEffect triggered for executionId:', executionId);
    let isPolling = true;
    let pollCount = 0;
    let timeoutId = null;

    // Poll for execution status
    const pollStatus = async () => {
      if (!isPolling) return; // Stop if component unmounted or execution completed
      
      try {
        const response = await fetch(`http://localhost:5051/api/test-execution/suite-status/${executionId}`);
        const data = await response.json();
        
        if (data.success) {
          const status = data.status;
          const newStatus = status.status || 'running';
          setStatus(newStatus);
          
          // Calculate progress based on results
          if (status.results) {
            const results = status.results;
            if (results.totalTests && results.completedTests !== undefined) {
              const progressPercent = (results.completedTests / results.totalTests) * 100;
              setProgress(progressPercent);
              setTotalTests(results.totalTests);
              setCompletedTests(results.completedTests);
            }
            
            // Update current test info
            if (results.currentTest) {
              setCurrentTest(results.currentTest);
            }
          }

          // Auto-close when execution completes (success or failure)
          if (newStatus === 'completed' || newStatus === 'failed') {
            console.log(`Test execution ${newStatus}. Auto-closing status in 3 seconds...`);
            isPolling = false; // Stop polling immediately
            
            // Call completion callback if provided
            if (onExecutionComplete) {
              onExecutionComplete(newStatus, status);
            }
            
            // Show completion message briefly before auto-closing
            setTimeout(() => {
              if (onClose) {
                onClose();
              }
            }, 3000); // Auto-close after 3 seconds
            return; // Exit early, don't schedule next poll
          }
        } else if (data.message === 'Test execution not found') {
          // Execution not found yet (still starting), continue polling
          console.log('⏳ Execution not found yet, continuing to poll...');
          setStatus('starting');
          setCurrentTest('Starting execution...');
        }
      } catch (error) {
        console.error('Error polling execution status:', error);
      }

      // Only continue polling if we haven't stopped and haven't reached max polls
      if (isPolling && pollCount < 200) { // Max 200 polls (up to 10 minutes) for long-running tests
        pollCount++;
        
        // Poll every 1 second for first 10 polls (10 seconds), then every 3 seconds
        const nextInterval = pollCount <= 10 ? 1000 : 3000;
        timeoutId = setTimeout(pollStatus, nextInterval);
      } else if (pollCount >= 200) {
        // Max polls reached, stop polling and show timeout message
        console.log('⚠️ Maximum polls reached, stopping polling');
        isPolling = false;
        setStatus('timeout');
        if (onExecutionComplete) {
          onExecutionComplete('timeout', { message: 'Execution timeout - maximum polling duration reached' });
        }
      }
    };

    // Initial poll
    pollStatus();

    // Cleanup function
    return () => {
      console.log('🧹 TestExecutionStatus cleanup triggered for executionId:', executionId);
      isPolling = false; // Stop polling
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [executionId, onClose, onExecutionComplete]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(executionId);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!executionId) {
    console.log('❌ TestExecutionStatus: No executionId provided');
    return null;
  }

  console.log('✅ TestExecutionStatus: Rendering with executionId:', executionId, 'status:', status);

  return (
    <StatusCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title>
          <FiClock />
          Test Execution Status
        </Title>
        <StatusBadge status={status}>
          {status.toUpperCase()}
        </StatusBadge>
      </div>

      <ButtonGroup>
        <ActionButton variant="secondary" onClick={handleViewDetails}>
          <FiExternalLink />
          View Details
        </ActionButton>
        <ActionButton variant="close" onClick={handleClose}>
          <FiX />
          Close
        </ActionButton>
        <ActionButton variant="primary" onClick={handleRefresh}>
          <FiRefreshCw />
          Refresh
        </ActionButton>
      </ButtonGroup>

      {status === 'running' && (
        <ProgressInfo>
          <ProgressText>
            {currentTest ? `Running: ${currentTest}` : 'Executing tests...'}
            {totalTests > 0 && ` (${completedTests}/${totalTests})`}
          </ProgressText>
          <ProgressBar>
            <ProgressFill percentage={progress} />
          </ProgressBar>
        </ProgressInfo>
      )}

      {status === 'completed' && (
        <ProgressInfo>
          <ProgressText style={{ color: '#27ae60' }}>
            ✅ All tests completed successfully
          </ProgressText>
          <ProgressText style={{ color: '#7f8c8d', fontSize: '12px', marginTop: '4px' }}>
            Status will close automatically in 3 seconds...
          </ProgressText>
        </ProgressInfo>
      )}

      {status === 'failed' && (
        <ProgressInfo>
          <ProgressText style={{ color: '#e74c3c' }}>
            ❌ Test execution failed
          </ProgressText>
          <ProgressText style={{ color: '#7f8c8d', fontSize: '12px', marginTop: '4px' }}>
            Status will close automatically in 3 seconds...
          </ProgressText>
        </ProgressInfo>
      )}
    </StatusCard>
  );
};

export default TestExecutionStatus;