import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { FiX, FiCopy, FiDownload, FiCode, FiFileText, FiSave, FiEdit3 } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-toastify';

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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #3498db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: #e9ecef;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;

  &:hover {
    background: #dee2e6;
    color: #495057;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SpecInfo = styled.div`
  padding: 16px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
`;

const CodeContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CodeHeader = styled.div`
  padding: 12px 24px;
  background: #2c3e50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
`;

const CodeActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const CodeBlock = styled.div`
  flex: 1;
  overflow: auto;
  background: #f8f9fa;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6c757d;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #495057;
  margin: 0 0 8px 0;
`;

const EmptyDescription = styled.p`
  font-size: 14px;
  color: #6c757d;
  margin: 0;
`;

const EditTextAreaContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  background: #1d1f21;
  color: #c5c8c6;
`;

const LineNumbers = styled.div`
  background: #1d1f21;
  color: #969896;
  padding: 16px 8px 16px 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  text-align: right;
  user-select: none;
  border-right: 1px solid #373b41;
  min-width: 50px;
  white-space: pre;
  overflow: hidden;
  flex-shrink: 0;
`;

const EditTextArea = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #1d1f21;
  color: #c5c8c6;
  resize: none;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
  
  &:focus {
    background: #1d1f21;
    box-shadow: inset 0 0 0 2px #3498db;
  }
`;

const SaveButton = styled(ActionButton)`
  background: #27ae60;
  border-color: #27ae60;
  
  &:hover {
    background: #229954;
    border-color: #229954;
  }
`;

const CancelButton = styled(ActionButton)`
  background: #e74c3c;
  border-color: #e74c3c;
  
  &:hover {
    background: #c0392b;
    border-color: #c0392b;
  }
`;

const SpecDetailsModal = ({ isOpen, onClose, test, specContent, onEdit, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const lineNumbers = useMemo(() => {
    const lines = editedContent.split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  }, [editedContent]);

  useEffect(() => {
    if (specContent) {
      setEditedContent(specContent);
    }
  }, [specContent]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditedContent('');
    }
  }, [isOpen]);

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  if (!isOpen || !test) return null;

  const handleCopyCode = () => {
    if (specContent) {
      navigator.clipboard.writeText(specContent);
      toast.success('Spec code copied to clipboard');
    }
  };

  const handleDownloadCode = () => {
    if (specContent) {
      const blob = new Blob([specContent], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${test.testName || 'test'}.spec.ts`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Spec file downloaded');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      // Import api here to avoid circular dependencies
      const api = (await import('../config/axios')).default;
      
      let endpoint;
      let payload;
      
      // Determine the correct endpoint based on test type
      if (test.isRealFile) {
        endpoint = `/test-files/${test.id}/content`;
        payload = { content: editedContent };
      } else if (test.testSuiteId || test.suiteId) {
        endpoint = `/test-suites/${test.testSuiteId || test.suiteId}/spec`;
        payload = { specContent: editedContent };
      } else if (test.promptId) {
        endpoint = `/prompts/${test.promptId}`;
        payload = { specContent: editedContent };
      } else {
        // Fallback endpoint
        endpoint = `/test-files/${test.id}/content`;
        payload = { content: editedContent };
      }
      
      await api.put(endpoint, payload);
      
      toast.success('Spec content saved successfully');
      setIsEditing(false);
      
      // Call onSave callback if provided to refresh the content
      if (onSave) {
        onSave(editedContent);
      }
    } catch (error) {
      console.error('Error saving spec content:', error);
      toast.error('Failed to save spec content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(specContent || '');
    setIsEditing(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLineCount = (content) => {
    if (!content) return 0;
    return content.split('\n').length;
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
          <HeaderLeft>
            <HeaderIcon>
              <FiFileText />
            </HeaderIcon>
            <HeaderInfo>
              <ModalTitle>Playwright Spec Details</ModalTitle>
              <ModalSubtitle>{test.testName || 'Generated Test'}</ModalSubtitle>
            </HeaderInfo>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <SpecInfo>
            <InfoItem>
              <InfoLabel>Test ID</InfoLabel>
              <InfoValue>{test.id || test.testId || 'N/A'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Type</InfoLabel>
              <InfoValue>{test.testType || 'UI Test'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Project Model</InfoLabel>
              <InfoValue>{test.projectModel || 'Default Model'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Tags</InfoLabel>
              <InfoValue>{test.tags || 'None'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Lines</InfoLabel>
              <InfoValue>{getLineCount(specContent)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Size</InfoLabel>
              <InfoValue>{formatFileSize(specContent ? specContent.length : 0)}</InfoValue>
            </InfoItem>
          </SpecInfo>

          <CodeContainer>
            {specContent ? (
              <>
                <CodeHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCode />
                    {test.testName || 'test'}.spec.ts
                  </div>
                  <CodeActions>
                    {!isEditing ? (
                      <>
                        <ActionButton onClick={handleCopyCode}>
                          <FiCopy />
                          Copy
                        </ActionButton>
                        <ActionButton onClick={handleDownloadCode}>
                          <FiDownload />
                          Download
                        </ActionButton>
                        <ActionButton onClick={handleEdit}>
                          <FiEdit3 />
                          Edit
                        </ActionButton>
                      </>
                    ) : (
                      <>
                        <CancelButton onClick={handleCancel}>
                          <FiX />
                          Cancel
                        </CancelButton>
                        <SaveButton onClick={handleSave} disabled={isSaving}>
                          <FiSave />
                          {isSaving ? 'Saving...' : 'Save'}
                        </SaveButton>
                      </>
                    )}
                  </CodeActions>
                </CodeHeader>
                <CodeBlock>
                  {isEditing ? (
                    <EditTextAreaContainer>
                      <LineNumbers ref={lineNumbersRef}>
                        {lineNumbers}
                      </LineNumbers>
                      <EditTextArea
                        ref={textareaRef}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        onScroll={handleScroll}
                        placeholder="Enter your Playwright test code here..."
                      />
                    </EditTextAreaContainer>
                  ) : (
                    <SyntaxHighlighter
                      language="typescript"
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: '1.5',
                        background: 'transparent'
                      }}
                      showLineNumbers
                      wrapLines
                    >
                      {specContent}
                    </SyntaxHighlighter>
                  )}
                </CodeBlock>
              </>
            ) : (
              <EmptyState>
                <EmptyIcon>
                  <FiFileText />
                </EmptyIcon>
                <EmptyTitle>No Spec Content Available</EmptyTitle>
                <EmptyDescription>
                  The spec file content could not be loaded. Please try refreshing or check if the file exists.
                </EmptyDescription>
              </EmptyState>
            )}
          </CodeContainer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SpecDetailsModal;

