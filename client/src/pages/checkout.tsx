import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  ArrowLeft, 
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';
import Navbar from '@/components/layout/navbar';

interface CheckoutData {
  orderId: string;
  amount: string;
  currency: string;
  planName: string;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, creator } = useAuth();
  const { toast } = useToast();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('pesapal');

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');
    const currency = urlParams.get('currency');
    const planName = urlParams.get('planName');

    if (orderId && amount && currency && planName) {
      setCheckoutData({
        orderId,
        amount,
        currency,
        planName: decodeURIComponent(planName)
      });
    } else {
      toast({
        title: "Invalid Checkout",
        description: "Missing checkout parameters. Redirecting to pricing page.",
        variant: "destructive",
      });
      setLocation('/pricing');
    }
  }, [setLocation, toast]);

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['/api/orders', checkoutData?.orderId],
    queryFn: async () => {
      if (!checkoutData?.orderId) return null;
      const response = await apiRequest('GET', `/api/orders/${checkoutData.orderId}`);
      return response.json();
    },
    enabled: !!checkoutData?.orderId
  });

  // Payment processing mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ paymentMethod }: { paymentMethod: string }) => {
      if (!checkoutData) throw new Error('No checkout data');
      
      let endpoint = '';
      let payload = {
        orderId: checkoutData.orderId,
        amount: parseFloat(checkoutData.amount),
        currency: checkoutData.currency,
        customerEmail: user?.email || `user${user?.id}@creohub.com`,
        customerName: creator?.storeName || user?.username || 'Customer',
        customerPhone: '+254700000000', // Default phone for demo
        description: `${checkoutData.planName} Plan Subscription`
      };

      switch (paymentMethod) {
        case 'pesapal':
          endpoint = '/api/payments/customer/pesapal';
          break;
        case 'stripe':
          endpoint = '/api/payments/customer/stripe/payment-intent';
          break;
        default:
          throw new Error('Invalid payment method');
      }

      const response = await apiRequest('POST', endpoint, payload);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authorizationUrl || data.checkoutUrl) {
        // Redirect to payment gateway
        window.location.href = data.authorizationUrl || data.checkoutUrl;
      } else if (data.clientSecret) {
        // Handle Stripe payment intent
        toast({
          title: "Payment Processing",
          description: "Redirecting to payment confirmation...",
        });
        // Implement Stripe confirmation flow here
      } else {
        toast({
          title: "Payment Initiated",
          description: "Please complete the payment process.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePayment = () => {
    paymentMutation.mutate({ paymentMethod: selectedPaymentMethod });
  };

  const handleBackToPricing = () => {
    setLocation('/pricing');
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={handleBackToPricing}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  Subscription upgrade details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge variant="secondary">{checkoutData.planName}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Billing Cycle</span>
                  <span className="text-sm font-medium">Monthly</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold">
                    {checkoutData.currency} {parseFloat(checkoutData.amount).toFixed(2)}
                  </span>
                </div>

                {order && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Order #{order.id}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Choose your preferred payment option
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pesapal Option */}
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'pesapal' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPaymentMethod('pesapal')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Credit/Debit Cards & M-Pesa</h3>
                      <p className="text-sm text-muted-foreground">
                        Visa, Mastercard, M-Pesa, and other local payment methods
                      </p>
                    </div>
                    {selectedPaymentMethod === 'pesapal' && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>

                {/* Stripe Option */}
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'stripe' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPaymentMethod('stripe')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">International Cards</h3>
                      <p className="text-sm text-muted-foreground">
                        Visa, Mastercard, American Express (Global)
                      </p>
                    </div>
                    {selectedPaymentMethod === 'stripe' && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>

                <Separator />

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={paymentMutation.isPending || isLoading}
                >
                  {paymentMutation.isPending ? 'Processing...' : `Pay ${checkoutData.currency} ${parseFloat(checkoutData.amount).toFixed(2)}`}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>🔒 Your payment is secured with industry-standard encryption</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}