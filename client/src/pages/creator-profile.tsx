import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  MapPin, 
  Globe, 
  Mail, 
  Package, 
  ShoppingBag, 
  TrendingUp,
  ExternalLink,
  Edit,
  Share,
  Eye,
  Star,
  Users
} from "lucide-react";
import { Link } from "wouter";

export default function CreatorProfile() {
  const { user, creator } = useAuth();

  const { data: products } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/products`],
    enabled: !!creator?.id,
  });

  const { data: orders } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/orders`],
    enabled: !!creator?.id,
  });

  const { data: analytics } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/analytics`],
    enabled: !!creator?.id,
  });

  if (!user || !creator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
              <p className="text-gray-600 mb-4">You need to be signed in to view your profile.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((product: any) => product.isActive).length || 0;
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum: number, order: any) => 
    order.paymentStatus === "completed" ? sum + parseFloat(order.totalAmount) : sum, 0) || 0;
  const storeViews = analytics?.filter((event: any) => event.eventType === 'view').length || 0;

  const joinDate = new Date(creator.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'bold': return 'from-red-500 to-pink-600';
      case 'creative': return 'from-purple-500 to-indigo-600';
      case 'professional': return 'from-blue-600 to-blue-800';
      default: return 'from-primary to-accent';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className={`bg-gradient-to-br ${getThemeColor(creator.storeTheme)} rounded-2xl p-8 mb-8 text-white`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-white/20">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="text-2xl text-gray-700">
                {user.fullName?.charAt(0) || user.username.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user.fullName || user.username}
              </h1>
              <p className="text-xl opacity-90 mb-3">
                Creator of {creator.storeName}
              </p>
              {user.bio && (
                <p className="text-white/80 mb-4 max-w-2xl">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Joined {joinDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">creohub.com/{creator.storeHandle}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge className="bg-white/20 text-white border-white/30">
                  <Star className="mr-1 h-3 w-3" />
                  {creator.planType === 'pro' ? 'Pro Creator' : 'Free Plan'}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30">
                  <Package className="mr-1 h-3 w-3" />
                  {totalProducts} Products
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30">
                  <ShoppingBag className="mr-1 h-3 w-3" />
                  {totalOrders} Orders
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" asChild className="bg-white text-gray-900 hover:bg-gray-100">
                <Link href="/settings">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href={`/storefront/${creator.storeHandle}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Store
                  <ExternalLink className="ml-2 h-4 w-4" />
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
                    KES {totalRevenue.toLocaleString()}
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
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{activeProducts}/{totalProducts}</p>
                  <p className="text-xs text-gray-500">Active/Total</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
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
                <ShoppingBag className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Store Views</p>
                  <p className="text-2xl font-bold text-gray-900">{storeViews}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Store Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                  <CardDescription>Details about your creator store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store Name:</span>
                    <span className="font-medium">{creator.storeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store Handle:</span>
                    <span className="font-medium">@{creator.storeHandle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Theme:</span>
                    <span className="font-medium capitalize">{creator.storeTheme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <Badge variant={creator.planType === 'pro' ? 'default' : 'secondary'}>
                      {creator.planType === 'pro' ? 'Pro' : 'Free'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={creator.isActive ? 'default' : 'secondary'}>
                      {creator.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {creator.storeDescription && (
                    <div className="pt-2">
                      <span className="text-gray-600 block mb-1">Description:</span>
                      <p className="text-sm">{creator.storeDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your store efficiently</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" asChild className="h-auto p-4">
                      <Link href="/products">
                        <div className="text-center">
                          <Package className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">Add Product</p>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-4">
                      <Link href="/orders">
                        <div className="text-center">
                          <ShoppingBag className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">View Orders</p>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-4">
                      <Link href="/settings">
                        <div className="text-center">
                          <Edit className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">Settings</p>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="h-auto p-4">
                      <div className="text-center">
                        <Share className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">Share Store</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>Manage your product catalog</CardDescription>
              </CardHeader>
              <CardContent>
                {products && products.length > 0 ? (
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{product.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">KES {parseFloat(product.price).toLocaleString()}</p>
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Hidden'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {products.length > 5 && (
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/products">
                          View All {products.length} Products
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No products yet</p>
                    <Button asChild>
                      <Link href="/products">Add Your First Product</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">{order.customerName || order.customerEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                          <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {orders.length > 5 && (
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/orders">
                          View All {orders.length} Orders
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Your creator milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 ${totalProducts >= 1 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalProducts >= 1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">First Product</h4>
                        <p className="text-sm text-gray-600">Upload your first product</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${totalOrders >= 1 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalOrders >= 1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">First Sale</h4>
                        <p className="text-sm text-gray-600">Make your first sale</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${totalProducts >= 10 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalProducts >= 10 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Product Master</h4>
                        <p className="text-sm text-gray-600">Upload 10 products</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${totalRevenue >= 10000 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalRevenue >= 10000 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Revenue Milestone</h4>
                        <p className="text-sm text-gray-600">Earn KES 10,000+</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
