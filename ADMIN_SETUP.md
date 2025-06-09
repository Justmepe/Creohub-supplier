# Admin System Setup Guide

## Overview
The Creohub platform includes a comprehensive admin system for platform management, creator oversight, and analytics monitoring.

## Admin Credentials for Testing

### Current Admin Account
- **Username**: `testerpeter`
- **Password**: `password123`
- **Role**: `admin`
- **Access Level**: Full platform administration

## Admin Features

### 1. Platform Statistics
- Total creator count
- Active creator monitoring
- Paid subscription tracking
- Platform revenue analytics

### 2. Creator Management
- View all registered creators
- Activate/deactivate creator accounts
- Monitor subscription status
- Manage plan types (free, starter, pro)

### 3. User Role Management
- Promote users to admin status
- Assign creator permissions
- Role-based access control

## Available Admin Routes

### Web Interface
- `/admin-setup` - Promote existing users to admin
- `/admin` - Main admin dashboard
- `/admin-test` - Admin functionality testing interface

### API Endpoints
- `GET /api/admin/dashboard` - Platform statistics
- `GET /api/admin/creators` - All creators list
- `PUT /api/admin/creators/:id` - Update creator status
- `POST /api/admin/promote-user` - Promote user roles
- `POST /api/admin/setup` - Admin setup endpoint

## How to Access Admin Features

### Method 1: Direct Login
1. Visit `/admin-test`
2. Login with admin credentials:
   - Username: `testerpeter`
   - Password: `password123`
3. Access admin dashboard and features

### Method 2: Promote Existing User
1. Visit `/admin-setup`
2. Enter existing username to promote
3. User will gain admin privileges

### Method 3: API Access
```bash
# Login and get session
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testerpeter", "password": "password123"}' \
  -c cookies.txt

# Access admin dashboard
curl -X GET http://localhost:5000/api/admin/dashboard -b cookies.txt
```

## Security Features

### Authentication
- Session-based authentication required
- Admin role verification for all admin routes
- Secure credential validation

### Authorization
- Role-based access control (user, creator, admin)
- Admin-only endpoints protected
- Creator management restricted to admins

## Testing the Admin System

### Quick Test Steps
1. Navigate to `/admin-test`
2. Login with provided credentials
3. Verify admin dashboard loads
4. Check creator management features
5. Test API endpoint responses

### Expected Results
- Platform statistics displayed
- Creator list populated
- Admin operations functional
- Role management working

## Database Schema

### User Roles
```sql
users {
  id: serial
  username: text
  email: text
  password: text
  isAdmin: boolean (default: false)
  role: text (default: 'user') -- 'user', 'creator', 'admin'
  isCreator: boolean
  ...
}
```

### Admin Permissions
- Full creator management
- Platform analytics access
- User role modification
- System configuration

## Troubleshooting

### Common Issues
1. **Login Failed**: Verify credentials are correct
2. **Unauthorized Access**: Ensure user has admin role
3. **API Errors**: Check session authentication
4. **Permission Denied**: Verify admin privileges

### Solutions
- Use `/admin-setup` to promote users
- Check user role in database
- Clear browser cookies and re-login
- Contact system administrator

## Production Considerations

### Security Recommendations
- Change default admin credentials
- Implement strong password policies
- Enable two-factor authentication
- Regular security audits
- Monitor admin activity logs

### Deployment Notes
- Ensure admin routes are properly secured
- Configure proper session management
- Set up admin monitoring alerts
- Regular backup procedures

This admin system provides comprehensive platform management capabilities while maintaining security and user access control.