# Pesapal Sandbox Setup Guide

## Quick Setup for Testing

### Step 1: Register for Pesapal Sandbox
1. Visit **https://cybqa.pesapal.com/pesapalv3**
2. Click "Register" to create a sandbox developer account
3. Fill in your details (use any valid email for testing)
4. Verify your email address

### Step 2: Get Sandbox Credentials
1. Login to your sandbox account at **https://cybqa.pesapal.com/pesapalv3**
2. Navigate to **"API Keys"** or **"Integration"** section
3. Generate your sandbox credentials:
   - **Consumer Key** (public identifier)
   - **Consumer Secret** (private key - keep secure)

### Step 3: Update Your Environment
Open your `.env` file and update these lines:
```env
PESAPAL_CONSUMER_KEY=your_actual_sandbox_consumer_key
PESAPAL_CONSUMER_SECRET=your_actual_sandbox_consumer_secret
PESAPAL_ENVIRONMENT=sandbox
```

### Step 4: Restart the Application
After updating the credentials, restart your development server to apply changes.

## Sandbox Testing Features

### Test Payment Methods
- **M-Pesa Sandbox**: Use test phone numbers like `+254700000000`
- **Test Cards**: Use sandbox card numbers provided in Pesapal documentation
- **Bank Transfers**: Test with sandbox bank account details

### Test Scenarios
- Successful payments
- Failed payments
- Pending payments
- Cancelled payments

## Moving to Production

### When Ready for Live Payments:
1. Register for live Pesapal account at **https://www.pesapal.com/merchant**
2. Complete business verification process
3. Get live credentials from the merchant dashboard
4. Update `.env` file:
   ```env
   PESAPAL_CONSUMER_KEY=your_live_consumer_key
   PESAPAL_CONSUMER_SECRET=your_live_consumer_secret
   PESAPAL_ENVIRONMENT=live
   ```

## Demo Mode (Current State)

Until you add sandbox credentials, the platform runs in demo mode:
- Simulates successful payments
- Shows payment flow without real processing
- Redirects to demo success page
- Perfect for UI/UX testing

## Support
- Pesapal Sandbox Documentation: https://developer.pesapal.com
- Pesapal Support: support@pesapal.com