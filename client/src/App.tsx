
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import Settings from "@/pages/settings";
import Pricing from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import Storefront from "@/pages/storefront";
import CreatorProfile from "@/pages/creator-profile";
import Testing from "@/pages/testing";
import TestLogin from "@/pages/test-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";
import AdminTest from "@/pages/admin-test";
import AdminRegister from "@/pages/admin-register";
import PaymentSuccess from "@/pages/payment-success";
import PaymentFailed from "@/pages/payment-failed";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/auth" component={Auth} />
              <Route path="/login" component={Auth} />
              <Route path="/signup" component={Auth} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/products" component={Products} />
              <Route path="/orders" component={Orders} />
              <Route path="/settings" component={Settings} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/checkout/:creatorId" component={Checkout} />
              <Route path="/storefront/:handle" component={Storefront} />
              <Route path="/profile" component={CreatorProfile} />
              <Route path="/testing" component={Testing} />
              <Route path="/test-login" component={TestLogin} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/register" component={AdminRegister} />
              <Route path="/payment/success" component={PaymentSuccess} />
              <Route path="/payment/failed" component={PaymentFailed} />
              <Route component={NotFound} />
            </Switch>
          </div>
          <Toaster />
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
