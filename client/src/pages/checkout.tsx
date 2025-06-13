import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Clock,
  User
} from 'lucide-react';
import Navbar from '@/components/layout/navbar';

interface CheckoutData {
  subscriptionId?: string;
  orderId?: string;
  amount: string;
  currency: string;
  planName: string;
  type: 'subscription' | 'product';
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, creator } = useAuth();
  const { toast } = useToast();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('pesapal');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+254'
  });

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionId = urlParams.get('subscriptionId');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');
    const currency = urlParams.get('currency');
    const planName = urlParams.get('planName');

    if (subscriptionId && amount && currency && planName) {
      setCheckoutData({
        subscriptionId,
        amount,
        currency,
        planName: decodeURIComponent(planName),
        type: 'subscription'
      });
    } else if (orderId && amount && currency && planName) {
      setCheckoutData({
        orderId,
        amount,
        currency,
        planName: decodeURIComponent(planName),
        type: 'product'
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

  // Fetch user profile for complete information
  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!user
  });

  // Initialize customer info with user data
  useEffect(() => {
    if (user || userProfile) {
      const fullName = creator?.storeName || user?.username || 'Customer';
      const nameParts = fullName.split(' ');
      
      setCustomerInfo({
        firstName: nameParts[0] || 'Customer',
        lastName: nameParts.slice(1).join(' ') || 'User',
        email: (userProfile as any)?.email || user?.email || '',
        phone: '+254'
      });
    }
  }, [user, userProfile, creator]);

  // Payment processing mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ paymentMethod }: { paymentMethod: string }) => {
      if (!checkoutData) throw new Error('No checkout data');
      
      let endpoint = '';
      let payload: any = {
        amount: parseFloat(checkoutData.amount),
        currency: checkoutData.currency,
        email: customerInfo.email || user?.email || `user${user?.id}@creohub.com`,
        description: `${checkoutData.planName} Plan Subscription`,
        orderId: checkoutData.orderId
      };

      // Add required fields for Pesapal
      if (paymentMethod === 'pesapal') {
        payload = {
          ...payload,
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          productId: parseInt(checkoutData.orderId),
          productName: `${checkoutData.planName} Plan Subscription`
        };
        endpoint = '/api/payments/customer/pesapal';
      } else if (paymentMethod === 'stripe') {
        payload.customerEmail = payload.email;
        payload.customerName = creator?.storeName || user?.username || 'Customer';
        endpoint = '/api/payments/customer/stripe/payment-intent';
      } else {
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
    // Validate required fields
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all customer information fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone format (basic check)
    if (customerInfo.phone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

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

          <div className="grid md:grid-cols-3 gap-8">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Enter your details for payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+254712345678"
                    required
                  />
                </div>
              </CardContent>
            </Card>

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