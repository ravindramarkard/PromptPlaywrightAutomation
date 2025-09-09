import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlay, 
  FiBarChart2, 
  FiTrash2, 
  FiEye, 
  FiEdit3,
  FiRefreshCw,
  FiMonitor,
  FiImage,
  FiCheckCircle,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';
import RunTestModal from '../components/RunTestModal';
import SpecDetailsModal from '../components/SpecDetailsModal';

const TestSuiteContainer = styled.div`
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
`;

const TitleIcon = styled.span`
  margin-right: 12px;
  color: #27ae60;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #27ae60;
  font-weight: 500;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: #27ae60;
  border-radius: 50%;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
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
  
  &.success {
    background-color: #27ae60;
    color: white;
    
    &:hover {
      background-color: #229954;
    }
  }
  
  &.danger {
    background-color: #e74c3c;
    color: white;
    
    &:hover {
      background-color: #c0392b;
    }
  }
`;

const TabsContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ecf0f1;
`;

const Tab = styled.button`
  padding: 16px 24px;
  border: none;
  background: none;
  color: ${props => props.$active ? '#3498db' : '#7f8c8d'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#3498db' : 'transparent'};
  transition: all 0.3s ease;
  
  &:hover {
    color: #2c3e50;
    background-color: #f8f9fa;
  }
`;

const TabContent = styled.div`
  padding: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  text-decoration: underline;
  text-decoration-color: #e74c3c;
  text-underline-offset: 4px;
`;

const TestCount = styled.span`
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const FilterTab = styled.button`
  padding: 8px 16px;
  border: none;
  background: none;
  color: ${props => props.$active ? '#3498db' : '#7f8c8d'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#3498db' : 'transparent'};
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #2c3e50;
  }
`;

const TestsTable = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 200px 100px 120px 150px 100px;
  gap: 16px;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ecf0f1;
  font-weight: 600;
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 200px 100px 120px 150px 100px;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #ecf0f1;
  align-items: center;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const TestName = styled.div`
  font-weight: 500;
  color: #2c3e50;
`;

const TestId = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
`;

const ProjectModel = styled.div`
  font-size: 14px;
  color: #2c3e50;
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
  
  &.ui {
    background-color: #e91e63;
  }
  
  &.api {
    background-color: #9c27b0;
  }
  
  &.e2e {
    background-color: #ff9800;
  }
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Tag = styled.span`
  background-color: #e8f4fd;
  color: #3498db;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px;
  border: none;
  background: none;
  color: #7f8c8d;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #ecf0f1;
    color: #2c3e50;
  }
  
  &.play:hover {
    background-color: #27ae60;
    color: white;
  }
  
  &.danger:hover {
    background-color: #e74c3c;
    color: white;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: #bdc3c7;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  margin: 0 0 8px 0;
  color: #2c3e50;
`;

const EmptyDescription = styled.p`
  font-size: 14px;
  margin: 0;
`;

const ConfirmationModal = styled.div`
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
  padding: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const ModalBody = styled.div`
  margin-bottom: 24px;
  color: #555;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
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
  
  &.secondary {
    background-color: #95a5a6;
    color: white;
    
    &:hover {
      background-color: #7f8c8d;
    }
  }
  
  &.danger {
    background-color: #e74c3c;
    color: white;
    
    &:hover {
      background-color: #c0392b;
    }
  }
`;

// Edit Spec Modal Styles
const EditSpecModalOverlay = styled.div`
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

const EditSpecModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

const EditSpecModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const EditSpecModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EditSpecModalBody = styled.div`
  padding: 24px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const EditSpecTextArea = styled.textarea`
  width: 100%;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
  
  &::placeholder {
    color: #95a5a6;
  }
`;

const EditSpecModalActions = styled.div`
  padding: 24px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const SecondaryButton = styled.button`
  padding: 12px 24px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f8f9fa;
    border-color: #bbb;
  }
`;

const PrimaryButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background-color: #3498db;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const TestSuiteManagement = () => {
  const [activeTab, setActiveTab] = useState('all-tests');
  const [activeFilter, setActiveFilter] = useState('ui');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState([]);
  const [showRunTestModal, setShowRunTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specContent, setSpecContent] = useState('');
  const [loadingSpec, setLoadingSpec] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSpecContent, setEditingSpecContent] = useState('');
  const [savingSpec, setSavingSpec] = useState(false);

  useEffect(() => {
    fetchAllTests();
  }, []);

  const fetchAllTests = async () => {
    try {
      setLoading(true);
      const allTests = [];
      
      // Fetch all prompts first to get the correct tags and types
      const promptsResponse = await api.get('/prompts');
      const promptsMap = new Map();
      if (promptsResponse.data && promptsResponse.data.prompts) {
        promptsResponse.data.prompts.forEach(prompt => {
          promptsMap.set(prompt._id, prompt);
        });
      }
      
      // Fetch all generated tests from test-suites endpoint
      const testSuitesResponse = await api.get('/test-suites');
      if (testSuitesResponse.data && testSuitesResponse.data.testSuites) {
        testSuitesResponse.data.testSuites.forEach(testSuite => {
          // Get the original prompt to fetch correct tags and type
          const originalPrompt = promptsMap.get(testSuite.promptId);
          
          allTests.push({
            id: testSuite.id,
            name: testSuite.name,
            promptId: testSuite.promptId,
            projectModel: testSuite.model || 'Default Model',
            type: originalPrompt ? originalPrompt.testType.toLowerCase() : (testSuite.type ? testSuite.type.toLowerCase() : 'unknown'),
            tags: originalPrompt ? (originalPrompt.tags || []) : (testSuite.tags || []),
            createdAt: testSuite.createdAt,
            filePath: testSuite.filePath,
            status: 'ready',
            source: testSuite.source,
            project: testSuite.project,
            isGenerated: testSuite.isGenerated
          });
        });
      }
      
      // Also fetch tests from prompts (for backward compatibility)
      if (promptsResponse.data && promptsResponse.data.prompts) {
        promptsResponse.data.prompts.forEach(prompt => {
          if (prompt.generatedTests && prompt.generatedTests.length > 0) {
            prompt.generatedTests.forEach(test => {
              // Check if this test is already in allTests (avoid duplicates)
              const exists = allTests.some(t => t.id === test.testId);
              if (!exists) {
                allTests.push({
                  id: test.testId,
                  name: test.testName,
                  promptId: prompt._id,
                  projectModel: prompt.modelName || 'Default Model',
                  type: prompt.testType ? prompt.testType.toLowerCase() : 'unknown',
                  tags: prompt.tags || [],
                  createdAt: test.createdAt || prompt.createdAt,
                  filePath: test.filePath,
                  status: 'ready'
                });
              }
            });
          }
        });
      }
      
      setTests(allTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
      setTests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTest = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAll = () => {
    const filteredTests = getFilteredTests();
    if (selectedTests.length === filteredTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(filteredTests.map(test => test.id));
    }
  };

  const handleRunTest = (testId) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      setSelectedTest(test);
      setShowRunTestModal(true);
    }
  };

  const handleTestRunComplete = (result) => {
    console.log('Test run completed:', result);
    toast.success('Test execution completed!');
    // Optionally refresh the test list
    fetchAllTests();
  };

  const handleViewTest = async (testId) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      try {
        setLoadingSpec(true);
        setSelectedTest(test);
        setShowSpecModal(true);
        
        // Try new test-suites endpoint first
        try {
          const response = await api.get(`/test-suites/${testId}/spec`);
          setSpecContent(response.data.specContent);
        } catch (newEndpointError) {
          // Fallback to old endpoint if new one fails
          console.log('New endpoint failed, trying old endpoint:', newEndpointError);
          const response = await api.get(`/prompts/${test.promptId}/tests/${testId}/spec`);
          setSpecContent(response.data.specContent);
        }
      } catch (error) {
        console.error('Error fetching spec content:', error);
        toast.error('Failed to load spec content');
        setSpecContent('');
      } finally {
        setLoadingSpec(false);
      }
    }
  };

  const handleEditTest = async (testId) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      try {
        setLoadingSpec(true);
        setSelectedTest(test);
        setShowEditModal(true);
        
        // Load spec content for editing
        try {
          const response = await api.get(`/test-suites/${testId}/spec`);
          setEditingSpecContent(response.data.specContent);
        } catch (newEndpointError) {
          // Fallback to old endpoint if new one fails
          console.log('New endpoint failed, trying old endpoint:', newEndpointError);
          const response = await api.get(`/prompts/${test.promptId}/tests/${testId}/spec`);
          setEditingSpecContent(response.data.specContent);
        }
      } catch (error) {
        console.error('Error fetching spec content for editing:', error);
        toast.error('Failed to load spec content for editing');
        setEditingSpecContent('');
      } finally {
        setLoadingSpec(false);
      }
    }
  };

  const handleSaveSpec = async () => {
    if (!selectedTest) return;
    
    try {
      setSavingSpec(true);
      
      const response = await api.put(`/test-suites/${selectedTest.id}/spec`, {
        specContent: editingSpecContent,
        testName: selectedTest.name
      });
      
      if (response.data.success) {
        toast.success('Spec file updated successfully!');
        setShowEditModal(false);
        setEditingSpecContent('');
        setSelectedTest(null);
        
        // Refresh the test list to show updated info
        fetchAllTests();
      } else {
        toast.error('Failed to update spec file');
      }
    } catch (error) {
      console.error('Error saving spec content:', error);
      toast.error(error.response?.data?.error || 'Failed to save spec content');
    } finally {
      setSavingSpec(false);
    }
  };

  const handleDeleteTest = (testId) => {
    setDeleteAction({ type: 'single', testId });
    setShowDeleteModal(true);
  };

  const handleDeleteSelectedTests = () => {
    if (selectedTests.length === 0) {
      toast.warning('No tests selected for deletion');
      return;
    }
    setDeleteAction({ type: 'selected', count: selectedTests.length });
    setShowDeleteModal(true);
  };

  const handleDeleteAllTests = () => {
    setDeleteAction({ type: 'all', count: tests.length });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteAction.type === 'single') {
        const test = tests.find(t => t.id === deleteAction.testId);
        if (test) {
          console.log('Deleting single test:', test);
          
          // Check if this is a generated test (has source property)
          if (test.source === 'Prompts' || test.isGenerated) {
            // Delete from test-suites endpoint
            await api.delete(`/test-suites/${test.id}`);
            console.log('Deleted from test-suites');
          } else {
            // Remove test from prompt's generatedTests array
            const promptResponse = await api.get(`/prompts/${test.promptId}`);
            const prompt = promptResponse.data;
            console.log('Current prompt generatedTests:', prompt.generatedTests);
            
            const updatedTests = prompt.generatedTests.filter(t => t.testId !== deleteAction.testId);
            console.log('Updated tests after filtering:', updatedTests);
            
            const updateResponse = await api.put(`/prompts/${test.promptId}`, {
              generatedTests: updatedTests
            });
            console.log('Update response:', updateResponse.data);
          }
          
          setTests(tests.filter(t => t.id !== deleteAction.testId));
          setSelectedTests(prev => prev.filter(id => id !== deleteAction.testId));
          toast.success('Test deleted successfully');
          
          // Refresh the test list to ensure consistency
          setTimeout(() => {
            fetchAllTests();
          }, 500);
        }
      } else if (deleteAction.type === 'selected') {
        console.log('Deleting selected tests:', selectedTests);
        
        // Delete each selected test
        for (const testId of selectedTests) {
          const test = tests.find(t => t.id === testId);
          if (test) {
            console.log('Deleting test:', test);
            
            // Check if this is a generated test (has source property)
            if (test.source === 'Prompts' || test.isGenerated) {
              // Delete from test-suites endpoint
              await api.delete(`/test-suites/${test.id}`);
              console.log('Deleted from test-suites');
            } else {
              // Remove test from prompt's generatedTests array
              const promptResponse = await api.get(`/prompts/${test.promptId}`);
              const prompt = promptResponse.data;
              const updatedTests = prompt.generatedTests.filter(t => t.testId !== testId);
              
              await api.put(`/prompts/${test.promptId}`, {
                generatedTests: updatedTests
              });
            }
          }
        }
        
        // Update local state
        setTests(tests.filter(t => !selectedTests.includes(t.id)));
        setSelectedTests([]);
        toast.success(`${selectedTests.length} test(s) deleted successfully`);
        
        // Refresh the test list to ensure consistency
        setTimeout(() => {
          fetchAllTests();
        }, 500);
      } else if (deleteAction.type === 'all') {
        console.log('Deleting all tests');
        
        // Separate generated tests from traditional tests
        const generatedTests = tests.filter(test => test.source === 'Prompts' || test.isGenerated);
        const traditionalTests = tests.filter(test => !test.source && !test.isGenerated);
        
        // Delete generated tests using test-suites endpoint
        for (const test of generatedTests) {
          console.log('Deleting generated test:', test.id);
          await api.delete(`/test-suites/${test.id}`);
        }
        
        // Group traditional tests by promptId for efficient deletion
        const testsByPrompt = {};
        traditionalTests.forEach(test => {
          if (!testsByPrompt[test.promptId]) {
            testsByPrompt[test.promptId] = [];
          }
          testsByPrompt[test.promptId].push(test.id);
        });

        // Clear all generatedTests for each prompt
        for (const [promptId] of Object.entries(testsByPrompt)) {
          console.log('Clearing tests for prompt:', promptId);
          await api.put(`/prompts/${promptId}`, {
            generatedTests: []
          });
        }
        
        // Update local state
        setTests([]);
        setSelectedTests([]);
        toast.success(`All ${tests.length} tests deleted successfully`);
        
        // Refresh the test list to ensure consistency
        setTimeout(() => {
          fetchAllTests();
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting tests:', error);
      toast.error('Failed to delete tests');
    } finally {
      setShowDeleteModal(false);
      setDeleteAction(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteAction(null);
  };

  const getFilteredTests = () => {
    let filtered;
    if (activeFilter === 'all') {
      filtered = tests;
    } else {
      filtered = tests.filter(test => {
        const testType = test.type.toLowerCase();
        if (activeFilter === 'ui') {
          return testType === 'ui test' || testType === 'ui';
        }
        if (activeFilter === 'api') {
          return testType === 'api test' || testType === 'api';
        }
        return testType === activeFilter;
      });
    }
    
    // Sort by latest created first (newest to oldest)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const filteredTests = getFilteredTests();
  const uiTests = tests.filter(test => {
    const testType = test.type.toLowerCase();
    return testType === 'ui test' || testType === 'ui';
  });
  const apiTests = tests.filter(test => {
    const testType = test.type.toLowerCase();
    return testType === 'api test' || testType === 'api';
  });

  if (loading) {
    return (
      <TestSuiteContainer>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div>Loading tests...</div>
        </div>
      </TestSuiteContainer>
    );
  }

  return (
    <TestSuiteContainer>
      <Header>
        <div>
          <Title>
            <TitleIcon>
              <FiBarChart2 />
            </TitleIcon>
            Test Suite Management
          </Title>
          <StatusIndicator>
            <StatusDot />
            Connected
          </StatusIndicator>
        </div>
        <HeaderActions>
          <Button className="secondary" onClick={fetchAllTests}>
            <FiRefreshCw />
            REFRESH
          </Button>
          {selectedTests.length > 0 && (
            <Button className="danger" onClick={handleDeleteSelectedTests}>
              <FiTrash2 />
              DELETE SELECTED ({selectedTests.length})
            </Button>
          )}
          {tests.length > 0 && (
            <Button className="danger" onClick={handleDeleteAllTests}>
              <FiTrash2 />
              DELETE ALL TESTS
            </Button>
          )}
        </HeaderActions>
      </Header>

      <TabsContainer>
        <Tabs>
          <Tab 
            $active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            OVERVIEW
          </Tab>
          <Tab 
            $active={activeTab === 'test-suites'} 
            onClick={() => setActiveTab('test-suites')}
          >
            TEST SUITES
          </Tab>
          <Tab 
            $active={activeTab === 'collections'} 
            onClick={() => setActiveTab('collections')}
          >
            COLLECTIONS
          </Tab>
          <Tab 
            $active={activeTab === 'all-tests'} 
            onClick={() => setActiveTab('all-tests')}
          >
            ALL TESTS
          </Tab>
          <Tab 
            $active={activeTab === 'tags'} 
            onClick={() => setActiveTab('tags')}
          >
            TAGS
          </Tab>
        </Tabs>

        <TabContent>
          {activeTab === 'all-tests' && (
            <>
              <SectionHeader>
                <SectionTitle>All Generated Tests</SectionTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <TestCount>Total: {tests.length} tests</TestCount>
                  {selectedTests.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#e74c3c', fontWeight: '500' }}>
                        {selectedTests.length} selected
                      </span>
                      <Button 
                        className="danger" 
                        onClick={handleDeleteSelectedTests}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <FiTrash2 />
                        DELETE SELECTED
                      </Button>
                    </div>
                  )}
                </div>
              </SectionHeader>

              <FilterTabs>
                <FilterTab 
                  $active={activeFilter === 'ui'} 
                  onClick={() => setActiveFilter('ui')}
                >
                  <FiMonitor />
                  UI TESTS ({uiTests.length})
                </FilterTab>
                <FilterTab 
                  $active={activeFilter === 'api'} 
                  onClick={() => setActiveFilter('api')}
                >
                  <FiImage />
                  API TESTS ({apiTests.length})
                </FilterTab>
                <FilterTab 
                  $active={activeFilter === 'all'} 
                  onClick={() => setActiveFilter('all')}
                >
                  <FiCheckCircle />
                  ALL TESTS ({tests.length})
                </FilterTab>
              </FilterTabs>

              {filteredTests.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>
                    <FiBarChart2 />
                  </EmptyIcon>
                  <EmptyTitle>No tests found</EmptyTitle>
                  <EmptyDescription>
                    {activeFilter === 'all' 
                      ? 'Generate some tests from prompts to see them here'
                      : `No ${activeFilter.toUpperCase()} tests found`
                    }
                  </EmptyDescription>
                </EmptyState>
              ) : (
                <TestsTable>
                  <TableHeader>
                    <Checkbox 
                      type="checkbox" 
                      checked={selectedTests.length === filteredTests.length && filteredTests.length > 0}
                      onChange={handleSelectAll}
                    />
                    <div>Test Name</div>
                    <div>Project Model</div>
                    <div>Type</div>
                    <div>Tags</div>
                    <div>Created Timestamp</div>
                    <div>Actions</div>
                  </TableHeader>
                  
                  {filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <Checkbox 
                        type="checkbox" 
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleSelectTest(test.id)}
                      />
                      <div>
                        <TestName>{test.name}</TestName>
                        <TestId>ID: {test.id}</TestId>
                      </div>
                      <ProjectModel>{test.projectModel}</ProjectModel>
                      <TypeBadge className={test.type.toLowerCase().replace(' test', '')}>
                        {test.type.toLowerCase().replace(' test', '')}
                      </TypeBadge>
                      <Tags>
                        {test.tags.map((tag, index) => (
                          <Tag key={index}>{tag}</Tag>
                        ))}
                      </Tags>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {new Date(test.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <Actions>
                        <ActionButton
                          onClick={() => handleRunTest(test.id)}
                          title="Run Test"
                          className="play"
                        >
                          <FiPlay />
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleViewTest(test.id)}
                          title="View Details"
                        >
                          <FiEye />
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleEditTest(test.id)}
                          title="Edit Spec"
                          className="edit"
                        >
                          <FiEdit3 />
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleDeleteTest(test.id)}
                          title="Delete"
                          className="danger"
                        >
                          <FiTrash2 />
                        </ActionButton>
                      </Actions>
                    </TableRow>
                  ))}
                </TestsTable>
              )}
            </>
          )}

          {activeTab === 'overview' && (
            <div>
              <h3>Overview</h3>
              <p>Test suite overview and statistics will be displayed here.</p>
            </div>
          )}

          {activeTab === 'test-suites' && (
            <div>
              <h3>Test Suites</h3>
              <p>Test suite management will be displayed here.</p>
            </div>
          )}

          {activeTab === 'collections' && (
            <div>
              <h3>Collections</h3>
              <p>Test collections will be displayed here.</p>
            </div>
          )}

          {activeTab === 'tags' && (
            <div>
              <h3>Tags</h3>
              <p>Test tags management will be displayed here.</p>
            </div>
          )}
        </TabContent>
      </TabsContainer>

      <RunTestModal
        isOpen={showRunTestModal}
        onClose={() => setShowRunTestModal(false)}
        test={selectedTest}
        onTestRun={handleTestRunComplete}
      />

      <SpecDetailsModal
        isOpen={showSpecModal}
        onClose={() => {
          setShowSpecModal(false);
          setSpecContent('');
          setSelectedTest(null);
        }}
        test={selectedTest}
        specContent={specContent}
      />

      {/* Edit Spec Modal */}
      {showEditModal && selectedTest && (
        <EditSpecModalOverlay>
          <EditSpecModalContainer>
            <EditSpecModalHeader>
              <EditSpecModalTitle>
                <FiEdit3 />
                Edit Spec: {selectedTest.name}
              </EditSpecModalTitle>
              <ModalButton onClick={() => {
                setShowEditModal(false);
                setEditingSpecContent('');
                setSelectedTest(null);
              }}>
                <FiX size={20} />
              </ModalButton>
            </EditSpecModalHeader>
            <EditSpecModalBody>
              {loadingSpec ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div>Loading spec content...</div>
                </div>
              ) : (
                <EditSpecTextArea
                  value={editingSpecContent}
                  onChange={(e) => setEditingSpecContent(e.target.value)}
                  placeholder="Edit your spec content here..."
                />
              )}
            </EditSpecModalBody>
            <EditSpecModalActions>
              <SecondaryButton onClick={() => {
                setShowEditModal(false);
                setEditingSpecContent('');
                setSelectedTest(null);
              }}>
                Cancel
              </SecondaryButton>
              <PrimaryButton 
                onClick={handleSaveSpec}
                disabled={savingSpec || loadingSpec}
              >
                {savingSpec ? 'Saving...' : 'Save Changes'}
              </PrimaryButton>
            </EditSpecModalActions>
          </EditSpecModalContainer>
        </EditSpecModalOverlay>
      )}

      {showDeleteModal && (
        <ConfirmationModal>
          <ModalContent>
            <ModalHeader>
              <FiAlertTriangle style={{ color: '#e74c3c', fontSize: '24px' }} />
              <ModalTitle>
                {deleteAction?.type === 'single' && 'Delete Test'}
                {deleteAction?.type === 'selected' && 'Delete Selected Tests'}
                {deleteAction?.type === 'all' && 'Delete All Tests'}
              </ModalTitle>
            </ModalHeader>
            <ModalBody>
              {deleteAction?.type === 'single' && (
                <p>Are you sure you want to delete this test? This action cannot be undone.</p>
              )}
              {deleteAction?.type === 'selected' && (
                <p>Are you sure you want to delete {deleteAction.count} selected test(s)? This action cannot be undone.</p>
              )}
              {deleteAction?.type === 'all' && (
                <p>Are you sure you want to delete ALL {deleteAction.count} tests? This action cannot be undone.</p>
              )}
            </ModalBody>
            <ModalActions>
              <ModalButton className="secondary" onClick={cancelDelete}>
                <FiX />
                Cancel
              </ModalButton>
              <ModalButton className="danger" onClick={confirmDelete}>
                <FiTrash2 />
                Delete
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ConfirmationModal>
      )}
    </TestSuiteContainer>
  );
};

export default TestSuiteManagement;
