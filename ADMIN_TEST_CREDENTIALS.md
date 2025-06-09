# Admin Test Credentials

## Dedicated Admin Account
- **Username**: `admintest`
- **Password**: `admin123`
- **Role**: `admin`
- **Purpose**: Separate admin testing account (not a creator)

## Creator-Admin Account (Backup)
- **Username**: `testerpeter`  
- **Password**: `password123`
- **Role**: `admin` + `creator`
- **Purpose**: Admin with creator privileges

## Testing Instructions

### Access Admin Dashboard
1. Visit `/admin-test` in your browser
2. Login with admin credentials: `admintest` / `admin123`
3. Test admin functionality including:
   - Platform statistics
   - Creator management
   - User role administration

### Admin Routes Available
- `/admin-test` - Admin testing interface
- `/admin` - Main admin dashboard
- `/admin-setup` - User promotion to admin

### API Endpoints
- `POST /api/admin/create-test-account` - Creates admintest account
- `GET /api/admin/dashboard` - Platform statistics
- `GET /api/admin/creators` - Creator management
- `PUT /api/admin/creators/:id` - Update creator status

The admin system is fully functional with proper authentication and authorization controls.