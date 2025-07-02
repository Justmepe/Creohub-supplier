# Creohub Supplier Platform - Deployment Guide

## Overview

This guide covers the deployment of the enhanced Creohub platform with complete supplier functionality including:
- Supplier dashboard and management
- Product catalog management
- Order fulfillment system
- Analytics and reporting
- CSV import/export capabilities

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Domain name and SSL certificate
- Server with at least 2GB RAM

## Environment Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/creohub_supplier"

# Application
NODE_ENV=production
PORT=5000
SESSION_SECRET="your-secure-session-secret"

# Email Configuration (for notifications)
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"

# File Upload
MAX_FILE_SIZE=500MB
UPLOAD_DIR="/var/www/creohub/uploads"

# Payment Integration (if using Pesapal)
PESAPAL_CONSUMER_KEY="your-pesapal-consumer-key"
PESAPAL_CONSUMER_SECRET="your-pesapal-consumer-secret"
PESAPAL_ENVIRONMENT="sandbox" # or "live" for production
```

### 2. Database Setup

```sql
-- Create database
CREATE DATABASE creohub_supplier;

-- Create user (optional)
CREATE USER creohub_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE creohub_supplier TO creohub_user;
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Migration

```bash
npm run db:push
```

## Production Build

### 1. Build the Application

```bash
npm run build
```

### 2. Start Production Server

```bash
npm start
```

## Server Configuration

### 1. Nginx Configuration

Create `/etc/nginx/sites-available/creohub-supplier`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # File upload size
    client_max_body_size 500M;

    # Static files
    location /assets/ {
        alias /var/www/creohub/server/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/creohub/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # API and application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### 2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/creohub-supplier /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. PM2 Process Manager

Install PM2 for process management:

```bash
npm install -g pm2
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'creohub-supplier',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/creohub/error.log',
    out_file: '/var/log/creohub/out.log',
    log_file: '/var/log/creohub/combined.log',
    time: true
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Supplier Features Configuration

### 1. Create Test Supplier Account

Use the built-in endpoint to create a test supplier:

```bash
curl -X POST http://your-domain.com/api/admin/create-test-supplier
```

This creates:
- Test supplier account (email: supplier@test.com, password: supplier123)
- Sample products for testing
- Approved supplier status

### 2. Supplier Dashboard Access

Suppliers can access their dashboard at:
- `/supplier/dashboard` - Main dashboard
- `/supplier/products` - Product management
- `/supplier/orders` - Order management
- `/supplier/analytics` - Analytics and reports

### 3. API Endpoints

The platform includes comprehensive supplier API endpoints:

#### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

#### Supplier Management
- `GET /api/supplier/dashboard` - Dashboard data
- `GET /api/supplier/profile` - Supplier profile
- `PUT /api/supplier/profile` - Update profile

#### Product Management
- `GET /api/supplier/products` - List products
- `POST /api/supplier/products` - Create product
- `PUT /api/supplier/products/:id` - Update product
- `POST /api/supplier/products/bulk-update` - Bulk update
- `POST /api/supplier/products/import-csv` - CSV import
- `GET /api/supplier/products/export-csv` - CSV export

#### Order Management
- `GET /api/supplier/orders` - List orders
- `PUT /api/supplier/orders/:id/status` - Update order status

#### Analytics
- `GET /api/supplier/analytics` - Analytics data

## Security Considerations

### 1. File Upload Security

- File size limits are enforced (500MB default)
- Upload directory is outside web root
- File type validation for images

### 2. Authentication

- Session-based authentication
- Supplier role verification
- Partner approval status checks

### 3. Data Validation

- Input validation on all endpoints
- SQL injection prevention via ORM
- XSS protection headers

## Monitoring and Maintenance

### 1. Log Files

Monitor these log files:
- `/var/log/creohub/error.log` - Application errors
- `/var/log/creohub/out.log` - Application output
- `/var/log/nginx/access.log` - Web server access
- `/var/log/nginx/error.log` - Web server errors

### 2. Database Backup

Set up automated database backups:

```bash
#!/bin/bash
# backup-db.sh
pg_dump creohub_supplier > /backups/creohub_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Health Checks

Monitor application health:
- Database connectivity
- File system permissions
- Memory usage
- Response times

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall settings

2. **File Upload Issues**
   - Verify upload directory permissions
   - Check nginx client_max_body_size
   - Ensure sufficient disk space

3. **Session Issues**
   - Verify SESSION_SECRET is set
   - Check session store configuration
   - Clear browser cookies

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Use connection pooling
   - Regular VACUUM and ANALYZE

2. **Caching**
   - Enable nginx caching for static assets
   - Implement Redis for session storage
   - Cache frequently accessed data

3. **CDN Integration**
   - Serve static assets via CDN
   - Optimize image delivery
   - Enable compression

## Supplier Onboarding Process

### 1. Application Process

1. Suppliers apply via `/api/dropshipping/partners/apply`
2. Admin reviews applications in admin dashboard
3. Admin approves/rejects via admin panel
4. Approved suppliers receive access credentials

### 2. Product Setup

1. Suppliers log in to dashboard
2. Add products manually or via CSV import
3. Configure pricing and inventory
4. Upload product images

### 3. Order Management

1. Orders are automatically routed to suppliers
2. Suppliers update order status and tracking
3. Customers receive notifications
4. Commission calculations are automated

## Support and Documentation

- API documentation available at `/api/docs` (if implemented)
- Supplier help documentation in dashboard
- Admin panel for user management
- Built-in analytics and reporting

For technical support, monitor the application logs and database performance regularly.

