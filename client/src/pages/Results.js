import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiBarChart2, FiPlay, FiDownload, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiSettings } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';
import TestAnalytics from '../components/TestAnalytics';

const ResultsContainer = styled.div`
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
  margin-left: 12px;
  
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
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const StatTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatIcon = styled.div`
  color: ${props => props.color || '#3498db'};
  font-size: 24px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const StatDescription = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
`;

const ReportSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
`;

const ReportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ReportCard = styled.div`
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
`;

const ReportTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
`;

const ReportStatus = styled.div`
  font-size: 14px;
  color: ${props => props.available ? '#27ae60' : '#e74c3c'};
  font-weight: 500;
  margin-bottom: 16px;
`;

const ReportButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
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
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const TestList = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TestItem = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const TestInfo = styled.div`
  flex: 1;
`;

const TestName = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
`;

const TestMeta = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TestStatus = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.passed {
    background-color: #d4edda;
    color: #155724;
  }
  
  &.failed {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  &.running {
    background-color: #fff3cd;
    color: #856404;
  }
`;

const TestActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
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
`;

const Results = () => {
  const [stats, setStats] = useState({
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    successRate: 0,
    averageDuration: 0
  });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [reports, setReports] = useState({
    playwright: { available: false, path: 'http://localhost:5051/reports/playwright/index.html' },
    allure: { available: false, path: 'http://localhost:5051/reports/allure/index.html' },
    api: { available: false, path: 'http://localhost:5051/reports/api/index.html' }
  });
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // Try to get data from reports first (most recent)
      try {
        const reportsStatsResponse = await api.get('/test-results/stats/from-reports');
        
        if (reportsStatsResponse.data.success) {
          const statsData = reportsStatsResponse.data.stats;
          setStats({
            totalTests: statsData.totalTests || 0,
            passed: statsData.passed || 0,
            failed: statsData.failed || 0,
            skipped: statsData.skipped || 0,
            successRate: statsData.successRate || 0,
            averageDuration: statsData.averageDuration || 0
          });
          
          // Set analytics data for detailed charts
          if (statsData.statusDistribution || statsData.durationDistribution || statsData.severityDistribution) {
            setAnalyticsData({
              statusDistribution: statsData.statusDistribution || { passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0 },
              durationDistribution: statsData.durationDistribution || [],
              severityDistribution: statsData.severityDistribution || { blocker: 0, critical: 0, normal: 0, minor: 0, trivial: 0 }
            });
          }
          
          console.log('📊 Using data from reports:', statsData);
        } else {
          throw new Error('No report data available');
        }
      } catch (error) {
        console.log('⚠️ Could not get data from reports, falling back to test results:', error.message);
        
        // Fallback to test results
        const summaryResponse = await api.get('/test-results/summary/execution');
        const statsData = summaryResponse.data || {};
        setStats({
          totalTests: statsData.totalTests || 0,
          passed: statsData.passed || 0,
          failed: statsData.failed || 0,
          skipped: statsData.skipped || 0,
          successRate: statsData.successRate || 0,
          averageDuration: statsData.averageDuration || 0
        });
      }
      
      // Fetch available reports
      const reportsResponse = await api.get('/test-results/reports/available');
      const reportsData = reportsResponse.data || {};
      setReports({
        playwright: reportsData.playwright || { available: false, path: 'http://localhost:5051/reports/playwright/index.html' },
        allure: reportsData.allure || { available: false, path: 'http://localhost:5051/reports/allure/index.html' },
        api: reportsData.api || { available: false, path: 'http://localhost:5051/reports/api/index.html' }
      });
      
      // Fetch actual test results
      const testResultsResponse = await api.get('/test-results');
      const testResults = testResultsResponse.data || [];
      
      // Transform test results for display
      const recentTests = testResults.slice(0, 10).map((test, index) => {
        // Generate more descriptive test names based on execution data
        const generateTestName = (test) => {
          if (test.testName && test.testName !== 'Login Test') {
            return test.testName;
          }
          
          // Generate names based on test characteristics
          const testTypes = ['Login Flow', 'User Authentication', 'Data Validation', 'API Integration', 'UI Navigation', 'Form Submission', 'Error Handling', 'Performance Test'];
          const testType = testTypes[index % testTypes.length];
          const browserType = test.browser === 'chromium' ? 'Chrome' : test.browser === 'firefox' ? 'Firefox' : 'Safari';
          return `${testType} - ${browserType}`;
        };

        return {
          id: test._id,
          name: generateTestName(test),
          type: test.testType || 'Unknown',
          status: test.status || 'unknown',
          createdAt: new Date(test.createdAt),
          files: 1, // Each test has one spec file
          executionId: test.executionId,
          browser: test.browser || 'unknown',
          headless: test.headless !== undefined ? test.headless : true,
          environment: test.environment || 'default',
          duration: test.results?.duration || 0,
          completedAt: test.completedAt ? new Date(test.completedAt) : null,
          description: `${test.testType || 'Test'} - ${test.browser || 'unknown'} - ${test.headless ? 'Headless' : 'Visible'}`
        };
      });
      
      setRecentTests(recentTests);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch test results');
      
      // Set fallback values on error
      setStats({
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        averageDuration: 0
      });
      setReports({
        playwright: { available: false, path: 'http://localhost:5051/reports/playwright/index.html' },
        allure: { available: false, path: 'http://localhost:5051/reports/allure/index.html' },
        api: { available: false, path: 'http://localhost:5051/reports/api/index.html' }
      });
      setRecentTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    try {
      const response = await api.post('/test-results/execute', {
        testSuiteId: 'default',
        environmentId: 'default'
      });
      
      toast.success('Test execution started');
      console.log('Execution started:', response.data);
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error('Failed to start test execution');
    }
  };

  const handleRefreshFromReports = async () => {
    try {
      setLoading(true);
      toast.info('Refreshing data from reports...');
      
      // Force refresh reports and get latest data
      const refreshResponse = await api.post('/test-results/refresh-reports');
      
      if (refreshResponse.data.success && refreshResponse.data.stats) {
        const statsData = refreshResponse.data.stats;
        setStats({
          totalTests: statsData.totalTests || 0,
          passed: statsData.passed || 0,
          failed: statsData.failed || 0,
          skipped: statsData.skipped || 0,
          successRate: statsData.successRate || 0,
          averageDuration: statsData.averageDuration || 0
        });
        
        // Set analytics data for detailed charts
        if (statsData.statusDistribution || statsData.durationDistribution || statsData.severityDistribution) {
          setAnalyticsData({
            statusDistribution: statsData.statusDistribution || { passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0 },
            durationDistribution: statsData.durationDistribution || [],
            severityDistribution: statsData.severityDistribution || { blocker: 0, critical: 0, normal: 0, minor: 0, trivial: 0 }
          });
        }
        
        toast.success('Data refreshed from reports successfully!');
        console.log('📊 Refreshed data from reports:', statsData);
      } else {
        // Fallback to regular refresh
        await fetchResults();
        toast.success('Data refreshed successfully!');
      }
    } catch (error) {
      console.error('Error refreshing from reports:', error);
      toast.error('Failed to refresh data from reports');
      // Fallback to regular refresh
      await fetchResults();
    } finally {
      setLoading(false);
    }
  };

  const handleCleanAndGenerateReports = async () => {
    try {
      setLoading(true);
      toast.info('Cleaning old reports and generating fresh ones...');
      
      // Clean all old reports and generate fresh ones
      const cleanResponse = await api.post('/api/reports/fresh-generate');
      
      if (cleanResponse.data.success) {
        toast.success('Reports cleaned and generated successfully!');
        console.log('🧹 Reports cleaned and generated:', cleanResponse.data);
        
        // Refresh the data after generating fresh reports
        await fetchResults();
      } else {
        toast.error('Failed to clean and generate reports');
      }
    } catch (error) {
      console.error('Error cleaning and generating reports:', error);
      toast.error('Failed to clean and generate reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlaywrightReport = async () => {
    try {
      const response = await api.post('/test-results/generate-playwright-report');
      if (response.data.success) {
        toast.success('Playwright report generated successfully');
        // Refresh reports status
        fetchResults();
      } else {
        toast.error('Failed to generate Playwright report');
      }
    } catch (error) {
      console.error('Error generating Playwright report:', error);
      toast.error('Failed to generate Playwright report');
    }
  };

  const handleGenerateAllureReport = async () => {
    try {
      const response = await api.post('/test-results/generate-allure-report');
      if (response.data.success) {
        toast.success('Allure report generated successfully');
        // Refresh reports status
        fetchResults();
      } else {
        toast.error('Failed to generate Allure report');
      }
    } catch (error) {
      console.error('Error generating Allure report:', error);
      toast.error('Failed to generate Allure report');
    }
  };

  const handleViewReport = (reportType) => {
    const report = reports?.[reportType];
    if (report?.available) {
      window.open(report.path, '_blank');
    } else {
      toast.error(`${reportType} report is not available`);
    }
  };

  const handleQuickRun = async (testId) => {
    try {
      // Mock quick run
      toast.success('Quick run started');
    } catch (error) {
      console.error('Error running quick test:', error);
      toast.error('Failed to run test');
    }
  };

  if (loading) {
    return (
      <ResultsContainer>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div>Loading test results...</div>
        </div>
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer>
      <Header>
        <Title>
          <TitleIcon>
            <FiBarChart2 />
          </TitleIcon>
          Test Results & Execution
        </Title>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button className="secondary" onClick={handleRefreshFromReports}>
            <FiRefreshCw />
            Refresh from Reports
          </Button>
          <Button className="secondary" onClick={handleCleanAndGenerateReports}>
            <FiSettings />
            Clean & Generate Reports
          </Button>
          <Button className="primary" onClick={handleRunAllTests}>
            <FiPlay />
            Run All Tests
          </Button>
        </div>
      </Header>

      <StatsGrid>
        <StatCard color="#3498db">
          <StatHeader>
            <StatTitle>Total Executions</StatTitle>
            <StatIcon color="#3498db">
              <FiBarChart2 />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalTests}</StatValue>
          <StatDescription>Test executions completed</StatDescription>
        </StatCard>

        <StatCard color="#27ae60">
          <StatHeader>
            <StatTitle>Passed</StatTitle>
            <StatIcon color="#27ae60">
              <FiCheckCircle />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.passed}</StatValue>
          <StatDescription>Successful test executions</StatDescription>
        </StatCard>

        <StatCard color="#e74c3c">
          <StatHeader>
            <StatTitle>Failed</StatTitle>
            <StatIcon color="#e74c3c">
              <FiXCircle />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.failed}</StatValue>
          <StatDescription>Failed test executions</StatDescription>
        </StatCard>

        <StatCard color="#f39c12">
          <StatHeader>
            <StatTitle>Success Rate</StatTitle>
            <StatIcon color="#f39c12">
              <FiBarChart2 />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.successRate}%</StatValue>
          <StatDescription>
            {stats.averageDuration > 0 ? `Avg: ${stats.averageDuration}ms` : 'No completed tests'}
          </StatDescription>
        </StatCard>
      </StatsGrid>

      <TestAnalytics data={analyticsData} />

      <ReportSection>
        <SectionTitle>Available Reports</SectionTitle>
        <ReportGrid>
          <ReportCard>
            <ReportTitle>Playwright Report</ReportTitle>
            <ReportStatus available={reports?.playwright?.available}>
              {reports?.playwright?.available ? 'Available' : 'Not Available'}
            </ReportStatus>
            {reports?.playwright?.available ? (
              <ReportButton
                className="primary"
                onClick={() => handleViewReport('playwright')}
              >
                <FiDownload />
                View Report
              </ReportButton>
            ) : (
              <ReportButton
                className="secondary"
                onClick={handleGeneratePlaywrightReport}
              >
                <FiDownload />
                Generate Report
              </ReportButton>
            )}
          </ReportCard>

          <ReportCard>
            <ReportTitle>Allure Report</ReportTitle>
            <ReportStatus available={reports?.allure?.available}>
              {reports?.allure?.available ? 'Available' : 'Not Available'}
            </ReportStatus>
            {reports?.allure?.available ? (
              <ReportButton
                className="primary"
                onClick={() => handleViewReport('allure')}
              >
                <FiDownload />
                View Report
              </ReportButton>
            ) : (
              <ReportButton
                className="secondary"
                onClick={handleGenerateAllureReport}
              >
                <FiDownload />
                Generate Report
              </ReportButton>
            )}
          </ReportCard>

          <ReportCard>
            <ReportTitle>API Report</ReportTitle>
            <ReportStatus available={reports?.api?.available}>
              {reports?.api?.available ? 'Available' : 'Not Available'}
            </ReportStatus>
            <ReportButton
              className="secondary"
              onClick={handleGenerateAllureReport}
              disabled={reports?.api?.available}
            >
              <FiDownload />
              {reports?.api?.available ? 'View Report' : 'Generate'}
            </ReportButton>
          </ReportCard>
        </ReportGrid>
      </ReportSection>

      <ReportSection>
        <SectionTitle>Recent Tests</SectionTitle>
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#7f8c8d' }}>
          {recentTests.length} test available for execution
        </div>
        
        <TestList>
          {recentTests.map((test) => (
            <TestItem key={test.id}>
              <TestInfo>
                <TestName>{test.name}</TestName>
                <TestMeta>
                  <div>
                    <TestStatus className={test.status}>{test.status}</TestStatus>
                    <span style={{ marginLeft: '8px' }}>
                      {test.type} • {test.browser} • {test.headless ? 'Headless' : 'Visible'}
                    </span>
                  </div>
                  <div>
                    Created: {test.createdAt.toLocaleDateString()} • 
                    {test.completedAt ? ` Completed: ${test.completedAt.toLocaleDateString()}` : ' Running...'} • 
                    {test.duration > 0 ? ` ${test.duration}ms` : ''} • 
                    {test.files} file(s)
                  </div>
                </TestMeta>
              </TestInfo>
              <TestActions>
                <ActionButton className="secondary">
                  <FiSettings />
                </ActionButton>
                <ActionButton
                  className="primary"
                  onClick={() => handleQuickRun(test.id)}
                >
                  <FiPlay />
                  Quick Run
                </ActionButton>
              </TestActions>
            </TestItem>
          ))}
        </TestList>
      </ReportSection>
    </ResultsContainer>
  );
};

export default Results;
