import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PayPalButton from "@/components/PayPalButton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PaymentMethod } from "@/lib/types";
import {
  CreditCard,
  Smartphone,
  Building2,
  Check,
  Loader2,
  AlertCircle,
  Shield
} from "lucide-react";

interface PaymentSelectorProps {
  amount: string;
  currency: string;
  onMethodSelect: (method: string) => void;
  selectedMethod: string;
  onPaymentComplete?: (result: any) => void;
}

export default function PaymentSelector({
  amount,
  currency,
  onMethodSelect,
  selectedMethod,
  onPaymentComplete
}: PaymentSelectorProps) {
  const { toast } = useToast();
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stripeToken, setStripeToken] = useState("");

  const paymentMethods: PaymentMethod[] = [
    {
      type: "mpesa",
      label: "M-Pesa",
      icon: "📱",
      enabled: true
    },
    {
      type: "flutterwave_card",
      label: "Credit/Debit Card",
      icon: "💳",
      enabled: true
    },
    {
      type: "flutterwave_bank",
      label: "Bank Transfer",
      icon: "🏦",
      enabled: true
    },
    {
      type: "flutterwave_mobile",
      label: "Mobile Money",
      icon: "📲",
      enabled: true
    },
    {
      type: "paypal",
      label: "PayPal",
      icon: "🅿️",
      enabled: true
    }
  ];

  const handleMpesaPayment = async () => {
    if (!mpesaPhone) {
      toast({
        title: "Phone number required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const response = await apiRequest("POST", "/api/payments/customer/mpesa", {
        amount: parseFloat(amount),
        phoneNumber: mpesaPhone,
        orderId: 1, // This would be the actual order ID
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "M-Pesa payment initiated",
          description: result.message,
        });
        onPaymentComplete?.(result);
      } else {
        throw new Error(result.message || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "M-Pesa payment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleFlutterwavePayment = async (paymentType: string) => {
    setIsProcessingPayment(true);
    
    try {
      let paymentMethods = '';
      switch (paymentType) {
        case 'flutterwave_card':
          paymentMethods = 'card';
          break;
        case 'flutterwave_bank':
          paymentMethods = 'banktransfer';
          break;
        case 'flutterwave_mobile':
          paymentMethods = 'mobilemoney';
          break;
        default:
          paymentMethods = 'card,banktransfer,mobilemoney';
      }

      const response = await apiRequest("POST", "/api/payments/customer/flutterwave", {
        amount: parseFloat(amount),
        currency: currency,
        email: "customer@example.com", // This would be the actual customer email
        name: "Customer Name", // This would be the actual customer name
        phone: mpesaPhone || "+254700000000",
        orderId: 1, // This would be the actual order ID
        creatorId: 1, // This would be the actual creator ID
        paymentMethods: paymentMethods
      });

      const result = await response.json();
      
      if (result.success && result.paymentLink) {
        // Redirect to Flutterwave payment page
        window.open(result.paymentLink, '_blank');
        
        toast({
          title: "Payment initiated",
          description: "You will be redirected to complete your payment",
        });
        
        onPaymentComplete?.(result);
      } else {
        throw new Error(result.error || "Payment initiation failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment failed", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case "mpesa":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                M-Pesa Payment
              </CardTitle>
              <CardDescription>
                Enter your M-Pesa registered phone number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mpesa-phone">Phone Number</Label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                />
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">How M-Pesa payment works:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Enter your M-Pesa registered phone number</li>
                      <li>You'll receive an M-Pesa prompt on your phone</li>
                      <li>Enter your M-Pesa PIN to complete payment</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleMpesaPayment}
                disabled={isProcessingPayment || !mpesaPhone}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${currency} ${parseFloat(amount).toLocaleString()} via M-Pesa`
                )}
              </Button>
            </CardContent>
          </Card>
        );

      case "paypal":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">🅿️</span>
                PayPal Payment
              </CardTitle>
              <CardDescription>
                Pay securely with your PayPal account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Secure payment powered by PayPal
                    </span>
                  </div>
                </div>
                
                <PayPalButton
                  amount={amount}
                  currency="USD" // PayPal typically uses USD
                  intent="capture"
                />
              </div>
            </CardContent>
          </Card>
        );

      case "stripe":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Credit/Debit Card
              </CardTitle>
              <CardDescription>
                Pay with your credit or debit card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={stripeToken}
                    onChange={(e) => setStripeToken(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="cardholder">Cardholder Name</Label>
                  <Input
                    id="cardholder"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">
                    Your payment information is encrypted and secure
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleStripePayment}
                disabled={isProcessingPayment || !stripeToken}
                className="w-full"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${currency} ${parseFloat(amount).toLocaleString()}`
                )}
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <div
            key={method.type}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedMethod === method.type
                ? "border-primary bg-primary/5"
                : method.enabled
                ? "border-gray-200 hover:border-gray-300"
                : "border-gray-100 bg-gray-50 cursor-not-allowed"
            }`}
            onClick={() => method.enabled && onMethodSelect(method.type)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <p className="font-medium">{method.label}</p>
                  <p className="text-sm text-gray-600">
                    {method.type === "mpesa" && "Mobile money payments"}
                    {method.type === "paypal" && "PayPal account or card"}
                    {method.type === "stripe" && "Visa, Mastercard, and more"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!method.enabled && (
                  <Badge variant="secondary">Coming Soon</Badge>
                )}
                {selectedMethod === method.type && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Payment Form */}
      {renderPaymentForm()}

      {/* Security Notice */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Shield className="h-4 w-4" />
          <span>All payments are secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}
