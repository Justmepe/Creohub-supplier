import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CreditCard, Smartphone, Building2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
  creatorId: number;
}

interface Creator {
  id: number;
  storeHandle: string;
  storeName?: string;
}

export default function CheckoutPage() {
  const [, params] = useRoute("/checkout/:productId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const productId = params?.productId ? parseInt(params.productId) : null;

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("pesapal");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get affiliate referral from URL
  const urlParams = new URLSearchParams(window.location.search);
  const affiliateRef = urlParams.get("ref");

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products/${productId}`);
      return response.json();
    },
    enabled: !!productId,
  });

  // Fetch creator details
  const { data: creator } = useQuery<Creator>({
    queryKey: [`/api/creators/${product?.creatorId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/creators/${product?.creatorId}`);
      return response.json();
    },
    enabled: !!product?.creatorId,
  });

  // Payment processing mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", `/api/payments/customer/${paymentMethod}`, paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      if (paymentMethod === "pesapal" && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else if (paymentMethod === "mpesa" && data.checkoutRequestId) {
        // Poll for M-Pesa status
        pollMpesaStatus(data.checkoutRequestId);
      } else if (paymentMethod === "stripe" && data.clientSecret) {
        // Handle Stripe payment
        handleStripePayment(data.clientSecret);
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const pollMpesaStatus = async (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes

    const poll = async () => {
      try {
        const response = await apiRequest("GET", `/api/payments/customer/mpesa/status/${checkoutRequestId}`);
        const result = await response.json();

        if (result.status === "completed") {
          setIsProcessing(false);
          toast({
            title: "Payment Successful!",
            description: "Your order has been confirmed",
          });
          setLocation("/orders");
        } else if (result.status === "failed") {
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: "Please try again",
            variant: "destructive",
          });
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setIsProcessing(false);
          toast({
            title: "Payment Timeout",
            description: "Please check your phone and try again",
            variant: "destructive",
          });
        }
      } catch (error) {
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "Unable to verify payment status",
          variant: "destructive",
        });
      }
    };

    poll();
  };

  const handleStripePayment = (clientSecret: string) => {
    // This would integrate with Stripe Elements
    toast({
      title: "Stripe Integration",
      description: "Redirecting to secure payment...",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsProcessing(true);

    const orderData = {
      productId: product.id,
      creatorId: product.creatorId,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      shippingAddress: customerInfo.address,
      totalAmount: product.price,
      currency: "KES",
      affiliateRef: affiliateRef,
    };

    processPaymentMutation.mutate(orderData);
  };

  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => setLocation("/")}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  const priceInKES = parseFloat(product.price);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  From {creator?.storeName || creator?.storeHandle}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Product Price</span>
                  <span className="font-medium">KES {priceInKES.toLocaleString()}</span>
                </div>
                {affiliateRef && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Referred by</span>
                    <span>{affiliateRef}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>KES {priceInKES.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>
                  Complete your purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          required
                          value={customerInfo.name}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={customerInfo.email}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        required
                        placeholder="+254XXXXXXXXX"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Delivery Address</Label>
                      <Input
                        id="address"
                        required
                        placeholder="Enter your delivery address"
                        value={customerInfo.address}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, address: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Payment Method</h3>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="pesapal" id="pesapal" />
                        <Label htmlFor="pesapal" className="flex items-center cursor-pointer">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pesapal (Cards, Mobile Money, Banking)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="mpesa" id="mpesa" />
                        <Label htmlFor="mpesa" className="flex items-center cursor-pointer">
                          <Smartphone className="h-4 w-4 mr-2" />
                          M-Pesa STK Push
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="flex items-center cursor-pointer">
                          <Building2 className="h-4 w-4 mr-2" />
                          International Cards (Stripe)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processing Payment...
                      </>
                    ) : (
                      `Pay KES ${priceInKES.toLocaleString()}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}