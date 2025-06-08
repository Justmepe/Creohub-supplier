export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | null;
  features: string[];
  transactionFee: number;
  productLimit: number | null; // null means unlimited
  trialDays?: number;
  popular?: boolean;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: null,
    features: [
      'Basic storefront customization',
      'Upload up to 3 products',
      'Accept payments',
      'Basic analytics',
      'M-Pesa + card payments'
    ],
    transactionFee: 0.10, // 10%
    productLimit: 3,
    trialDays: 30
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Up to 25 products (digital + physical)',
      'Email capture & basic CRM',
      'Custom domain support',
      'Enhanced analytics',
      'Limited marketing tools (social sharing, referral tracking)'
    ],
    transactionFee: 0.05, // 5%
    productLimit: 25,
    popular: true
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited products',
      'Advanced analytics & sales reports',
      'Full marketing suite (email campaigns, coupons, affiliate tools)',
      'Priority support',
      'Zero transaction fees',
      'Multi-currency pricing & payouts'
    ],
    transactionFee: 0, // 0%
    productLimit: null // unlimited
  }
};

export function getPlanById(planId: string): PricingPlan | null {
  return PRICING_PLANS[planId] || null;
}

export function calculateTransactionFee(amount: number, planType: string): number {
  const plan = getPlanById(planType);
  if (!plan) return 0;
  return amount * plan.transactionFee;
}

export function canAddProduct(currentCount: number, planType: string): boolean {
  const plan = getPlanById(planType);
  if (!plan) return false;
  if (plan.productLimit === null) return true; // unlimited
  return currentCount < plan.productLimit;
}

export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() > trialEndsAt;
}

export function isSubscriptionActive(subscriptionStatus: string, subscriptionEndsAt: Date | null): boolean {
  if (subscriptionStatus === 'active' && subscriptionEndsAt) {
    return new Date() < subscriptionEndsAt;
  }
  return subscriptionStatus === 'active';
}