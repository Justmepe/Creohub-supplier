import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Globe,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/queryClient";

interface PesapalPaymentProps {
  amount: number;
  currency: string;
  productId: string;
  productName: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

interface PesapalResponse {
  success: boolean;
  order_tracking_id: string;
  redirect_url: string;
  order_id: string;
}

export default function PesapalPayment({
  amount,
  currency,
  productId,
  productName,
  customerEmail,
  customerPhone,
  customerName,
  onSuccess,
  onCancel
}: PesapalPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'redirecting' | 'success' | 'failed'>('idle');
  const [orderTrackingId, setOrderTrackingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const initiatePesapalPayment = useMutation({
    mutationFn: async (paymentData: {
      amount: number;
      currency: string;
      email: string;
      phone: string;
      firstName: string;
      lastName: string;
      productId: string;
      productName: string;
    }) => {
      const response = await apiRequest("POST", "/api/payments/customer/pesapal", paymentData);
      const data = await response.json();
      return data as PesapalResponse;
    },
    onSuccess: (data: PesapalResponse) => {
      if (data.success && data.redirect_url) {
        setOrderTrackingId(data.order_tracking_id);
        setPaymentStatus('redirecting');
        
        toast({
          title: "Payment Initialized",
          description: "Redirecting to Pesapal payment page...",
        });

        // Open Pesapal payment page in new window
        const paymentWindow = window.open(data.redirect_url, 'pesapal_payment', 'width=800,height=600');
        
        // Poll for payment completion
        pollPaymentStatus(data.order_tracking_id, paymentWindow);
      } else {
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setPaymentStatus('failed');
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  const checkPaymentStatus = useMutation({
    mutationFn: async (trackingId: string) => {
      const response = await apiRequest("GET", `/api/payments/customer/pesapal/status/${trackingId}`);
      const data = await response.json();
      return data;
    },
  });

  const pollPaymentStatus = async (trackingId: string, paymentWindow: Window | null) => {
    const maxAttempts = 60; // 10 minutes (10 second intervals)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus('failed');
        toast({
          title: "Payment Timeout",
          description: "Payment verification timed out. Please check your payment status.",
          variant: "destructive",
        });
        return;
      }

      try {
        const status = await checkPaymentStatus.mutateAsync(trackingId);
        
        // Check if payment window was closed
        if (paymentWindow && paymentWindow.closed) {
          setPaymentStatus('idle');
          return;
        }

        if (status.payment_status_description === 'Completed') {
          setPaymentStatus('success');
          if (paymentWindow) paymentWindow.close();
          
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully!",
          });
          
          onSuccess?.(status);
          return;
        } else if (status.payment_status_description === 'Failed') {
          setPaymentStatus('failed');
          if (paymentWindow) paymentWindow.close();
          
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed.",
            variant: "destructive",
          });
          return;
        }

        // Continue polling
        attempts++;
        setTimeout(poll, 10000); // Poll every 10 seconds
      } catch (error) {
        console.error('Payment status check failed:', error);
        attempts++;
        setTimeout(poll, 10000);
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 5000);
  };

  const handlePayment = () => {
    const [firstName, ...lastNameParts] = customerName.trim().split(' ');
    const lastName = lastNameParts.join(' ') || 'User';

    setIsProcessing(true);
    setPaymentStatus('processing');

    initiatePesapalPayment.mutate({
      amount,
      currency,
      email: customerEmail,
      phone: customerPhone,
      firstName,
      lastName,
      productId,
      productName,
    });
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
      case 'redirecting':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Globe className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Initializing payment...';
      case 'redirecting':
        return 'Redirecting to payment page...';
      case 'success':
        return 'Payment completed successfully!';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return 'Ready to process payment';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Pesapal Payment Gateway
        </CardTitle>
        <CardDescription>
          Pay securely with M-Pesa, Cards, or Bank Transfer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Methods Available */}
        <div className="grid grid-cols-3 gap-2">
          <Badge variant="outline" className="flex items-center gap-1 justify-center py-2">
            <Smartphone className="h-3 w-3" />
            M-Pesa
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 justify-center py-2">
            <CreditCard className="h-3 w-3" />
            Cards
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 justify-center py-2">
            <Building2 className="h-3 w-3" />
            Bank
          </Badge>
        </div>

        {/* Payment Summary */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Amount:</span>
            <span className="text-lg font-bold">
              {formatPrice(amount, currency)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {productName}
          </div>
        </div>

        {/* Status Display */}
        {paymentStatus !== 'idle' && (
          <Alert>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{getStatusMessage()}</span>
            </div>
            {paymentStatus === 'redirecting' && (
              <AlertDescription className="mt-2">
                Complete your payment in the new window. This page will update automatically.
              </AlertDescription>
            )}
          </Alert>
        )}

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing || paymentStatus === 'processing' || paymentStatus === 'redirecting'}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Pay {formatPrice(amount, currency)} with Pesapal
            </>
          )}
        </Button>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Secure Payment Processing</p>
            <p>Your payment is processed securely by Pesapal. Choose from M-Pesa, credit/debit cards, or direct bank transfer.</p>
          </div>
        </div>

        {/* Cancel Option */}
        {onCancel && paymentStatus === 'idle' && (
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}