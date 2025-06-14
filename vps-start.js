import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple VPS startup script without complex checks
console.log('Starting Creohub production server...');

// Set production environment
process.env.NODE_ENV = 'production';

// Start the server directly
const serverPath = path.join(__dirname, 'dist', 'index.js');

if (!fs.existsSync(serverPath)) {
    console.error('Server bundle not found. Run: npm run build');
    process.exit(1);
}

console.log('Starting server...');
const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: process.env
});

server.on('error', (error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});

server.on('close', (code) => {
    if (code !== 0) {
        console.error(`Server exited with code ${code}`);
        process.exit(code);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    server.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('Shutting down...');
    server.kill('SIGTERM');
});