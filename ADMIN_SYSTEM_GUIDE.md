# Creohub Admin System Guide

## Overview
Creohub's admin system provides comprehensive platform management capabilities through a secure, role-based access control system. Admins are dedicated accounts separate from creator accounts to avoid data conflicts.

## Admin Roles and Capabilities

### Platform Management
- **Dashboard Analytics**: View platform statistics including total creators, active creators, and revenue
- **Creator Management**: Monitor all creator accounts, subscription status, and trial periods
- **User Administration**: Promote users to admin status and manage user roles
- **Subscription Monitoring**: Track subscription plans, trial expirations, and payment status

### Security Features
- **Token-based Authentication**: Secure Bearer token system for API access
- **Role-based Access Control**: Admin-only endpoints with proper authorization
- **Invite Code Protection**: Secure admin registration with invite codes

## Admin Onboarding Options

### Option 1: Dedicated Admin Registration (Recommended)
**Route**: `/admin-register`
**Endpoint**: `POST /api/admin/register`

**Benefits**:
- Clean admin-only accounts (not creators)
- No data conversion complications
- Secure invite code system
- Proper role assignment from creation

**Requirements**:
- Username (minimum 3 characters)
- Valid email address
- Secure password (minimum 6 characters)
- Admin invite code: `ADMIN2025`

**Example Registration**:
```json
{
  "username": "platformadmin",
  "email": "admin@company.com", 
  "password": "securepass123",
  "inviteCode": "ADMIN2025"
}
```

### Option 2: User Promotion (Development/Testing)
**Endpoint**: `POST /api/admin/setup`

**Use Cases**:
- Converting existing users to admin during development
- Emergency admin promotion
- Testing scenarios

**Limitations**:
- May create complications if user has creator data
- Intended primarily for development use

## Admin Authentication

### Login Process
1. Use standard login endpoint: `POST /api/auth/login`
2. Receive Bearer token in response
3. Include token in all admin API requests

**Example Login**:
```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "adminuser", "password": "password123"}'
```

**Response**:
```json
{
  "user": {
    "id": 4,
    "username": "adminuser",
    "email": "admin@company.com",
    "isAdmin": true,
    "role": "admin",
    "isCreator": false
  },
  "token": "base64encodedtoken"
}
```

### API Access
All admin endpoints require Bearer token authentication:

```bash
Authorization: Bearer {token}
```

## Admin API Endpoints

### Dashboard Analytics
**GET** `/api/admin/dashboard`
- Platform statistics
- Creator counts and status
- Revenue metrics
- Recent activity logs

### Creator Management  
**GET** `/api/admin/creators`
- List all creators
- Subscription details
- Product counts
- Account status

**PUT** `/api/admin/creators/:id`
- Update creator settings
- Modify subscription status
- Account management

### User Management
**POST** `/api/admin/setup`
- Promote existing users to admin
- Development/testing purposes

**POST** `/api/admin/register`
- Create new dedicated admin accounts
- Production admin onboarding

## Security Considerations

### Production Deployment
1. **Change Invite Code**: Update the hardcoded invite code to a dynamic system
2. **Token Security**: Implement token expiration and refresh mechanisms
3. **Rate Limiting**: Add rate limiting to admin endpoints
4. **Audit Logging**: Implement comprehensive admin action logging

### Access Control
- Admin accounts cannot be creators (prevents data conflicts)
- All admin endpoints verify both authentication and admin role
- Separate admin routes from user/creator functionality

## Current Test Credentials

### Existing Admin (Creator + Admin)
- **Username**: `testerpeter`
- **Password**: `password123`
- **Role**: Admin + Creator (dual role for testing)

### New Dedicated Admin
- **Username**: `newadmin` 
- **Password**: `securepass123`
- **Role**: Admin only (recommended approach)

## Web Interface Access

### Admin Pages
- `/admin-register` - New admin registration
- `/admin-test` - Admin login and testing interface
- `/admin` - Main admin dashboard (requires authentication)

### Navigation Flow
1. Register admin account at `/admin-register`
2. Login through `/admin-test` 
3. Access dashboard at `/admin` with full platform management

## Best Practices

### Admin Account Management
- Use dedicated admin accounts, not converted creator accounts
- Implement strong password policies
- Regular access review and audit
- Separate admin and creator functionalities

### Security Guidelines
- Always use HTTPS in production
- Implement session timeouts
- Add two-factor authentication for admin accounts
- Monitor admin access logs

### Development vs Production
- Use `/api/admin/setup` for development testing
- Use `/api/admin/register` for production admin onboarding
- Change default invite codes before production deployment