import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import AnalyticsCards from "@/components/dashboard/analytics-cards";
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
  Settings,
  User,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, creator: activeCreator } = useAuth();
  const { formatPrice } = useCurrency();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/products`],
    enabled: !!activeCreator?.id,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/orders`],
    enabled: !!activeCreator?.id,
  });

  const { data: analytics = {} } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/analytics`],
    enabled: !!activeCreator?.id,
  });

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  if (!activeCreator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <CreateCreatorProfile userId={user.id} />
        </div>
      </div>
    );
  }

  const productsArray = Array.isArray(products) ? products : [];
  const ordersArray = Array.isArray(orders) ? orders : [];
  const analyticsData = analytics as any || {};
  
  const totalProducts = productsArray.length;
  const totalOrders = ordersArray.length;
  const totalRevenue = ordersArray.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || "0"), 0);
  const recentOrders = ordersArray.slice(0, 5);
  const recentProducts = productsArray.slice(0, 5);
  const viewsCount = analyticsData.views || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders</p>
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
              <Link 
                href="/products"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <Package className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Products</span>
              </Link>
              
              <Link 
                href="/orders"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <ShoppingBag className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Orders</span>
              </Link>
              
              <Link 
                href="/dropshipping"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <Truck className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Dropshipping</span>
              </Link>
              
              <Link 
                href="/supplier-dashboard"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <Building className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Supplier Dashboard</span>
              </Link>
              
              <Link 
                href="/recommendations"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <Bot className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">AI Recommendations</span>
              </Link>
              
              <Link 
                href="/affiliate"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Affiliate</span>
              </Link>
              
              <Link 
                href="/withdrawals"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <CreditCard className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Withdrawals</span>
              </Link>
              
              <Link 
                href="/themes"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <Palette className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Themes</span>
              </Link>
              
              <Link 
                href="/settings"
                className="w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Settings</span>
              </Link>
              
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

          {/* Content Area - Dashboard Overview */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              </div>
              
              <div className="text-center py-12">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Your Creator Dashboard</h3>
                  <p className="text-gray-600 mb-4">Use the navigation menu on the left to access different sections of your store.</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button asChild className="h-12">
                    <Link href="/products">
                      <Package className="h-4 w-4 mr-2" />
                      Manage Products
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12">
                    <Link href={`/storefront/${activeCreator.storeHandle}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Store
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}