@echo off
echo Starting Creohub Development Server on Windows...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Set environment and start server
echo Setting up environment...
set NODE_ENV=development

echo Starting server on http://localhost:5000
echo.
echo Available URLs:
echo - Main App: http://localhost:5000
echo - Creator Dashboard: http://localhost:5000/dashboard  
echo - Admin Dashboard: http://localhost:5000/admin
echo - Admin Registration: http://localhost:5000/admin/register
echo.
echo Press Ctrl+C to stop the server
echo.

npx tsx server/index.ts