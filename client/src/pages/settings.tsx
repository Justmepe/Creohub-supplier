import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Store, 
  Palette, 
  CreditCard, 
  Bell, 
  Shield,
  ExternalLink,
  Save,
  Eye,
  Upload
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { Link } from "wouter";

const storeSettingsSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeDescription: z.string().optional(),
  storeTheme: z.string(),
  customDomain: z.string().optional(),
});

const userSettingsSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().optional(),
  email: z.string().email("Invalid email address"),
});

type StoreSettingsData = z.infer<typeof storeSettingsSchema>;
type UserSettingsData = z.infer<typeof userSettingsSchema>;

export default function Settings() {
  const { user, creator, setCreator, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const storeForm = useForm<StoreSettingsData>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: creator?.storeName || "",
      storeDescription: creator?.storeDescription || "",
      storeTheme: creator?.storeTheme || "minimal",
      customDomain: creator?.customDomain || "",
    },
  });

  const userForm = useForm<UserSettingsData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      bio: user?.bio || "",
      email: user?.email || "",
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: (data: StoreSettingsData) =>
      apiRequest("PUT", `/api/creators/${creator?.id}`, data),
    onSuccess: (response) => {
      response.json().then((updatedCreator) => {
        setCreator(updatedCreator);
        queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}`] });
        toast({
          title: "Store settings updated",
          description: "Your store settings have been saved successfully.",
        });
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating store settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: UserSettingsData) =>
      apiRequest("PUT", `/api/users/${user?.id}`, data),
    onSuccess: (response) => {
      response.json().then((updatedUser) => {
        setUser(updatedUser);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch(`/api/creators/${creator?.id}/upload-logo`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setCreator(result.creator);
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}`] });
    } finally {
      setLogoUploading(false);
    }
  };

  const uploadBanner = async (file: File) => {
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);
      
      const response = await fetch(`/api/creators/${creator?.id}/upload-banner`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setCreator(result.creator);
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}`] });
    } finally {
      setBannerUploading(false);
    }
  };

  if (!user || !creator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Access Required</h3>
              <p className="text-gray-600 mb-4">You need to be signed in to access settings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const themes = [
    { 
      value: "minimal", 
      label: "Minimal", 
      description: "Clean and simple design",
      preview: "bg-gradient-to-br from-gray-100 to-gray-200"
    },
    { 
      value: "bold", 
      label: "Bold", 
      description: "Vibrant and eye-catching",
      preview: "bg-gradient-to-br from-red-500 to-pink-600"
    },
    { 
      value: "creative", 
      label: "Creative", 
      description: "Artistic and unique",
      preview: "bg-gradient-to-br from-purple-500 to-indigo-600"
    },
    { 
      value: "professional", 
      label: "Professional", 
      description: "Business-focused design",
      preview: "bg-gradient-to-br from-blue-600 to-blue-800"
    },
  ];

  const onStoreSubmit = (data: StoreSettingsData) => {
    updateStoreMutation.mutate(data);
  };

  const onUserSubmit = (data: UserSettingsData) => {
    updateUserMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">
                Manage your store and account settings
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/storefront/${creator.storeHandle}`}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Store
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>
                  Manage your store details and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...storeForm}>
                  <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-6">
                    <FormField
                      control={storeForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Awesome Store" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={storeForm.control}
                      name="storeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell customers about your store..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This description will appear on your storefront
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>Store URL</FormLabel>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          creohub.com/
                        </span>
                        <Input 
                          value={creator.storeHandle}
                          disabled
                          className="rounded-l-none bg-gray-50"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Contact support to change your store handle
                      </p>
                    </div>

                    <FormField
                      control={storeForm.control}
                      name="customDomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Domain (Pro)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="www.yourstore.com"
                              disabled={creator.planType !== 'pro'}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {creator.planType !== 'pro' 
                              ? "Upgrade to Pro to use a custom domain"
                              : "Point your domain to your Creohub store"
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={updateStoreMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateStoreMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Store Branding */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Store Branding</CardTitle>
                <CardDescription>
                  Upload your store logo and banner to create a professional brand presence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUpload
                    currentImageUrl={creator?.storeLogo || undefined}
                    onUpload={uploadLogo}
                    uploading={logoUploading}
                    type="logo"
                    maxSizeMB={2}
                  />
                  <ImageUpload
                    currentImageUrl={creator?.storeBanner || undefined}
                    onUpload={uploadBanner}
                    uploading={bannerUploading}
                    type="banner"
                    maxSizeMB={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Store Appearance</CardTitle>
                <CardDescription>
                  Customize how your store looks to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...storeForm}>
                  <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-6">
                    <FormField
                      control={storeForm.control}
                      name="storeTheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Theme</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {themes.map((theme) => (
                              <div
                                key={theme.value}
                                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                  field.value === theme.value 
                                    ? "border-primary bg-primary/5" 
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => field.onChange(theme.value)}
                              >
                                <div className={`w-full h-20 rounded-md mb-3 ${theme.preview}`}></div>
                                <h4 className="font-semibold">{theme.label}</h4>
                                <p className="text-sm text-gray-600">{theme.description}</p>
                                {field.value === theme.value && (
                                  <div className="absolute top-2 right-2">
                                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={updateStoreMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateStoreMutation.isPending ? "Saving..." : "Save Theme"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                    <FormField
                      control={userForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about yourself..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            A short description about yourself
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>Username</FormLabel>
                      <Input value={user.username} disabled className="bg-gray-50" />
                      <p className="text-sm text-gray-600">
                        Contact support to change your username
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updateUserMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Settings */}
          <TabsContent value="plan">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg capitalize">
                        {creator.planType} Plan
                      </h3>
                      <p className="text-gray-600">
                        {creator.planType === 'pro' 
                          ? "KES 1,500/month - All features included"
                          : "Free forever - Limited features"
                        }
                      </p>
                    </div>
                    {creator.planType === 'free' && (
                      <Button>
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Plan Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Free Plan Features */}
                    <div>
                      <h4 className="font-semibold mb-3">Free Plan</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Basic storefront
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Up to 10 products
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Payment processing
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          5-10% transaction fee
                        </li>
                      </ul>
                    </div>

                    {/* Pro Plan Features */}
                    <div>
                      <h4 className="font-semibold mb-3">Pro Plan</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Unlimited products
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Custom branding
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Advanced analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          0% transaction fees
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Email marketing tools
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Custom domain support
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
