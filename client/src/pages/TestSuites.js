import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus, FiPlay, FiBarChart2, FiSettings, FiTrash2, FiEdit3, FiRefreshCw, FiClipboard, FiBox, FiFileText, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';

const TestSuitesContainer = styled.div`
  padding: 0;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const TabsContainer = styled.div`
  background: white;
  border-radius: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
`;

const TabsList = styled.div`
  display: flex;
  border-bottom: 1px solid #e9ecef;
  padding: 0 20px;
`;

const Tab = styled.button`
  padding: 16px 24px;
  border: none;
  background: none;
  color: ${props => props.$active ? '#007bff' : '#6c757d'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#007bff' : 'transparent'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #007bff;
  }
`;

const TabContent = styled.div`
  background: white;
  border-radius: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
`;

const TitleIcon = styled.span`
  margin-right: 12px;
  color: #007bff;
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



const TableContainer = styled.div`
  padding: 0;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
`;

const TableTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TableActions = styled.div`
  display: flex;
  gap: 12px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
`;

const TableHead = styled.thead`
  background-color: #f8f9fa;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }
`;

const TableHeaderCell = styled.th`
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
  border-bottom: 1px solid #dee2e6;
`;

const TableCell = styled.td`
  padding: 16px 20px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
  color: #495057;
  vertical-align: middle;
  
  &:last-child {
    text-align: right;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  
  &.blue {
    background-color: #e3f2fd;
    color: #1976d2;
  }
  
  &.green {
    background-color: #e8f5e8;
    color: #2e7d32;
  }
`;

const SuiteName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const SuiteDescription = styled.div`
  font-size: 12px;
  color: #6c757d;
`;

