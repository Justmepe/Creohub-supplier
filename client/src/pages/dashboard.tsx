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

  const productsArray = Array.isArray(products) ? products : [];
  const ordersArray = Array.isArray(orders) ? orders : [];
  const analyticsData = analytics || {};
  
  const totalProducts = productsArray.length;
  const totalOrders = ordersArray.length;
  const totalRevenue = ordersArray.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || "0"), 0);
  const recentOrders = ordersArray.slice(0, 5);
  const recentProducts = productsArray.slice(0, 5);
  const viewsCount = analyticsData.views || 0;

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
              ) : ordersArray.length > 0 ? (
                <div className="space-y-4">
                  {ordersArray.map((order: any) => (
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
                <h2 className="text-2xl font-bold">Dropshipping Marketplace</h2>
                <Button asChild>
                  <Link href="/dropshipping">Browse All Products</Link>
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Available Products</h3>
                        <p className="text-2xl font-bold text-blue-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Products ready for import</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Active Suppliers</h3>
                        <p className="text-2xl font-bold text-green-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Verified supplier partners</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Truck className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Imported Products</h3>
                        <p className="text-2xl font-bold text-purple-600">{totalProducts}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Products in your store</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Dropshipping Activity</CardTitle>
                  <CardDescription>Latest product imports and supplier updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">No recent activity</p>
                    <p className="text-gray-500">Product imports and supplier activities will appear here</p>
                    <Button className="mt-4" asChild>
                      <Link href="/dropshipping">Explore Marketplace</Link>
                    </Button>
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
                <h2 className="text-2xl font-bold">AI Product Recommendations</h2>
                <Button>
                  <Bot className="h-4 w-4 mr-2" />
                  Generate New Recommendations
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Trending Products</h3>
                        <p className="text-2xl font-bold text-green-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Hot products in your niche</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bot className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">AI Suggestions</h3>
                        <p className="text-2xl font-bold text-blue-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Personalized recommendations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Market Insights</h3>
                        <p className="text-2xl font-bold text-purple-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Data-driven insights</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Products for Your Store</CardTitle>
                  <CardDescription>AI-powered product suggestions based on your niche and market trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">No recommendations yet</p>
                    <p className="text-gray-500 mb-4">Generate AI-powered product recommendations to boost your sales</p>
                    <Button>
                      <Bot className="h-4 w-4 mr-2" />
                      Get Recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "affiliate" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Affiliate Program</h2>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Invite Affiliates
                </Button>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Active Affiliates</h3>
                        <p className="text-2xl font-bold text-green-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Total partners</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Clicks</h3>
                        <p className="text-2xl font-bold text-blue-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Total affiliate clicks</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Conversions</h3>
                        <p className="text-2xl font-bold text-yellow-600">0</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Successful sales</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Commissions</h3>
                        <p className="text-2xl font-bold text-purple-600">{formatPrice(0)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Total paid out</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Affiliates</CardTitle>
                    <CardDescription>Your best affiliate partners this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">No affiliates yet</p>
                      <p className="text-gray-500">Invite partners to promote your products</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Commission Settings</CardTitle>
                    <CardDescription>Configure your affiliate program</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Default Commission Rate</span>
                        <Badge variant="outline">10%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Cookie Duration</span>
                        <Badge variant="outline">30 days</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Minimum Payout</span>
                        <Badge variant="outline">{formatPrice(50)}</Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Earnings & Withdrawals</h2>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Request Withdrawal
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Available Balance</h3>
                        <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Ready for withdrawal</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Pending</h3>
                        <p className="text-2xl font-bold text-blue-600">{formatPrice(0)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Processing withdrawals</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Total Withdrawn</h3>
                        <p className="text-2xl font-bold text-purple-600">{formatPrice(0)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">All-time payouts</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Withdrawals</CardTitle>
                    <CardDescription>Your latest payout requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">No withdrawals yet</p>
                      <p className="text-gray-500">Request your first payout when ready</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payout Methods</CardTitle>
                    <CardDescription>Manage your withdrawal accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-6">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600 mb-2">No payout methods</p>
                        <p className="text-xs text-gray-500 mb-4">Add a payment method to receive withdrawals</p>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Settings</CardTitle>
                  <CardDescription>Configure your payout preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Minimum Withdrawal</span>
                        <Badge variant="outline">{formatPrice(10)}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Processing Time</span>
                        <Badge variant="outline">1-3 business days</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Currency</span>
                        <Badge variant="outline">USD</Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Auto-withdrawal</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Withdrawal Fee</span>
                        <Badge variant="outline">Free</Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Update Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "themes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Store Themes</h2>
                <Button>
                  <Palette className="h-4 w-4 mr-2" />
                  Customize Theme
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Current Theme</CardTitle>
                  <CardDescription>Your active storefront theme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-16 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
                    <div>
                      <h3 className="font-semibold">Modern Commerce</h3>
                      <p className="text-sm text-gray-600">Clean and professional design</p>
                      <Badge className="mt-2">Active</Badge>
                    </div>
                    <div className="ml-auto">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Customize
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mb-3"></div>
                    <h3 className="font-semibold">Minimalist</h3>
                    <p className="text-sm text-gray-600 mb-3">Simple and elegant design</p>
                    <Button variant="outline" size="sm" className="w-full">Preview</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-3"></div>
                    <h3 className="font-semibold">Creative</h3>
                    <p className="text-sm text-gray-600 mb-3">Bold and artistic layout</p>
                    <Button variant="outline" size="sm" className="w-full">Preview</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg mb-3"></div>
                    <h3 className="font-semibold">Professional</h3>
                    <p className="text-sm text-gray-600 mb-3">Corporate and trustworthy</p>
                    <Button variant="outline" size="sm" className="w-full">Preview</Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>Customize your store appearance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Primary Color</span>
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 bg-blue-600 rounded border"></div>
                          <span className="text-sm text-gray-600">#3B82F6</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Font Style</span>
                        <Badge variant="outline">Inter</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Layout Style</span>
                        <Badge variant="outline">Grid</Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mobile Responsive</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Dark Mode</span>
                        <Badge variant="outline">Available</Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Palette className="h-4 w-4 mr-2" />
                        Advanced Customization
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Account Settings</h2>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Store Information</CardTitle>
                    <CardDescription>Basic details about your store</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Store Name</label>
                        <p className="text-sm text-gray-600">{activeCreator.storeName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Store Handle</label>
                        <p className="text-sm text-gray-600">@{activeCreator.storeHandle}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-gray-600">{activeCreator.storeDescription || 'No description set'}</p>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Store Details
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>Your personal account information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <p className="text-sm text-gray-600">{user.fullName || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <p className="text-sm text-gray-600">{user.username}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email Address</label>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Button variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription & Billing</CardTitle>
                  <CardDescription>Manage your plan and payment details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Plan</label>
                      <div className="flex items-center space-x-2">
                        <Badge variant={activeCreator.planType === 'free' ? 'secondary' : 'default'}>
                          {activeCreator.planType?.toUpperCase()}
                        </Badge>
                        {activeCreator.planType === 'free' && (
                          <span className="text-xs text-gray-500">Trial</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Badge variant="outline">{activeCreator.subscriptionStatus}</Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Commission Rate</label>
                      <Badge variant="outline">
                        {activeCreator.planType === 'free' ? '10%' : 
                         activeCreator.planType === 'starter' ? '5%' : '0%'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <Button asChild>
                      <Link href="/pricing">Upgrade Plan</Link>
                    </Button>
                    <Button variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Billing History
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Email Notifications</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Order Alerts</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Marketing Emails</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Two-Factor Auth</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">API Access</span>
                        <Badge variant="outline">Available</Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Preferences
                      </Button>
                    </div>
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