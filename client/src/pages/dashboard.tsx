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
import { 
  Plus, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Package,
  Eye,
  ExternalLink,
  Calendar
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, creator, setCreator } = useAuth();

  // Check if user has a creator profile
  const { data: creatorProfile, isLoading: creatorLoading } = useQuery({
    queryKey: [`/api/creators/user/${user?.id}`],
    enabled: !!user?.id && !creator,
  });

  // Set creator when profile is loaded
  React.useEffect(() => {
    if (creatorProfile && typeof creatorProfile === 'object' && 'id' in creatorProfile) {
      setCreator(creatorProfile as any);
    }
  }, [creatorProfile, setCreator]);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/products`],
    enabled: !!creator?.id,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/orders`],
    enabled: !!creator?.id,
  });

  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/analytics`],
    enabled: !!creator?.id,
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

  if (creatorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Welcome {user.username}!</h3>
              <p className="text-gray-600 mb-4">Create your creator profile to start selling products.</p>
              <CreateCreatorProfile userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalProducts = products?.length || 0;
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0) || 0;
  const viewsCount = analytics?.filter((event: any) => event.eventType === 'view')?.length || 0;

  const recentOrders = orders?.slice(0, 5) || [];
  const topProducts = products?.slice(0, 3) || [];

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
                Here's what's happening with {creator.storeName}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Button variant="outline" asChild>
                <Link href={`/storefront/${creator.storeHandle}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Store
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/products">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
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
                <DollarSign className="h-8 w-8 text-green-600" />
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

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

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
                            <p className="font-medium">{order.customerName || order.customerEmail}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                            <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No orders yet</p>
                      <p className="text-sm text-gray-500 mt-1">Orders will appear here once customers start buying</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>Your best performing products</CardDescription>
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
                            <p className="text-sm text-gray-600 capitalize">{product.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">KES {parseFloat(product.price).toLocaleString()}</p>
                            <Badge variant="outline">{product.category || 'Uncategorized'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No products yet</p>
                      <Button asChild className="mt-2">
                        <Link href="/products">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Product
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with these common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link href="/products">
                      <div className="text-center">
                        <Plus className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Add Product</p>
                        <p className="text-sm text-gray-600">Upload new items</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link href={`/storefront/${creator.storeHandle}`}>
                      <div className="text-center">
                        <Eye className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">View Store</p>
                        <p className="text-sm text-gray-600">See your storefront</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link href="/settings">
                      <div className="text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Customize</p>
                        <p className="text-sm text-gray-600">Edit your store</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link href="/orders">
                      <div className="text-center">
                        <ShoppingBag className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Orders</p>
                        <p className="text-sm text-gray-600">Manage sales</p>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <ProductUpload />
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Manage your customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse border rounded-lg p-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-600">{order.customerName || order.customerEmail}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                            <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="capitalize">{order.paymentMethod}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">No orders yet</p>
                    <p className="text-gray-500">Orders will appear here once customers start buying your products</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsCards 
              creatorId={creator.id}
              totalRevenue={totalRevenue}
              totalOrders={totalOrders}
              viewsCount={viewsCount}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
