import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, CheckCircle, XCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface MpesaPaymentProps {
  amount: number;
  productId: number;
  productName: string;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

interface MpesaResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface StatusResponse {
  ResultCode: string;
  ResultDesc: string;
}

export default function MpesaPayment({ 
  amount, 
  productId, 
  productName, 
  onSuccess, 
  onCancel 
}: MpesaPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const initiateMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; amount: number; productId: number }) => {
      const response = await apiRequest("POST", "/api/payments/customer/mpesa", {
        phoneNumber: data.phoneNumber,
        amount: data.amount,
        accountReference: `PRODUCT_${data.productId}`,
        transactionDesc: `Payment for ${productName}`
      });
      return response.json();
    },
    onSuccess: (data: MpesaResponse) => {
      if (data.ResponseCode === "0") {
        setCheckoutRequestId(data.CheckoutRequestID);
        setPaymentStatus('pending');
        setIsProcessing(true);
        
        toast({
          title: "Payment Request Sent",
          description: "Please complete the payment on your phone",
        });

        // Start polling for status
        pollPaymentStatus(data.CheckoutRequestID);
      } else {
        toast({
          title: "Payment Failed",
          description: data.ResponseDescription || "Failed to initiate payment",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate M-Pesa payment",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (checkoutRequestId: string) => {
      const response = await apiRequest("GET", `/api/payments/customer/mpesa/status/${checkoutRequestId}`);
      return response.json();
    },
  });

  const pollPaymentStatus = async (requestId: string) => {
    const maxAttempts = 30; // 5 minutes (10 second intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await statusMutation.mutateAsync(requestId);
        
        if (status.ResultCode === "0") {
          // Payment successful
          setPaymentStatus('success');
          setIsProcessing(false);
          toast({
            title: "Payment Successful",
            description: "Your payment has been confirmed!",
          });
          onSuccess?.(requestId);
        } else if (status.ResultCode === "1032") {
          // Payment cancelled by user
          setPaymentStatus('failed');
          setIsProcessing(false);
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled by user",
            variant: "destructive",
          });
        } else if (attempts < maxAttempts) {
          // Still processing, continue polling
          attempts++;
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          // Timeout
          setPaymentStatus('failed');
          setIsProcessing(false);
          toast({
            title: "Payment Timeout",
            description: "Payment verification timed out. Please check your transaction status.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 10000);
        } else {
          setPaymentStatus('failed');
          setIsProcessing(false);
          toast({
            title: "Status Check Failed",
            description: "Could not verify payment status",
            variant: "destructive",
          });
        }
      }
    };

    // Start polling after 5 seconds
    setTimeout(poll, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive",
      });
      return;
    }

    // Format phone number (remove spaces, add country code if needed)
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    initiateMutation.mutate({
      phoneNumber: formattedPhone,
      amount: Math.round(amount),
      productId
    });
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setIsProcessing(false);
    setCheckoutRequestId(null);
    setPhoneNumber("");
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
          <Smartphone className="w-5 h-5" />
          M-Pesa Payment
        </CardTitle>
        <CardDescription>
          Pay {formatPrice(amount)} for {productName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentStatus === 'pending' ? (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <div>
              <h3 className="font-semibold">Complete Payment on Your Phone</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Check your phone for the M-Pesa payment prompt and enter your PIN to complete the transaction.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Request ID: {checkoutRequestId}
              </p>
            </div>
            <Button 
              onClick={() => {
                setIsProcessing(false);
                setPaymentStatus('failed');
              }} 
              variant="outline" 
              size="sm"
            >
              Cancel Payment
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="0712345678 or 254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={initiateMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Enter your Safaricom M-Pesa number
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span className="font-semibold">{formatPrice(amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Product:</span>
                <span className="font-medium">{productName}</span>
              </div>
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
                    Initiating Payment...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay with M-Pesa
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