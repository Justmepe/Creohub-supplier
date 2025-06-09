# Creohub Payment System Architecture

Creohub implements two distinct payment flows to handle different transaction types:

## 1. Creator Subscription Payments
**Purpose**: Creators pay the platform for subscription plans
**Flow**: Creator → Creohub Platform
**Plans**: 
- Free Trial (30 days, 10% transaction fee)
- Starter ($14.99/month, 5% transaction fee)  
- Pro ($29.99/month, 0% transaction fee)

### API Endpoints:
- `POST /api/payments/creator/subscription` - Create creator subscription
- `POST /api/payments/creator/stripe/customer` - Create Stripe customer for creator
- `GET /api/subscription/status/:creatorId` - Get creator subscription status
- `POST /api/subscription/upgrade` - Upgrade/downgrade creator plan

### Implementation:
- Uses Stripe Subscriptions for recurring billing
- Managed in creator dashboard billing section
- Automatically applies transaction fees based on plan

## 2. Customer Product Purchases  
**Purpose**: End customers buy products/services from creators
**Flow**: Customer → Creator (minus platform fee)
**Payment Methods**: M-Pesa, Stripe, PayPal, Bank Transfer

### API Endpoints:
- `POST /api/payments/customer/mpesa` - M-Pesa payment for products
- `POST /api/payments/customer/stripe/payment-intent` - Stripe payment for products
- `POST /api/payments/customer/mpesa/callback` - M-Pesa payment callback
- `POST /api/payments/customer/stripe/webhook` - Stripe payment webhook

### Implementation:
- Supports multiple payment methods for global accessibility
- Platform takes transaction fee based on creator's subscription plan
- Creates orders in database for tracking and fulfillment

## Key Differences:

| Aspect | Creator Subscriptions | Customer Purchases |
|--------|----------------------|-------------------|
| **Payer** | Creator | End Customer |
| **Recipient** | Creohub Platform | Creator (minus fee) |
| **Purpose** | Platform access | Product/service purchase |
| **Payment Type** | Recurring subscription | One-time payment |
| **Currency** | USD | Multi-currency (KES, USD, etc.) |
| **Integration** | Stripe Subscriptions | Multiple payment gateways |

## Revenue Model:
1. **Subscription Revenue**: Direct payments from creators for platform access
2. **Transaction Fees**: Percentage of customer purchases based on creator's plan
   - Free Trial: 10% fee
   - Starter Plan: 5% fee  
   - Pro Plan: 0% fee

This dual payment system ensures sustainable platform revenue while providing creators with flexible monetization options and customers with convenient payment methods.