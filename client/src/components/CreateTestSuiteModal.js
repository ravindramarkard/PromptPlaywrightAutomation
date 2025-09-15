import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiX, FiSave, FiClipboard, FiBarChart2 } from 'react-icons/fi';
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
  overflow-y: auto;
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

const Form = styled.form`
  padding: 0 24px 24px 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const TestTypeSelector = styled.div`
  margin-bottom: 24px;
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
  min-height: 400px;
  gap: 20px;
  margin-bottom: 20px;
`;

const Panel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
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
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0;
  min-height: 250px;
  background-color: white;
  overflow-y: auto;
`;

const TestList = styled.div`
  padding: 8px 0;
`;

const TestItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f1f3f4;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.selected && `
    background-color: #e3f2fd;
    border-left: 3px solid #2196f3;
  `}
`;

const Checkbox = styled.input`
  margin-right: 12px;
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const TestInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const TestTitle = styled.div`
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 4px;
  line-height: 1.4;
`;

const TestIdentifier = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const TestTags = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const Tag = styled.span`
  background-color: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
`;

const ButtonPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
  justify-content: center;
  min-width: 60px;
`;

const ArrowButton = styled.button`
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #666;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
    border-color: #2196f3;
    color: #2196f3;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  ${props => props.primary && `
    background-color: #2196f3;
    border-color: #2196f3;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #1976d2;
    }
  `}
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
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
  margin: 0 -24px -24px -24px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: #7f8c8d;
  font-size: 14px;
`;


const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
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

