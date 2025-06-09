# Pesapal Payment Integration Guide

## Overview

Creohub now integrates with Pesapal, Africa's leading unified payment gateway, providing seamless access to:

- **Mobile Money**: M-Pesa, Airtel Money, T-Kash, MTN Mobile Money
- **Card Payments**: Visa, Mastercard, and local bank cards
- **Bank Transfers**: Direct bank transfers and RTGS
- **USSD Payments**: Mobile banking and USSD codes

## Features

✅ **Unified Payment Experience**: Single integration supporting multiple payment methods
✅ **Multi-Currency Support**: KES, UGX, TZS, RWF, MWK, ZMW
✅ **Real-time Payment Verification**: Automatic payment status checking
✅ **Responsive UI**: Mobile-optimized payment forms
✅ **Secure Processing**: Industry-standard security protocols
✅ **Automatic Redirects**: Seamless user experience with success/failure handling

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Pesapal Configuration
PESAPAL_CONSUMER_KEY=your_consumer_key
PESAPAL_CONSUMER_SECRET=your_consumer_secret
PESAPAL_ENVIRONMENT=sandbox  # or 'live' for production
PESAPAL_IPN_URL=http://localhost:5000/api/payments/customer/pesapal/ipn
PESAPAL_CALLBACK_URL=http://localhost:5000/api/payments/customer/pesapal/callback
```

### Getting API Credentials

1. Visit [Pesapal Developer Portal](https://developer.pesapal.com)
2. Create an account and verify your business
3. Generate API credentials (Consumer Key & Secret)
4. Set up your IPN and callback URLs

## API Endpoints

### Payment Initiation
```
POST /api/payments/customer/pesapal
```

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "KES",
  "email": "customer@example.com",
  "phone": "+254712345678",
  "firstName": "John",
  "lastName": "Doe",
  "productId": 1,
  "productName": "Digital Course"
}
```

**Response:**
```json
{
  "success": true,
  "order_tracking_id": "pesapal_tracking_id",
  "redirect_url": "https://cybqa.pesapal.com/pesapalv3/...",
  "order_id": "ORDER_1234567890_abc123"
}
```

### Payment Status Check
```
GET /api/payments/customer/pesapal/status/:orderTrackingId
```

**Response:**
```json
{
  "payment_status_description": "Completed",
  "amount": "1000.00",
  "currency": "KES",
  "payment_method": "Mobile Money"
}
```

### IPN Endpoint
```
GET /api/payments/customer/pesapal/ipn
```
Receives real-time payment notifications from Pesapal.

### Callback Endpoint
```
GET /api/payments/customer/pesapal/callback
```
Handles user redirects after payment completion.

## Payment Flow

1. **Customer initiates payment** on product page
2. **Pesapal component collects** customer details
3. **Payment request sent** to Pesapal API
4. **Customer redirected** to Pesapal hosted page
5. **Customer completes payment** using preferred method
6. **Real-time notifications** via IPN
7. **Customer redirected back** to success/failure page
8. **Payment verification** and order processing

## UI Components

### PesapalPayment Component

Located at: `client/src/components/payments/PesapalPayment.tsx`

**Props:**
- `amount`: Payment amount (number)
- `productId`: Product identifier (number)
- `productName`: Product display name (string)
- `onSuccess`: Success callback function
- `onCancel`: Cancel callback function

### PaymentSelector Integration

The PaymentSelector automatically shows Pesapal as the primary option for African currencies:

- **Priority**: Highest for African currencies (KES, UGX, TZS, etc.)
- **Availability**: Automatically enabled for supported regions
- **Fallback**: Other payment methods available as alternatives

## Success/Failure Pages

### Payment Success
Route: `/payment/success`
- Displays payment confirmation
- Shows transaction details
- Provides download/access links
- Real-time payment verification

### Payment Failed
Route: `/payment/failed`
- Shows error information
- Provides retry options
- Displays helpful troubleshooting tips
- Support contact information

## Testing

### Sandbox Credentials
```env
PESAPAL_CONSUMER_KEY=qkio1BGGYAXTu2JOfm7XSXNjwcwA4Y
PESAPAL_CONSUMER_SECRET=osGQ364R2K31X8ynMLa6YaKISk4bKv
PESAPAL_ENVIRONMENT=sandbox
```

### Test Payment Methods

**Mobile Money Testing:**
- Use phone number: +254712345678
- Any amount between 1-100,000 KES
- Test cards: 4000000000000002 (success), 4000000000000010 (failure)

**Bank Transfer Testing:**
- Use any valid bank account details in sandbox
- Payments are instantly processed in test mode

## Security Features

- **Token-based authentication** for API requests
- **Encrypted payment data** transmission
- **Secure redirect URLs** with validation
- **IPN signature verification** (planned)
- **PCI compliance** through Pesapal

## Error Handling

Common error scenarios and solutions:

### Authentication Errors
- Verify consumer key and secret
- Check environment configuration
- Ensure token hasn't expired

### Payment Failures
- Invalid phone number format
- Insufficient account balance
- Network connectivity issues
- Payment method restrictions

### Integration Issues
- IPN URL accessibility
- Callback URL configuration
- CORS policy settings

## Production Deployment

### Pre-deployment Checklist

1. ✅ Update environment variables to production values
2. ✅ Set `PESAPAL_ENVIRONMENT=live`
3. ✅ Configure production IPN/callback URLs
4. ✅ Test with small amounts first
5. ✅ Monitor payment logs and errors
6. ✅ Set up alerting for failed payments

### URL Configuration

Update these URLs for production:
```env
PESAPAL_IPN_URL=https://yourdomain.com/api/payments/customer/pesapal/ipn
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/payments/customer/pesapal/callback
```

## Monitoring and Analytics

### Payment Tracking
- All transactions logged with unique order IDs
- Real-time status updates via IPN
- Failed payment analysis and retry logic
- Customer payment method preferences

### Business Intelligence
- Payment method popularity by region
- Conversion rates by currency
- Average transaction values
- Failed payment patterns

## Support and Troubleshooting

### Common Issues

**"Payment failed to initialize"**
- Check API credentials
- Verify network connectivity
- Validate request parameters

**"Redirect not working"**
- Confirm callback URL configuration
- Check browser security settings
- Verify HTTPS requirements

**"IPN not received"**
- Test IPN endpoint accessibility
- Check server firewall settings
- Verify webhook configuration

### Getting Help

- **Pesapal Support**: support@pesapal.com
- **Developer Docs**: https://developer.pesapal.com
- **Status Page**: https://status.pesapal.com

## Future Enhancements

- **Recurring payments** for subscriptions
- **Bulk payment processing** for multiple orders
- **Advanced fraud detection** integration
- **Multi-language support** for payment forms
- **Enhanced analytics dashboard** with payment insights

---

**Note**: This integration provides a robust foundation for accepting payments across Africa. The unified approach through Pesapal significantly reduces complexity while maximizing payment method availability for your customers.