import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../config/axios';
import RunTestModal from '../components/RunTestModal';
import RunTestSuiteModal from '../components/RunTestSuiteModal';
import SpecDetailsModal from '../components/SpecDetailsModal';
import CreateTestSuiteModal from '../components/CreateTestSuiteModal';
import EditTestSuiteModal from '../components/EditTestSuiteModal';
import TestExecutionStatus from '../components/TestExecutionStatus';
import ExecutionDetailsModal from '../components/ExecutionDetailsModal';

const TestSuiteContainer = styled.div`
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const PaginationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
  color: #666;
`;

const PageSizeSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: ${props => props.$active ? '#3498db' : 'white'};
  color: ${props => props.$active ? 'white' : '#666'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? '#2980b9' : '#f8f9fa'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

// Overview styled components
const OverviewContainer = styled.div`
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: ${props => props.color || '#3498db'}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color || '#3498db'};
  font-size: 20px;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  margin: 0 0 8px 0;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
`;

const StatDescription = styled.p`
  font-size: 12px;
  color: #95a5a6;
  margin: 0;
`;

const QuickActionsSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const QuickActionsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuickActionsGrid = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const QuickActionButton = styled.button`
  background-color: ${props => props.color || '#3498db'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

// Test Suites styled components
const TestSuitesContainer = styled.div`
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const TestSuitesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const TestSuitesTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CreateButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }
`;

const TestSuitesTable = styled.table`
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TestSuitesTableHeader = styled.thead`
  background-color: #f8f9fa;
`;

const TestSuitesTableHeaderRow = styled.tr`
  border-bottom: 1px solid #e9ecef;
`;

const TestSuitesTableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
`;

const TestSuitesTableBody = styled.tbody``;

const TestSuitesTableRow = styled.tr`
  border-bottom: 1px solid #e9ecef;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TestSuitesTableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #495057;
`;

const SuiteName = styled.div`
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const SuiteSubtitle = styled.div`
  font-size: 12px;
  color: #7f8c8d;
`;

const EnvironmentBadge = styled.span`
  background-color: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const TestSuitesTestCount = styled.span`
  font-weight: 500;
  color: #2c3e50;
`;

const TestSuitesActionButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const TestSuitesRunButton = styled(TestSuitesActionButton)`
  background-color: #27ae60;
  color: white;
  
  &:hover {
    background-color: #229954;
  }
`;

const TestSuitesEditButton = styled(TestSuitesActionButton)`
  color: #3498db;
  
  &:hover {
    background-color: #e3f2fd;
  }
`;

const TestSuitesDeleteButton = styled(TestSuitesActionButton)`
  color: #e74c3c;
  
  &:hover {
    background-color: #ffebee;
  }
