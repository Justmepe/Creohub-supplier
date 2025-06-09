import { Request, Response } from "express";

interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  environment: 'sandbox' | 'production';
}

interface FlutterwavePaymentData {
  amount: number;
  currency: string;
  email: string;
  phone_number?: string;
  name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization: {
    title: string;
    description: string;
    logo: string;
  };
  payment_options: string;
  meta: {
    orderId: string;
    creatorId: string;
  };
}

class FlutterwaveService {
  private config: FlutterwaveConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
      environment: (process.env.FLUTTERWAVE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };
    
    this.baseUrl = this.config.environment === 'production' 
      ? 'https://api.flutterwave.com/v3'
      : 'https://api.flutterwave.com/v3';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  async initiatePayment(paymentData: FlutterwavePaymentData): Promise<any> {
    if (!this.config.secretKey) {
      throw new Error('Flutterwave credentials not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Payment initiation failed');
      }

      return result;
    } catch (error) {
      console.error('Flutterwave payment error:', error);
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Payment verification failed');
      }

      return result;
    } catch (error) {
      console.error('Flutterwave verification error:', error);
      throw error;
    }
  }

  async getBanks(country: string = 'KE'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/banks/${country}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Flutterwave banks error:', error);
      throw error;
    }
  }

  async createVirtualAccount(data: {
    email: string;
    name: string;
    narration: string;
    country: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/virtual-account-numbers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Flutterwave virtual account error:', error);
      throw error;
    }
  }
}

const flutterwaveService = new FlutterwaveService();

export async function initiateFlutterwavePayment(req: Request, res: Response) {
  try {
    const { 
      amount, 
      currency, 
      email, 
      phone, 
      name, 
      orderId, 
      creatorId,
      paymentMethods = 'card,mobilemoney,banktransfer'
    } = req.body;

    if (!amount || !currency || !email || !name || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const txRef = `creohub_${orderId}_${Date.now()}`;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:5000';

    const paymentData: FlutterwavePaymentData = {
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      email,
      phone_number: phone,
      name,
      tx_ref: txRef,
      callback_url: `${baseUrl}/api/payments/customer/flutterwave/webhook`,
      return_url: `${baseUrl}/payment-success`,
      customization: {
        title: 'Creohub Purchase',
        description: `Payment for order #${orderId}`,
        logo: `${baseUrl}/logo.png`
      },
      payment_options: paymentMethods,
      meta: {
        orderId: orderId.toString(),
        creatorId: creatorId.toString()
      }
    };

    const result = await flutterwaveService.initiatePayment(paymentData);
    
    res.json({
      success: true,
      data: result.data,
      paymentLink: result.data.link,
      txRef
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function verifyFlutterwavePayment(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;
    const result = await flutterwaveService.verifyPayment(transactionId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function flutterwaveWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['verif-hash'];
    const expectedSignature = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const paymentData = req.body;
    console.log('Flutterwave webhook received:', paymentData);
    
    // Process payment confirmation
    if (paymentData.status === 'successful') {
      const { orderId, creatorId } = paymentData.meta;
      
      // Update order status in database
      // This would integrate with your order management system
      console.log(`Payment successful for order ${orderId}, creator ${creatorId}`);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export async function getFlutterwaveBanks(req: Request, res: Response) {
  try {
    const { country = 'KE' } = req.query;
    const result = await flutterwaveService.getBanks(country as string);
    
    res.json({
      success: true,
      banks: result.data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}