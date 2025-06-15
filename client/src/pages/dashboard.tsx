import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import AnalyticsCards from "@/components/dashboard/analytics-cards";
import ProductUpload from "@/components/dashboard/product-upload";
import CreateCreatorProfile from "@/components/dashboard/create-creator-profile";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign,
  Eye,
  Calendar,
  Package
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, creator: activeCreator } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/products`],
    enabled: !!activeCreator?.id,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/orders`],
    enabled: !!activeCreator?.id,
  });

  const { data: analytics = {}, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/analytics`],
    enabled: !!activeCreator?.id,
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
          <CreateCreatorProfile userId={user.id} />
        </div>
      </div>
    );
  }

  const totalProducts = products?.length || 0;
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || "0"), 0) || 0;
  const recentOrders = orders?.slice(0, 5) || [];
  const recentProducts = products?.slice(0, 5) || [];
  const viewsCount = analytics?.views || 0;

  const navigationItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "subscriptions", label: "Plans", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {activeCreator.storeName}
              </h1>
              <p className="text-lg text-gray-600">
                Manage your store and track your performance
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <Link href={`/storefront/${activeCreator.storeHandle}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Store
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
                    {formatPrice(totalRevenue)}
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

        {/* Main Layout with Sidebar */}
        <div className="flex gap-6">
          {/* Vertical Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-sm border p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === item.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
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
                                {formatPrice(parseFloat(order.totalAmount))}
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

                {/* Recent Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Products</CardTitle>
                    <CardDescription>Your latest added products</CardDescription>
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
                    ) : recentProducts.length > 0 ? (
                      <div className="space-y-4">
                        {recentProducts.map((product: any) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">{product.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatPrice(parseFloat(product.price))}
                              </p>
                              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600 mb-2">No products yet</p>
                        <p className="text-gray-500">Start by adding your first product</p>
                        <Button className="mt-4" asChild>
                          <Link href="/products/new">Add Product</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <ProductUpload />
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Orders</h2>
              </div>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-gray-600">{order.customerEmail}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">
                              {formatPrice(parseFloat(order.totalAmount))}
                            </p>
                            <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">No orders yet</p>
                  <p className="text-gray-500">Orders from customers will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Subscription Plan</h2>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan: {activeCreator.planType}</CardTitle>
                  <CardDescription>
                    Status: {activeCreator.subscriptionStatus}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeCreator.planType === 'free' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          You're on the free trial. Upgrade to unlock more features and reduce fees.
                        </p>
                      </div>
                      <Button asChild>
                        <Link href="/pricing">Upgrade Plan</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <AnalyticsCards 
              creatorId={activeCreator.id}
              totalRevenue={totalRevenue}
              totalOrders={totalOrders}
              viewsCount={viewsCount}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}