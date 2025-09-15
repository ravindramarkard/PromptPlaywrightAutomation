# 🤖 AI-Powered Test Automation Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Latest-blue.svg)](https://playwright.dev/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

A comprehensive test automation framework that combines traditional testing with AI-powered test generation capabilities. Built with Playwright, React, and Node.js, this platform provides an intuitive interface for creating, managing, and executing automated tests across multiple browsers and environments.

## Features

### Core Features
- **Web UI for Prompt Input**: Intuitive interface for entering test prompts in natural language
- **Prompt Parser**: Converts natural language into structured test steps
- **Template-Based Code Generator**: Generates deterministic Playwright test specifications
- **Generated Playwright Spec Output**: Displays and downloads generated `.spec.ts` files
- **LLM Integration**: Optional integration with OpenAI, Claude, or local LLMs
- **Metadata & Reporting**: Comprehensive test metadata and Allure reporting

### Advanced Features
- **Environment Management**: Configure multiple testing environments with different base URLs
- **Test Suite Management**: Organize tests into suites and collections
- **API Test Generation**: Generate API tests from Swagger/OpenAPI specifications
- **Enhanced AI Generator**: Advanced AI features with intelligent test generation
- **Real-time Test Execution**: Run tests directly from the platform
- **Comprehensive Reporting**: Allure and Playwright HTML reports

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Playwright** for test execution
- **Allure** for test reporting
- **OpenAI/Claude** for AI integration

### Frontend
- **React 18** with functional components and hooks
- **Styled Components** for styling
- **React Router** for navigation
- **Axios** for API communication
- **React Syntax Highlighter** for code display

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-test-generator
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp server/env.example server/.env
   
   # Edit the .env file with your configuration
   nano server/.env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not already running)
   mongod
   
   # The application will create the database and collections automatically
   ```

5. **Start the application**
   ```bash
   # From the root directory
   npm run dev
   
   # Or start individually
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 5050
   ```

## Usage

### 1. Environment Setup
- Navigate to **Environments** in the sidebar
- Create a new environment with your base URL and configuration
- Configure Jira integration (optional)
- Set up LLM configuration (optional)

### 2. Creating Prompts
- Go to **Prompts** section
- Click "Create New Prompt"
- Enter a natural language description of your test
- Example: "Navigate to login page, enter username and password, click login button, verify dashboard is displayed"

### 3. Generating Tests
- Select a prompt and click "Generate Test"
- The AI will parse your prompt and generate Playwright test code
- Review and download the generated test file

### 4. Running Tests
- Go to **Test Suites** to organize your tests
- Use **Results** section to execute tests and view reports
- Access Allure reports for detailed analytics

### 5. API Testing
- Use **API Test Generator** to create tests from Swagger/OpenAPI specs
- Load endpoints from API, environment, or uploaded files
- Generate comprehensive API test suites

## API Endpoints

### Prompts
- `GET /api/prompts` - List all prompts
- `POST /api/prompts` - Create new prompt
- `GET /api/prompts/:id` - Get single prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt
- `POST /api/prompts/:id/generate-test` - Generate test from prompt

### Environments
- `GET /api/environments` - List environments
- `POST /api/environments` - Create environment
- `PUT /api/environments/:id` - Update environment
- `DELETE /api/environments/:id` - Delete environment
- `POST /api/environments/:id/test-connection` - Test connection

### Test Suites
- `GET /api/test-suites` - List test suites
- `POST /api/test-suites` - Create test suite
- `POST /api/test-suites/:id/execute` - Execute test suite

### Test Results
- `GET /api/test-results` - List test results
- `POST /api/test-results/execute` - Execute tests
- `POST /api/test-results/generate-allure-report` - Generate Allure report

## Configuration

### Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-test-generator

# Base URL for tests
BASE_URL=http://localhost:5050

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key_here

# Claude Configuration (Optional)
CLAUDE_API_KEY=your_claude_api_key_here

# Jira Integration (Optional)
JIRA_URL=your_jira_url_here
JIRA_USERNAME=your_jira_username
JIRA_PASSWORD=your_jira_password
```

### Playwright Configuration

The `playwright.config.js` file contains the test configuration:
- Test directory: `./tests`
- Base URL: From environment variable
- Reporters: HTML and Allure
- Browsers: Chromium, Firefox, WebKit
- Mobile testing support

## Project Structure

```
ai-test-generator/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── index.js            # Server entry point
│   └── package.json
├── tests/                  # Generated test files
│   └── projects/           # Organized by project/model/prompt
├── allure-results/         # Allure test results
├── allure-report/          # Allure HTML reports
├── playwright-report/      # Playwright HTML reports
├── playwright.config.js    # Playwright configuration
└── package.json            # Root package.json
```

## Testing

### Running Tests
```bash
# Run all tests
npm run test:playwright

# Run specific test file
npx playwright test tests/specific-test.spec.ts

# Run tests in headed mode
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
```

### Viewing Reports
```bash
# View Allure report
npm run test:report

# View Playwright report
npx playwright show-report
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the example prompts and configurations

## Roadmap

- [ ] Enhanced AI model integration
- [ ] Visual test recording
- [ ] Test data management
- [ ] CI/CD integration
- [ ] Advanced reporting features
- [ ] Multi-language support
- [ ] Team collaboration features
