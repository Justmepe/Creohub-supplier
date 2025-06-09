import { Request, Response } from "express";

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  routingNumber?: string;
  swiftCode?: string;
  branch?: string;
}

interface BankTransferConfig {
  accounts: BankAccount[];
  webhookSecret: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
}

class BankTransferService {
  private config: BankTransferConfig;

  constructor() {
    this.config = {
      accounts: this.parseBankAccounts(),
      webhookSecret: process.env.BANK_TRANSFER_WEBHOOK_SECRET || '',
      apiKey: process.env.BANK_TRANSFER_API_KEY || '',
      environment: (process.env.BANK_TRANSFER_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };
  }

  private parseBankAccounts(): BankAccount[] {
    const accountsJson = process.env.BANK_ACCOUNTS || JSON.stringify([
      {
        bankName: "Equity Bank Kenya",
        accountNumber: "0123456789",
        accountName: "Creohub Limited",
        branch: "Westlands Branch",
        swiftCode: "EQBLKENA"
      },
      {
        bankName: "KCB Bank Kenya",
        accountNumber: "1234567890",
        accountName: "Creohub Limited", 
        branch: "CBD Branch",
        swiftCode: "KCBLKENX"
      },
      {
        bankName: "Standard Chartered Bank",
        accountNumber: "8901234567",
        accountName: "Creohub Limited",
        branch: "Nairobi Branch", 
        swiftCode: "SCBLKENX"
      }
    ]);
    try {
      return JSON.parse(accountsJson);
    } catch (error) {
      console.error('Failed to parse bank accounts from environment:', error);
      return [];
    }
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    return this.config.accounts;
  }

  async initiateTransfer(transferDetails: {
    amount: number;
    currency: string;
    reference: string;
    customerEmail: string;
    description: string;
  }): Promise<any> {
    // This would integrate with a bank API service like Flutterwave, Paystack, etc.
    // For now, returning bank account details for manual transfer
    
    const accounts = await this.getBankAccounts();
    
    if (accounts.length === 0) {
      throw new Error('Bank accounts not configured');
    }

    // Select appropriate account based on currency or region
    const selectedAccount = accounts[0]; // Simple selection for now

    return {
      success: true,
      transferId: `BT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bankDetails: selectedAccount,
      amount: transferDetails.amount,
      currency: transferDetails.currency,
      reference: transferDetails.reference,
      instructions: `Please transfer ${transferDetails.amount} ${transferDetails.currency} to the account details provided. Use reference: ${transferDetails.reference}`,
      status: 'pending_confirmation'
    };
  }

  async verifyTransfer(transferId: string, bankReference: string): Promise<any> {
    // This would verify the transfer with the bank's API
    // For manual verification, this could update the order status
    
    return {
      transferId,
      bankReference,
      status: 'verified',
      verifiedAt: new Date().toISOString()
    };
  }

  async handleWebhook(webhookData: any): Promise<any> {
    // Verify webhook signature
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Process webhook data to update order status
    console.log('Bank transfer webhook received:', webhookData);
    
    return {
      status: 'processed',
      transferId: webhookData.transferId,
      amount: webhookData.amount
    };
  }
}

const bankTransferService = new BankTransferService();

export async function initiateBankTransfer(req: Request, res: Response) {
  try {
    const { amount, currency, reference, customerEmail, description } = req.body;
    
    if (!amount || !currency || !reference || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await bankTransferService.initiateTransfer({
      amount,
      currency,
      reference,
      customerEmail,
      description
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getBankAccounts(req: Request, res: Response) {
  try {
    const accounts = await bankTransferService.getBankAccounts();
    res.json({ accounts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function verifyBankTransfer(req: Request, res: Response) {
  try {
    const { transferId } = req.params;
    const { bankReference } = req.body;
    
    if (!bankReference) {
      return res.status(400).json({ error: 'Bank reference is required' });
    }

    const result = await bankTransferService.verifyTransfer(transferId, bankReference);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function bankTransferWebhook(req: Request, res: Response) {
  try {
    const result = await bankTransferService.handleWebhook(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}