# Production SSL Certificate Error Fix

## Problem
SSL error: "Hostname/IP does not match certificate's altnames: Host: localhost. is not in the cert's altnames: DNS:creohub.io, DNS:www.creohub.io"

## Root Cause
Your production DATABASE_URL is pointing to `localhost` instead of the actual database host.

## Solution

### 1. Update Production Environment Variables
On your VPS, check and update these environment variables:

```bash
# Check current DATABASE_URL
echo $DATABASE_URL

# It should NOT contain localhost
# Correct format should be something like:
DATABASE_URL=postgresql://username:password@your-db-host:5432/creohub

# Also ensure these are set:
NODE_ENV=production
GMAIL_USER=petersongikonyo182@gmail.com
GMAIL_APP_PASSWORD=lmkznhawpschulgb
```

### 2. Database Configuration Updated
I've updated `server/db.ts` to handle SSL properly for production environments.

### 3. PostgreSQL VPS Configuration
Since you're using PostgreSQL on your VPS, your DATABASE_URL should be:

```bash
# If PostgreSQL is on the same server:
DATABASE_URL=postgresql://postgres:your_password@127.0.0.1:5432/creohub

# If PostgreSQL is on a different server:
DATABASE_URL=postgresql://postgres:your_password@your-db-server-ip:5432/creohub

# With SSL (recommended for production):
DATABASE_URL=postgresql://postgres:your_password@your-db-host:5432/creohub?sslmode=require
```

### 4. Fix Steps on Your VPS
```bash
# 1. Check current environment
cat .env

# 2. Update DATABASE_URL to point to your actual database host
# Replace localhost with your actual database host
nano .env

# 3. Restart your application
pm2 restart all
# OR
systemctl restart your-app-service
```

### 5. Verify Fix
After updating, the login should work without SSL certificate errors.