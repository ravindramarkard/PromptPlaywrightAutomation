import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiSettings, FiTrash2, FiEdit3, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';
import CreateEnvironmentModal from '../components/CreateEnvironmentModal';
import EditEnvironmentModal from '../components/EditEnvironmentModal';

const EnvironmentsContainer = styled.div`
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
  
  &.danger {
    background-color: #e74c3c;
    color: white;
    
    &:hover {
      background-color: #c0392b;
    }
  }
`;

const EnvironmentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const EnvironmentCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.status === 'active' ? '#27ae60' : '#95a5a6'};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
`;

const CardKey = styled.p`
  font-size: 12px;
  color: #7f8c8d;
  margin: 0;
  font-family: monospace;
`;

const CardStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.status === 'active' ? '#27ae60' : '#95a5a6'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardDescription = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const CardDetails = styled.div`
  margin-bottom: 20px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f8f9fa;
  font-size: 13px;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: #7f8c8d;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #2c3e50;
  font-family: monospace;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
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
  
  &.danger {
    background-color: #e74c3c;
    color: white;
    
    &:hover {
      background-color: #c0392b;
    }
  }
`;

const IntegrationStatus = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f8f9fa;
`;

const IntegrationItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
`;

const IntegrationLabel = styled.span`
  color: #7f8c8d;
`;

const IntegrationStatusText = styled.span`
  color: ${props => props.enabled ? '#27ae60' : '#e74c3c'};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

const Environments = () => {
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/environments');
      // Handle both array response and object with environments property
      const environmentsData = Array.isArray(response.data) ? response.data : response.data.environments || [];
      setEnvironments(environmentsData);
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast.error('Failed to fetch environments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnvironment = async (environmentData) => {
    try {
      const response = await api.post('/environments', environmentData);
      setEnvironments([...environments, response.data]);
      setShowCreateModal(false);
      toast.success('Environment created successfully');
    } catch (error) {
      console.error('Error creating environment:', error);
      toast.error('Failed to create environment');
    }
  };

  const handleDeleteEnvironment = async (environmentId) => {
    if (window.confirm('Are you sure you want to delete this environment?')) {
      try {
        await api.delete(`/environments/${environmentId}`);
        setEnvironments(environments.filter(env => env._id !== environmentId));
        toast.success('Environment deleted successfully');
      } catch (error) {
        console.error('Error deleting environment:', error);
        toast.error('Failed to delete environment');
      }
    }
  };

  const handleTestConnection = async (environmentId) => {
    try {
      const response = await api.post(`/environments/${environmentId}/test-connection`);
      if (response.data.success) {
        toast.success('Connection test successful');
      } else {
        toast.error('Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Connection test failed');
    }
  };

  const handleEditEnvironment = (environment) => {
    setSelectedEnvironment(environment);
    setShowEditModal(true);
  };

  const handleUpdateEnvironment = async (environmentId, updatedData) => {
    try {
      const response = await api.put(`/environments/${environmentId}`, updatedData);
      setEnvironments(environments.map(env => 
        env._id === environmentId ? response.data : env
      ));
      setShowEditModal(false);
      setSelectedEnvironment(null);
      toast.success('Environment updated successfully');
    } catch (error) {
      console.error('Error updating environment:', error);
      toast.error('Failed to update environment');
      throw error; // Re-throw to let the modal handle it
    }
  };

  if (loading) {
    return (
      <EnvironmentsContainer>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div>Loading environments...</div>
        </div>
      </EnvironmentsContainer>
    );
  }

  return (
    <EnvironmentsContainer>
      <Header>
        <Title>
          <TitleIcon>
            <FiSettings />
          </TitleIcon>
          Environments
        </Title>
        <Button
          className="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus />
          New Environment
        </Button>
      </Header>

      {environments.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FiSettings />
          </EmptyIcon>
          <EmptyTitle>No environments found</EmptyTitle>
          <EmptyDescription>
            Create your first environment to get started with testing
          </EmptyDescription>
        </EmptyState>
      ) : (
        <EnvironmentsGrid>
          {environments.map((environment) => (
            <EnvironmentCard key={environment._id} status={environment.status}>
              <CardHeader>
                <div>
                  <CardTitle>{environment.name}</CardTitle>
                  <CardKey>{environment.key}</CardKey>
                </div>
                <CardStatus status={environment.status}>
                  {environment.status === 'active' ? <FiCheckCircle /> : <FiXCircle />}
                  {environment.status}
                </CardStatus>
              </CardHeader>

              <CardDescription>{environment.description}</CardDescription>

              <CardDetails>
                <DetailRow>
                  <DetailLabel>Base URL</DetailLabel>
                  <DetailValue>{environment.variables.BASE_URL}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>Browser</DetailLabel>
                  <DetailValue>{environment.variables.BROWSER}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>Timeout</DetailLabel>
                  <DetailValue>{environment.variables.TIMEOUT}ms</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>Headless</DetailLabel>
                  <DetailValue>{environment.variables.HEADLESS ? 'Yes' : 'No'}</DetailValue>
                </DetailRow>
              </CardDetails>

              <IntegrationStatus>
                <IntegrationItem>
                  <IntegrationLabel>Jira Integration</IntegrationLabel>
                  <IntegrationStatusText enabled={environment.jiraIntegration.enabled}>
                    {environment.jiraIntegration.enabled ? 'Enabled' : 'Disabled'}
                  </IntegrationStatusText>
                </IntegrationItem>
                <IntegrationItem>
                  <IntegrationLabel>LLM Configuration</IntegrationLabel>
                  <IntegrationStatusText enabled={environment.llmConfiguration.enabled}>
                    {environment.llmConfiguration.enabled ? 'Enabled' : 'Disabled'}
                  </IntegrationStatusText>
                </IntegrationItem>
              </IntegrationStatus>

              <CardActions>
                <ActionButton
                  className="secondary"
                  onClick={() => handleTestConnection(environment._id)}
                >
                  <FiCheckCircle />
                  Test
                </ActionButton>
                <ActionButton
                  className="primary"
                  onClick={() => handleEditEnvironment(environment)}
                >
                  <FiEdit3 />
                  Edit
                </ActionButton>
                <ActionButton
                  className="danger"
                  onClick={() => handleDeleteEnvironment(environment._id)}
                >
                  <FiTrash2 />
                  Delete
                </ActionButton>
              </CardActions>
            </EnvironmentCard>
          ))}
        </EnvironmentsGrid>
      )}

      {showCreateModal && (
        <CreateEnvironmentModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEnvironment}
        />
      )}

      {showEditModal && (
        <EditEnvironmentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEnvironment(null);
          }}
          environment={selectedEnvironment}
          onUpdate={handleUpdateEnvironment}
        />
      )}
    </EnvironmentsContainer>
  );
};

export default Environments;