const CreateTestSuiteModal = ({ 
  isOpen, 
  onClose, 
  onCreateTestSuite 
}) => {
  const [formData, setFormData] = useState({
    suiteName: '',
    description: '',
    testType: 'UI'
  });
  const [saving, setSaving] = useState(false);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [allTests, setAllTests] = useState([]); // Store all tests for refiltering
  const [loading, setLoading] = useState(false);
  const [selectedAvailableTests, setSelectedAvailableTests] = useState([]);
  const [selectedSuiteTests, setSelectedSuiteTests] = useState([]);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/test-files?type=all');
      if (response.data && response.data.success) {
        const allTestsData = response.data.tests || [];
        const filteredTests = allTestsData.filter(test => {
          const testTypeLower = (test.type || '').toLowerCase();
          const formTestTypeLower = (formData.testType || '').toLowerCase();
          
          // Handle different test type formats
          if (formTestTypeLower.includes('ui')) {
            return testTypeLower === 'ui';
          } else if (formTestTypeLower.includes('api')) {
            return testTypeLower === 'api';
          } else {
            // Fallback to original logic
            return testTypeLower.includes(formTestTypeLower);
          }
        });
        
        // Store all filtered tests for refiltering
        setAllTests(filteredTests);
        
        // The refilterAvailableTests will be called automatically via useEffect
        // after allTests is updated
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  }, [formData.testType]);

  const refilterAvailableTests = useCallback(() => {
    if (allTests.length === 0) {
      console.log('Refiltering skipped - allTests is empty');
      return;
    }
    
    const availableTests = allTests.filter(test => 
      !selectedTests.find(selectedTest => selectedTest.id === test.id)
    );
    
    console.log('Refiltering - All tests:', allTests.length);
    console.log('Refiltering - Selected tests:', selectedTests.length);
    console.log('Refiltering - Available tests:', availableTests.length);
    console.log('Selected test IDs:', selectedTests.map(t => t.id));
    console.log('Available test IDs:', availableTests.map(t => t.id));
    
    setAvailableTests(availableTests);
  }, [allTests, selectedTests]);

  useEffect(() => {
    if (isOpen) {
      setFormData({ suiteName: '', description: '', testType: 'UI' });
      setSelectedTests([]);
      // Clear allTests and availableTests to ensure fresh data
      setAllTests([]);
      setAvailableTests([]);
      setSelectedAvailableTests([]);
      setSelectedSuiteTests([]);
      fetchTests();
    }
  }, [isOpen, fetchTests]);

  useEffect(() => {
    if (formData.testType) {
      fetchTests();
    }
  }, [formData.testType, fetchTests]);

  // Separate useEffect to refilter when selectedTests changes
  useEffect(() => {
    if (isOpen && allTests.length > 0) {
      refilterAvailableTests();
    }
  }, [selectedTests, isOpen, allTests, refilterAvailableTests]);

  const handleTestTypeChange = (e) => {
    setFormData(prev => ({ ...prev, testType: e.target.value }));
    setSelectedTests([]);
  };

  const toggleTestSelection = (test) => {
    setSelectedAvailableTests(prev => {
      if (prev.includes(test.id)) {
        return prev.filter(id => id !== test.id);
      } else {
        return [...prev, test.id];
      }
    });
  };

  const toggleSuiteTestSelection = (testId) => {
    setSelectedSuiteTests(prev => {
      if (prev.includes(testId)) {
        return prev.filter(id => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  const moveAllToSuite = () => {
    const testsToAdd = availableTests.filter(test => 
      !selectedTests.find(t => t.id === test.id)
    );
    setSelectedTests(prev => [...prev, ...testsToAdd]);
    setSelectedAvailableTests([]);
  };

  const moveSelectedToSuite = () => {
    const testsToAdd = availableTests.filter(test => 
      selectedAvailableTests.includes(test.id) && 
      !selectedTests.find(t => t.id === test.id)
    );
    setSelectedTests(prev => [...prev, ...testsToAdd]);
    setSelectedAvailableTests([]);
  };

  const moveSelectedFromSuite = () => {
    setSelectedTests(prev => prev.filter(test => 
      !selectedSuiteTests.includes(test.id)
    ));
    setSelectedSuiteTests([]);
  };

  const moveAllFromSuite = () => {
    setSelectedTests([]);
    setSelectedSuiteTests([]);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.suiteName.trim()) {
      alert('Please enter a test suite name');
      return;
    }

    if (selectedTests.length === 0) {
      alert('Please select at least one test for the suite');
      return;
    }

    setSaving(true);
    
    try {
      const suiteData = {
        suiteName: formData.suiteName,
        description: formData.description,
        testType: formData.testType,
        selectedTestCases: selectedTests
      };
      
      await onCreateTestSuite(suiteData);
      
      // Close modal after successful creation
      onClose();
      
    } catch (error) {
      console.error('Error creating test suite:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create Test Suite</ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <FormGroup>
              <Label htmlFor="suiteName">Test Suite Name *</Label>
              <Input
                type="text"
                id="suiteName"
                name="suiteName"
                value={formData.suiteName}
                onChange={handleInputChange}
                placeholder="Enter test suite name"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter test suite description"
              />
            </FormGroup>

            <TestTypeSelector>
              <TestTypeLabel>Test Type</TestTypeLabel>
              <TestTypeSelect value={formData.testType} onChange={handleTestTypeChange}>
                <option value="UI">UI Tests</option>
                <option value="API">API Tests</option>
              </TestTypeSelect>
            </TestTypeSelector>
          </FormSection>

          <MainContent>
            <Panel>
              <PanelHeader color="#e8f4fd" textColor="#3498db">
                <FiClipboard />
                Tests in Suite ({selectedTests.length})
              </PanelHeader>
              <PanelContent>
                {selectedTests.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon>📋</EmptyIcon>
                    <EmptyText>No tests in suite</EmptyText>
                    <EmptyDescription>Select tests from the right panel</EmptyDescription>
                  </EmptyState>
                ) : (
                  <TestList>
                    {selectedTests.map((test) => (
                      <TestItem
                        key={test.id}
                        selected={selectedSuiteTests.includes(test.id)}
                        onClick={() => toggleSuiteTestSelection(test.id)}
                      >
                        <Checkbox
                          type="checkbox"
                          checked={selectedSuiteTests.includes(test.id)}
                          onChange={() => toggleSuiteTestSelection(test.id)}
                        />
                        <TestInfo>
                          <TestTitle>{test.name}</TestTitle>
                          <TestIdentifier>
                            {test.type?.toLowerCase() || 'ui'} • {test.id}
                          </TestIdentifier>
                          {test.tags && test.tags.length > 0 && (
                            <TestTags>
                              {test.tags.map((tag, index) => (
                                <Tag key={index}>{tag}</Tag>
                              ))}
                            </TestTags>
                          )}
                        </TestInfo>
                      </TestItem>
                    ))}
                  </TestList>
                )}
              </PanelContent>
            </Panel>

            <ButtonPanel>
              <ArrowButton
                onClick={moveAllFromSuite}
                disabled={selectedTests.length === 0}
                title="Move all from suite"
              >
                ≪
              </ArrowButton>
              <ArrowButton
                onClick={moveSelectedFromSuite}
                disabled={selectedSuiteTests.length === 0}
                title="Move selected from suite"
              >
                &lt;
              </ArrowButton>
              <ArrowButton
                onClick={moveSelectedToSuite}
                disabled={selectedAvailableTests.length === 0}
                title="Move selected to suite"
              >
                &gt;
              </ArrowButton>
              <ArrowButton
                onClick={moveAllToSuite}
                disabled={availableTests.length === 0}
                title="Move all to suite"
              >
                ≫
              </ArrowButton>
            </ButtonPanel>

            <Panel>
              <PanelHeader color="#f8f9fa" textColor="#2c3e50">
                <FiClipboard />
                Available Tests ({availableTests.length})
              </PanelHeader>
              <PanelContent>
                {loading ? (
                  <LoadingSpinner>Loading tests...</LoadingSpinner>
                ) : availableTests.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon>🔍</EmptyIcon>
                    <EmptyText>No available tests</EmptyText>
                    <EmptyDescription>No {formData.testType} tests found</EmptyDescription>
                  </EmptyState>
                ) : (
                  <TestList>
                    {availableTests.map((test) => (
                      <TestItem
                        key={test.id}
                        selected={selectedAvailableTests.includes(test.id)}
                        onClick={() => toggleTestSelection(test)}
                      >
                        <Checkbox
                          type="checkbox"
                          checked={selectedAvailableTests.includes(test.id)}
                          onChange={() => toggleTestSelection(test)}
                        />
                        <TestInfo>
                          <TestTitle>{test.name}</TestTitle>
                          <TestIdentifier>
                            {test.type?.toLowerCase() || 'ui'} • {test.id}
                          </TestIdentifier>
                          {test.tags && test.tags.length > 0 && (
                            <TestTags>
                              {test.tags.map((tag, index) => (
                                <Tag key={index}>{tag}</Tag>
                              ))}
                            </TestTags>
                          )}
                        </TestInfo>
                      </TestItem>
                    ))}
                  </TestList>
                )}
              </PanelContent>
            </Panel>
          </MainContent>

          <SuiteSummary>
            <FiBarChart2 />
            Suite Summary: {selectedTests.length} test(s) configured • {availableTests.length} test(s) available to add
          </SuiteSummary>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton type="submit" disabled={saving || selectedTests.length === 0}>
              <FiSave />
              {saving ? 'Creating...' : 'Create Suite'}
            </SaveButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateTestSuiteModal;