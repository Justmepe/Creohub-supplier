import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestLogin() {
  const { setUser, setCreator } = useAuth();
  const [, setLocation] = useLocation();

  const handleTestLogin = async () => {
    // Set test user data directly
    const testUser = {
      id: 1,
      username: "testerpeter",
      email: "petersongikonyo182@gmail.com",
      password: "password123",
      fullName: null,
      bio: null,
      avatar: null,
      isCreator: true,
      createdAt: new Date("2025-06-09T06:45:26.384Z")
    };

    const testCreator = {
      id: 1,
      userId: 1,
      storeHandle: "testerr",
      storeName: "testerr",
      storeDescription: "",
      storeTheme: "minimal",
      storeColors: {},
      customDomain: null,
      isActive: true,
      planType: "free",
      subscriptionStatus: "trial",
      trialEndsAt: new Date("2025-07-09T06:53:31.723Z"),
      subscriptionEndsAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      productCount: 3,
      createdAt: new Date("2025-06-09T06:53:31.723827Z")
    };

    setUser(testUser);
    setCreator(testCreator);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Test Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestLogin} className="w-full">
            Login as Test User (testerpeter)
          </Button>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            This will log you in directly and show your existing products
          </p>
        </CardContent>
      </Card>
    </div>
  );
}