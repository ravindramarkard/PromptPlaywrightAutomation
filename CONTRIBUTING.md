# 🤝 Contributing to AI-Powered Test Automation Framework

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to our project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers
- **Focus on what's best** for the community
- **Show empathy** towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Basic knowledge of JavaScript, React, and testing

### First Contribution

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-test-automation-framework.git
   cd ai-test-automation-framework
   ```
3. **Set up the development environment** (see below)
4. **Find an issue** labeled `good first issue` or `help wanted`
5. **Create a branch** for your contribution
6. **Make your changes**
7. **Submit a pull request**

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install Playwright browsers
cd ..
npx playwright install
```

### 2. Environment Configuration

```bash
# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env

# Configure your API keys and settings
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start frontend development server
cd client
npm start

# Terminal 3: Run tests (optional)
npx playwright test --ui
```

### 4. Verify Setup

- Frontend: http://localhost:5050
- Backend API: http://localhost:5051
- Test UI: http://localhost:5050/test-suites

## 📝 Contributing Guidelines

### Types of Contributions

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🧪 **Test additions**
- 🎨 **UI/UX enhancements**
- ⚡ **Performance optimizations**
- 🔧 **Build/tooling improvements**

### Before You Start

1. **Check existing issues** to avoid duplicates
2. **Create an issue** for new features or major changes
3. **Discuss your approach** with maintainers
4. **Keep changes focused** and atomic

### Branch Naming Convention

```
feature/description-of-feature
bugfix/description-of-bug
docs/description-of-docs
refactor/description-of-refactor
test/description-of-test
```

Examples:
- `feature/ai-test-generation`
- `bugfix/playwright-timeout-issue`
- `docs/api-documentation`

## 🔄 Pull Request Process

### 1. Preparation

```bash
# Update your branch
git checkout main
git pull upstream main
git checkout your-feature-branch
git rebase main
```

### 2. Quality Checks

```bash
# Run linting
npm run lint
cd server && npm run lint
cd ../client && npm run lint

# Run tests
npm test
npx playwright test

# Build the project
cd client && npm run build
```

### 3. Commit Guidelines

Use conventional commits:

```
type(scope): description

feat(ai): add GPT-4 integration for test generation
fix(ui): resolve test suite table pagination issue
docs(readme): update installation instructions
test(e2e): add tests for user authentication flow
```

### 4. Pull Request Template

Fill out the PR template completely:
- Clear description of changes
- Link to related issues
- Screenshots for UI changes
- Test coverage information
- Breaking changes (if any)

## 🎨 Coding Standards

### JavaScript/React

- Use **ES6+** features
- Follow **ESLint** configuration
- Use **functional components** with hooks
- Implement **proper error handling**
- Write **meaningful variable names**

### Code Style

```javascript
// ✅ Good
const handleTestExecution = async (testSuite) => {
  try {
    const result = await executeTest(testSuite);
    setTestResults(result);
  } catch (error) {
    console.error('Test execution failed:', error);
    setError(error.message);
  }
};

// ❌ Bad
const handle = (ts) => {
  executeTest(ts).then(r => setTestResults(r));
};
```

### File Organization

```
client/src/
├── components/          # Reusable components
├── pages/              # Page components
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── services/           # API services
├── styles/             # Global styles
└── __tests__/          # Test files
```

## 🧪 Testing Guidelines

### Test Types

1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user workflows
4. **API Tests** - Backend endpoints

### Writing Tests

```javascript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import TestSuiteCard from '../TestSuiteCard';

describe('TestSuiteCard', () => {
  it('should display test suite information', () => {
    const testSuite = {
      name: 'Login Tests',
      environment: 'staging',
      testCases: 5
    };
    
    render(<TestSuiteCard testSuite={testSuite} />);
    
    expect(screen.getByText('Login Tests')).toBeInTheDocument();
    expect(screen.getByText('staging')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
```

### Playwright Tests

```javascript
// E2E test example
import { test, expect } from '@playwright/test';

test('should create new test suite', async ({ page }) => {
  await page.goto('/test-suites');
  
  await page.click('[data-testid="create-test-suite"]');
  await page.fill('[data-testid="suite-name"]', 'New Test Suite');
  await page.selectOption('[data-testid="environment"]', 'production');
  await page.click('[data-testid="save-suite"]');
  
  await expect(page.locator('text=New Test Suite')).toBeVisible();
});
```

### Test Coverage

- Aim for **80%+ code coverage**
- Test **happy paths** and **error scenarios**
- Include **edge cases**
- Test **accessibility** features

## 📚 Documentation

### Code Documentation

```javascript
/**
 * Generates AI-powered test cases for a given application URL
 * @param {string} url - The application URL to test
 * @param {Object} options - Configuration options
 * @param {string} options.model - LLM model to use
 * @param {number} options.maxTests - Maximum number of tests to generate
 * @returns {Promise<Array>} Array of generated test cases
 */
async function generateAITests(url, options = {}) {
  // Implementation
}
```

### README Updates

- Keep installation instructions current
- Update feature lists
- Add new configuration options
- Include troubleshooting tips

### API Documentation

- Document all endpoints
- Include request/response examples
- Specify error codes
- Add authentication requirements

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issue
- `priority: low` - Low priority issue
- `ai/llm` - Related to AI/LLM features
- `frontend` - Frontend related
- `backend` - Backend related
- `testing` - Testing related

## 🌟 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page
- Special mentions for significant contributions

## 💬 Community

### Getting Help

- **GitHub Discussions** - General questions and ideas
- **Issues** - Bug reports and feature requests
- **Discord/Slack** - Real-time chat (if available)

### Communication Guidelines

- Be clear and concise
- Provide context and examples
- Use appropriate channels
- Search before asking
- Help others when possible

## 🔄 Release Process

1. **Feature freeze** for upcoming release
2. **Testing phase** with release candidates
3. **Documentation updates**
4. **Version tagging** and release notes
5. **Deployment** to production

## 📞 Contact

For questions about contributing:
- Create an issue with the `question` label
- Start a discussion in GitHub Discussions
- Contact maintainers directly (for sensitive matters)

---

**Thank you for contributing to our AI-Powered Test Automation Framework! 🚀**

Your contributions help make testing more efficient and accessible for everyone.