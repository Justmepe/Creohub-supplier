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
  Package,
  Truck,
  Building,
  Bot,
  Users,
  CreditCard,
  Palette,
  Settings
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, creator: activeCreator } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("products");

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
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "dropshipping", label: "Dropshipping", icon: Truck },
    { id: "supplier-dashboard", label: "Supplier Dashboard", icon: Building },
    { id: "ai-recommendations", label: "AI Recommendations", icon: Bot },
    { id: "affiliate", label: "Affiliate", icon: Users },
    { id: "withdrawals", label: "Withdrawals", icon: CreditCard },
    { id: "themes", label: "Themes", icon: Palette },
    { id: "settings", label: "Settings", icon: Settings },
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
          <div className="w-72 bg-white rounded-lg shadow-sm border p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm ${
                      activeTab === item.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
              
              <div className="pt-2 mt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full text-sm" asChild>
                  <Link href={`/storefront/${activeCreator.storeHandle}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Store
                  </Link>
                </Button>
              </div>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border p-6">
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

          {activeTab === "dropshipping" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Dropshipping</h2>
                <Button asChild>
                  <Link href="/dropshipping">View Marketplace</Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">Dropshipping Marketplace</p>
                    <p className="text-gray-500">Find suppliers and add products to your store</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "supplier-dashboard" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Supplier Dashboard</h2>
                <Button asChild>
                  <Link href="/supplier-dashboard">Manage Suppliers</Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">Supplier Management</p>
                    <p className="text-gray-500">Manage your supplier partnerships and products</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "ai-recommendations" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">AI Recommendations</h2>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">AI Product Recommendations</p>
                    <p className="text-gray-500">Get AI-powered suggestions for trending products</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "affiliate" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Affiliate Program</h2>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">Affiliate Management</p>
                    <p className="text-gray-500">Manage your affiliate partners and commissions</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Withdrawals</h2>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">Withdraw Earnings</p>
                    <p className="text-gray-500">Request withdrawals and manage payout methods</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "themes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Store Themes</h2>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">Customize Your Store</p>
                    <p className="text-gray-500">Choose and customize themes for your storefront</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Settings</h2>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">Account Settings</p>
                    <p className="text-gray-500">Manage your account preferences and store settings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}