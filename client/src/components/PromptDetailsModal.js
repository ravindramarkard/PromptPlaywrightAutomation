import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiPlay, FiCode, FiCopy } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-toastify';
import api from '../config/axios';

const ModalOverlay = styled.div`
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
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #ecf0f1;
    color: #2c3e50;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const PromptInfo = styled.div`
  margin-bottom: 30px;
`;

const PromptTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
`;

const PromptDescription = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 16px 0;
`;

const PromptMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const MetaItem = styled.div`
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
`;

const MetaLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const MetaValue = styled.div`
  font-size: 14px;
  color: #2c3e50;
`;

const PromptContent = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
`;

const ContentBox = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
`;

const ParsedSteps = styled.div`
  margin-bottom: 30px;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StepItem = styled.div`
  padding: 16px;
  background-color: #f8f9fa;
  border-left: 4px solid #3498db;
  border-radius: 0 6px 6px 0;
`;

const StepHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const StepNumber = styled.span`
  font-weight: 600;
  color: #3498db;
`;

const StepAction = styled.span`
  font-size: 12px;
  background-color: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
`;

const StepText = styled.div`
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const StepDetails = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
`;

const GeneratedCode = styled.div`
  margin-bottom: 30px;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CodeActions = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
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
`;

const CodeBlock = styled.div`
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid #ecf0f1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const PromptDetailsModal = ({ prompt, onClose, onGenerateTest }) => {
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setLoading(true);
      const response = await api.post('/code-generation/generate-playwright', {
        promptContent: prompt.promptContent,
        testName: prompt.title,
        testType: prompt.testType,
        baseUrl: prompt.baseUrl
      });
      
      setGeneratedCode(response.data.testCode);
      toast.success('Code generated successfully');
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Prompt Details</ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <PromptInfo>
            <PromptTitle>{prompt.title}</PromptTitle>
            <PromptDescription>{prompt.description}</PromptDescription>
            
            <PromptMeta>
              <MetaItem>
                <MetaLabel>Test Type</MetaLabel>
                <MetaValue>{prompt.testType}</MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaLabel>Created</MetaLabel>
                <MetaValue>{formatDate(prompt.createdAt)}</MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaLabel>Status</MetaLabel>
                <MetaValue style={{ 
                  color: prompt.status === 'active' ? '#27ae60' : '#7f8c8d',
                  textTransform: 'capitalize'
                }}>
                  {prompt.status}
                </MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaLabel>Tags</MetaLabel>
                <MetaValue>{prompt.tags?.join(', ') || 'None'}</MetaValue>
              </MetaItem>
            </PromptMeta>
          </PromptInfo>

          <PromptContent>
            <SectionTitle>Prompt Content</SectionTitle>
            <ContentBox>{prompt.promptContent}</ContentBox>
          </PromptContent>

          {prompt.metadata?.parsedSteps && prompt.metadata.parsedSteps.length > 0 && (
            <ParsedSteps>
              <SectionTitle>Parsed Steps</SectionTitle>
              <StepList>
                {prompt.metadata.parsedSteps.map((step, index) => (
                  <StepItem key={index}>
                    <StepHeader>
                      <StepNumber>Step {step.stepNumber}</StepNumber>
                      <StepAction>{step.action}</StepAction>
                    </StepHeader>
                    <StepText>{step.originalText}</StepText>
                    <StepDetails>
                      {step.target && <div><strong>Target:</strong> {step.target}</div>}
                      {step.value && <div><strong>Value:</strong> {step.value}</div>}
                      {step.assertion && <div><strong>Assertion:</strong> {step.assertion}</div>}
                    </StepDetails>
                  </StepItem>
                ))}
              </StepList>
            </ParsedSteps>
          )}

          <GeneratedCode>
            <CodeHeader>
              <SectionTitle>Generated Test Code</SectionTitle>
              <CodeActions>
                <Button
                  className="secondary"
                  onClick={handleGenerateCode}
                  disabled={loading}
                >
                  <FiCode />
                  {loading ? 'Generating...' : 'Generate Code'}
                </Button>
                {generatedCode && (
                  <Button
                    className="secondary"
                    onClick={handleCopyCode}
                  >
                    <FiCopy />
                    Copy
                  </Button>
                )}
              </CodeActions>
            </CodeHeader>
            
            {generatedCode ? (
              <CodeBlock>
                <SyntaxHighlighter
                  language="typescript"
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }}
                >
                  {generatedCode}
                </SyntaxHighlighter>
              </CodeBlock>
            ) : (
              <ContentBox style={{ textAlign: 'center', color: '#7f8c8d' }}>
                Click "Generate Code" to see the Playwright test code
              </ContentBox>
            )}
          </GeneratedCode>
        </ModalBody>
        
        <ModalFooter>
          <Button
            className="secondary"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="primary"
            onClick={onGenerateTest}
          >
            <FiPlay />
            Generate & Run Test
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PromptDetailsModal;
