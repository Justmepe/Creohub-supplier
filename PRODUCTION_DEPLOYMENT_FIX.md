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

### 3. Common VPS Database URLs
- **Neon**: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
- **Railway**: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`
- **Supabase**: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`

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