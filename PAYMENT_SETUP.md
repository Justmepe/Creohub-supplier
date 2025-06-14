# Payment Methods Configuration Guide

This guide explains how to configure each payment method by adding the required environment variables to your `.env` file.

## 🔧 Environment Variables Setup

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

## 💰 Pesapal Configuration (Primary Gateway)

1. **Register with Pesapal:**
   - Go to https://www.pesapal.com/
   - Create a merchant account
   - Get your Consumer Key and Consumer Secret

2. **Required Variables:**
   ```env
   PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
   PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
   PESAPAL_ENVIRONMENT=sandbox  # or production
   PESAPAL_IPN_URL=https://yourdomain.com/api/payments/customer/pesapal/ipn
   ```

## 📱 M-Pesa Configuration (Kenya)

1. **Register with Safaricom Daraja API:**
   - Go to https://developer.safaricom.co.ke/
   - Create an app to get Consumer Key and Consumer Secret

2. **Required Variables:**
   ```env
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_BUSINESS_SHORT_CODE=your_till_number
   MPESA_PASSKEY=your_lipa_na_mpesa_passkey
   MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
   MPESA_ENVIRONMENT=sandbox  # or production
   ```



## 🏦 Bank Transfer Configuration

1. **Bank Account Details:**
   Configure your bank accounts in JSON format:
   ```env
   BANK_ACCOUNTS=[
     {
       "bankName": "Equity Bank",
       "accountNumber": "1234567890",
       "accountName": "Your Business Name",
       "branch": "Westlands",
       "swiftCode": "EQBLKENA"
     }
   ]
   ```

2. **Integration with Banking APIs (Optional):**
   ```env
   BANK_TRANSFER_API_KEY=your_bank_api_key
   BANK_TRANSFER_WEBHOOK_SECRET=your_webhook_secret
   BANK_TRANSFER_ENVIRONMENT=sandbox
   ```

## ✅ Testing Payment Integration

### Test M-Pesa
```bash
curl -X POST http://localhost:5000/api/payments/mpesa \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 100,
    "accountReference": "TEST001",
    "transactionDesc": "Test payment"
  }'
```

### Test Stripe
```bash
curl -X POST http://localhost:5000/api/payments/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "usd"
  }'
```

### Test PayPal
```bash
curl -X POST http://localhost:5000/api/paypal/order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.00",
    "currency": "USD",
    "intent": "CAPTURE"
  }'
```

### Test Bank Transfer
```bash
curl -X POST http://localhost:5000/api/payments/bank-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "KES",
    "reference": "ORDER001",
    "customerEmail": "customer@example.com"
  }'
```

## 🔒 Security Notes

1. **Never commit `.env` to version control**
2. **Use different keys for development and production**
3. **Regularly rotate API keys**
4. **Validate webhook signatures**
5. **Use HTTPS in production**

## 🌍 Currency Support

The platform supports automatic currency detection for:
- USD (United States Dollar)
- KES (Kenyan Shilling)
- NGN (Nigerian Naira)
- ZAR (South African Rand)
- GHS (Ghanaian Cedi)
- EGP (Egyptian Pound)
- EUR (Euro)
- GBP (British Pound)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)

## 📊 Transaction Fees

- **Free Plan**: 10% transaction fee
- **Starter Plan**: 5% transaction fee  
- **Pro Plan**: 0% transaction fee

Fees are automatically calculated and deducted from creator earnings.