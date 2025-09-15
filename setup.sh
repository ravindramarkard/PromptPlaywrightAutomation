#!/bin/bash

# AI Test Generator Setup Script
echo "🚀 Setting up AI Test Generator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi



# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Create environment file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating environment file..."
    cp server/env.example server/.env
    echo "✅ Environment file created. Please edit server/.env with your configuration."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p tests/projects/default-project/models/default-model/Default\ Model/prompts
mkdir -p allure-results
mkdir -p allure-report
mkdir -p playwright-report
mkdir -p test-results/screenshots

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

# Set up Allure
echo "📊 Setting up Allure reporting..."
npm install -g allure-commandline

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit server/.env with your configuration"
echo "2. Start MongoDB: mongod"
echo "3. Start the application: npm run dev"
echo "4. Open http://localhost:5050 in your browser"
echo ""
echo "📚 For more information, see README.md"
