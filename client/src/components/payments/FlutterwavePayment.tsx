import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FlutterwavePaymentProps {
  amount: number;
  productId: number;
  productName: string;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

interface PaymentData {
  email: string;
  phoneNumber: string;
  fullName: string;
  country: string;
}

interface FlutterwaveResponse {
  status: string;
  message: string;
  data: {
    link: string;
    tx_ref: string;
  };
}

export default function FlutterwavePayment({ 
  amount, 
  productId, 
  productName, 
  onSuccess, 
  onCancel 
}: FlutterwavePaymentProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    email: "",
    phoneNumber: "",
    fullName: "",
    country: "KE"
  });
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const { toast } = useToast();
  const { formatPrice, currency } = useCurrency();

  const countries = [
    { code: "KE", name: "Kenya" },
    { code: "UG", name: "Uganda" },
    { code: "TZ", name: "Tanzania" },
    { code: "GH", name: "Ghana" },
    { code: "NG", name: "Nigeria" },
    { code: "ZA", name: "South Africa" },
    { code: "RW", name: "Rwanda" },
    { code: "ZM", name: "Zambia" },
    { code: "MW", name: "Malawi" }
  ];

  const initiateMutation = useMutation({
    mutationFn: async (data: PaymentData & { amount: number; productId: number }) => {
      const response = await apiRequest("POST", "/api/payments/customer/flutterwave", {
        email: data.email,
        phone_number: data.phoneNumber,
        name: data.fullName,
        amount: data.amount,
        currency: currency,
        tx_ref: `PRODUCT_${data.productId}_${Date.now()}`,
        redirect_url: `${window.location.origin}/payment/success`,
        customer: {
          email: data.email,
          phone_number: data.phoneNumber,
          name: data.fullName
        },
        customizations: {
          title: "Creohub Payment",
          description: `Payment for ${productName}`,
          logo: ""
        },
        meta: {
          product_id: data.productId,
          product_name: productName
        }
      });
      return response.json();
    },
    onSuccess: (data: FlutterwaveResponse) => {
      if (data.status === "success" && data.data?.link) {
        setPaymentStatus('processing');
        
        toast({
          title: "Redirecting to Payment",
          description: "You will be redirected to complete your payment",
        });

        // Redirect to Flutterwave hosted payment page
        window.location.href = data.data.link;
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Failed to initiate payment",
          variant: "destructive",
        });
        setPaymentStatus('failed');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate Flutterwave payment",
        variant: "destructive",
      });
      setPaymentStatus('failed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.email || !paymentData.fullName || !paymentData.phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    initiateMutation.mutate({
      ...paymentData,
      amount: Math.round(amount),
      productId
    });
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setPaymentData({
      email: "",
      phoneNumber: "",
      fullName: "",
      country: "KE"
    });
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-700">Payment Successful!</CardTitle>
          <CardDescription>
            Your payment of {formatPrice(amount)} has been confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetPayment} variant="outline" className="w-full">
            Make Another Payment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-700">Payment Failed</CardTitle>
          <CardDescription>
            Your payment could not be processed. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={resetPayment} className="w-full">
            Try Again
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="w-full">
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Card Payment
        </CardTitle>
        <CardDescription>
          Pay {formatPrice(amount)} for {productName} using your card or mobile money
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentStatus === 'processing' ? (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <div>
              <h3 className="font-semibold">Redirecting to Payment Gateway</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we redirect you to complete your payment securely.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={paymentData.fullName}
                onChange={(e) => setPaymentData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={initiateMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={paymentData.email}
                onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
                disabled={initiateMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+254712345678"
                value={paymentData.phoneNumber}
                onChange={(e) => setPaymentData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                disabled={initiateMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={paymentData.country} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, country: value }))}
                disabled={initiateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Amount:</span>
                <span className="font-semibold">{formatPrice(amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Product:</span>
                <span className="font-medium">{productName}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="font-medium mb-1">Supported Payment Methods:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Visa, Mastercard, and local cards</li>
                <li>Mobile money (M-Pesa, MTN, Airtel)</li>
                <li>Bank transfers and USSD</li>
                <li>Digital wallets</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={initiateMutation.isPending}
              >
                {initiateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Continue to Payment
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  onClick={onCancel} 
                  variant="outline" 
                  className="w-full"
                  disabled={initiateMutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}