#!/bin/bash

echo "Building Creohub for production deployment..."

# Clean previous builds
rm -rf dist/
rm -rf server/public/

# Build the application
echo "Building client and server..."
npm run build

# Create the public directory for static files
echo "Setting up static files..."
mkdir -p server/public

# Copy client build files to server/public
if [ -d "dist" ]; then
    cp -r dist/* server/public/
    echo "✓ Client files copied to server/public/"
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Verify critical files exist
if [ -f "server/public/index.html" ]; then
    echo "✓ index.html found"
else
    echo "❌ index.html missing in server/public/"
    exit 1
fi

if [ -f "dist/index.js" ]; then
    echo "✓ Server bundle found"
else
    echo "❌ Server bundle missing"
    exit 1
fi

echo ""
echo "🚀 Production build complete!"
echo ""
echo "To deploy on your VPS:"
echo "1. Upload the entire project folder to your VPS"
echo "2. Run: npm install --production"
echo "3. Create .env file with your environment variables"
echo "4. Run: npm start"
echo ""
echo "Your app will be available on port 5000"