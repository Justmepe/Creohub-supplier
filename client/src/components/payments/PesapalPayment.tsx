import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle, XCircle, Banknote } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PesapalPaymentProps {
  amount: number;
  productId: number;
  productName: string;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

interface PaymentData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  country: string;
}

interface PesapalResponse {
  success: boolean;
  order_tracking_id: string;
  redirect_url: string;
  order_id: string;
}

export default function PesapalPayment({ 
  amount, 
  productId, 
  productName, 
  onSuccess, 
  onCancel 
}: PesapalPaymentProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    country: "KE"
  });
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const { toast } = useToast();
  const { formatPrice, currency } = useCurrency();

  const countries = [
    { code: "KE", name: "Kenya", currency: "KES" },
    { code: "UG", name: "Uganda", currency: "UGX" },
    { code: "TZ", name: "Tanzania", currency: "TZS" },
    { code: "RW", name: "Rwanda", currency: "RWF" },
    { code: "MW", name: "Malawi", currency: "MWK" },
    { code: "ZM", name: "Zambia", currency: "ZMW" }
  ];

  const initiateMutation = useMutation({
    mutationFn: async (data: PaymentData & { amount: number; productId: number }) => {
      const response = await apiRequest("POST", "/api/payments/customer/pesapal", {
        amount: data.amount,
        currency: currency,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        productId: data.productId,
        productName: productName
      });
      return response.json();
    },
    onSuccess: (data: PesapalResponse) => {
      if (data.success && data.redirect_url) {
        setPaymentStatus('processing');
        
        toast({
          title: "Redirecting to Payment",
          description: "You will be redirected to complete your payment securely",
        });

        // Redirect to Pesapal hosted payment page
        window.location.href = data.redirect_url;
      } else {
        toast({
          title: "Payment Failed",
          description: "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
        setPaymentStatus('failed');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
      setPaymentStatus('failed');
    },
  });

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing
    if (cleaned.startsWith('0')) {
      const countryCode = paymentData.country === 'KE' ? '254' :
                         paymentData.country === 'UG' ? '256' :
                         paymentData.country === 'TZ' ? '255' :
                         paymentData.country === 'RW' ? '250' : '254';
      cleaned = countryCode + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.email || !paymentData.firstName || !paymentData.lastName || !paymentData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const formattedData = {
      ...paymentData,
      phone: formatPhoneNumber(paymentData.phone),
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      productId
    };

    initiateMutation.mutate(formattedData);
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setPaymentData({
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
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
          <Banknote className="w-5 h-5" />
          Pesapal Payment
        </CardTitle>
        <CardDescription>
          Pay {formatPrice(amount)} for {productName} using mobile money, cards, or bank transfer
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentStatus === 'processing' ? (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <div>
              <h3 className="font-semibold">Redirecting to Secure Payment</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we redirect you to Pesapal's secure payment gateway.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={paymentData.firstName}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={initiateMutation.isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={paymentData.lastName}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={initiateMutation.isPending}
                  required
                />
              </div>
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
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678 or +254712345678"
                value={paymentData.phone}
                onChange={(e) => setPaymentData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={initiateMutation.isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your mobile number for payment confirmation
              </p>
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
                      {country.name} ({country.currency})
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
                <li>M-Pesa, Airtel Money, T-Kash (Mobile Money)</li>
                <li>Visa, Mastercard, and local bank cards</li>
                <li>Direct bank transfers and RTGS</li>
                <li>USSD and mobile banking</li>
              </ul>
              <p className="mt-2 text-xs">
                Powered by Pesapal - Secure payments across Africa
              </p>
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
                    <Banknote className="w-4 h-4 mr-2" />
                    Pay with Pesapal
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