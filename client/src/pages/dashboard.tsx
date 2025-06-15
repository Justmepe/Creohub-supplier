import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import AnalyticsCards from "@/components/dashboard/analytics-cards";
import ProductUpload from "@/components/dashboard/product-upload";
import CreateCreatorProfile from "@/components/dashboard/create-creator-profile";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PriceDisplay } from "@/components/ui/price-display";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Eye,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, creator: activeCreator } = useAuth();
  const { formatPrice } = useCurrency();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/products`],
    enabled: !!activeCreator?.id,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/orders`],
    enabled: !!activeCreator?.id,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/analytics`],
    enabled: !!activeCreator?.id,
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/subscriptions`],
    enabled: !!activeCreator?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/creators/${activeCreator?.id}/subscriptions`);
      return response.json();
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Welcome to Creohub</h3>
              <p className="text-gray-600 mb-4">Please sign in to access your dashboard.</p>
              <Button asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!activeCreator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CreateCreatorProfile />
        </div>
      </div>
    );
  }

  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  const totalRevenue = Array.isArray(orders) ? orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0) : 0;
  const viewsCount = Array.isArray(analytics) ? analytics.filter((event: any) => event.eventType === 'view').length : 0;

  const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];
  const topProducts = Array.isArray(products) ? products.slice(0, 3) : [];
  
  console.log('Dashboard data check:', {
    products: products,
    orders: orders,
    subscriptions: subscriptions,
    subscriptionsType: typeof subscriptions,
    subscriptionsArray: Array.isArray(subscriptions),
    subscriptionsLength: Array.isArray(subscriptions) ? subscriptions.length : 'not array',
    subscriptionsData: Array.isArray(subscriptions) ? subscriptions : 'not showing'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.fullName || user.username}!
              </h1>
              <p className="mt-2 text-gray-600">
                Here's what's happening with {activeCreator?.storeName}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/withdrawals">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdrawals
                </Link>
              </Button>
              <Button asChild>
                <Link href="/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <PriceDisplay amount={totalRevenue} />
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Store Views</p>
                  <p className="text-2xl font-bold text-gray-900">{viewsCount}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6">
          <Tabs defaultValue="overview" className="w-full">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-white rounded-lg shadow-sm border p-4">
              <nav className="space-y-2">
                <TabsList className="grid w-full grid-rows-5 h-auto bg-transparent space-y-1 p-0">
                  <TabsTrigger 
                    value="overview" 
                    className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                  >
                    <TrendingUp className="h-4 w-4 mr-3" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products" 
                    className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                  >
                    <Package className="h-4 w-4 mr-3" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                  >
                    <ShoppingBag className="h-4 w-4 mr-3" />
                    Orders
                  </TabsTrigger>
                  <TabsTrigger 
                    value="subscriptions" 
                    className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Plans
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                  >
                    <DollarSign className="h-4 w-4 mr-3" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border p-6">
              <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your latest customer orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentOrders.length > 0 ? (
                      <div className="space-y-4">
                        {recentOrders.map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{order.customerEmail}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                <PriceDisplay amount={parseFloat(order.totalAmount)} />
                              </p>
                              <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                                {order.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600 mb-2">No orders yet</p>
                        <p className="text-gray-500">Orders from customers will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Your best-selling products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {productsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : topProducts.length > 0 ? (
                      <div className="space-y-4">
                        {topProducts.map((product: any) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">{product.description?.substring(0, 50)}...</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                <PriceDisplay amount={parseFloat(product.price)} />
                              </p>
                              <p className="text-sm text-gray-600">{product.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600 mb-2">No products yet</p>
                        <p className="text-gray-500">Add your first product to get started</p>
                        <Button asChild className="mt-4">
                          <Link href="/products/new">Add Product</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Products</CardTitle>
                    <CardDescription>Manage your digital products, services, and merchandise</CardDescription>
                  </div>
                  <Link href="/products">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : Array.isArray(products) && products.length > 0 ? (
                    <div className="space-y-4">
                      {products.map((product: any) => (
                        <div key={product.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">{product.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="capitalize">{product.type}</span>
                                <span>•</span>
                                <span>Created {new Date(product.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-lg">
                                <PriceDisplay amount={parseFloat(product.price)} />
                              </p>
                              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Eye className="h-4 w-4" />
                              <span>{product.views || 0} views</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                View Store
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No products yet</h3>
                      <p className="text-gray-500 mb-4">Start selling by creating your first product</p>
                      <Link href="/products">
                        <Button className="flex items-center gap-2 mx-auto">
                          <Plus className="h-4 w-4" />
                          Create Product
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Orders</CardTitle>
                  <CardDescription>All orders from your customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : Array.isArray(orders) && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order: any) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{order.customerEmail}</p>
                              <p className="text-sm text-gray-600">
                                Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                <PriceDisplay amount={parseFloat(order.totalAmount)} />
                              </p>
                              <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                                {order.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Payment: {order.paymentMethod || 'N/A'}</span>
                            <span>Items: {Array.isArray(order.items) ? order.items.length : 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">No customer orders</p>
                      <p className="text-gray-500">Customer purchases will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Plan History</CardTitle>
                  <CardDescription>Your subscription plan upgrades and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : Array.isArray(subscriptions) && subscriptions.length > 0 ? (
                    <div className="space-y-4">
                      {subscriptions.map((subscription: any) => (
                        <div key={subscription.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium capitalize">{subscription.planType} Plan</p>
                              <p className="text-sm text-gray-600">
                                Started: {new Date(subscription.startsAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">KES {parseFloat(subscription.amount).toLocaleString()}</p>
                              <Badge variant={subscription.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                                {subscription.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Payment Method: {subscription.paymentMethod || 'N/A'}</span>
                            <span className="capitalize">Status: {subscription.subscriptionStatus}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">No subscription history</p>
                      <p className="text-gray-500">Plan upgrades and subscription payments will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsCards 
                creatorId={activeCreator.id}
                totalRevenue={totalRevenue}
                totalOrders={totalOrders}
                viewsCount={viewsCount}
              />
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}