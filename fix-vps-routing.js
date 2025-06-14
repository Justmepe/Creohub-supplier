// Quick fix script for VPS routing issues
// Run this on your VPS after uploading files: node fix-vps-routing.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing VPS routing configuration...');

// 1. Ensure server/public directory exists
const publicDir = path.join(__dirname, 'server', 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✓ Created server/public directory');
}

// 2. Copy dist files to server/public if they exist
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    const distFiles = fs.readdirSync(distDir);
    distFiles.forEach(file => {
        const srcPath = path.join(distDir, file);
        const destPath = path.join(publicDir, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            // Copy directory recursively
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            copyDir(srcPath, destPath);
        } else {
            // Copy file
            fs.copyFileSync(srcPath, destPath);
        }
    });
    console.log('✓ Copied build files to server/public');
} else {
    console.log('⚠️  dist directory not found. Run "npm run build" first.');
}

// 3. Verify index.html exists
const indexPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexPath)) {
    console.log('✓ index.html found in server/public');
} else {
    console.log('❌ index.html missing. Build may have failed.');
}

// 4. Create a simple test page if index.html is missing
if (!fs.existsSync(indexPath)) {
    const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Creohub - Loading...</title>
</head>
<body>
    <div id="root">
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>Creohub is Loading...</h1>
            <p>If you see this message, the server is running but the client build is incomplete.</p>
            <p>Please run "npm run build" and restart the server.</p>
        </div>
    </div>
</body>
</html>`;
    fs.writeFileSync(indexPath, testHtml);
    console.log('✓ Created temporary index.html');
}

// Helper function to copy directories recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

console.log('\n🚀 VPS routing fix complete!');
console.log('\nNext steps:');
console.log('1. Ensure your .env file has NODE_ENV=production');
console.log('2. Run: npm start');
console.log('3. Test: curl http://your-domain:5000/login (should return HTML)');
console.log('4. Test: curl http://your-domain:5000/api/auth/me (should return JSON)');