import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { Package, Download, Truck, Clock, CheckCircle, XCircle, Search } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: any;
  items: any;
  paymentMethod: string;
}

export default function CustomerOrdersPage() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // This would typically be protected and require customer authentication
  // For now, we'll use email-based lookup for demonstration
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/customer", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const response = await apiRequest("GET", `/api/orders/customer?email=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: !!searchQuery,
  });

  const handleSearch = () => {
    if (searchEmail.trim()) {
      setSearchQuery(searchEmail.trim());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (amount: string, currency: string = "KES") => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Orders</h1>
          <p className="text-muted-foreground">
            Enter your email address to view your order history and track deliveries
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Lookup</CardTitle>
            <CardDescription>
              Enter the email address used during checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter your email address"
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchEmail.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search Orders
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Searching for your orders...</p>
          </div>
        )}

        {/* No Search Query */}
        {!searchQuery && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Track Your Orders</h3>
              <p className="text-muted-foreground">
                Enter your email address above to view your purchase history
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Orders Found */}
        {searchQuery && !isLoading && orders.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any orders associated with "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => {
                setSearchEmail("");
                setSearchQuery("");
              }}>
                Try Different Email
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {orders.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Order History ({orders.length} orders)
              </h2>
              <Badge variant="outline">
                Found for: {searchQuery}
              </Badge>
            </div>

            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber || order.id}
                      </CardTitle>
                      <CardDescription>
                        Placed on {formatDate(order.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-2">Items Ordered</h4>
                      <div className="space-y-2">
                        {Array.isArray(order.items) ? order.items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                {item.type === 'digital' ? (
                                  <Download className="h-4 w-4" />
                                ) : (
                                  <Package className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity || 1}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatPrice((item.price * (item.quantity || 1)).toString(), order.currency)}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Order details unavailable</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Order Summary */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Delivery Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Name:</span> {order.customerName}</p>
                          <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
                          {order.shippingAddress && typeof order.shippingAddress === 'object' && (
                            <p><span className="font-medium">Address:</span> {order.shippingAddress.address || 'N/A'}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Payment Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Method:</span> {order.paymentMethod || 'N/A'}</p>
                          <p><span className="font-medium">Total:</span> {formatPrice(order.totalAmount, order.currency)}</p>
                          <p><span className="font-medium">Status:</span> 
                            <Badge size="sm" className={`ml-2 ${getStatusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {order.status === 'completed' && (
                      <div className="flex gap-2 pt-4">
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact Support
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}