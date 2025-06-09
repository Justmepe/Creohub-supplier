import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, ArrowLeft, Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function PaymentSuccess() {
  const [, params] = useLocation();
  const { formatPrice } = useCurrency();
  
  // Extract query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  const orderTrackingId = urlParams.get('OrderTrackingId');
  const status = urlParams.get('status');

  const [paymentVerified, setPaymentVerified] = useState(false);

  // Query to verify payment status
  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['payment-status', orderTrackingId],
    queryFn: async () => {
      if (!orderTrackingId) return null;
      
      const response = await fetch(`/api/payments/customer/pesapal/status/${orderTrackingId}`);
      if (!response.ok) throw new Error('Failed to verify payment');
      
      const data = await response.json();
      
      if (data.payment_status_description === 'Completed') {
        setPaymentVerified(true);
      }
      
      return data;
    },
    enabled: !!orderTrackingId,
    refetchInterval: paymentVerified ? false : 5000, // Poll every 5 seconds until verified
  });

  useEffect(() => {
    // Set page title
    document.title = "Payment Successful - Creohub";
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold mb-2">Verifying Payment</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-green-700 dark:text-green-400">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            {paymentVerified 
              ? "Your payment has been confirmed and processed successfully."
              : "Your payment is being processed. You will receive a confirmation shortly."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {paymentStatus && (
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-xs">{orderTrackingId}</span>
              </div>
              {paymentStatus.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">
                    {formatPrice(parseFloat(paymentStatus.amount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-semibold ${
                  paymentVerified ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {paymentStatus.payment_status_description || 'Processing'}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {paymentVerified && (
              <Button className="w-full" asChild>
                <Link href="/dashboard">
                  <Download className="w-4 h-4 mr-2" />
                  Access Your Purchase
                </Link>
              </Button>
            )}
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Need help? Contact our support team
            </p>
            <p className="text-xs text-muted-foreground">
              Transaction reference: {orderId || orderTrackingId}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}