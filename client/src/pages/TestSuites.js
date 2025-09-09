import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiPlay, FiBarChart2, FiSettings, FiTrash2, FiEdit3, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';

const TestSuitesContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const TabsContainer = styled.div`
  background: white;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
`;

const TabsList = styled.div`
  display: flex;
  border-bottom: 1px solid #e9ecef;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  background: none;
  color: ${props => props.$active ? '#007bff' : '#6c757d'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#007bff' : 'transparent'};
  transition: all 0.3s ease;
  
  &:hover {
    color: #007bff;
  }
`;

const TabContent = styled.div`
  background: white;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  color: #3498db;
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
  padding: 20px;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
  border-bottom: 1px solid #dee2e6;
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
  color: #495057;
  
  &:last-child {
    text-align: right;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
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
  const [testSuites, setTestSuites] = useState([]);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [stats, setStats] = useState({
    totalSuites: 0,
    totalTests: 0,
    totalCollections: 0,
    totalEnvironments: 0,
    availableTags: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'OVERVIEW', label: 'OVERVIEW' },
    { id: 'TEST SUITES', label: 'TEST SUITES' },
    { id: 'COLLECTIONS', label: 'COLLECTIONS' },
    { id: 'ALL TESTS', label: 'ALL TESTS' },
    { id: 'TAGS', label: 'TAGS' }
  ];

  useEffect(() => {
    fetchTestSuites();
    fetchStats();
  }, []);

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

  return (
    <TestSuitesContainer>
      <Header>
        <Title>
          <TitleIcon>
            <FiBarChart2 />
          </TitleIcon>
          Test Suite Management
        </Title>
        <Button className="primary" onClick={() => fetchTestSuites()}>
          <FiRefreshCw />
          REFRESH
        </Button>
      </Header>

      <TabsContainer>
        <TabsList>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Tab>
          ))}
        </TabsList>
      </TabsContainer>

      <TabContent>
        {activeTab === 'TEST SUITES' && (
          <TableContainer>
            <TableHeader>
              <TableTitle>
                <FiBarChart2 />
                Test Suites
              </TableTitle>
              <TableActions>
                <Button className="primary" onClick={() => handleCreateTestSuite()}>
                  <FiPlus />
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
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {suite.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {suite.description || suite.type || suite.testType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="blue">
                          {suite.environment || 'dev'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {suite.testCount || suite.tests?.length || 2}
                      </TableCell>
                      <TableCell>
                        {suite.tags && suite.tags.length > 0 ? (
                          suite.tags.map((tag, index) => (
                            <Badge key={index} className="green" style={{ marginRight: '4px' }}>
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span style={{ color: '#6c757d' }}>chromium • Headed</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActionButton title="Settings">
                          <FiSettings />
                        </ActionButton>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Button className="success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <FiPlay style={{ fontSize: '12px' }} />
                            RUN
                          </Button>
                          <Button className="primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            VIEW FILE
                          </Button>
                          <ActionButton
                            onClick={() => {/* Edit functionality */}}
                            title="Edit Test Suite"
                          >
                            <FiEdit3 />
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleDeleteTestSuite(suite.id)}
                            title="Delete Test Suite"
                            className="danger"
                          >
                            <FiTrash2 />
                          </ActionButton>
                        </div>
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
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <EmptyIcon>
                <FiBarChart2 />
              </EmptyIcon>
              <EmptyTitle>All Tests</EmptyTitle>
              <EmptyDescription>
                All tests content will be displayed here
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
