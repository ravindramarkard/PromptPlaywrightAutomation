import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiHome,
  FiEdit3,
  FiFolder,
  FiBarChart2,
  FiSettings,
  FiCpu,
  FiZap
} from 'react-icons/fi';

const SidebarContainer = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  background-color: #2c3e50;
  color: white;
  z-index: 1000;
  overflow-y: auto;
`;

const Logo = styled.div`
  padding: 20px;
  border-bottom: 1px solid #34495e;
  font-size: 18px;
  font-weight: bold;
  color: #ecf0f1;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  
  &:hover {
    background-color: #34495e;
    color: #ecf0f1;
  }
  
  &.active {
    background-color: #3498db;
    color: white;
    border-left-color: #2980b9;
  }
`;

const NavIcon = styled.span`
  margin-right: 12px;
  font-size: 18px;
  display: flex;
  align-items: center;
`;

const NavText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: FiHome, text: 'Dashboard' },
    { path: '/prompts', icon: FiEdit3, text: 'Prompts' },
    { path: '/test-suites', icon: FiFolder, text: 'Test Management' },
    { path: '/results', icon: FiBarChart2, text: 'Results' },
    { path: '/environments', icon: FiSettings, text: 'Environments' },
    { path: '/api-test-generator', icon: FiCpu, text: 'API Test Generator' },
    { path: '/enhanced-ai-generator', icon: FiZap, text: 'Enhanced AI Generator' }
  ];

  return (
    <SidebarContainer>
      <Logo>AI Test Generator</Logo>
      <NavList>
        {navItems.map((item) => (
          <NavItem key={item.path}>
            <NavLink
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <NavIcon>
                <item.icon />
              </NavIcon>
              <NavText>{item.text}</NavText>
            </NavLink>
          </NavItem>
        ))}
      </NavList>
    </SidebarContainer>
  );
};

export default Sidebar;
