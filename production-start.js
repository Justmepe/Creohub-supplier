// Production startup script that ensures proper routing
// This replaces the default npm start for VPS deployment

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Environment check
if (process.env.NODE_ENV !== 'production') {
    console.log('Setting NODE_ENV to production...');
    process.env.NODE_ENV = 'production';
}

// Pre-flight checks
console.log('Starting Creohub production server...');
console.log('Performing pre-flight checks...');

// Check 1: Verify server bundle exists
const serverBundle = path.join(__dirname, 'dist', 'index.js');
if (!fs.existsSync(serverBundle)) {
    console.error('❌ Server bundle not found at dist/index.js');
    console.error('Run "npm run build" first');
    process.exit(1);
}
console.log('✓ Server bundle found');

// Check 2: Verify public directory exists
const publicDir = path.join(__dirname, 'server', 'public');
if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found at server/public');
    console.error('Run the build script or copy dist/* to server/public/');
    process.exit(1);
}
console.log('✓ Public directory found');

// Check 3: Verify index.html exists
const indexHtml = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexHtml)) {
    console.error('❌ index.html not found in server/public');
    console.error('The client build may be incomplete');
    process.exit(1);
}
console.log('✓ Client files found');

// Check 4: Verify environment variables
const requiredEnvVars = ['SESSION_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
    console.warn('The app may not function correctly without these');
}

console.log('\n🚀 Starting production server...');

// Start the server
const server = spawn('node', [serverBundle], {
    stdio: 'inherit',
    env: process.env
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
});

server.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        process.exit(code);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
});