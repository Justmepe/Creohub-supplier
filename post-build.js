const fs = require('fs');
const path = require('path');

// Post-build script to fix VPS deployment
console.log('Setting up VPS deployment structure...');

const sourceDir = path.join(__dirname, 'dist', 'public');
const fallbackSourceDir = path.join(__dirname, 'dist');
const targetDir = path.join(__dirname, 'server', 'public');

// Determine source directory
let actualSourceDir = sourceDir;
if (!fs.existsSync(sourceDir)) {
  actualSourceDir = fallbackSourceDir;
}

if (!fs.existsSync(actualSourceDir)) {
  console.error('Build output not found. Run npm run build first.');
  process.exit(1);
}

// Create target directory
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy files
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy all files from source to target
fs.readdirSync(actualSourceDir).forEach(item => {
  const srcPath = path.join(actualSourceDir, item);
  const destPath = path.join(targetDir, item);
  copyRecursive(srcPath, destPath);
});

console.log('VPS deployment files ready in server/public/');

// Verify critical files
const indexPath = path.join(targetDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('index.html confirmed');
} else {
  console.error('Missing index.html - build may have failed');
}