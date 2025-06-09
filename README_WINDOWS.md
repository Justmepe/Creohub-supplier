# Running Creohub on Windows

## Prerequisites
- Node.js 18+ (Download from https://nodejs.org/)
- Git (Download from https://git-scm.com/)
- Visual Studio Code (Download from https://code.visualstudio.com/)

## Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd creohub
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_database_url
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=creohub
```

## Running the Application

### Option 1: Using npm scripts
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

### Option 2: Using VS Code
1. Open the project in VS Code
2. Press `Ctrl+Shift+P` and select "Tasks: Run Task"
3. Choose "Start Development Server"
4. Or press `F5` to run with debugger

### Option 3: Manual commands
```bash
# Development with tsx
npx tsx server/index.ts

# With environment variable
set NODE_ENV=development && npx tsx server/index.ts
```

## VS Code Setup

### Recommended Extensions
Install these extensions for the best development experience:
- TypeScript and JavaScript Language Features (built-in)
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer

### Available VS Code Tasks
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Development Server"
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Build Production"
- `Ctrl+Shift+P` → "Tasks: Run Task" → "TypeScript Check"
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Database Push"

### Debugging
- Press `F5` to start debugging
- Set breakpoints in TypeScript files
- Use integrated terminal for logging

## Database Setup

```bash
# Push schema changes
npm run db:push

# Open Drizzle Studio (if available)
npm run db:studio
```

## Troubleshooting

### Port Issues
If port 5000 is in use:
1. Kill the process: `netstat -ano | findstr :5000`
2. Or change the port in `server/index.ts`

### Node Version Issues
Ensure you're using Node.js 18+:
```bash
node --version
```

### TypeScript Issues
Run type checking:
```bash
npm run check
```

### Database Connection
Verify your `.env` file has correct database credentials.

## Project Structure
```
creohub/
├── client/src/          # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── .vscode/             # VS Code configuration
└── uploads/             # File uploads
```

The application will be available at http://localhost:5000