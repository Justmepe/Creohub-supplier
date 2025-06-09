import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, CreditCard, Building2, Globe, Banknote } from "lucide-react";
import MpesaPayment from "./MpesaPayment";
import PesapalPayment from "./PesapalPayment";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PaymentSelectorProps {
  amount: number;
  productId: number;
  productName: string;
  onSuccess?: (transactionId: string, method: string) => void;
  onCancel?: () => void;
}

export default function PaymentSelector({
  amount,
  productId,
  productName,
  onSuccess,
  onCancel
}: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const { formatPrice, currency } = useCurrency();

  // Determine available payment methods based on currency/region
  const isKenyanShilling = currency === 'KES';
  const isAfricanCurrency = ['KES', 'UGX', 'TZS', 'GHS', 'NGN', 'ZAR'].includes(currency);

  const paymentMethods = [
    {
      id: 'pesapal',
      name: 'Pesapal',
      description: 'Unified payment - Mobile money, cards, and bank transfers',
      icon: Banknote,
      available: isAfricanCurrency,
      popular: isAfricanCurrency,
      fees: 'Standard processing fees apply'
    },
    {
      id: 'mpesa',
      name: 'M-Pesa',
      description: 'Pay with your Safaricom M-Pesa account',
      icon: Smartphone,
      available: isKenyanShilling,
      popular: false,
      fees: 'No additional fees'
    },
    {
      id: 'card',
      name: 'Card Payment',
      description: 'Pay with Visa, Mastercard, or local cards',
      icon: CreditCard,
      available: true,
      popular: !isAfricanCurrency,
      fees: 'Standard processing fees apply'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with PayPal account or card',
      icon: Globe,
      available: true,
      popular: false,
      fees: 'PayPal fees apply'
    }
  ].filter(method => method.available);

  if (selectedMethod === 'mpesa') {
    return (
      <MpesaPayment
        amount={amount}
        productId={productId}
        productName={productName}
        onSuccess={(transactionId) => onSuccess?.(transactionId, 'mpesa')}
        onCancel={() => setSelectedMethod(null)}
      />
    );
  }

  if (selectedMethod === 'pesapal') {
    return (
      <PesapalPayment
        amount={amount}
        productId={productId}
        productName={productName}
        onSuccess={(transactionId) => onSuccess?.(transactionId, 'pesapal')}
        onCancel={() => setSelectedMethod(null)}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Choose Payment Method</CardTitle>
        <CardDescription>
          Select your preferred payment method for {productName} - {formatPrice(amount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <Card 
                key={method.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/20"
                onClick={() => setSelectedMethod(method.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{method.name}</h3>
                          {method.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {method.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {method.fees}
                        </p>
                      </div>
                    </div>
                    <Button size="sm">
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {onCancel && (
          <div className="mt-6 flex justify-center">
            <Button onClick={onCancel} variant="outline">
              Cancel Purchase
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Payment Information</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Product:</span>
              <span>{productName}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">{formatPrice(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Currency:</span>
              <span>{currency}</span>
            </div>
          </div>
        </div>

        {!isKenyanShilling && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>African Payment Support:</strong> This platform supports multiple African payment methods including mobile money, local cards, and bank transfers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}