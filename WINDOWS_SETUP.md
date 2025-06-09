# Complete Windows Setup Guide for Creohub

## Prerequisites Installation

### 1. Install Node.js (Required)
- Go to https://nodejs.org/
- Download and install Node.js 18 or later
- Verify installation:
```cmd
node --version
npm --version
```

### 2. Install Git (Required)
- Go to https://git-scm.com/download/win
- Download and install Git for Windows
- Verify installation:
```cmd
git --version
```

### 3. Install Visual Studio Code (Recommended)
- Go to https://code.visualstudio.com/
- Download and install VS Code

## Quick Start (3 Steps)

### Step 1: Clone and Install
```cmd
git clone [your-repo-url]
cd creohub
npm install
```

### Step 2: Set Up Database
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_postgresql_url
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=creohub
```

### Step 3: Run the Application
Use one of these methods:

**Method A: Batch File (Easiest)**
```cmd
start-dev.bat
```

**Method B: PowerShell**
```powershell
$env:NODE_ENV="development"; npx tsx server/index.ts
```

**Method C: Command Prompt with manual setup**
```cmd
set NODE_ENV=development
npx tsx server/index.ts
```

**Method D: VS Code (Best for Development)**
- Open project in VS Code
- Press `F5` to start with debugging
- Or press `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Development Server"

## Application URLs
- **Main Application**: http://localhost:5000
- **Creator Dashboard**: http://localhost:5000/dashboard
- **Admin Dashboard**: http://localhost:5000/admin
- **Admin Registration**: http://localhost:5000/admin/register

## Test Accounts
- **Admin**: username: `testerpeter`, password: `password123`
- **Creator**: username: `testerpeter`, password: `password123` (same account, role-based access)

## VS Code Development Features

### Recommended Extensions
Install these extensions for optimal development:
1. TypeScript and JavaScript Language Features (built-in)
2. Prettier - Code formatter
3. Tailwind CSS IntelliSense
4. ES7+ React/Redux/React-Native snippets
5. Auto Rename Tag

### Available Tasks (Ctrl+Shift+P → "Tasks: Run Task")
- **Start Development Server** - Runs the app with hot reload
- **Build Production** - Creates production build
- **TypeScript Check** - Validates TypeScript code
- **Database Push** - Applies schema changes

### Debugging
- Press `F5` to start with breakpoints
- Set breakpoints in any TypeScript file
- View variables and call stack in debug panel

## Troubleshooting

### Port 5000 Already in Use
```cmd
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID [process_id] /F
```

### Node Version Issues
```cmd
# Check Node version (should be 18+)
node --version

# If wrong version, reinstall from nodejs.org
```

### TypeScript Errors
```cmd
# Run type checking
npm run check

# Or in VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check `.env` file has correct credentials
3. Test connection with database client

### Environment Variable Issues
If you see "NODE_ENV is not recognized":
- Use `start-dev.bat` instead of `npm run dev`
- Or use PowerShell instead of Command Prompt

## Project Structure
```
creohub/
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/          # Application pages
│   ├── contexts/       # React contexts
│   └── lib/            # Utilities
├── server/             # Express backend
│   ├── payments/       # Payment integrations
│   └── routes.ts       # API endpoints
├── shared/             # Shared types and schemas
├── .vscode/            # VS Code configuration
├── start-dev.bat       # Windows development script
└── start-prod.bat      # Windows production script
```

## Features Available
- ✅ User authentication (creators and admins)
- ✅ Creator product management
- ✅ Order processing and analytics
- ✅ Admin platform management
- ✅ Multi-currency support (10+ African currencies)
- ✅ Responsive design
- 🔄 Payment integrations (M-Pesa, Flutterwave) - In Progress

## Common Commands
```cmd
# Development
start-dev.bat                    # Start development server
npm run check                    # Check TypeScript
npm run db:push                  # Update database schema

# Production
npm run build                    # Build for production
start-prod.bat                   # Start production server

# Database
npm run db:push                  # Apply schema changes
```

## Performance Tips
- Use VS Code for best development experience
- Enable TypeScript strict mode checking
- Use browser developer tools for debugging frontend
- Monitor console for server logs

The application is fully Windows-compatible and ready for development!