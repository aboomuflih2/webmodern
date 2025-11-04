#!/bin/bash

# Pottur School Connect - Safe Deployment Script
# This script ensures zero-downtime deployment to production

set -e  # Exit on any error

echo "🚀 Starting Safe Deployment Process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check if PM2 process exists
if ! pm2 list | grep -q "pottur-school-website"; then
    echo "❌ Error: PM2 process 'pottur-school-website' not found"
    exit 1
fi

echo "📋 Pre-deployment checks..."

# Switch to production branch
echo "🔄 Switching to production branch..."
git checkout production

# Merge from development
echo "🔀 Merging latest development changes..."
git merge development

# Install dependencies (if package.json changed)
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️  Building production version..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful!"

# Deploy with zero downtime
echo "🚀 Deploying to PM2 (zero downtime)..."
pm2 reload pottur-school-website

# Wait a moment for the process to stabilize
sleep 3

# Verify deployment
echo "🔍 Verifying deployment..."
if pm2 list | grep -q "online.*pottur-school-website"; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running on http://localhost:8080"
    
    # Test if the application responds
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
        echo "✅ Application is responding correctly"
    else
        echo "⚠️  Warning: Application may not be responding correctly"
    fi
else
    echo "❌ Error: Deployment failed - PM2 process not online"
    exit 1
fi

echo "📊 Current PM2 status:"
pm2 list

echo ""
echo "🎉 Deployment completed successfully!"
echo "📝 Remember to:"
echo "   - Test critical functionality on the live site"
echo "   - Monitor PM2 logs: pm2 logs pottur-school-website"
echo "   - Check for any errors in the next 10-15 minutes"