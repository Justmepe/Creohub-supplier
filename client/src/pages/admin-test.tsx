import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, User, Key, LogIn } from "lucide-react";

export default function AdminTest() {
  const [loginData, setLoginData] = useState({
    username: "testerpeter",
    password: "password123"
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Logged in successfully"
      });
      setIsLoggedIn(true);
      localStorage.setItem('auth-token', data.token);
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive"
      });
    }
  });

  // Admin dashboard query
  const { data: adminStats, refetch: refetchAdminStats } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard");
      return response.json();
    },
    enabled: isLoggedIn
  });

  // Admin creators query
  const { data: creators } = useQuery({
    queryKey: ['/api/admin/creators'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/creators");
      return response.json();
    },
    enabled: isLoggedIn
  });

  const handleLogin = () => {
    loginMutation.mutate(loginData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('auth-token');
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "Successfully logged out"
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Login Test</CardTitle>
            <CardDescription>
              Login to test admin dashboard functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <Input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            
            <Button 
              onClick={handleLogin} 
              disabled={loginMutation.isPending}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loginMutation.isPending ? "Logging in..." : "Login as Admin"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p><strong>Admin Credentials:</strong></p>
              <p>Username: testerpeter</p>
              <p>Password: password123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                Admin Test Dashboard
              </h1>
              <p className="text-gray-600">Testing admin functionality and API access</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <User className="h-3 w-3 mr-1" />
                {loginData.username}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.totalCreators || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.activeCreators || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Paid Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.paidCreators || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${adminStats?.platformRevenue || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* API Test Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Test Results</CardTitle>
            <CardDescription>
              Testing admin API endpoints and data access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">Admin Dashboard API</span>
                <Badge variant={adminStats ? "default" : "secondary"}>
                  {adminStats ? "✓ Working" : "✗ Failed"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">Creators Management API</span>
                <Badge variant={creators ? "default" : "secondary"}>
                  {creators ? "✓ Working" : "✗ Failed"}
                </Badge>
              </div>

              <Button 
                onClick={() => {
                  refetchAdminStats();
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/creators'] });
                }}
                variant="outline"
                className="w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                Refresh API Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Creator List */}
        {creators && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Creators</CardTitle>
              <CardDescription>
                All registered creators on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creators.map((creator: any) => (
                  <div key={creator.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{creator.storeName}</h3>
                      <p className="text-sm text-gray-600">@{creator.storeHandle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={creator.planType === 'free' ? 'secondary' : 'default'}>
                        {creator.planType}
                      </Badge>
                      <Badge variant={creator.isActive ? 'default' : 'secondary'}>
                        {creator.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}