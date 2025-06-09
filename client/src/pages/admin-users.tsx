import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useContext, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Shield,
  LogOut,
  Trash2,
  UserX,
  ArrowLeft
} from "lucide-react";

export default function AdminUsers() {
  const authContext = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect non-admin users
  useEffect(() => {
    if (authContext?.user && !authContext.user.isAdmin) {
      setLocation("/auth");
    }
  }, [authContext?.user, setLocation]);

  const handleLogout = () => {
    authContext?.logout();
    setLocation("/auth");
  };

  // Fetch all users for user management
  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // User deletion mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `User deleted successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-8 w-8 text-blue-600" />
                  User Management
                </h1>
                <p className="text-gray-600">Manage platform users and accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {authContext?.user?.username} (Administrator)
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Platform Users
            </CardTitle>
            <CardDescription>
              View and manage all platform users. You can delete non-admin accounts when necessary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allUsers?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {user.isAdmin && (
                          <Badge variant="default" className="bg-red-100 text-red-800">
                            Admin
                          </Badge>
                        )}
                        {user.isCreator && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Creator
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {user.role || 'user'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ID: {user.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={user.isAdmin ? 'destructive' : 'secondary'}>
                      {user.isAdmin ? 'Administrator' : 'Regular User'}
                    </Badge>
                    
                    {(!user.isAdmin || ['testerpeter', 'newadmin', 'admintest'].includes(user.username)) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="gap-2"
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <UserX className="h-5 w-5 text-red-500" />
                              Delete User Account
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete user <strong>{user.username}</strong> (ID: {user.id})? 
                              <br /><br />
                              This action will:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Permanently delete the user account</li>
                                <li>Remove all associated creator data (if applicable)</li>
                                <li>Delete all products and orders</li>
                                <li>This action cannot be undone</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteUserMutation.isPending}
                            >
                              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {user.isAdmin && !['testerpeter', 'newadmin', 'admintest'].includes(user.username) && (
                      <Badge variant="outline" className="text-gray-500">
                        Protected Account
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {!allUsers?.length && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}