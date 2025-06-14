# VPS Deployment Fix for __dirname Error

## The Problem
You're getting `{"message":"__dirname is not defined"}` because the production files use ES modules but weren't properly converted.

## Quick Fix (Choose One Method)

### Method 1: Use the new VPS startup script
```bash
# On your VPS, run this instead of npm start:
node vps-start.js
```

### Method 2: Direct server start (simplest)
```bash
# Skip all wrapper scripts and run the server directly:
NODE_ENV=production node dist/index.js
```

### Method 3: Manual file fix (if above don't work)
```bash
# Edit production-start.js on your VPS:
nano production-start.js

# Replace the first few lines with:
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

## Complete VPS Setup Commands

```bash
# 1. Build the project
npm run build

# 2. Copy files to server/public (run post-build script)
node post-build.js

# 3. Start the server (use any of these):
node vps-start.js
# OR
NODE_ENV=production node dist/index.js
# OR
npm start

# 4. Verify it's working
curl http://your-domain:5000/api/auth/me
curl http://your-domain:5000/
```

## Environment Variables Required
Make sure your .env file on VPS has:
```
NODE_ENV=production
DATABASE_URL=your_database_url
SESSION_SECRET=your_session_secret
GMAIL_USER=your_email
GMAIL_APP_PASSWORD=your_password
```

## Image Changes on VPS
To change images after deployment:

1. **Replace logo**: Upload new file as `attached_assets/Logo_1749474304178.png`
2. **Hero image**: Update the URL in `client/src/pages/home.tsx` line 238
3. **Rebuild**: Run `npm run build && node post-build.js`
4. **Restart**: Restart your server

## Troubleshooting
- If you see "Cannot find module": Run `npm install` on VPS
- If images don't load: Check `server/public` folder exists
- If API errors: Check environment variables are set
- If still __dirname error: Use Method 2 (direct server start)