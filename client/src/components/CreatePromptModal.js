import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiSave } from 'react-icons/fi';

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
  max-width: 600px;
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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid #ecf0f1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

const CreatePromptModal = ({ onClose, onSubmit, initialData, titleOverride, submitLabel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promptContent: '',
    testType: 'UI Test',
    tags: '',
    additionalContext: '',
    baseUrl: '',
    additionalInformation: ''
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        promptContent: initialData.promptContent || initialData.content || '',
        testType: initialData.testType || 'UI Test',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''),
        additionalContext: initialData.additionalContext || '',
        baseUrl: initialData.baseUrl || '',
        additionalInformation: initialData.additionalInformation || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.promptContent) {
      alert('Title and Prompt Content are required');
      return;
    }
    
    onSubmit(formData);
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
          <ModalTitle>{titleOverride || 'Create New Prompt'}</ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label htmlFor="title">Title *</Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter prompt title"
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
                placeholder="Enter prompt description"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="promptContent">Prompt Content *</Label>
              <TextArea
                id="promptContent"
                name="promptContent"
                value={formData.promptContent}
                onChange={handleInputChange}
                placeholder="Enter your test prompt (e.g., 'Navigate to login, enter username/password, click login, validate dashboard')"
                required
                style={{ minHeight: '120px' }}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="testType">Test Type</Label>
              <Select
                id="testType"
                name="testType"
                value={formData.testType}
                onChange={handleInputChange}
              >
                <option value="UI Test">UI Test</option>
                <option value="API Test">API Test</option>
                <option value="E2E Test">E2E Test</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="smoke, regression, critical"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="additionalContext">Additional Context</Label>
              <Input
                type="text"
                id="additionalContext"
                name="additionalContext"
                value={formData.additionalContext}
                onChange={handleInputChange}
                placeholder="Any additional context for the test"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                type="url"
                id="baseUrl"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="additionalInformation">Additional Information</Label>
              <TextArea
                id="additionalInformation"
                name="additionalInformation"
                value={formData.additionalInformation}
                onChange={handleInputChange}
                placeholder="Any additional information or requirements"
              />
            </FormGroup>
          </ModalBody>
          
          <ModalFooter>
            <Button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="primary"
            >
              <FiSave />
              {submitLabel || 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreatePromptModal;
