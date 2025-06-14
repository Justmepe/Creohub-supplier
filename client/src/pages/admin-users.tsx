import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const authContext = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom fetch function with proper token handling
  const fetchUsers = async (): Promise<User[]> => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const handleLogout = () => {
    authContext?.logout();
    setLocation("/auth");
  };

  // Fetch all users for user management
  const { data: allUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    retry: 3,
    retryDelay: 1000
  });

  // Handle user deletion
  const handleDeleteUser = async (userId: number, username: string) => {
    try {
      setIsDeleting(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast({
        title: "User Deleted",
        description: `User ${username} has been successfully deleted.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              View and manage all platform users. Delete accounts when necessary.
            </p>
          </div>
          
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              View and manage all platform users. Delete accounts when necessary.
            </p>
          </div>
          
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const users: User[] = allUsers || [];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all platform users. Delete accounts when necessary.
          </p>
        </div>

        {users.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">There are no users in the system.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{user.username}</h3>
                        <div className="flex gap-2">
                          {user.isAdmin && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                          {user.isCreator && (
                            <Badge variant="secondary">Creator</Badge>
                          )}
                          <Badge variant="outline">{user.role || 'User'}</Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-1">{user.email}</p>
                      {user.fullName && (
                        <p className="text-sm text-muted-foreground">{user.fullName}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        ID: {user.id} • Joined: {new Date(user.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {users.length} user{users.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}