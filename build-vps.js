#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building for VPS deployment...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  if (fs.existsSync('server/public')) {
    fs.rmSync('server/public', { recursive: true, force: true });
  }

  console.log('Running build...');
  execSync('npm run build', { stdio: 'inherit' });

  // Create the public directory
  console.log('Setting up static files...');
  fs.mkdirSync('server/public', { recursive: true });

  // Copy all dist files to server/public
  if (fs.existsSync('dist')) {
    const distFiles = fs.readdirSync('dist');
    distFiles.forEach(file => {
      const srcPath = path.join('dist', file);
      const destPath = path.join('server/public', file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    console.log('✓ Client files copied to server/public/');
  }

  // Verify files
  if (fs.existsSync('server/public/index.html')) {
    console.log('✓ index.html ready');
  } else {
    throw new Error('index.html missing');
  }

  if (fs.existsSync('dist/index.js')) {
    console.log('✓ Server bundle ready');
  } else {
    throw new Error('Server bundle missing');
  }

  console.log('\n🎉 VPS build complete!');
  console.log('\nNext steps for VPS deployment:');
  console.log('1. Upload entire project to VPS');
  console.log('2. Run: npm install --production');
  console.log('3. Set NODE_ENV=production in .env');
  console.log('4. Run: npm start');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

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