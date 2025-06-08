import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, User, Store, Palette, CheckCircle } from "lucide-react";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().optional(),
});

const creatorSchema = z.object({
  storeHandle: z.string().min(3, "Store handle must be at least 3 characters").regex(/^[a-zA-Z0-9_-]+$/, "Store handle can only contain letters, numbers, hyphens, and underscores"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeDescription: z.string().optional(),
  storeTheme: z.string().default("minimal"),
});

type UserFormData = z.infer<typeof userSchema>;
type CreatorFormData = z.infer<typeof creatorSchema>;

interface CreatorOnboardingProps {
  onComplete: () => void;
}

export default function CreatorOnboarding({ onComplete }: CreatorOnboardingProps) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setUser, setCreator } = useAuth();
  const [, setLocation] = useLocation();

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      bio: "",
    },
  });

  const creatorForm = useForm<CreatorFormData>({
    resolver: zodResolver(creatorSchema),
    defaultValues: {
      storeHandle: "",
      storeName: "",
      storeDescription: "",
      storeTheme: "minimal",
    },
  });

  const progress = (step / 3) * 100;

  const onUserSubmit = (data: UserFormData) => {
    setUserData(data);
    setStep(2);
  };

  const onCreatorSubmit = async (data: CreatorFormData) => {
    if (!userData) return;

    setIsLoading(true);
    try {
      // Create user account
      const userResponse = await apiRequest("POST", "/api/auth/register", userData);
      const user = await userResponse.json();

      // Create creator profile
      const creatorResponse = await apiRequest("POST", "/api/creators", {
        ...data,
        userId: user.user.id,
      });
      const creator = await creatorResponse.json();

      setUser(user.user);
      setCreator(creator);
      setStep(3);

      toast({
        title: "Account created successfully!",
        description: "Welcome to Creohub. Your creator journey starts now.",
      });

      setTimeout(() => {
        onComplete();
        setLocation("/dashboard");
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const themes = [
    { value: "minimal", label: "Minimal", description: "Clean and simple" },
    { value: "bold", label: "Bold", description: "Vibrant and eye-catching" },
    { value: "creative", label: "Creative", description: "Artistic and unique" },
    { value: "professional", label: "Professional", description: "Business-focused" },
  ];

  if (step === 3) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-secondary mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-neutral mb-2">Welcome to Creohub!</h3>
          <p className="text-gray-600 mb-4">
            Your creator account has been set up successfully. You'll be redirected to your dashboard shortly.
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-primary rounded-full w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Step {step} of 2: {step === 1 ? "Personal Information" : "Store Setup"}
          </h3>
          <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Create Your Account
            </CardTitle>
            <CardDescription>
              Let's start with your basic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
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
                      <FormLabel>Bio (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Set Up Your Store
            </CardTitle>
            <CardDescription>
              Configure your creator storefront
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...creatorForm}>
              <form onSubmit={creatorForm.handleSubmit(onCreatorSubmit)} className="space-y-4">
                <FormField
                  control={creatorForm.control}
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
                  control={creatorForm.control}
                  name="storeHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Handle</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            creohub.com/
                          </span>
                          <Input 
                            placeholder="my-store" 
                            className="rounded-l-none" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creatorForm.control}
                  name="storeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what you sell..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creatorForm.control}
                  name="storeTheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Store Theme
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {themes.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value}>
                              <div>
                                <div className="font-medium">{theme.label}</div>
                                <div className="text-sm text-gray-500">{theme.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Creating..." : "Create Store"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}