import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Prompts from './pages/Prompts';
import TestSuiteManagement from './pages/TestSuiteManagement';
import Results from './pages/Results';
import Environments from './pages/Environments';
import APITestGenerator from './pages/APITestGenerator';
import EnhancedAIGenerator from './pages/EnhancedAIGenerator';
import ErrorBoundary from './components/ErrorBoundary';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.div`
  flex: 1;
  margin-left: 250px;
  padding: 0;
  background-color: #ffffff;
  min-height: 100vh;
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Sidebar />
        <MainContent>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/test-suites" element={<TestSuiteManagement />} />
            <Route path="/results" element={<Results />} />
            <Route path="/environments" element={<Environments />} />
            <Route path="/api-test-generator" element={<APITestGenerator />} />
            <Route path="/enhanced-ai-generator" element={
              <ErrorBoundary>
                <EnhancedAIGenerator />
              </ErrorBoundary>
            } />
          </Routes>
        </MainContent>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AppContainer>
    </Router>
  );
}

export default App;
