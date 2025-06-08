
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Store, 
  ShoppingCart, 
  Crown, 
  TestTube, 
  Database,
  Plus,
  Eye,
  Settings
} from "lucide-react";
import { Link } from "wouter";

export default function Testing() {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setCreator, user, creator } = useAuth();
  const { toast } = useToast();

  // Sample test data
  const testUsers = [
    {
      username: "creator1",
      email: "creator1@test.com",
      password: "password123",
      fullName: "John Creator",
      bio: "Digital artist and content creator",
      role: "creator"
    },
    {
      username: "creator2", 
      email: "creator2@test.com",
      password: "password123",
      fullName: "Sarah Designer",
      bio: "UI/UX designer and course creator",
      role: "creator"
    },
    {
      username: "customer1",
      email: "customer1@test.com", 
      password: "password123",
      fullName: "Mike Customer",
      bio: "Tech enthusiast",
      role: "customer"
    },
    {
      username: "admin1",
      email: "admin1@test.com",
      password: "password123", 
      fullName: "Admin User",
      bio: "Platform administrator",
      role: "admin"
    }
  ];

  const testCreators = [
    {
      storeHandle: "john-designs",
      storeName: "John's Design Studio", 
      storeDescription: "Premium digital designs and templates",
      storeTheme: "creative"
    },
    {
      storeHandle: "sarah-courses",
      storeName: "Sarah's UX Academy",
      storeDescription: "Learn UX design from industry experts", 
      storeTheme: "professional"
    }
  ];

  const createTestData = async () => {
    setIsLoading(true);
    try {
      // Create test users and creators
      for (let i = 0; i < testUsers.length; i++) {
        const userData = testUsers[i];
        
        // Create user
        const userResponse = await apiRequest("POST", "/api/auth/register", userData);
        const userResult = await userResponse.json();
        
        // If it's a creator, create creator profile
        if (userData.role === "creator" && i < testCreators.length) {
          const creatorData = {
            ...testCreators[i],
            userId: userResult.user.id
          };
          
          await apiRequest("POST", "/api/creators", creatorData);
          
          // Add some sample products for creators
          const sampleProducts = [
            {
              name: "Premium Logo Pack",
              description: "High-quality logo templates for businesses",
              price: 49.99,
              type: "digital",
              category: "Design",
              creatorId: userResult.user.id
            },
            {
              name: "UX Design Consultation",
              description: "1-hour UX design consultation session",
              price: 120.00,
              type: "service", 
              category: "Consulting",
              creatorId: userResult.user.id
            }
          ];
          
          for (const product of sampleProducts) {
            await apiRequest("POST", "/api/products", product);
          }
        }
      }
      
      toast({
        title: "Test data created successfully!",
        description: "You can now test all interfaces with sample data.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating test data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsTestUser = async (testUser: any) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email: testUser.email,
        password: testUser.password
      });
      const result = await response.json();
      setUser(result.user);
      
      // If user is a creator, get creator profile
      if (testUser.role === "creator") {
        const creatorHandle = testUser.username === "creator1" ? "john-designs" : "sarah-courses";
        const creatorResponse = await apiRequest("GET", `/api/creators/${creatorHandle}`);
        const creatorResult = await creatorResponse.json();
        setCreator(creatorResult);
      }
      
      toast({
        title: "Logged in successfully!",
        description: `Welcome ${testUser.fullName}`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <TestTube className="inline mr-2 h-8 w-8" />
            Testing Interface
          </h1>
          <p className="text-gray-600">
            Test all interfaces: Creator Dashboard, Customer Store Views, and Admin Controls
          </p>
        </div>

        {user && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Currently logged in as: <strong>{user.fullName}</strong></p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUser(null);
                    setCreator(null);
                  }}
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Setup Test Data</TabsTrigger>
            <TabsTrigger value="creator">Creator Interface</TabsTrigger>
            <TabsTrigger value="customer">Customer Interface</TabsTrigger>
            <TabsTrigger value="admin">Admin Interface</TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Test Data Setup
                </CardTitle>
                <CardDescription>
                  Create sample users, creators, and products for testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Test Users</h3>
                    <div className="space-y-2">
                      {testUsers.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => loginAsTestUser(user)}
                          >
                            Login
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Test Stores</h3>
                    <div className="space-y-2">
                      {testCreators.map((creator, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="font-medium">{creator.storeName}</p>
                          <p className="text-sm text-gray-600">{creator.storeDescription}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{creator.storeTheme}</Badge>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/storefront/${creator.storeHandle}`}>
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={createTestData} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Creating..." : "Create All Test Data"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creator">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Creator Interface Testing
                </CardTitle>
                <CardDescription>
                  Test creator dashboard, product management, and store customization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/dashboard">
                      <div className="text-center">
                        <Store className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Creator Dashboard</p>
                        <p className="text-sm text-gray-600">Analytics, orders, overview</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/products">
                      <div className="text-center">
                        <Plus className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Product Management</p>
                        <p className="text-sm text-gray-600">Add, edit, manage products</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/orders">
                      <div className="text-center">
                        <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Order Management</p>
                        <p className="text-sm text-gray-600">View and manage orders</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/settings">
                      <div className="text-center">
                        <Settings className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Store Settings</p>
                        <p className="text-sm text-gray-600">Customize store appearance</p>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Interface Testing
                </CardTitle>
                <CardDescription>
                  Test customer store browsing, product viewing, and checkout process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/storefront/john-designs">
                      <div className="text-center">
                        <Eye className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">John's Design Studio</p>
                        <p className="text-sm text-gray-600">Creative theme storefront</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/storefront/sarah-courses">
                      <div className="text-center">
                        <Eye className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Sarah's UX Academy</p>
                        <p className="text-sm text-gray-600">Professional theme storefront</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/pricing">
                      <div className="text-center">
                        <Crown className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Pricing Plans</p>
                        <p className="text-sm text-gray-600">View subscription options</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-center">
                      <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                      <p className="font-medium">Checkout Process</p>
                      <p className="text-sm text-gray-600">Test from any storefront</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Admin Interface Testing
                </CardTitle>
                <CardDescription>
                  Test admin features, user management, and platform analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <h3 className="font-semibold text-yellow-800 mb-2">Admin Features Coming Soon</h3>
                    <p className="text-sm text-yellow-700">
                      Admin interface features will include:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                      <li>User management and verification</li>
                      <li>Platform analytics and revenue tracking</li>
                      <li>Creator approval and moderation</li>
                      <li>Content moderation tools</li>
                      <li>Support ticket management</li>
                    </ul>
                  </div>
                  
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Admin interface in development</p>
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
