# Pesapal Payment Gateway Setup Guide

## Quick Start - Get Your Pesapal Credentials

### Step 1: Create Pesapal Business Account
1. Visit **https://www.pesapal.com/merchant-registration**
2. Click "Get Started" and fill in your business details:
   - Business name and registration details
   - Contact information
   - Business type (select "E-commerce" or "Digital Services")
3. Submit required documents (business certificate, ID, bank details)
4. Wait for account approval (typically 1-3 business days)

### Step 2: Access Developer Credentials
1. Once approved, login to **https://www.pesapal.com/merchant**
2. Navigate to **"Settings" → "API Configuration"**
3. Generate your API credentials:
   - **Consumer Key** (starts with letters/numbers)
   - **Consumer Secret** (long string)
   - **IPN ID** (for webhook notifications)

### Step 3: Configure Environment
Add these exact credentials to your environment:
```env
PESAPAL_CONSUMER_KEY=your_actual_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_actual_consumer_secret_here
PESAPAL_ENVIRONMENT=sandbox  # Use 'live' for production
```

## Why Pesapal is Perfect for African Creators

Pesapal provides a unified gateway supporting:
- **M-Pesa** (Kenya, Tanzania, Uganda) - Mobile money payments
- **Credit/Debit Cards** (Visa, Mastercard, American Express)
- **Bank Transfers** - Direct bank account payments
- **Mobile Money** - Airtel Money, MTN Mobile Money
- **Multi-currency** - KES, UGX, TZS, USD, EUR

### 3. Environment Configuration
Add these to your `.env` file:
```env
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_ENVIRONMENT=sandbox  # or 'live' for production
PESAPAL_IPN_URL=https://yourdomain.com/api/payments/customer/pesapal/ipn
PESAPAL_CALLBACK_URL=https://yourdomain.com/payment/success
```

## Testing Your Integration

### Sandbox Testing
- Use sandbox credentials for development
- Test with small amounts (e.g., KES 10-100)
- Verify all payment methods work correctly

### Test Payment Flow
1. Go to `/payment-test` in your application
2. Click "Test Pesapal"
3. Verify payment window opens
4. Test with different payment methods:
   - M-Pesa: Use test phone numbers
   - Cards: Use test card numbers provided by Pesapal
   - Bank Transfer: Test with sandbox bank accounts

## Production Deployment

### 1. Live Credentials
- Switch to live/production credentials
- Update `PESAPAL_ENVIRONMENT=live`
- Configure production webhook URLs

### 2. Webhook Configuration
Set up IPN (Instant Payment Notification) URL in Pesapal dashboard:
- IPN URL: `https://yourdomain.com/api/payments/customer/pesapal/ipn`
- Callback URL: `https://yourdomain.com/payment/success`

### 3. Currency Support
Your platform supports automatic currency detection:
- **Kenya**: KES (Kenyan Shilling)
- **Uganda**: UGX (Ugandan Shilling)
- **Tanzania**: TZS (Tanzanian Shilling)
- **Global**: USD, EUR, GBP

## Payment Method Features

### M-Pesa Integration
- STK Push notifications
- Real-time payment confirmation
- Support for Kenya, Tanzania, Uganda M-Pesa

### Card Payments
- Visa, Mastercard, American Express
- 3D Secure authentication
- PCI DSS compliant processing

### Bank Transfers
- Direct bank account debits
- Real-time bank verification
- Support for major African banks

## Creator Fee Structure
Your platform implements a three-tier pricing model:
- **Free Plan**: 10% transaction fee (30-day trial)
- **Starter Plan**: 5% transaction fee ($14.99/month)
- **Pro Plan**: 0% transaction fee ($29.99/month)

## Troubleshooting

### Common Issues
1. **Invalid credentials**: Verify your consumer key and secret
2. **Webhook failures**: Ensure your server is accessible via HTTPS
3. **Currency mismatch**: Check supported currencies for your region
4. **Network timeout**: Implement proper retry logic for API calls

### Support Resources
- Pesapal Documentation: https://developer.pesapal.com/docs
- API Reference: https://developer.pesapal.com/api-reference
- Support Email: support@pesapal.com

## Security Best Practices
1. Never expose consumer secrets in client-side code
2. Validate all webhook signatures
3. Use HTTPS for all callback URLs
4. Implement proper error handling and logging
5. Store sensitive data securely

## Monitoring and Analytics
- Track payment success rates
- Monitor transaction volumes
- Set up alerts for failed payments
- Generate revenue reports by payment method