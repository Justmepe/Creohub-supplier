import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Calendar, 
  DollarSign,
  User,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw
} from "lucide-react";

export default function Orders() {
  const { creator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/orders`],
    enabled: !!creator?.id,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, updates }: { orderId: number; updates: any }) =>
      apiRequest("PUT", `/api/orders/${orderId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}/orders`] });
      toast({
        title: "Order updated",
        description: "The order status has been updated successfully.",
      });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Creator Profile Required</h3>
              <p className="text-gray-600 mb-4">You need to create a creator profile to view orders.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);
    const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "mpesa": return "📱";
      case "paypal": return "🅿️";
      case "stripe": return "💳";
      default: return "💰";
    }
  };

  const formatPrice = (price: string, currency: string = "KES") => {
    return `${currency} ${parseFloat(price).toLocaleString()}`;
  };

  const totalRevenue = orders?.reduce((sum: number, order: any) => 
    order.paymentStatus === "completed" ? sum + parseFloat(order.totalAmount) : sum, 0) || 0;
  const completedOrders = orders?.filter((order: any) => order.paymentStatus === "completed").length || 0;
  const pendingOrders = orders?.filter((order: any) => order.paymentStatus === "pending").length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">
            Manage and track your customer orders
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalRevenue.toString())}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by customer name, email, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== "all" ? "No orders found" : "No orders yet"}
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Orders will appear here once customers start buying your products"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          Order #{order.id}
                        </h3>
                        <Badge className={getStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                        <Badge className={getOrderStatusColor(order.orderStatus)}>
                          {order.orderStatus}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.customerName || order.customerEmail}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{getPaymentMethodIcon(order.paymentMethod)}</span>
                          <span className="capitalize">{order.paymentMethod}</span>
                        </div>
                      </div>

                      {order.items && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Items:</span> {order.items.length} product(s)
                        </div>
                      )}
                    </div>

                    {/* Order Amount and Actions */}
                    <div className="flex items-center justify-between lg:flex-col lg:items-end gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(order.totalAmount, order.currency)}
                        </div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-600">
                            📞 {order.customerPhone}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order #{order.id} Details</DialogTitle>
                              <DialogDescription>
                                Order placed on {new Date(order.createdAt).toLocaleDateString()}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Customer Info */}
                              <div>
                                <h4 className="font-semibold mb-2">Customer Information</h4>
                                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                  <p><span className="font-medium">Name:</span> {order.customerName || "Not provided"}</p>
                                  <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
                                  {order.customerPhone && (
                                    <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>
                                  )}
                                </div>
                              </div>

                              {/* Order Items */}
                              {order.items && (
                                <div>
                                  <h4 className="font-semibold mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {order.items.map((item: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                          <p className="font-medium">{item.name}</p>
                                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold">
                                          {formatPrice((item.price * item.quantity).toString())}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Shipping Address */}
                              {order.shippingAddress && (
                                <div>
                                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p>{order.shippingAddress.fullName}</p>
                                    <p>{order.shippingAddress.address}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                                    <p>{order.shippingAddress.country}</p>
                                  </div>
                                </div>
                              )}

                              {/* Update Order Status */}
                              <div>
                                <h4 className="font-semibold mb-2">Update Status</h4>
                                <div className="flex gap-2">
                                  <Select
                                    value={order.orderStatus}
                                    onValueChange={(value) => 
                                      updateOrderMutation.mutate({
                                        orderId: order.id,
                                        updates: { orderStatus: value }
                                      })
                                    }
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {order.paymentStatus === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => 
                              updateOrderMutation.mutate({
                                orderId: order.id,
                                updates: { paymentStatus: "completed" }
                              })
                            }
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
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
