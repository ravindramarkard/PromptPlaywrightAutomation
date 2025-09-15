import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiPlus, FiMinus, FiClipboard, FiBarChart2, FiTag } from 'react-icons/fi';
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
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
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

const TestTypeSelector = styled.div`
  padding: 0 24px 20px 24px;
`;

const TestTypeLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;

const TestTypeSelect = styled.select`
  width: 200px;
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

const MainContent = styled.div`
  display: flex;
  flex: 1;
  min-height: 500px;
  padding: 0 24px 24px 24px;
  gap: 20px;
`;

const Panel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: ${props => props.color || '#f8f9fa'};
  border-radius: 8px;
  font-weight: 600;
  color: ${props => props.textColor || '#2c3e50'};
  font-size: 16px;
`;

const PanelContent = styled.div`
  flex: 1;
  border: 2px dashed ${props => props.borderColor || '#e9ecef'};
  border-radius: 8px;
  padding: 16px;
  min-height: 300px;
  background-color: ${props => props.backgroundColor || '#fafbfc'};
  overflow-y: auto;
`;

const TestCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: move;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TestTitle = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
`;

const TestIdentifier = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const TestTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const Tag = styled.span`
  background-color: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
`;

const ActionButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.color || '#3498db'};
  color: white;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #7f8c8d;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const EmptyDescription = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const SuiteSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  font-size: 14px;
  color: #495057;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background-color: #fafbfc;
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

const SaveButton = styled(Button)`
  background-color: #3498db;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #2980b9;
  }
`;

const CancelButton = styled(Button)`
  background-color: #95a5a6;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #7f8c8d;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #7f8c8d;
  font-size: 14px;
`;

const TestSelectionModal = ({ 
  isOpen, 
  onClose, 
  testSuite, 
  onSave,
  isEdit = false
}) => {
  const [testType, setTestType] = useState('UI');
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedTest, setDraggedTest] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && testSuite) {
        setTestType(testSuite.testType || 'UI');
        setSelectedTests(testSuite.testCases || []);
      } else {
        setTestType('UI');
        setSelectedTests([]);
      }
      fetchTests();
    }
  }, [isOpen, testSuite, isEdit]);

  useEffect(() => {
    if (testType) {
      fetchTests();
    }
  }, [testType]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/test-files?type=all');
      if (response.data && response.data.success) {
        const allTests = response.data.tests || [];
        const filteredTests = allTests.filter(test => {
          const testTypeLower = (test.type || '').toLowerCase();
          return testTypeLower.includes(testType.toLowerCase());
        });
        
        setAvailableTests(filteredTests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTypeChange = (e) => {
    setTestType(e.target.value);
    setSelectedTests([]);
  };

  const addTestToSuite = (test) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const removeTestFromSuite = (testId) => {
    setSelectedTests(prev => prev.filter(t => t.id !== testId));
  };

  const handleDragStart = (e, test) => {
    setDraggedTest(test);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetPanel) => {
    e.preventDefault();
    
    if (!draggedTest) return;
    
    if (targetPanel === 'selected') {
      addTestToSuite(draggedTest);
    } else if (targetPanel === 'available') {
      removeTestFromSuite(draggedTest.id);
    }
    
    setDraggedTest(null);
  };

  const handleSave = () => {
    if (selectedTests.length === 0) {
      alert('Please select at least one test for the suite');
      return;
    }

    const suiteData = {
      testType,
      selectedTestCases: selectedTests
    };

    onSave(suiteData);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {isEdit ? 'Edit Test Suite' : 'Create Test Suite'}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <TestTypeSelector>
          <TestTypeLabel>Test Type</TestTypeLabel>
          <TestTypeSelect value={testType} onChange={handleTestTypeChange}>
            <option value="UI">UI Tests</option>
            <option value="API">API Tests</option>
          </TestTypeSelect>
        </TestTypeSelector>

        <MainContent>
          <Panel>
            <PanelHeader color="#e8f4fd" textColor="#3498db">
              <FiClipboard />
              Tests in Suite ({selectedTests.length})
            </PanelHeader>
            <PanelContent
              borderColor="#3498db"
              backgroundColor="#f8f9ff"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'selected')}
            >
              {selectedTests.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>📋</EmptyIcon>
                  <EmptyText>No tests in suite</EmptyText>
                  <EmptyDescription>Drag tests here or click the + button</EmptyDescription>
                </EmptyState>
              ) : (
                selectedTests.map((test) => (
                  <TestCard
                    key={test.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, test)}
                  >
                    <TestTitle>{test.name}</TestTitle>
                    <TestIdentifier>
                      {test.type?.toLowerCase() || 'ui'} • {test.id}
                    </TestIdentifier>
                    <TestTags>
                      {test.tags && test.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </TestTags>
                    <ActionButton
                      color="#e74c3c"
                      onClick={() => removeTestFromSuite(test.id)}
                    >
                      <FiMinus />
                    </ActionButton>
                  </TestCard>
                ))
              )}
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader color="#fff5f5" textColor="#e74c3c">
              <FiPlus />
              Available Tests ({availableTests.length})
            </PanelHeader>
            <PanelContent
              borderColor="#e74c3c"
              backgroundColor="#fffbfb"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'available')}
            >
              {loading ? (
                <LoadingSpinner>Loading tests...</LoadingSpinner>
              ) : availableTests.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>🔍</EmptyIcon>
                  <EmptyText>No available tests</EmptyText>
                  <EmptyDescription>No {testType} tests found</EmptyDescription>
                </EmptyState>
              ) : (
                availableTests
                  .filter(test => !selectedTests.find(t => t.id === test.id))
                  .map((test) => (
                    <TestCard
                      key={test.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, test)}
                    >
                      <TestTitle>{test.name}</TestTitle>
                      <TestIdentifier>
                        {test.type?.toLowerCase() || 'ui'} • {test.id}
                      </TestIdentifier>
                      <TestTags>
                        {test.tags && test.tags.map((tag, index) => (
                          <Tag key={index}>{tag}</Tag>
                        ))}
                      </TestTags>
                      <ActionButton
                        color="#27ae60"
                        onClick={() => addTestToSuite(test)}
                      >
                        <FiPlus />
                      </ActionButton>
                    </TestCard>
                  ))
              )}
            </PanelContent>
          </Panel>
        </MainContent>

        <SuiteSummary>
          <FiBarChart2 />
          Suite Summary: {selectedTests.length} test(s) configured • {availableTests.filter(test => !selectedTests.find(t => t.id === test.id)).length} test(s) available to add
        </SuiteSummary>

        <ButtonGroup>
          <CancelButton onClick={onClose}>
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={selectedTests.length === 0}>
            {isEdit ? 'Update Suite' : 'Create Suite'}
          </SaveButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default TestSelectionModal;