`;

const TestSuiteManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFilter, setActiveFilter] = useState('ui');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  
  // Test data state
  const [tests, setTests] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState([]);
  const [showRunTestModal, setShowRunTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);
  const [showCreateTestSuiteModal, setShowCreateTestSuiteModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specContent, setSpecContent] = useState('');
  const [loadingSpec, setLoadingSpec] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSpecContent, setEditingSpecContent] = useState('');
  const [savingSpec, setSavingSpec] = useState(false);
  const [deletedTestIds, setDeletedTestIds] = useState(new Set()); // Track deleted test IDs
  
  // Test Suite editing state
  const [showEditTestSuiteModal, setShowEditTestSuiteModal] = useState(false);
  const [editingTestSuite, setEditingTestSuite] = useState(null);
  const [testSuites, setTestSuites] = useState([]);
  
  // Test Suite run state
  const [showRunTestSuiteModal, setShowRunTestSuiteModal] = useState(false);
  const [runningTestSuite, setRunningTestSuite] = useState(null);
  const [currentExecutionId, setCurrentExecutionId] = useState(null);
  const [showExecutionStatus, setShowExecutionStatus] = useState(false);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Debug activeFilter changes
  useEffect(() => {
    console.log('=== ACTIVE FILTER CHANGED ===');
    console.log('New activeFilter:', activeFilter);
    console.log('Current tests length:', tests.length);
    console.log('================================');
  }, [activeFilter]);

  // Cleanup execution state on unmount
  useEffect(() => {
    return () => {
      setIsExecuting(false);
      setShowExecutionStatus(false);
      setCurrentExecutionId(null);
    };
  }, []);

  // Reset filter when switching to ALL TESTS tab
  useEffect(() => {
    if (activeTab === 'all-tests') {
      console.log('Resetting filter to ui for ALL TESTS tab');
      setActiveFilter('ui');
      setCurrentPage(1); // Reset to first page
    }
  }, [activeTab]);

  // Update pagination when tests or filter changes
  useEffect(() => {
    if (activeTab === 'all-tests') {
      // Filter tests directly here to avoid dependency issues
      const filtered = tests.filter(test => {
        const testType = test.type.toLowerCase();
        if (activeFilter === 'ui') {
          return testType === 'ui test' || testType === 'ui';
        }
        if (activeFilter === 'api') {
          return testType === 'api test' || testType === 'api';
        }
        return testType === activeFilter;
      });
      
      const total = filtered.length;
      const pages = Math.ceil(total / pageSize);
      
      setTotalTests(total);
      setTotalPages(pages);
      
      // Reset to page 1 if current page is beyond total pages
      if (currentPage > pages && pages > 0) {
        setCurrentPage(1);
      }
    }
  }, [activeTab, tests, activeFilter, pageSize, currentPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    if (activeTab === 'all-tests') {
      setCurrentPage(1);
    }
  }, [activeFilter, activeTab]);
  
  // Debug tests array changes
  useEffect(() => {
    console.log('=== TESTS ARRAY CHANGED ===');
    console.log('Length:', tests.length);
    console.log('Tests:', tests.map(t => ({ id: t.id, type: t.type, name: t.name })));
    console.log('UI tests count:', tests.filter(t => t.type === 'ui' || t.type === 'ui test').length);
    console.log('API tests count:', tests.filter(t => t.type === 'api' || t.type === 'api test').length);
    console.log('================================');
  }, [tests]);

  // Load deleted test IDs from localStorage on component mount
  useEffect(() => {
    const savedDeletedIds = localStorage.getItem('deletedTestIds');
    if (savedDeletedIds) {
      try {
        const parsedIds = JSON.parse(savedDeletedIds);
        setDeletedTestIds(new Set(parsedIds));
        console.log('Loaded deleted test IDs from localStorage:', parsedIds);
      } catch (error) {
        console.error('Error loading deleted test IDs from localStorage:', error);
      }
    }
  }, []);

  // Save deleted test IDs to localStorage whenever they change
  useEffect(() => {
    if (deletedTestIds.size > 0) {
      localStorage.setItem('deletedTestIds', JSON.stringify([...deletedTestIds]));
      console.log('Saved deleted test IDs to localStorage:', [...deletedTestIds]);
    }
  }, [deletedTestIds]);

  useEffect(() => {
    fetchAllTests();
    fetchTestSuites();
  }, []);

  const fetchTestSuites = async () => {
    try {
      const response = await api.get('/test-suites');
      if (response.data && response.data.testSuites && Array.isArray(response.data.testSuites)) {
        // Filter for test suites with the new format (created through the UI)
        const newFormatSuites = response.data.testSuites.filter(suite => 
          suite.id && suite.name && suite.testType
        );
        setTestSuites(newFormatSuites);
      }
    } catch (error) {
      console.error('Error fetching test suites:', error);
    }
  };

  // Handle URL hash to set active tab
  useEffect(() => {
    const hash = location.hash.substring(1); // Remove the # symbol
    console.log('URL hash:', hash);
    console.log('Current activeTab:', activeTab);
    if (hash === 'all-tests') {
      console.log('Setting activeTab to all-tests');
      setActiveTab('all-tests');
    }
  }, [location.hash, activeTab]);

  const fetchAllTests = useCallback(async () => {
    if (isFetching) {
      console.log('Already fetching tests, skipping...');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      console.log('=== FETCHING ALL TESTS ===');
      console.log('Current tests length before fetch:', tests.length);
      const allTests = [];
      
      // Fetch real test files from the new API endpoint
      const testFilesResponse = await api.get('/test-files?type=all');
      if (testFilesResponse.data && testFilesResponse.data.success) {
        testFilesResponse.data.tests.forEach(testFile => {
          allTests.push({
            id: testFile.id,
            name: testFile.name,
            projectModel: 'Default Model',
            type: testFile.type.toLowerCase(),
            tags: testFile.tags,
            createdAt: testFile.created,
            filePath: testFile.filePath,
            status: 'ready',
            source: 'File System',
            project: 'Generated',
            isGenerated: true,
            isRealFile: true
          });
        });
      }
      
      // Fetch all prompts first to get the correct tags and types
      const promptsResponse = await api.get('/prompts');
      const promptsMap = new Map();
      if (promptsResponse.data && promptsResponse.data.prompts) {
        promptsResponse.data.prompts.forEach(prompt => {
          promptsMap.set(prompt._id, prompt);
        });
      }
      
      // Note: Test suites should NOT be included in the ALL TESTS tab
      // Test suites are only shown in the TEST SUITES tab
      
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
      
       // Filter out deleted tests
       const filteredTests = allTests.filter(test => !deletedTestIds.has(test.id));
       
       console.log('Setting tests:', filteredTests.length, 'tests (filtered from', allTests.length, 'total)');
       console.log('Tests breakdown:');
       console.log('- UI tests:', filteredTests.filter(t => t.type === 'ui').length);
       console.log('- API tests:', filteredTests.filter(t => t.type === 'api').length);
       console.log('- Deleted tests:', deletedTestIds.size);
       console.log('================================');
       setTests(filteredTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
      setTests([]); // Set empty array on error
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [isFetching, deletedTestIds]);

  const handleSelectTest = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAll = () => {
    const paginatedTests = getPaginatedTests();
    if (selectedTests.length === paginatedTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(paginatedTests.map(test => test.id));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleRunTest = async (testId) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      // Check if this is an API test
      if (test.type === 'API' || test.testType === 'API') {
        await handleRunApiTest(test);
      } else {
      setSelectedTest(test);
      setShowRunTestModal(true);
      }
    }
  };

  const handleRunApiTest = async (test) => {
    try {
      setLoading(true);
      
      // Get the test file path
      const testFilePath = test.filePath || test.path;
      
      if (!testFilePath) {
        toast.error('Test file path not found');
        return;
      }

      console.log(`🚀 Running API test: ${test.name}`);
      console.log(`📁 Test file: ${testFilePath}`);

      // Execute API test
      const response = await api.post('/test-execution/run-api', {
        testFile: testFilePath,
        environment: 'test',
        timeout: 30000,
        retries: 1
      });

      if (response.data.success) {
        toast.success('API test executed successfully!');
        console.log('API test execution result:', response.data);
      } else {
        toast.error(`API test execution failed: ${response.data.message}`);
        console.error('API test execution error:', response.data);
      }

    } catch (error) {
      console.error('Error running API test:', error);
      toast.error(`Failed to run API test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestRunComplete = (result) => {
    console.log('Test run completed:', result);
    toast.success('Test execution completed!');
    // No need to refresh the test list
  };

  const handleViewTest = async (testId) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      try {
        setLoadingSpec(true);
        setSelectedTest(test);
        setShowSpecModal(true);
        
        console.log('Loading spec for test:', test);
        
        if (test.isRealFile) {
          // For real file tests, try to read the file directly
          try {
            const response = await api.get(`/test-files/${testId}/content`);
            setSpecContent(response.data.content);
          } catch (error) {
            console.error('Error fetching real file content:', error);
            // Fallback: show a message that spec content is not available
            setSpecContent(`// Spec content for ${test.name}\n// File: ${test.filePath}\n// This is a real file from the file system\n// Content loading is not yet implemented for file system tests`);
          }
        } else if (test.source === 'Prompts' || test.isGenerated) {
          // Try test-suites endpoint
        try {
          const response = await api.get(`/test-suites/${testId}/spec`);
          setSpecContent(response.data.specContent);
        } catch (newEndpointError) {
            console.log('Test-suites endpoint failed, trying prompts endpoint:', newEndpointError);
            // Fallback to prompts endpoint if available
            if (test.promptId) {
              try {
          const response = await api.get(`/prompts/${test.promptId}/tests/${testId}/spec`);
          setSpecContent(response.data.specContent);
              } catch (promptError) {
                console.error('Prompts endpoint also failed:', promptError);
                setSpecContent(`// Spec content for ${test.name}\n// Error: Could not load spec content\n// Test ID: ${testId}\n// Error: ${promptError.message}`);
              }
            } else {
              setSpecContent(`// Spec content for ${test.name}\n// Error: No prompt ID available\n// Test ID: ${testId}`);
            }
          }
        } else {
          // Fallback for other test types
          setSpecContent(`// Spec content for ${test.name}\n// Test type: ${test.type}\n// Test ID: ${testId}\n// Spec content loading not implemented for this test type`);
        }
      } catch (error) {
        console.error('Error fetching spec content:', error);
        toast.error('Failed to load spec content');
        setSpecContent(`// Error loading spec content\n// Test: ${test.name}\n// Error: ${error.message}`);
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
        
        console.log('Loading spec for editing:', test);
        
        if (test.isRealFile) {
          // For real file tests, try to read the file directly
          try {
            const response = await api.get(`/test-files/${testId}/content`);
            setEditingSpecContent(response.data.content);
          } catch (error) {
            console.error('Error fetching real file content for editing:', error);
            // Fallback: show a message that editing is not available
            setEditingSpecContent(`// Spec content for ${test.name}\n// File: ${test.filePath}\n// This is a real file from the file system\n// Editing is not yet implemented for file system tests`);
          }
        } else if (test.source === 'Prompts' || test.isGenerated) {
          // Try test-suites endpoint
        try {
          const response = await api.get(`/test-suites/${testId}/spec`);
          setEditingSpecContent(response.data.specContent);
        } catch (newEndpointError) {
            console.log('Test-suites endpoint failed, trying prompts endpoint:', newEndpointError);
            // Fallback to prompts endpoint if available
            if (test.promptId) {
              try {
          const response = await api.get(`/prompts/${test.promptId}/tests/${testId}/spec`);
          setEditingSpecContent(response.data.specContent);
              } catch (promptError) {
                console.error('Prompts endpoint also failed:', promptError);
                setEditingSpecContent(`// Spec content for ${test.name}\n// Error: Could not load spec content for editing\n// Test ID: ${testId}\n// Error: ${promptError.message}`);
              }
            } else {
              setEditingSpecContent(`// Spec content for ${test.name}\n// Error: No prompt ID available\n// Test ID: ${testId}`);
            }
          }
        } else {
          // Fallback for other test types
          setEditingSpecContent(`// Spec content for ${test.name}\n// Test type: ${test.type}\n// Test ID: ${testId}\n// Spec content editing not implemented for this test type`);
        }
      } catch (error) {
        console.error('Error fetching spec content for editing:', error);
        toast.error('Failed to load spec content for editing');
        setEditingSpecContent(`// Error loading spec content for editing\n// Test: ${test.name}\n// Error: ${error.message}`);
      } finally {
        setLoadingSpec(false);
      }
    }
  };

  const handleSaveSpec = async () => {
    if (!selectedTest) return;
    
    try {
      setSavingSpec(true);
      console.log('Saving spec for test:', selectedTest);
      
      if (selectedTest.isRealFile) {
        // For real file tests, use the new PUT endpoint
        try {
          const response = await api.put(`/test-files/${selectedTest.id}/content`, {
            content: editingSpecContent,
            testName: selectedTest.name
          });
          
          if (response.data.success) {
            toast.success('Test file updated successfully!');
            setShowEditModal(false);
            setEditingSpecContent('');
            setSelectedTest(null);
          } else {
            toast.error('Failed to update test file');
          }
        } catch (error) {
          console.error('Error saving real file content:', error);
          toast.error('Failed to save test file content');
        }
        return;
      } else if (selectedTest.source === 'Prompts' || selectedTest.isGenerated) {
        // Try test-suites endpoint first
        try {
      const response = await api.put(`/test-suites/${selectedTest.id}/spec`, {
        specContent: editingSpecContent,
        testName: selectedTest.name
      });
      
      if (response.data.success) {
        toast.success('Spec file updated successfully!');
        setShowEditModal(false);
        setEditingSpecContent('');
        setSelectedTest(null);
          } else {
            toast.error('Failed to update spec file');
          }
        } catch (testSuitesError) {
          console.log('Test-suites endpoint failed, trying prompts endpoint:', testSuitesError);
          // Fallback to prompts endpoint if available
          if (selectedTest.promptId) {
            try {
              const response = await api.put(`/prompts/${selectedTest.promptId}/tests/${selectedTest.id}/spec`, {
                specContent: editingSpecContent,
                testName: selectedTest.name
              });
              
              if (response.data.success) {
                toast.success('Spec file updated successfully!');
                setShowEditModal(false);
                setEditingSpecContent('');
                setSelectedTest(null);
      } else {
        toast.error('Failed to update spec file');
              }
            } catch (promptError) {
              console.error('Prompts endpoint also failed:', promptError);
              toast.error('Failed to save spec content. No suitable endpoint found.');
            }
          } else {
            toast.error('Cannot save spec content. No prompt ID available.');
          }
        }
      } else {
        // Fallback for other test types
        toast.warning('Cannot save changes to this type of test. Saving not implemented.');
        setShowEditModal(false);
        setEditingSpecContent('');
        setSelectedTest(null);
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

  const handleCreateTestSuite = () => {
    setShowCreateTestSuiteModal(true);
  };

  const handleTestSuiteCreated = async (testSuiteData) => {
    try {
      console.log('Test suite created:', testSuiteData);
      
      // Save the test suite to the backend
      const response = await api.post('/test-suites', testSuiteData);
      
      if (response.data.success) {
        toast.success('Test suite created successfully!');
        console.log('Test suite saved to backend:', response.data.testSuite);
        
        // Refresh the test suites list
        await fetchAllTests();
        await fetchTestSuites();
      } else {
        toast.error('Failed to save test suite');
      }
    } catch (error) {
      console.error('Error saving test suite:', error);
      toast.error('Failed to save test suite');
    }
  };

  const handleEditTestSuite = (testSuite) => {
    setEditingTestSuite(testSuite);
    setShowEditTestSuiteModal(true);
  };

  const handleTestSuiteUpdated = async (updatedData) => {
    try {
      console.log('Test suite updated:', updatedData);
      
      // Update the test suite in the backend
      const response = await api.put(`/test-suites/${editingTestSuite.id}`, updatedData);
      
      if (response.data.success) {
        toast.success('Test suite updated successfully!');
        console.log('Test suite updated in backend:', response.data.testSuite);
        
        // Refresh the test suites list
        await fetchTestSuites();
        setShowEditTestSuiteModal(false);
        setEditingTestSuite(null);
      } else {
        toast.error('Failed to update test suite');
      }
    } catch (error) {
      console.error('Error updating test suite:', error);
      toast.error('Failed to update test suite');
    }
  };

  const handleDeleteTestSuite = async (testSuiteId) => {
    try {
      const response = await api.delete(`/test-suites/${testSuiteId}`);
      
      if (response.data.success) {
        toast.success('Test suite deleted successfully!');
        console.log('Test suite deleted from backend');
        
        // Refresh the test suites list
        await fetchTestSuites();
      } else {
        toast.error('Failed to delete test suite');
      }
    } catch (error) {
      console.error('Error deleting test suite:', error);
      toast.error('Failed to delete test suite');
    }
  };

  const handleRunTestSuite = (testSuite) => {
    setRunningTestSuite(testSuite);
    setShowRunTestSuiteModal(true);
  };

  const handleTestSuiteExecuted = async (executionData) => {
    // Prevent multiple executions
    if (isExecuting) {
      console.log('⚠️ Test suite execution already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsExecuting(true);
      console.log('🚀 Test suite execution started:', executionData);
      console.log('📊 Execution data structure:', JSON.stringify(executionData, null, 2));
      
      if (executionData.executionId) {
        // Show execution status
        console.log('✅ Setting execution status - executionId:', executionData.executionId);
        setCurrentExecutionId(executionData.executionId);
        setShowExecutionStatus(true);
        console.log('🎯 Execution status should now be visible');
        console.log('🔍 Current state - showExecutionStatus:', true, 'currentExecutionId:', executionData.executionId);
        toast.success(`Test suite "${executionData.testSuite?.name || 'Unknown'}" execution started!`);
      } else {
        console.log('❌ No executionId in response, showing basic toast');
        console.log('🔍 Available keys in executionData:', Object.keys(executionData));
        toast.success(`Test suite "${executionData.testSuiteName || 'Unknown'}" execution started!`);
      }
      
      // Close the modal
      setShowRunTestSuiteModal(false);
      setRunningTestSuite(null);
      
    } catch (error) {
      console.error('❌ Error executing test suite:', error);
      toast.error('Failed to start test suite execution');
    } finally {
      setIsExecuting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteAction.type === 'single') {
        const test = tests.find(t => t.id === deleteAction.testId);
        if (test) {
          console.log('Deleting single test:', test);
          
          // For now, just remove from local state since we don't have proper delete endpoints
          // for individual tests from the /api/test-files endpoint
          if (test.isRealFile) {
            // This is a real file from the file system - delete it through the API
            try {
              console.log('Deleting real file through API');
              await api.delete(`/test-files/${deleteAction.testId}`);
              console.log('Real file deleted successfully');
              setTests(prevTests => prevTests.filter(t => t.id !== deleteAction.testId));
              setSelectedTests(prev => prev.filter(id => id !== deleteAction.testId));
              toast.success('Test file deleted successfully');
            } catch (error) {
              console.error('Error deleting real file:', error);
              // Fallback: just remove from local state and mark as deleted
              setDeletedTestIds(prev => new Set([...prev, deleteAction.testId]));
              setTests(prevTests => prevTests.filter(t => t.id !== deleteAction.testId));
              setSelectedTests(prev => prev.filter(id => id !== deleteAction.testId));
              toast.success('Test removed from view (file system test)');
            }
          } else if (test.source === 'Prompts' || test.isGenerated) {
            // Try to delete from test-suites endpoint
            try {
            await api.delete(`/test-suites/${test.id}`);
            console.log('Deleted from test-suites');
              setTests(prevTests => prevTests.filter(t => t.id !== deleteAction.testId));
              setSelectedTests(prev => prev.filter(id => id !== deleteAction.testId));
              toast.success('Test deleted successfully');
            } catch (error) {
              console.error('Error deleting from test-suites:', error);
              // Fallback: just remove from local state
              setTests(prevTests => prevTests.filter(t => t.id !== deleteAction.testId));
              setSelectedTests(prev => prev.filter(id => id !== deleteAction.testId));
              toast.success('Test removed from view');
            }
          } else {
            // Remove test from prompt's generatedTests array
            try {
            const promptResponse = await api.get(`/prompts/${test.promptId}`);
            const prompt = promptResponse.data;
            console.log('Current prompt generatedTests:', prompt.generatedTests);
            
            const updatedTests = prompt.generatedTests.filter(t => t.testId !== deleteAction.testId);
            console.log('Updated tests after filtering:', updatedTests);
            
            const updateResponse = await api.put(`/prompts/${test.promptId}`, {
              generatedTests: updatedTests
            });
            console.log('Update response:', updateResponse.data);
          
              setTests(prevTests => prevTests.filter(t => t.id !== deleteAction.testId));
          setSelectedTests(prev => prev.filter(id => id !== deleteAction.testId));
          toast.success('Test deleted successfully');
            } catch (error) {
              console.error('Error updating prompt:', error);
              // Fallback: just remove from local state
              setTests(prevTests => prevTests.filter(t => t.id !== deleteAction.testId));
              setSelectedTests(prev => prev.filter(id => id !== deleteAction.testId));
              toast.success('Test removed from view');
            }
          }
        }
      } else if (deleteAction.type === 'selected') {
        console.log('Deleting selected tests:', selectedTests);
        
        // Delete each selected test
        for (const testId of selectedTests) {
          const test = tests.find(t => t.id === testId);
          if (test) {
            console.log('Deleting test:', test);
            
            if (test.isRealFile) {
              // Real file from file system - delete it through the API
              try {
                console.log('Deleting real file through API');
                await api.delete(`/test-files/${testId}`);
                console.log('Real file deleted successfully');
              } catch (error) {
                console.error('Error deleting real file:', error);
                // Fallback: add to deleted set
                setDeletedTestIds(prev => new Set([...prev, testId]));
              }
            } else if (test.source === 'Prompts' || test.isGenerated) {
              // Try to delete from test-suites endpoint
              try {
              await api.delete(`/test-suites/${test.id}`);
              console.log('Deleted from test-suites');
              } catch (error) {
                console.error('Error deleting from test-suites:', error);
              }
            } else {
              // Remove test from prompt's generatedTests array
              try {
              const promptResponse = await api.get(`/prompts/${test.promptId}`);
              const prompt = promptResponse.data;
              const updatedTests = prompt.generatedTests.filter(t => t.testId !== testId);
              
              await api.put(`/prompts/${test.promptId}`, {
                generatedTests: updatedTests
              });
              } catch (error) {
                console.error('Error updating prompt:', error);
              }
            }
          }
        }
        
        // Update local state
         setTests(prevTests => prevTests.filter(t => !selectedTests.includes(t.id)));
        setSelectedTests([]);
        toast.success(`${selectedTests.length} test(s) deleted successfully`);
        
        // No need to refresh since we already updated local state
      } else if (deleteAction.type === 'all') {
        console.log('Deleting all tests');
        
        // Separate different types of tests
        const realFileTests = tests.filter(test => test.isRealFile);
        const generatedTests = tests.filter(test => (test.source === 'Prompts' || test.isGenerated) && !test.isRealFile);
        const traditionalTests = tests.filter(test => !test.source && !test.isGenerated && !test.isRealFile);
        
        // For real file tests, delete them through the API
        console.log('Real file tests (deleting through API):', realFileTests.length);
        for (const test of realFileTests) {
          try {
            console.log('Deleting real file through API:', test.id);
            await api.delete(`/test-files/${test.id}`);
            console.log('Real file deleted successfully');
          } catch (error) {
            console.error('Error deleting real file:', error);
            // Fallback: add to deleted set
            setDeletedTestIds(prev => new Set([...prev, test.id]));
          }
        }
        
        // Delete generated tests using test-suites endpoint
        for (const test of generatedTests) {
          console.log('Deleting generated test:', test.id);
          try {
          await api.delete(`/test-suites/${test.id}`);
          } catch (error) {
            console.error('Error deleting generated test:', error);
          }
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
          try {
          await api.put(`/prompts/${promptId}`, {
            generatedTests: []
          });
          } catch (error) {
            console.error('Error clearing prompt tests:', error);
          }
        }
        
        // Update local state
        setTests([]);
        setSelectedTests([]);
        toast.success(`All ${tests.length} tests deleted successfully`);
        
        // No need to refresh since we already updated local state
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

  const clearDeletedTests = () => {
    setDeletedTestIds(new Set());
    localStorage.removeItem('deletedTestIds');
    toast.success('Deleted tests cleared. All tests will be visible again.');
    fetchAllTests(); // Refresh to show all tests
  };

  const getFilteredTests = () => {
    console.log('Filtering tests with activeFilter:', activeFilter, 'total tests:', tests.length);
    let filtered = tests.filter(test => {
        const testType = test.type.toLowerCase();
        if (activeFilter === 'ui') {
          return testType === 'ui test' || testType === 'ui';
        }
        if (activeFilter === 'api') {
          return testType === 'api test' || testType === 'api';
        }
        return testType === activeFilter;
      });
    
    console.log('Filtered tests count:', filtered.length);
    // Sort by latest created first (newest to oldest)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getPaginatedTests = () => {
    const filtered = getFilteredTests();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  };

  const filteredTests = getFilteredTests();
  const paginatedTests = getPaginatedTests();
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
                  <TestCount>Total: {uiTests.length + apiTests.length} tests</TestCount>
                  {selectedTests.length > 0 && (
                      <span style={{ fontSize: '14px', color: '#e74c3c', fontWeight: '500' }}>
                        {selectedTests.length} selected
                      </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
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
              </FilterTabs>

              {filteredTests.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>
                    <FiBarChart2 />
                  </EmptyIcon>
                  <EmptyTitle>No tests found</EmptyTitle>
                  <EmptyDescription>
                     {`No ${activeFilter.toUpperCase()} tests found`}
                  </EmptyDescription>
                </EmptyState>
              ) : (
                <>
                <TestsTable>
                  <TableHeader>
                    <Checkbox 
                      type="checkbox" 
                        checked={selectedTests.length === paginatedTests.length && paginatedTests.length > 0}
                      onChange={handleSelectAll}
                    />
                    <div>Test Name</div>
                    <div>Project Model</div>
                    <div>Type</div>
                    <div>Tags</div>
                    <div>Created Timestamp</div>
                    <div>Actions</div>
                  </TableHeader>
                  
                    {paginatedTests.map((test) => (
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
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <PaginationContainer>
                    <PaginationInfo>
                      <span>
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalTests)} of {totalTests} tests
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Show:</span>
                        <PageSizeSelect 
                          value={pageSize} 
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </PageSizeSelect>
                        <span>per page</span>
                      </div>
                    </PaginationInfo>
                    
                    <PaginationControls>
                      <PageButton 
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </PageButton>
                      <PageButton 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </PageButton>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PageButton
                            key={pageNum}
                            $active={currentPage === pageNum}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </PageButton>
                        );
                      })}
                      
                      <PageButton 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </PageButton>
                      <PageButton 
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </PageButton>
                    </PaginationControls>
                  </PaginationContainer>
                )}
              </>
              )}
            </>
          )}

          {activeTab === 'overview' && (
            <OverviewContainer>
              <StatsGrid>
                <StatCard color="#3498db">
                  <StatIcon color="#3498db">
                    <FiBarChart2 />
                  </StatIcon>
                  <StatContent>
                    <StatTitle>Test Suites</StatTitle>
                    <StatValue>2</StatValue>
                    <StatDescription>Available test suites</StatDescription>
                  </StatContent>
                </StatCard>

                <StatCard color="#e74c3c">
                  <StatIcon color="#e74c3c">
                    <FiBarChart2 />
                  </StatIcon>
                  <StatContent>
                    <StatTitle>Collections</StatTitle>
                    <StatValue>1</StatValue>
                    <StatDescription>Test collections</StatDescription>
                  </StatContent>
                </StatCard>

                <StatCard color="#27ae60">
                  <StatIcon color="#27ae60">
                    <FiBarChart2 />
                  </StatIcon>
                  <StatContent>
                    <StatTitle>Environments</StatTitle>
                    <StatValue>4</StatValue>
                    <StatDescription>Test environments</StatDescription>
                  </StatContent>
                </StatCard>

                <StatCard color="#3498db">
                  <StatIcon color="#3498db">
                    <FiBarChart2 />
                  </StatIcon>
                  <StatContent>
                    <StatTitle>Total Tests</StatTitle>
                    <StatValue>2</StatValue>
                    <StatDescription>Generated test files</StatDescription>
                  </StatContent>
                </StatCard>

                <StatCard color="#f39c12">
                  <StatIcon color="#f39c12">
                    <FiBarChart2 />
                  </StatIcon>
                  <StatContent>
                    <StatTitle>Available Tags</StatTitle>
                    <StatValue>2</StatValue>
                    <StatDescription>Unique test tags</StatDescription>
                  </StatContent>
                </StatCard>
              </StatsGrid>

              <QuickActionsSection>
                <QuickActionsTitle>
                  <FiBarChart2 />
                  Quick Actions
                </QuickActionsTitle>
                <QuickActionsGrid>
                  <QuickActionButton color="#3498db" onClick={handleCreateTestSuite}>
                    <FiBarChart2 />
                    + CREATE TEST SUITE
                  </QuickActionButton>
                  <QuickActionButton color="#e74c3c">
                    <FiBarChart2 />
                    + CREATE COLLECTION
                  </QuickActionButton>
                  <QuickActionButton color="#27ae60">
                    <FiBarChart2 />
                    RUN BY TAGS
                  </QuickActionButton>
                </QuickActionsGrid>
              </QuickActionsSection>
            </OverviewContainer>
          )}

          {activeTab === 'test-suites' && (
            <TestSuitesContainer>
              <TestSuitesHeader>
                <TestSuitesTitle>
                  <FiBarChart2 />
                  Test Suites
                </TestSuitesTitle>
                <CreateButton onClick={handleCreateTestSuite}>
                  <FiBarChart2 />
                  + CREATE TEST SUITE
                </CreateButton>
                {deletedTestIds.size > 0 && (
                  <CreateButton 
                    onClick={clearDeletedTests}
                    style={{ 
                      backgroundColor: '#f39c12', 
                      marginLeft: '10px',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  >
                    <FiRefreshCw />
                    CLEAR DELETED ({deletedTestIds.size})
                  </CreateButton>
                )}
              </TestSuitesHeader>

              <TestSuitesTable>
                <TestSuitesTableHeader>
                  <TestSuitesTableHeaderRow>
                    <TestSuitesTableHeaderCell>Name</TestSuitesTableHeaderCell>
                    <TestSuitesTableHeaderCell>Environment</TestSuitesTableHeaderCell>
                    <TestSuitesTableHeaderCell>Test Cases</TestSuitesTableHeaderCell>
                    <TestSuitesTableHeaderCell>Tags</TestSuitesTableHeaderCell>
                    <TestSuitesTableHeaderCell>Settings</TestSuitesTableHeaderCell>
                    <TestSuitesTableHeaderCell>Actions</TestSuitesTableHeaderCell>
                  </TestSuitesTableHeaderRow>
                </TestSuitesTableHeader>
                <TestSuitesTableBody>
                  {testSuites.length === 0 ? (
                    <TestSuitesTableRow>
                      <TestSuitesTableCell colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ color: '#7f8c8d', fontSize: '16px' }}>
                          No test suites found. Create your first test suite to get started.
            </div>
                      </TestSuitesTableCell>
                    </TestSuitesTableRow>
                  ) : (
                    <>
                      {testSuites.map((testSuite) => (
                        <TestSuitesTableRow key={testSuite.id}>
                          <TestSuitesTableCell>
                            <SuiteName>{testSuite.name}</SuiteName>
                            <SuiteSubtitle>{testSuite.description || 'No description'}</SuiteSubtitle>
                          </TestSuitesTableCell>
                          <TestSuitesTableCell>
                            <EnvironmentBadge>{testSuite.testType || 'UI'}</EnvironmentBadge>
                          </TestSuitesTableCell>
                          <TestSuitesTableCell>
                            <TestSuitesTestCount>{testSuite.totalTests || testSuite.testCases?.length || 0}</TestSuitesTestCount>
                          </TestSuitesTableCell>
                          <TestSuitesTableCell>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {testSuite.tags && testSuite.tags.map((tag, index) => (
                                <span key={index} style={{
                                  backgroundColor: '#e8f4fd',
                                  color: '#3498db',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </TestSuitesTableCell>
                          <TestSuitesTableCell>
                            <div style={{ 
                              width: '20px', 
                              height: '4px', 
                              backgroundColor: testSuite.status === 'ready' ? '#27ae60' : '#f39c12', 
                              borderRadius: '2px' 
                            }}></div>
                          </TestSuitesTableCell>
                          <TestSuitesTableCell>
                            <TestSuitesRunButton
                              onClick={() => handleRunTestSuite(testSuite)}
                            >
                              <FiBarChart2 />
                              RUN
                            </TestSuitesRunButton>
                            <TestSuitesEditButton
                              onClick={() => handleEditTestSuite(testSuite)}
                            >
                              <FiEdit3 />
                            </TestSuitesEditButton>
                            <TestSuitesDeleteButton
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${testSuite.name}"?`)) {
                                  handleDeleteTestSuite(testSuite.id);
                                }
                              }}
                            >
                              <FiTrash2 />
                            </TestSuitesDeleteButton>
                          </TestSuitesTableCell>
                        </TestSuitesTableRow>
                      ))}
                      
                    </>
                  )}
                </TestSuitesTableBody>
              </TestSuitesTable>

              {/* Test Execution Status Card */}
              {showExecutionStatus && currentExecutionId && (
                <TestExecutionStatus
                  executionId={currentExecutionId}
                  onClose={() => {
                    setShowExecutionStatus(false);
                    setCurrentExecutionId(null);
                    toast.info('Test execution status closed');
                  }}
                  onViewDetails={(executionId) => {
                    console.log('View details for execution:', executionId);
                    setShowExecutionDetails(true);
                  }}
                  onRefresh={() => {
                    // Refresh execution status
                    console.log('Refresh execution status');
                    toast.info('Refreshing execution status...');
                  }}
                  onExecutionComplete={(status, execution) => {
                    console.log('🎯 Execution completion callback triggered:', { status, execution });
                    if (status === 'completed') {
                      toast.success('🎉 Test suite execution completed successfully!');
                    } else if (status === 'failed') {
                      toast.error('❌ Test suite execution failed');
                    } else if (status === 'timeout') {
                      toast.warning('⏰ Test suite execution timed out');
                    }
                    console.log('Execution completed:', { status, execution });
                    
                    // Reset execution state
                    setIsExecuting(false);
                  }}
                />
              )}
            </TestSuitesContainer>
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

      {showCreateTestSuiteModal && (
        <CreateTestSuiteModal
          isOpen={showCreateTestSuiteModal}
          onClose={() => setShowCreateTestSuiteModal(false)}
          onCreateTestSuite={handleTestSuiteCreated}
        />
      )}

      {showEditTestSuiteModal && (
        <EditTestSuiteModal
          isOpen={showEditTestSuiteModal}
          onClose={() => {
            setShowEditTestSuiteModal(false);
            setEditingTestSuite(null);
          }}
          testSuite={editingTestSuite}
          onSave={handleTestSuiteUpdated}
        />
      )}

      {showRunTestSuiteModal && (
        <RunTestSuiteModal
          isOpen={showRunTestSuiteModal}
          onClose={() => {
            setShowRunTestSuiteModal(false);
            setRunningTestSuite(null);
          }}
          testSuite={runningTestSuite}
          onExecute={handleTestSuiteExecuted}
        />
      )}

      {/* Execution Details Modal */}
      {showExecutionDetails && currentExecutionId && (
        <ExecutionDetailsModal
          isOpen={showExecutionDetails}
          onClose={() => setShowExecutionDetails(false)}
          executionId={currentExecutionId}
        />
      )}

    </TestSuiteContainer>
  );
};

export default TestSuiteManagement;
