import Stripe from 'stripe';
import { Request, Response } from 'express';

class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  private ensureStripeConfigured(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    return this.stripe;
  }

  async createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<Stripe.PaymentIntent> {
    const stripe = this.ensureStripeConfigured();
    
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });
  }

  async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    const stripe = this.ensureStripeConfigured();
    
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    const stripe = this.ensureStripeConfigured();
    
    return await stripe.customers.create({
      email,
      name,
    });
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = this.ensureStripeConfigured();
    
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = this.ensureStripeConfigured();
    
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    const stripe = this.ensureStripeConfigured();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

const stripeService = new StripeService();

export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency = 'usd', metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const paymentIntent = await stripeService.createPaymentIntent(amount, currency, metadata);
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createSubscription(req: Request, res: Response) {
  try {
    const { customerId, priceId } = req.body;
    
    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'Customer ID and Price ID are required' });
    }

    const subscription = await stripeService.createSubscription(customerId, priceId);
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent?.client_secret,
    });
  } catch (error: any) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customer = await stripeService.createCustomer(email, name);
    
    res.json({
      customerId: customer.id,
      email: customer.email,
    });
  } catch (error: any) {
    console.error('Stripe customer creation error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function stripeWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    const event = await stripeService.handleWebhook(payload, signature);
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        // Update order status in database
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        // Update order status in database
        break;
      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object);
        // Update creator subscription status
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object);
        // Update creator subscription status
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}