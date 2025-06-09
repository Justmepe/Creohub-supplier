import { Request, Response } from "express";
import crypto from "crypto";

interface PesapalConfig {
  consumerKey: string;
  consumerSecret: string;
  environment: 'sandbox' | 'live';
  ipnUrl: string;
  callbackUrl: string;
}

interface PesapalPaymentRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number: string;
    country_code: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

class PesapalService {
  private config: PesapalConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      consumerKey: process.env.PESAPAL_CONSUMER_KEY || 'test_consumer_key',
      consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || 'test_consumer_secret',
      environment: (process.env.PESAPAL_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox',
      ipnUrl: process.env.PESAPAL_IPN_URL || 'http://localhost:5000/api/payments/customer/pesapal/ipn',
      callbackUrl: process.env.PESAPAL_CALLBACK_URL || 'https://your-domain.com/payment/success'
    };
  }

  private getBaseUrl(): string {
    return this.config.environment === 'live'
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const url = `${this.getBaseUrl()}/api/Auth/RequestToken`;
    
    console.log('Requesting Pesapal token from:', url);
    console.log('Using credentials:', { 
      consumer_key: this.config.consumerKey?.substring(0, 10) + '...', 
      consumer_secret: this.config.consumerSecret?.substring(0, 10) + '...' 
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: this.config.consumerKey,
        consumer_secret: this.config.consumerSecret
      })
    });

    const responseText = await response.text();
    console.log('Pesapal response status:', response.status);
    console.log('Pesapal response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response from Pesapal: ${responseText}`);
    }
    
    if (data.token) {
      this.accessToken = data.token;
      // Token expires in 5 minutes, refresh 1 minute early
      this.tokenExpiry = new Date(Date.now() + (4 * 60 * 1000));
      console.log('Successfully obtained Pesapal token');
      return this.accessToken;
    }

    console.error('Pesapal token request failed:', data);
    throw new Error(`Failed to get Pesapal access token: ${data.error || data.message || 'Unknown error'}`);
  }

  async registerIPN(): Promise<string> {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/api/URLSetup/RegisterIPN`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url: this.config.ipnUrl,
        ipn_notification_type: 'GET'
      })
    });

    const data = await response.json();
    return data.ipn_id;
  }

  async submitOrderRequest(orderData: PesapalPaymentRequest): Promise<any> {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/api/Transactions/SubmitOrderRequest`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    return await response.json();
  }

  async getTransactionStatus(orderTrackingId: string): Promise<any> {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return await response.json();
  }

  generateOrderId(): string {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

const pesapalService = new PesapalService();

export async function initiatePesapalPayment(req: Request, res: Response) {
  try {
    const {
      amount,
      currency,
      email,
      phone,
      firstName,
      lastName,
      productId,
      productName
    } = req.body;

    if (!amount || !currency || !email || !phone || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, currency, email, phone, firstName, lastName' 
      });
    }

    // Validate credentials are provided
    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      return res.status(500).json({
        error: 'Pesapal credentials not configured',
        message: 'Please configure PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET'
      });
    }

    // Register IPN if not already done (you may want to cache this)
    let notificationId;
    try {
      notificationId = await pesapalService.registerIPN();
    } catch (error) {
      console.log('IPN registration failed, using default');
      notificationId = 'default';
    }

    const orderId = pesapalService.generateOrderId();
    
    const orderData: PesapalPaymentRequest = {
      id: orderId,
      currency: currency.toUpperCase(),
      amount: parseFloat(amount),
      description: productName || `Payment for Product ${productId}`,
      callback_url: `${req.protocol}://${req.get('host')}/payment/success?order_id=${orderId}`,
      notification_id: notificationId,
      billing_address: {
        email_address: email,
        phone_number: phone,
        country_code: currency === 'KES' ? 'KE' : 
                     currency === 'UGX' ? 'UG' : 
                     currency === 'TZS' ? 'TZ' : 'KE',
        first_name: firstName,
        last_name: lastName
      }
    };

    const result = await pesapalService.submitOrderRequest(orderData);
    
    if (result.order_tracking_id && result.redirect_url) {
      res.json({
        success: true,
        order_tracking_id: result.order_tracking_id,
        redirect_url: result.redirect_url,
        order_id: orderId
      });
    } else {
      res.status(400).json({
        error: 'Failed to create payment request',
        details: result
      });
    }
  } catch (error: any) {
    console.error('Pesapal payment initiation error:', error);
    res.status(500).json({ 
      error: 'Payment initiation failed',
      message: error.message 
    });
  }
}

export async function checkPesapalStatus(req: Request, res: Response) {
  try {
    const { orderTrackingId } = req.params;
    
    if (!orderTrackingId) {
      return res.status(400).json({ error: 'Order tracking ID is required' });
    }

    const status = await pesapalService.getTransactionStatus(orderTrackingId);
    res.json(status);
  } catch (error: any) {
    console.error('Pesapal status check error:', error);
    res.status(500).json({ 
      error: 'Status check failed',
      message: error.message 
    });
  }
}

export async function pesapalIPN(req: Request, res: Response) {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    
    console.log('Pesapal IPN received:', req.query);
    
    if (OrderTrackingId) {
      // Get transaction status
      const status = await pesapalService.getTransactionStatus(OrderTrackingId as string);
      
      console.log('Transaction status:', status);
      
      // Update order status in database based on the status
      // This would typically update your orders table
      
      // Respond with success
      res.status(200).json({ 
        message: 'IPN processed successfully',
        status: status.payment_status_description 
      });
    } else {
      res.status(400).json({ error: 'Invalid IPN data' });
    }
  } catch (error: any) {
    console.error('Pesapal IPN error:', error);
    res.status(500).json({ 
      error: 'IPN processing failed',
      message: error.message 
    });
  }
}

export async function pesapalCallback(req: Request, res: Response) {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    
    console.log('Pesapal callback received:', req.query);
    
    if (OrderTrackingId) {
      // Get final transaction status
      const status = await pesapalService.getTransactionStatus(OrderTrackingId as string);
      
      // Redirect user based on payment status
      if (status.payment_status_description === 'Completed') {
        res.redirect(`/payment/success?order_id=${OrderMerchantReference}&status=success`);
      } else {
        res.redirect(`/payment/failed?order_id=${OrderMerchantReference}&status=failed`);
      }
    } else {
      res.redirect('/payment/failed?error=invalid_callback');
    }
  } catch (error: any) {
    console.error('Pesapal callback error:', error);
    res.redirect('/payment/failed?error=processing_failed');
  }
}