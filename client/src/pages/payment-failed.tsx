import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RotateCcw, AlertCircle } from "lucide-react";

export default function PaymentFailed() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  const error = urlParams.get('error');

  useEffect(() => {
    document.title = "Payment Failed - Creohub";
  }, []);

  const getErrorMessage = () => {
    switch (error) {
      case 'invalid_callback':
        return "Invalid payment callback received. Please try again.";
      case 'processing_failed':
        return "Payment processing failed. Please check your payment method and try again.";
      case 'cancelled':
        return "Payment was cancelled. You can try again when ready.";
      default:
        return "Your payment could not be processed. This may be due to insufficient funds, network issues, or payment method restrictions.";
    }
  };

  const getErrorIcon = () => {
    if (error === 'cancelled') {
      return <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />;
    }
    return <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />;
  };

  const getErrorColor = () => {
    if (error === 'cancelled') {
      return "text-yellow-700 dark:text-yellow-400";
    }
    return "text-red-700 dark:text-red-400";
  };

  const getBackgroundColor = () => {
    if (error === 'cancelled') {
      return "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20";
    }
    return "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20";
  };

  return (
    <div className={`min-h-screen ${getBackgroundColor()} flex items-center justify-center p-4`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 ${
            error === 'cancelled' 
              ? 'bg-yellow-100 dark:bg-yellow-900' 
              : 'bg-red-100 dark:bg-red-900'
          } rounded-full flex items-center justify-center mb-4`}>
            {getErrorIcon()}
          </div>
          <CardTitle className={getErrorColor()}>
            {error === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
          </CardTitle>
          <CardDescription>
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {orderId && (
            <div className={`${
              error === 'cancelled' 
                ? 'bg-yellow-50 dark:bg-yellow-950/30' 
                : 'bg-red-50 dark:bg-red-950/30'
            } p-4 rounded-lg`}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-xs">{orderId}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/dashboard">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t space-y-2">
            <h4 className="font-medium text-sm">Common Solutions:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Check your account balance</li>
              <li>• Verify payment method details</li>
              <li>• Ensure stable internet connection</li>
              <li>• Contact your bank if needed</li>
            </ul>
            
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Need help? Contact our support team with reference: {orderId || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}