# VPS Deployment Guide for Creohub

## Pre-deployment Steps

1. **Build the application:**
```bash
npm run build
```

2. **Verify build output:**
After running the build command, you should have:
- `dist/` folder containing the built client files
- `dist/index.js` containing the server bundle

3. **Create a `public` directory and copy client files:**
```bash
mkdir -p server/public
cp -r dist/* server/public/
```

## VPS Deployment Steps

### 1. Upload Files to VPS
Upload the following to your VPS:
- All `node_modules` (or run `npm install` on VPS)
- `server/` directory (including the new `public` folder)
- `package.json`
- `.env` file with your environment variables

### 2. Environment Variables
Create a `.env` file on your VPS with:
```env
NODE_ENV=production
SESSION_SECRET=your-secure-session-secret
DATABASE_URL=your-database-url
PESAPAL_CONSUMER_KEY=your-pesapal-key
PESAPAL_CONSUMER_SECRET=your-pesapal-secret
# Add other required API keys
```

### 3. Start the Production Server
```bash
npm start
```

## Common 404 Issues and Solutions

### Issue: Login page returns 404
**Cause:** Missing client build files or incorrect directory structure

**Solution:**
1. Ensure the `server/public` directory exists and contains:
   - `index.html`
   - `assets/` folder with JS/CSS files
   
2. Verify the build process completed successfully:
```bash
ls -la server/public/
# Should show index.html and assets folder
```

### Issue: API routes work but pages don't
**Cause:** Client-side routing not properly configured

**Solution:** The server is configured to serve `index.html` for all non-API routes. Ensure:
1. `server/public/index.html` exists
2. The file contains the React app entry point

## Directory Structure After Build
```
your-project/
├── server/
│   ├── public/          # Built client files (created after build)
│   │   ├── index.html
│   │   └── assets/
│   ├── index.js         # Built server (created after build)
│   └── [other server files]
├── package.json
└── .env
```

## Troubleshooting Commands

1. **Check if files exist:**
```bash
ls -la server/public/
cat server/public/index.html | head -5
```

2. **Check server logs:**
```bash
npm start
# Look for "serving on port 5000" and any error messages
```

3. **Test API endpoints:**
```bash
curl http://your-domain.com/api/auth/me
# Should return JSON, not 404
```

4. **Test client routing:**
```bash
curl http://your-domain.com/login
# Should return HTML with React app, not 404
```

## Quick Fix Script
Create this script on your VPS to rebuild and restart:

```bash
#!/bin/bash
# rebuild.sh
npm run build
mkdir -p server/public
cp -r dist/* server/public/
npm start
```

Run with: `chmod +x rebuild.sh && ./rebuild.sh`