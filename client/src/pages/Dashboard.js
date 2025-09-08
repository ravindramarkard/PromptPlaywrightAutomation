import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiBarChart2, FiPlay, FiCheckCircle, FiXCircle, FiClock, FiEdit3, FiSettings, FiCpu } from 'react-icons/fi';
import api from '../config/axios';

const DashboardContainer = styled.div`
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
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

const RecentActivity = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid ${props => props.color || '#3498db'};
`;

const ActivityIcon = styled.div`
  color: ${props => props.color || '#3498db'};
  margin-right: 12px;
  font-size: 18px;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const ActivityTime = styled.div`
  font-size: 12px;
  color: #7f8c8d;
`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalTests: 0,
    totalSuites: 0,
    totalEnvironments: 0,
    recentExecutions: 0,
    successRate: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch prompts count
      const promptsResponse = await api.get('/prompts?limit=1');
      const totalPrompts = promptsResponse.data.total || 0;

      // Fetch test suites count
      const suitesResponse = await api.get('/test-suites?limit=1');
      const totalSuites = suitesResponse.data.total || 0;

      // Fetch environments count
      const envsResponse = await api.get('/environments');
      const totalEnvironments = envsResponse.data.length || 0;

      // Fetch test results summary
      const resultsResponse = await api.get('/test-results/summary/execution');
      const { totalTests, successRate } = resultsResponse.data;

      setStats({
        totalPrompts,
        totalTests: totalTests || 0,
        totalSuites,
        totalEnvironments,
        recentExecutions: totalTests || 0,
        successRate: successRate || 0
      });

      // Mock recent activity data
      setRecentActivity([
        {
          id: 1,
          title: 'New prompt created: "Login Flow Test"',
          time: '2 minutes ago',
          type: 'prompt',
          color: '#3498db'
        },
        {
          id: 2,
          title: 'Test suite "E2E Tests" executed successfully',
          time: '15 minutes ago',
          type: 'execution',
          color: '#27ae60'
        },
        {
          id: 3,
          title: 'Environment "Staging" updated',
          time: '1 hour ago',
          type: 'environment',
          color: '#f39c12'
        },
        {
          id: 4,
          title: 'API test generation completed',
          time: '2 hours ago',
          type: 'generation',
          color: '#9b59b6'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'prompt': return <FiEdit3 />;
      case 'execution': return <FiPlay />;
      case 'environment': return <FiSettings />;
      case 'generation': return <FiCpu />;
      default: return <FiClock />;
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <Subtitle>Welcome to AI Test Generator - Your automated testing solution</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard color="#3498db">
          <StatHeader>
            <StatTitle>Total Prompts</StatTitle>
            <StatIcon color="#3498db">
              <FiEdit3 />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalPrompts}</StatValue>
          <StatDescription>AI-generated test prompts</StatDescription>
        </StatCard>

        <StatCard color="#27ae60">
          <StatHeader>
            <StatTitle>Total Tests</StatTitle>
            <StatIcon color="#27ae60">
              <FiCheckCircle />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalTests}</StatValue>
          <StatDescription>Generated test files</StatDescription>
        </StatCard>

        <StatCard color="#f39c12">
          <StatHeader>
            <StatTitle>Test Suites</StatTitle>
            <StatIcon color="#f39c12">
              <FiBarChart2 />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalSuites}</StatValue>
          <StatDescription>Organized test collections</StatDescription>
        </StatCard>

        <StatCard color="#9b59b6">
          <StatHeader>
            <StatTitle>Environments</StatTitle>
            <StatIcon color="#9b59b6">
              <FiSettings />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalEnvironments}</StatValue>
          <StatDescription>Configured test environments</StatDescription>
        </StatCard>

        <StatCard color="#e74c3c">
          <StatHeader>
            <StatTitle>Success Rate</StatTitle>
            <StatIcon color="#e74c3c">
              <FiCheckCircle />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.successRate.toFixed(1)}%</StatValue>
          <StatDescription>Test execution success rate</StatDescription>
        </StatCard>

        <StatCard color="#1abc9c">
          <StatHeader>
            <StatTitle>Recent Executions</StatTitle>
            <StatIcon color="#1abc9c">
              <FiPlay />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.recentExecutions}</StatValue>
          <StatDescription>Tests run in last 7 days</StatDescription>
        </StatCard>
      </StatsGrid>

      <RecentActivity>
        <SectionTitle>Recent Activity</SectionTitle>
        <ActivityList>
          {recentActivity.map((activity) => (
            <ActivityItem key={activity.id} color={activity.color}>
              <ActivityIcon color={activity.color}>
                {getActivityIcon(activity.type)}
              </ActivityIcon>
              <ActivityContent>
                <ActivityTitle>{activity.title}</ActivityTitle>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          ))}
        </ActivityList>
      </RecentActivity>
    </DashboardContainer>
  );
};

export default Dashboard;
