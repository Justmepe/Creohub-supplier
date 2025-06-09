import { Request, Response } from "express";

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

class MpesaService {
  private config: MpesaConfig;

  constructor() {
    // Use sandbox credentials as fallback for testing
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || 'sandbox_consumer_key',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'sandbox_consumer_secret',
      businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '174379',
      passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/payments/customer/mpesa/callback',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };
  }

  private getBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config.consumerKey || !this.config.consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    
    const response = await fetch(`${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.access_token;
  }

  async initiateSTKPush(phoneNumber: string, amount: number, accountReference: string, transactionDesc: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${this.config.businessShortCode}${this.config.passkey}${timestamp}`).toString('base64');

      const requestBody = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.config.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.config.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      return await response.json();
    } catch (error) {
      console.error('M-Pesa STK Push error:', error);
      throw error;
    }
  }

  async checkTransactionStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${this.config.businessShortCode}${this.config.passkey}${timestamp}`).toString('base64');

      const requestBody = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      return await response.json();
    } catch (error) {
      console.error('M-Pesa status check error:', error);
      throw error;
    }
  }
}

const mpesaService = new MpesaService();

export async function initiateMpesaPayment(req: Request, res: Response) {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;
    
    if (!phoneNumber || !amount || !accountReference) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await mpesaService.initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc || 'Payment');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function checkMpesaStatus(req: Request, res: Response) {
  try {
    const { checkoutRequestId } = req.params;
    const result = await mpesaService.checkTransactionStatus(checkoutRequestId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function mpesaCallback(req: Request, res: Response) {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback:', callbackData);
    
    // Process the callback data and update order status
    // This would typically update the database with payment confirmation
    
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
}