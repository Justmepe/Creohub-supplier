import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Crown, Zap, Plus, Settings, Users, Eye, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SocialProofData {
  name: string;
  location: string;
  plan: "starter" | "pro";
  timeAgo: string;
}

interface SocialProofResponse {
  data: SocialProofData[];
  config: {
    useRealData: boolean;
    minRealDataRequired: number;
    mixRatio: number;
  };
}

export default function AdminSocialProof() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [newUser, setNewUser] = useState({
    name: "",
    location: "",
    plan: "starter" as "starter" | "pro"
  });

  const [config, setConfig] = useState({
    useRealData: true,
    minRealDataRequired: 5,
    mixRatio: 0.7
  });

  const { data: socialProofData, isLoading } = useQuery<SocialProofResponse>({
    queryKey: ["/api/social-proof"],
    onSuccess: (data) => {
      setConfig(data.config);
    }
  });

  const addFakeUserMutation = useMutation({
    mutationFn: (userData: typeof newUser) => 
      apiRequest("POST", "/api/admin/social-proof/add-fake", userData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fake user added successfully",
      });
      setNewUser({ name: "", location: "", plan: "starter" });
      queryClient.invalidateQueries({ queryKey: ["/api/social-proof"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add fake user",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (configData: typeof config) => 
      apiRequest("PUT", "/api/admin/social-proof/config", configData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-proof"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const handleAddFakeUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.location) {
      toast({
        title: "Validation Error",
        description: "Name and location are required",
        variant: "destructive",
      });
      return;
    }
    addFakeUserMutation.mutate(newUser);
  };

  const handleConfigUpdate = () => {
    updateConfigMutation.mutate(config);
  };

  const africanCities = [
    "Nairobi", "Lagos", "Accra", "Kampala", "Dar es Salaam", "Kigali", 
    "Addis Ababa", "Lusaka", "Harare", "Douala", "Cape Town", "Tunis",
    "Casablanca", "Abuja", "Kinshasa", "Luanda", "Maputo", "Gaborone"
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/admin-dashboard")}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Social Proof Management</h1>
            <p className="text-muted-foreground">
              Manage fake users and configure data sources for social proof notifications
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Fake User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Fake User
            </CardTitle>
            <CardDescription>
              Add fake upgrade notifications to increase social proof
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFakeUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={newUser.location}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {africanCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select
                  value={newUser.plan}
                  onValueChange={(value: "starter" | "pro") => setNewUser(prev => ({ ...prev, plan: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        Starter Plan
                      </div>
                    </SelectItem>
                    <SelectItem value="pro">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-500" />
                        Pro Plan
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={addFakeUserMutation.isPending}
              >
                {addFakeUserMutation.isPending ? "Adding..." : "Add Fake User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Data Source Configuration
            </CardTitle>
            <CardDescription>
              Control how social proof data is displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Use Real Data</Label>
                <p className="text-sm text-muted-foreground">
                  Show actual user upgrades when available
                </p>
              </div>
              <Switch
                checked={config.useRealData}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, useRealData: checked }))}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="minReal">Minimum Real Data Required</Label>
              <Input
                id="minReal"
                type="number"
                min="1"
                max="20"
                value={config.minRealDataRequired}
                onChange={(e) => setConfig(prev => ({ ...prev, minRealDataRequired: parseInt(e.target.value) || 5 }))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum real upgrades needed before using real data
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mixRatio">Real Data Mix Ratio</Label>
              <Input
                id="mixRatio"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.mixRatio}
                onChange={(e) => setConfig(prev => ({ ...prev, mixRatio: parseFloat(e.target.value) || 0.7 }))}
              />
              <p className="text-xs text-muted-foreground">
                Ratio of real vs fake data (0.7 = 70% real, 30% fake)
              </p>
            </div>

            <Button 
              onClick={handleConfigUpdate}
              className="w-full"
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? "Updating..." : "Update Configuration"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Current Social Proof Data
          </CardTitle>
          <CardDescription>
            Preview of the social proof notifications being shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {socialProofData?.data && socialProofData.data.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {socialProofData.data.slice(0, 9).map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {item.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    </div>
                    {item.plan === "pro" ? (
                      <Crown className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Zap className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Upgraded to {item.plan === "pro" ? "Pro" : "Starter"} Plan • {item.timeAgo}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No social proof data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}