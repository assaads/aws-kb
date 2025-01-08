#!/bin/bash

# Exit on error
set -e

echo "🧪 Testing build process..."

# Clean previous build
rm -rf build/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Verify the build output exists
if [ ! -f "build/index.js" ]; then
    echo "❌ Build failed: build/index.js not found"
    exit 1
fi

# Make the build executable
chmod +x build/index.js

echo "✅ Build test completed successfully!"

# Optional: Run the MCP inspector
if [ "$1" == "--inspect" ]; then
    echo "🔍 Running MCP inspector..."
    npm run inspector
fi