const SettingsInfo = styled.div`
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
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

const TestSuites = () => {
  const location = useLocation();
  const [testSuites, setTestSuites] = useState([]);
  const [activeTab, setActiveTab] = useState('TEST SUITES');
  const [stats, setStats] = useState({
    totalSuites: 0,
    totalTests: 0,
    totalCollections: 0,
    totalEnvironments: 0,
    availableTags: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'OVERVIEW', label: 'OVERVIEW', icon: FiBarChart2 },
    { id: 'TEST SUITES', label: 'TEST MANAGEMENT', icon: FiClipboard },
    { id: 'COLLECTIONS', label: 'COLLECTIONS', icon: FiBox },
    { id: 'ALL TESTS', label: 'ALL TESTS', icon: FiFileText },
    { id: 'TAGS', label: 'TAGS', icon: FiTag }
  ];

  useEffect(() => {
    fetchTestSuites();
    fetchStats();
  }, []);

  // Handle URL hash to set active tab
  useEffect(() => {
    const hash = location.hash.substring(1); // Remove the # symbol
    console.log('URL hash:', hash);
    console.log('Current activeTab:', activeTab);
    if (hash === 'all-tests') {
      console.log('Setting activeTab to ALL TESTS');
      setActiveTab('ALL TESTS');
    }
  }, [location.hash, activeTab]);

  const fetchTestSuites = async () => {
    try {
      setLoading(true);
      console.log('Fetching test suites...');
      const response = await api.get('/test-suites');
      console.log('Test suites response:', response.data);
      
      // The API returns testSuites in the response.data.testSuites array
      const testSuitesData = response.data.testSuites || [];
      console.log('Setting test suites:', testSuitesData.length, 'items');
      setTestSuites(testSuitesData);
      
      // Update stats with real data
      setStats({
        totalSuites: response.data.total || 0,
        totalTests: response.data.generated || 0,
        totalCollections: response.data.traditional || 0,
        totalEnvironments: 4, // Keep this as is for now
        availableTags: response.data.testSuites?.reduce((acc, suite) => acc + (suite.tags?.length || 0), 0) || 0
      });
    } catch (error) {
      console.error('Error fetching test suites:', error);
      toast.error('Failed to fetch test suites');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Stats are now fetched as part of fetchTestSuites
  };

  const handleDeleteTestSuite = async (suiteId) => {
    if (window.confirm('Are you sure you want to delete this test suite?')) {
      try {
        await api.delete(`/test-suites/${suiteId}`);
        setTestSuites(testSuites.filter(suite => suite.id !== suiteId));
        toast.success('Test suite deleted successfully');
      } catch (error) {
        console.error('Error deleting test suite:', error);
        toast.error('Failed to delete test suite');
      }
    }
  };

  const handleCreateTestSuite = () => {
    // For now, just show a message - you can implement a modal or redirect later
    toast.info('Create Test Suite functionality will be implemented soon!');
  };

  const handleExecuteTestSuite = async (suiteId) => {
    try {
      // Find the test suite to get its details
      const suite = testSuites.find(s => s.id === suiteId || s._id === suiteId);
      
      if (!suite) {
        toast.error('Test suite not found');
        return;
      }
      
      // For generated tests, use the file path to run the test
      if (suite.isGenerated && suite.relativePath) {
        toast.success(`Running test: ${suite.name}`);
        console.log('Executing generated test:', suite.relativePath);
        
        // You can add a modal or redirect to show test execution progress
        // For now, just show a success message
        toast.info('Test execution started. Check the terminal for progress.');
      } else {
        // For traditional test suites
        const response = await api.post(`/test-suites/${suiteId}/execute`, {
          environmentId: 'default'
        });
        
        toast.success('Test execution started');
        console.log('Execution started:', response.data);
      }
    } catch (error) {
      console.error('Error executing test suite:', error);
      toast.error('Failed to execute test suite');
    }
  };

  if (loading) {
    return (
      <TestSuitesContainer>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div>Loading test suites...</div>
        </div>
      </TestSuitesContainer>
    );
  }

  console.log('Current activeTab:', activeTab);
  
  return (
    <TestSuitesContainer>
      <TabsContainer>
        <TabsList>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Tab
                key={tab.id}
                $active={activeTab === tab.id}
                onClick={() => {
                  console.log('Switching to tab:', tab.id);
                  setActiveTab(tab.id);
                }}
              >
                <IconComponent size={16} />
                {tab.label}
              </Tab>
            );
          })}
        </TabsList>
      </TabsContainer>

      <TabContent>
        {activeTab === 'TEST SUITES' && (
          <TableContainer>
            <TableHeader>
              <TableTitle>
                <FiClipboard />
                Test Management
              </TableTitle>
              <TableActions>
                <Button 
                  className="primary" 
                  onClick={() => {
                    console.log('Create Test Suite button clicked');
                    handleCreateTestSuite();
                  }}
                  style={{ 
                    backgroundColor: '#007bff', 
                    color: 'white',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiPlus size={16} />
                  CREATE TEST SUITE
                </Button>
              </TableActions>
            </TableHeader>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div>Loading test suites...</div>
              </div>
            ) : testSuites.length === 0 ? (
              <EmptyState>
                <EmptyIcon>
                  <FiBarChart2 />
                </EmptyIcon>
                <EmptyTitle>No test suites found</EmptyTitle>
                <EmptyDescription>
                  Create your first test suite to organize your tests
                </EmptyDescription>
              </EmptyState>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Environment</TableHeaderCell>
                    <TableHeaderCell>Test Cases</TableHeaderCell>
                    <TableHeaderCell>Tags</TableHeaderCell>
                    <TableHeaderCell>Settings</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <tbody>
                  {testSuites.map((suite) => (
                    <TableRow key={suite._id}>
                      <TableCell>
                        <SuiteName>{suite.name}</SuiteName>
                        <SuiteDescription>{suite.description || suite.name}</SuiteDescription>
                      </TableCell>
                      <TableCell>
                        <Badge className="blue">
                          {suite.environment || 'ai_env'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {suite.testCount || suite.tests?.length || suite.testCases?.length || 0}
                      </TableCell>
                      <TableCell>
                        {suite.tags && suite.tags.length > 0 ? (
                          suite.tags.map((tag, index) => (
                            <Badge key={index} className="green" style={{ marginRight: '4px' }}>
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span style={{ color: '#6c757d' }}>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <SettingsInfo>
                          chromium • {suite.type === 'custom' ? 'Headed' : 'Headless'}
                        </SettingsInfo>
                      </TableCell>
                      <TableCell>
                        <ActionGroup>
                          <Button className="success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <FiPlay style={{ fontSize: '12px' }} />
                            RUN
                          </Button>
                          <ActionButton
                            onClick={() => {/* Edit functionality */}}
                            title="Edit Test Suite"
                          >
                            <FiEdit3 />
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleDeleteTestSuite(suite._id)}
                            title="Delete Test Suite"
                            className="danger"
                          >
                            <FiTrash2 />
                          </ActionButton>
                        </ActionGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </TableContainer>
        )}
        
        {activeTab === 'OVERVIEW' && (
          <TableContainer>
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <EmptyIcon>
                <FiBarChart2 />
              </EmptyIcon>
              <EmptyTitle>Overview</EmptyTitle>
              <EmptyDescription>
                Overview content will be displayed here
              </EmptyDescription>
            </div>
          </TableContainer>
        )}
        
        {activeTab === 'COLLECTIONS' && (
          <TableContainer>
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <EmptyIcon>
                <FiBarChart2 />
              </EmptyIcon>
              <EmptyTitle>Collections</EmptyTitle>
              <EmptyDescription>
                Collections content will be displayed here
              </EmptyDescription>
            </div>
          </TableContainer>
        )}
        
        {activeTab === 'ALL TESTS' && (
          <TableContainer>
            <TableHeader>
              <TableTitle>
                <FiFileText />
                All Tests
              </TableTitle>
            </TableHeader>
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <EmptyIcon>
                <FiFileText />
              </EmptyIcon>
              <EmptyTitle>All Tests</EmptyTitle>
              <EmptyDescription>
                View and manage all generated test files across all test suites
              </EmptyDescription>
            </div>
          </TableContainer>
        )}
        
        {activeTab === 'TAGS' && (
          <TableContainer>
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <EmptyIcon>
                <FiBarChart2 />
              </EmptyIcon>
              <EmptyTitle>Tags</EmptyTitle>
              <EmptyDescription>
                Tags content will be displayed here
              </EmptyDescription>
            </div>
          </TableContainer>
        )}
      </TabContent>
    </TestSuitesContainer>
  );
};

export default TestSuites;
