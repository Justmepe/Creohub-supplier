import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import logoPath from "@assets/Logo_1749474304178.png";

export default function PaymentDemo() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status') || 'success';
  const orderId = urlParams.get('order') || 'DEMO_123';
  const amount = urlParams.get('amount') || '29.99';
  const currency = urlParams.get('currency') || 'KES';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLocation('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return {
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
          color: "text-green-600"
        };
      case 'failed':
        return {
          title: "Payment Failed",
          description: "There was an issue processing your payment.",
          color: "text-red-600"
        };
      default:
        return {
          title: "Payment Processing",
          description: "Your payment is being processed.",
          color: "text-yellow-600"
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src={logoPath} 
              alt="Creohub" 
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold text-primary">Creohub</h1>
          </div>
          
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <CardTitle className={`text-2xl ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{statusInfo.description}</p>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Order ID</div>
            <div className="font-mono text-sm">{orderId}</div>
            <div className="text-sm text-gray-500 mt-2">Amount</div>
            <div className="font-semibold">{amount} {currency}</div>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <div className="text-sm text-orange-700">
              <strong>Demo Mode:</strong> This is a test payment. No real money was processed.
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Redirecting to dashboard in {countdown} seconds...
          </div>
          
          <Button 
            onClick={() => setLocation('/dashboard')}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}