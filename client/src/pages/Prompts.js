import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit3, FiTrash2, FiEye, FiPlay, FiGrid, FiList, FiCode, FiZap, FiX, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';
import CreatePromptModal from '../components/CreatePromptModal';
import PromptDetailsModal from '../components/PromptDetailsModal';
import ContinueExecutionModal from '../components/ContinueExecutionModal';

// Simple wrapper to reuse CreatePromptModal for editing/copying by seeding initial values
function EditPromptModal({ initial, onClose, onSubmit }) {
  return (
    <CreatePromptModal
      onClose={onClose}
      onSubmit={onSubmit}
      initialData={initial || null}
      titleOverride={initial?._id ? 'Edit Prompt' : 'Copy Prompt'}
      submitLabel={initial?._id ? 'Update' : 'Create Copy'}
    />
  );
}

const PromptsContainer = styled.div`
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

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ViewToggle = styled.div`
  display: flex;
  background-color: #ecf0f1;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
`;

const ViewToggleButton = styled.button`
  padding: 8px 12px;
  border: none;
  background: ${props => props.$active ? '#3498db' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#7f8c8d'};
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? '#2980b9' : '#d5dbdb'};
    color: ${props => props.$active ? 'white' : '#2c3e50'};
  }
`;

const SearchInput = styled.input`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 300px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
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
`;

const PromptsList = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const PromptsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const PromptItem = styled.div`
  padding: 20px;
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

const PromptCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: all 0.3s ease;
  border: 1px solid #ecf0f1;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const PromptInfo = styled.div`
  flex: 1;
`;

const PromptCardInfo = styled.div`
  margin-bottom: 16px;
`;

const PromptTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
`;

const PromptDescription = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 8px 0;
  line-height: 1.4;
`;

const PromptMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #95a5a6;
  flex-wrap: wrap;
`;

const PromptCardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 16px;
`;

const PromptActions = styled.div`
  display: flex;
  gap: 8px;
`;

const PromptCardActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ecf0f1;
`;

const PromptTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const Tag = styled.span`
  background-color: #e8f4fd;
  color: #3498db;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
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
  
  &.continue {
    color: #27ae60;
    
    &:hover {
      background-color: #27ae60;
      color: white;
    }
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

// Code Modal Styles
const CodeModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const CodeModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const CodeModalHeader = styled.div`
  padding: 20px 30px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
`;

const CodeModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CodeModalBody = styled.div`
  padding: 0;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CodeContainer = styled.div`
  flex: 1;
  overflow: auto;
  background: #f8f9fa;
`;

const CodeContent = styled.pre`
  margin: 0;
  padding: 20px;
  background: #2d3748;
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const CodeModalActions = styled.div`
  padding: 20px 30px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
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
  transition: all 0.2s;
`;

const PrimaryButton = styled(ModalButton)`
  background: #3498db;
  color: white;
  
  &:hover {
    background: #2980b9;
  }
`;

const SecondaryButton = styled(ModalButton)`
  background: #95a5a6;
  color: white;
  
  &:hover {
    background: #7f8c8d;
  }
`;

// Environment Selection Modal
const EnvModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
`;

const EnvModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const EnvModalTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EnvList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const EnvItem = styled.div`
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3498db;
    background: #f8f9fa;
  }
  
  &.selected {
    border-color: #3498db;
    background: #e3f2fd;
  }
`;

const EnvName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const EnvDetails = styled.div`
  font-size: 12px;
  color: #7f8c8d;
`;

const EnvModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const LoadingMessage = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1002;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Prompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [environments, setEnvironments] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [pendingPromptId, setPendingPromptId] = useState(null);

  useEffect(() => {
    fetchPrompts();
    fetchEnvironments();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      // Fetch all prompts by setting a high limit to bypass pagination
      const response = await api.get('/prompts?limit=1000');
      setPrompts(response.data.prompts || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast.error('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const response = await api.get('/environments');
      const envs = Array.isArray(response.data) ? response.data : (response.data.environments || []);
      setEnvironments(envs);
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const handleCreatePrompt = async (promptData) => {
    try {
      const response = await api.post('/prompts', promptData);
      setPrompts([response.data, ...prompts]);
      setShowCreateModal(false);
      toast.success('Prompt created successfully');
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast.error('Failed to create prompt');
    }
  };

  const handleDeletePrompt = async (promptId) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await api.delete(`/prompts/${promptId}`);
        setPrompts(prompts.filter(p => p._id !== promptId));
        toast.success('Prompt deleted successfully');
      } catch (error) {
        console.error('Error deleting prompt:', error);
        toast.error('Failed to delete prompt');
      }
    }
  };

  const handleEditClick = (prompt) => {
    setEditingPrompt(prompt);
    setShowEditModal(true);
  };

  const handleCopyClick = (prompt) => {
    // Open modal with copied seed (clear ids and timestamps)
    const seed = {
      ...prompt,
      title: `${prompt.title} (Copy)`,
      promptId: undefined,
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };
    setEditingPrompt(seed);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (data) => {
    try {
      // If editing an existing prompt, PUT; if copying (no _id), POST
      if (editingPrompt?._id) {
        const res = await api.put(`/prompts/${editingPrompt._id}`, data);
        setPrompts(prompts.map(p => (p._id === editingPrompt._id ? res.data : p)));
        toast.success('Prompt updated');
      } else {
        const res = await api.post('/prompts', data);
        setPrompts([res.data, ...prompts]);
        toast.success('Prompt copied');
      }
      setShowEditModal(false);
      setEditingPrompt(null);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    }
  };

  const handleViewPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setShowDetailsModal(true);
  };

  const handleGenerateTest = async (promptId, selectedEnvironment = null) => {
    try {
      setGeneratingCode(true);
      const prompt = prompts.find(p => p._id === promptId);
      
      let response;
      if (selectedEnvironment) {
        // Use generate-llm-playwright endpoint for LLM generation
        response = await api.post('/code-generation/generate-llm-playwright', {
          promptContent: prompt?.promptContent || prompt?.content || '',
          testName: `Generated from ${prompt?.title}`,
          testType: prompt?.testType || 'UI Test',
          environment: selectedEnvironment, // Pass full environment object
          parsedSteps: prompt?.metadata?.parsedSteps || [], // Send parsed steps for reference
          baseUrl: prompt?.baseUrl // Pass the prompt's baseUrl to take priority
        });
      } else {
        // Use template-based generation (no LLM)
        response = await api.post(`/prompts/${promptId}/generate-test`, {
          testName: `Generated from ${prompt?.title}`,
          environmentId: null,
          options: {
            useLLM: false,
            includeAllureReport: true,
            addTestDescription: true,
            includeTestSteps: true
          }
        });
      }
      
      setGeneratedCode({
        testCode: response.data.testCode,
        testName: response.data.testName,
        filePath: response.data.filePath,
        testId: response.data.testId,
        prompt: prompt,
        execution: response.data.execution
      });
      setShowCodeModal(true);
      
      const generationMethod = response.data.metadata?.generatedWith || 'Template';
      const llmProvider = selectedEnvironment?.llmConfiguration?.provider || 'Template';
      
      if (selectedEnvironment) {
        if (response.data.execution?.started) {
          toast.success(`🤖 Test generated and running in browser using ${llmProvider}`);
        } else {
          toast.success(`🤖 ${generationMethod} code generated using ${llmProvider}`);
        }
      } else {
        toast.success(`⚡ ${generationMethod} code generated using template approach`);
      }
      
      console.log('Generated test:', response.data);
          } catch (error) {
        console.error('Error generating test:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to generate test';
        toast.error(`Failed to generate test: ${errorMessage}`);
      } finally {
        setGeneratingCode(false);
      }
  };

  const handleGenerateClick = (promptId) => {
    if (environments.length === 0) {
      // No environments available, generate without LLM
      handleGenerateTest(promptId, null);
    } else {
      // Show environment selection modal
      setPendingPromptId(promptId);
      setShowEnvModal(true);
    }
  };

  const checkSessionExists = async () => {
    try {
      const response = await api.get('/test-execution/check-session');
      return response.data.exists;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };


  const handleContinueExecution = async (promptId) => {
    try {
      const prompt = prompts.find(p => p._id === promptId);
      if (!prompt) {
        toast.error('Prompt not found');
        return;
      }

      // Check if session exists
      const sessionExists = await checkSessionExists();
      if (!sessionExists) {
        toast.warning('No active session found. Please run a login prompt first to create a session.');
        return;
      }

      // Show continue execution modal
      setSelectedPrompt(prompt);
      setShowContinueModal(true);
      
    } catch (error) {
      console.error('Error continuing execution:', error);
      toast.error('Failed to continue execution');
    }
  };

  const handleEnvSelect = (env) => {
    setSelectedEnv(env);
  };

  const handleContinueExecutionFromModal = async (promptId, options) => {
    try {
      setGeneratingCode(true);
      
      const prompt = prompts.find(p => p._id === promptId);
      if (!prompt) {
        throw new Error('Prompt not found');
      }
      
      const response = await api.post(`/code-generation/generate-and-run`, {
        promptContent: prompt.promptContent,
        testName: prompt.title,
        testType: prompt.testType,
        baseUrl: prompt.baseUrl || '',
        useExistingSession: true,
        environment: options.environment,
        analysisResult: options.analysisResult
      });

      if (response.data.success) {
        toast.success('Test generated and execution started successfully!');
        // Refresh prompts to show updated data
        fetchPrompts();
      } else {
        throw new Error(response.data.message || 'Failed to generate test');
      }
    } catch (error) {
      console.error('Error in continue execution from modal:', error);
      toast.error(`Failed to continue execution: ${error.message}`);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleEnvConfirm = () => {
    if (pendingPromptId) {
      handleGenerateTest(pendingPromptId, selectedEnv);
      setShowEnvModal(false);
      setSelectedEnv(null);
      setPendingPromptId(null);
    }
  };

  const handleEnvCancel = () => {
    setShowEnvModal(false);
    setSelectedEnv(null);
    setPendingPromptId(null);
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.promptContent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PromptsContainer>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div>Loading prompts...</div>
        </div>
      </PromptsContainer>
    );
  }

  return (
    <PromptsContainer>
      <Header>
        <Title>
          <TitleIcon>
            <FiEdit3 />
          </TitleIcon>
          Prompts
        </Title>
        <HeaderActions>
          <SearchInput
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ViewToggle>
            <ViewToggleButton
              $active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              <FiList />
              List
            </ViewToggleButton>
            <ViewToggleButton
              $active={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid />
              Grid
            </ViewToggleButton>
          </ViewToggle>
          <Button
            className="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus />
            Create New Prompt
          </Button>
        </HeaderActions>
      </Header>

      {filteredPrompts.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FiEdit3 />
          </EmptyIcon>
          <EmptyTitle>No prompts found</EmptyTitle>
          <EmptyDescription>
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first prompt to get started'}
          </EmptyDescription>
        </EmptyState>
      ) : viewMode === 'list' ? (
        <PromptsList>
          {filteredPrompts.map((prompt) => (
            <PromptItem key={prompt._id}>
              <PromptInfo>
                <PromptTitle>{prompt.title}</PromptTitle>
                <PromptDescription>{prompt.description}</PromptDescription>
                <PromptMeta>
                  <span>Type: {prompt.testType}</span>
                  <span>Created: {new Date(prompt.createdAt).toLocaleDateString()}</span>
                  <span>Tags: {prompt.tags?.join(', ') || 'None'}</span>
                </PromptMeta>
              </PromptInfo>
              <PromptActions>
                <ActionButton
                  onClick={() => handleViewPrompt(prompt)}
                  title="View Details"
                >
                  <FiEye />
                </ActionButton>
                <ActionButton
                  onClick={() => handleEditClick(prompt)}
                  title="Edit Prompt"
                >
                  <FiEdit3 />
                </ActionButton>
                <ActionButton
                  onClick={() => handleCopyClick(prompt)}
                  title="Copy Prompt"
                >
                  <FiPlus />
                </ActionButton>
                <ActionButton
                  onClick={() => handleGenerateClick(prompt._id)}
                  title="Generate Enhanced Test with LLM"
                  disabled={generatingCode}
                >
                  {generatingCode ? <FiZap /> : <FiCode />}
                </ActionButton>
                <ActionButton
                  onClick={() => handleContinueExecution(prompt._id)}
                  title="Continue Execution (Use Existing Session)"
                  className="continue"
                >
                  <FiRefreshCw />
                </ActionButton>
                <ActionButton
                  onClick={() => handleDeletePrompt(prompt._id)}
                  title="Delete"
                  className="danger"
                >
                  <FiTrash2 />
                </ActionButton>
              </PromptActions>
            </PromptItem>
          ))}
        </PromptsList>
      ) : (
        <PromptsGrid>
          {filteredPrompts.map((prompt) => (
            <PromptCard key={prompt._id}>
              <PromptCardInfo>
                <PromptTitle>{prompt.title}</PromptTitle>
                <PromptDescription>{prompt.description}</PromptDescription>
                <PromptCardMeta>
                  <div><strong>Type:</strong> {prompt.testType}</div>
                  <div><strong>Created:</strong> {new Date(prompt.createdAt).toLocaleDateString()}</div>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <PromptTags>
                      {prompt.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </PromptTags>
                  )}
                </PromptCardMeta>
              </PromptCardInfo>
              <PromptCardActions>
                <ActionButton
                  onClick={() => handleViewPrompt(prompt)}
                  title="View Details"
                >
                  <FiEye />
                </ActionButton>
                <ActionButton
                  onClick={() => handleEditClick(prompt)}
                  title="Edit Prompt"
                >
                  <FiEdit3 />
                </ActionButton>
                <ActionButton
                  onClick={() => handleCopyClick(prompt)}
                  title="Copy Prompt"
                >
                  <FiPlus />
                </ActionButton>
                <ActionButton
                  onClick={() => handleGenerateClick(prompt._id)}
                  title="Generate Enhanced Test with LLM"
                  disabled={generatingCode}
                >
                  {generatingCode ? <FiZap /> : <FiCode />}
                </ActionButton>
                <ActionButton
                  onClick={() => handleContinueExecution(prompt._id)}
                  title="Continue Execution (Use Existing Session)"
                  className="continue"
                >
                  <FiRefreshCw />
                </ActionButton>
                <ActionButton
                  onClick={() => handleDeletePrompt(prompt._id)}
                  title="Delete"
                  className="danger"
                >
                  <FiTrash2 />
                </ActionButton>
              </PromptCardActions>
            </PromptCard>
          ))}
        </PromptsGrid>
      )}

      {showCreateModal && (
        <CreatePromptModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePrompt}
        />
      )}

      {showDetailsModal && selectedPrompt && (
        <PromptDetailsModal
          prompt={selectedPrompt}
          onClose={() => setShowDetailsModal(false)}
          onGenerateTest={() => {
            handleGenerateClick(selectedPrompt._id);
            setShowDetailsModal(false);
          }}
        />
      )}

      {/* Edit / Copy Prompt Modal */}
      {showEditModal && (
        <EditPromptModal
          initial={editingPrompt}
          onClose={() => { setShowEditModal(false); setEditingPrompt(null); }}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* Environment Selection Modal */}
      {showEnvModal && (
        <EnvModalOverlay>
          <EnvModalContainer>
            <EnvModalTitle>
              <FiZap />
              Select LLM Environment
            </EnvModalTitle>
            <EnvList>
              {environments.map((env) => (
                <EnvItem
                  key={env._id}
                  className={selectedEnv?._id === env._id ? 'selected' : ''}
                  onClick={() => handleEnvSelect(env)}
                >
                  <EnvName>{env.name}</EnvName>
                  <EnvDetails>
                    {env.llmConfiguration?.enabled ? (
                      <>
                        🤖 {env.llmConfiguration?.llmProvider || 'Local LLM'} • 
                        {env.llmConfiguration?.model || 'Default Model'}
                      </>
                    ) : (
                      'No LLM Configuration'
                    )}
                  </EnvDetails>
                </EnvItem>
              ))}
            </EnvList>
            <EnvModalActions>
              <SecondaryButton onClick={handleEnvCancel}>
                Cancel
              </SecondaryButton>
              <PrimaryButton 
                onClick={handleEnvConfirm}
                disabled={!selectedEnv}
              >
                Generate Enhanced Test
              </PrimaryButton>
            </EnvModalActions>
          </EnvModalContainer>
        </EnvModalOverlay>
      )}

      {/* Generated Code Modal */}
      {showCodeModal && generatedCode && (
        <CodeModalOverlay>
          <CodeModalContainer>
            <CodeModalHeader>
              <CodeModalTitle>
                <FiCode />
                Generated Test Code
              </CodeModalTitle>
              <ModalButton onClick={() => setShowCodeModal(false)}>
                <FiX size={20} />
              </ModalButton>
            </CodeModalHeader>
            <CodeModalBody>
              {generatedCode.execution?.started && (
                <div style={{ 
                  background: '#e8f5e8', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '16px',
                  border: '1px solid #4caf50'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiPlay style={{ color: '#4caf50' }} />
                    <strong>Test is running in browser...</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Command: {generatedCode.execution.command}
                  </div>
                </div>
              )}
              <CodeContainer>
                <CodeContent>{generatedCode.testCode}</CodeContent>
              </CodeContainer>
            </CodeModalBody>
            <CodeModalActions>
              <SecondaryButton onClick={() => setShowCodeModal(false)}>
                Close
              </SecondaryButton>
              <PrimaryButton onClick={() => {
                navigator.clipboard.writeText(generatedCode.testCode);
                toast.success('Code copied to clipboard!');
              }}>
                Copy Code
              </PrimaryButton>
            </CodeModalActions>
          </CodeModalContainer>
        </CodeModalOverlay>
      )}

      {/* Loading Message */}
      {/* Continue Execution Modal */}
      {showContinueModal && selectedPrompt && (
        <ContinueExecutionModal
          isOpen={showContinueModal}
          onClose={() => {
            setShowContinueModal(false);
            setSelectedPrompt(null);
          }}
          prompt={selectedPrompt}
          onExecute={handleContinueExecutionFromModal}
        />
      )}

      {generatingCode && (
        <LoadingMessage>
          <LoadingSpinner />
          AI Generating script for you
        </LoadingMessage>
      )}
    </PromptsContainer>
  );
};

export default Prompts;
