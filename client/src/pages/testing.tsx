
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Crown, 
  ShoppingCart, 
  Settings,
  Eye,
  BarChart3,
  Package,
  Users,
  Store,
  Laptop,
  Smartphone
} from "lucide-react";

export default function Testing() {
  const { setUser, setCreator } = useAuth();
  const [testMode, setTestMode] = useState<"creator" | "customer" | "admin" | null>(null);

  const mockCreator = {
    id: "test-creator-1",
    userId: "test-user-1",
    businessName: "Sarah's Digital Store",
    storeHandle: "sarahs-store",
    bio: "Digital marketing expert and course creator",
    website: "https://sarahsstore.com",
    socialLinks: {
      instagram: "@sarahsstore",
      twitter: "@sarahdigital",
      linkedin: "sarah-digital"
    },
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b69beb23?w=150",
    bannerImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUser = {
    id: "test-user-1",
    email: "sarah@example.com",
    name: "Sarah Johnson",
    role: "creator" as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCustomerUser = {
    id: "test-customer-1",
    email: "customer@example.com",
    name: "John Customer",
    role: "customer" as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAdminUser = {
    id: "test-admin-1",
    email: "admin@creohub.com",
    name: "Admin User",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const loginAsCreator = () => {
    setUser(mockUser);
    setCreator(mockCreator);
    setTestMode("creator");
  };

  const loginAsCustomer = () => {
    setUser(mockCustomerUser);
    setCreator(null);
    setTestMode("customer");
  };

  const loginAsAdmin = () => {
    setUser(mockAdminUser);
    setCreator(null);
    setTestMode("admin");
  };

  const logout = () => {
    setUser(null);
    setCreator(null);
    setTestMode(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Creohub Testing Interface
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Test all user interfaces: Creators, Customers, and Admins
          </p>
          
          {testMode && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Currently testing as: {testMode}
              </Badge>
              <Button onClick={logout} variant="outline">
                Logout & Reset
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="interfaces" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="interfaces">User Interfaces</TabsTrigger>
            <TabsTrigger value="features">Feature Testing</TabsTrigger>
            <TabsTrigger value="data">Test Data</TabsTrigger>
          </TabsList>

          <TabsContent value="interfaces" className="space-y-8">
            {/* User Type Selection */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Creator Interface */}
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Creator Interface</CardTitle>
                  <CardDescription>
                    Test the creator dashboard, product management, and store customization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={loginAsCreator} className="w-full" size="lg">
                    Login as Creator
                  </Button>
                  
                  {testMode === "creator" && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Quick Links:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/products">Products</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/orders">Orders</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/settings">Settings</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Interface */}
              <Card className="border-2 hover:border-secondary transition-colors">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-8 w-8 text-secondary" />
                  </div>
                  <CardTitle className="text-xl">Customer Interface</CardTitle>
                  <CardDescription>
                    Test the shopping experience, checkout process, and customer features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={loginAsCustomer} className="w-full" size="lg" variant="secondary">
                    Login as Customer
                  </Button>
                  
                  {testMode === "customer" && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Quick Links:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/storefront/sarahs-store">View Store</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/checkout/test-creator-1">Checkout</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Interface */}
              <Card className="border-2 hover:border-accent transition-colors">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl">Admin Interface</CardTitle>
                  <CardDescription>
                    Test admin controls, user management, and platform analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={loginAsAdmin} className="w-full" size="lg" variant="destructive">
                    Login as Admin
                  </Button>
                  
                  {testMode === "admin" && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Quick Links:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/dashboard">Admin Panel</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/settings">Platform Settings</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current Status */}
            {testMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Current Testing Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">User Type</Label>
                      <p className="font-semibold capitalize">{testMode}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">User Name</Label>
                      <p className="font-semibold">
                        {testMode === "creator" && "Sarah Johnson"}
                        {testMode === "customer" && "John Customer"}
                        {testMode === "admin" && "Admin User"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Available Features</Label>
                      <p className="font-semibold">
                        {testMode === "creator" && "Dashboard, Products, Orders, Settings"}
                        {testMode === "customer" && "Browse, Purchase, Checkout"}
                        {testMode === "admin" && "User Management, Analytics, Platform Settings"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Creator Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Creator Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/products">Product Management</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/orders">Order Processing</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard">Analytics Dashboard</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/settings">Store Customization</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Customer Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Customer Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/storefront/sarahs-store">Browse Products</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/checkout/test-creator-1">Checkout Process</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Admin Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Admin Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard">Platform Analytics</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/settings">User Management</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    Transaction Monitoring
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    Platform Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mock Data Information</CardTitle>
                  <CardDescription>
                    Test data being used for different user types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Creator Data:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Business: Sarah's Digital Store</li>
                      <li>• Handle: sarahs-store</li>
                      <li>• Email: sarah@example.com</li>
                      <li>• Products: Digital courses, consultations</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Customer Data:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Name: John Customer</li>
                      <li>• Email: customer@example.com</li>
                      <li>• Role: Regular customer</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Admin Data:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Name: Admin User</li>
                      <li>• Email: admin@creohub.com</li>
                      <li>• Role: Platform administrator</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Testing</CardTitle>
                  <CardDescription>
                    Test responsive design across devices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Laptop className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Desktop View</p>
                      <p className="text-sm text-gray-600">Full feature set</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Mobile View</p>
                      <p className="text-sm text-gray-600">Responsive design</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
