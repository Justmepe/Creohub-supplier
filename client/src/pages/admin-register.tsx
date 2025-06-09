import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, UserPlus, Key, Mail, User } from "lucide-react";
import { Link } from "wouter";

const adminRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  inviteCode: z.string().min(1, "Invite code is required")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminRegisterForm = z.infer<typeof adminRegisterSchema>;

export default function AdminRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AdminRegisterForm>({
    resolver: zodResolver(adminRegisterSchema)
  });

  const onSubmit = async (data: AdminRegisterForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/register", {
        username: data.username,
        email: data.email,
        password: data.password,
        inviteCode: data.inviteCode
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Admin Account Created",
          description: `Welcome ${data.username}! You can now login with your admin credentials.`,
        });
        reset();
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to create admin account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Registration
            </CardTitle>
            <CardDescription className="text-gray-600">
              Create a new administrator account for Creohub platform management
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="Enter admin username"
                  className="border-gray-200 focus:border-blue-500"
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="admin@example.com"
                  className="border-gray-200 focus:border-blue-500"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Create secure password"
                  className="border-gray-200 focus:border-blue-500"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Confirm your password"
                  className="border-gray-200 focus:border-blue-500"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Invite Code
                </Label>
                <Input
                  id="inviteCode"
                  {...register("inviteCode")}
                  placeholder="Enter invite code"
                  className="border-gray-200 focus:border-blue-500"
                />
                {errors.inviteCode && (
                  <p className="text-sm text-red-500">{errors.inviteCode.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Contact your platform administrator for the invite code
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isSubmitting}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating Account..." : "Create Admin Account"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Already have an admin account?{" "}
                <Link href="/admin-test" className="text-blue-600 hover:underline">
                  Login here
                </Link>
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <p><strong>Admin Capabilities:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Platform statistics and analytics</li>
                  <li>Creator account management</li>
                  <li>User role administration</li>
                  <li>Subscription monitoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}