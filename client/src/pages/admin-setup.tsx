import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield } from "lucide-react";

export default function AdminSetup() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetupAdmin = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/setup", {
        username: username.trim()
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${username} has been promoted to admin`,
        });
        setUsername("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to promote user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote user to admin",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Promote an existing user to admin status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username to Promote
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSetupAdmin()}
            />
          </div>
          
          <Button 
            onClick={handleSetupAdmin} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Promoting..." : "Promote to Admin"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>Note: The user must already be registered in the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}