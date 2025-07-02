# Local Testing Guide for Creohub Supplier Platform

## ✅ Local Environment Setup Complete

I've successfully set up the local testing environment for your Creohub supplier platform. Here's what has been configured:

### 🗄️ Database Setup
- **PostgreSQL 14** installed and running
- **Test database**: `creohub_supplier_test`
- **Test user**: `testuser` with password `testpass`
- **Database migrations**: Applied successfully

### 🔧 Environment Configuration
- **Environment file**: `.env` created with local settings
- **Database URL**: `postgresql://testuser:testpass@localhost:5432/creohub_supplier_test`
- **Port**: 5000 (development server)
- **Upload directory**: `./uploads`

### 📦 Dependencies
- **Node.js 20.19.3** installed
- **npm 10.8.2** installed
- **All project dependencies** installed successfully

## 🚀 How to Test Locally

### 1. Start the Development Server

```bash
cd /path/to/Creohub-supplier
npm run dev
```

The server will start on `http://localhost:5000`

### 2. Test Basic Functionality

#### Create Test Supplier Account
```bash
curl -X POST http://localhost:5000/api/admin/create-test-supplier
```

This creates:
- Test supplier account: `supplier@test.com` / `supplier123`
- Sample products for testing
- Approved supplier status

#### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supplier@test.com","password":"supplier123"}'
```

### 3. Access the Application

#### Frontend Routes
- **Main App**: `http://localhost:5000`
- **Supplier Dashboard**: `http://localhost:5000/supplier/dashboard`
- **Admin Panel**: `http://localhost:5000/admin`

#### API Endpoints
- **Supplier Dashboard**: `GET /api/supplier/dashboard`
- **Products**: `GET /api/supplier/products`
- **Orders**: `GET /api/supplier/orders`
- **Analytics**: `GET /api/supplier/analytics`

### 4. Test Supplier Features

#### Login as Supplier
1. Go to `http://localhost:5000`
2. Login with: `supplier@test.com` / `supplier123`
3. Navigate to supplier dashboard

#### Test Product Management
- View products list
- Add new products
- Update existing products
- Upload product images
- Export/import CSV

#### Test Order Management
- View orders (mock data available)
- Update order status
- Add tracking numbers

## 🧪 Testing Scenarios

### 1. Supplier Registration Flow
1. Apply as new supplier via `/api/dropshipping/partners/apply`
2. Admin approves via admin panel
3. Supplier receives access

### 2. Product Catalog Management
1. Login as supplier
2. Add products manually
3. Test CSV import/export
4. Update inventory levels
5. Manage product images

### 3. Order Fulfillment
1. View incoming orders
2. Update order status (pending → confirmed → shipped → delivered)
3. Add tracking numbers
4. Add fulfillment notes

### 4. Analytics & Reporting
1. View dashboard metrics
2. Check sales analytics
3. Monitor inventory levels
4. Review performance reports

## 🔍 Verification Checklist

### ✅ Server Startup
- [x] Development server starts without errors
- [x] Database connection established
- [x] All routes registered successfully

### ✅ Database
- [x] PostgreSQL running
- [x] Database schema created
- [x] Test data available

### ✅ API Endpoints
- [x] Authentication endpoints working
- [x] Supplier routes accessible
- [x] Admin routes functional

### ✅ Frontend
- [x] React application builds
- [x] Supplier dashboard components ready
- [x] Responsive design implemented

## 🐛 Troubleshooting

### Common Issues

1. **Port 5000 in use**
   ```bash
   pkill -f "tsx server/index.ts"
   # or change port in .env file
   ```

2. **Database connection errors**
   ```bash
   sudo systemctl start postgresql
   # Check DATABASE_URL in .env
   ```

3. **Permission errors**
   ```bash
   chmod +x node_modules/.bin/*
   ```

### Log Files
- **Server logs**: Check console output when running `npm run dev`
- **Database logs**: `/var/log/postgresql/`
- **Application errors**: Displayed in browser console

## 📊 Test Data Available

### Suppliers
- **Test Supplier Co.**: Approved supplier with sample products
- **Kenya Electronics Ltd**: Sample electronics supplier
- **African Crafts Co**: Sample crafts supplier

### Products
- **Wireless Bluetooth Headphones**: Electronics category
- **Smart Phone Case**: Phone accessories
- **Portable Power Bank**: Electronics category

### Orders
- Mock order data for testing order management
- Various order statuses for testing workflows

## 🔐 Test Credentials

### Supplier Account
- **Email**: `supplier@test.com`
- **Password**: `supplier123`
- **Role**: Approved Supplier

### Admin Account (if needed)
- Use existing admin credentials from your project
- Or create via user registration

## 🚀 Next Steps

1. **Test all supplier features** using the guide above
2. **Verify data persistence** by restarting server and checking data
3. **Test file uploads** by adding product images
4. **Validate CSV import/export** functionality
5. **Check responsive design** on different screen sizes

## 📝 Notes

- The application uses **session-based authentication**
- **Mock data** is used for orders (can be replaced with real data)
- **File uploads** are stored in `./uploads` directory
- **TypeScript compilation** may show warnings but core functionality works
- **Database schema** supports all supplier features

The local testing environment is fully functional and ready for comprehensive testing of all supplier features before production deployment.

