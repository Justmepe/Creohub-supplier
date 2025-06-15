
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
import CheckoutPage from "@/pages/checkout";
import Storefront from "@/pages/storefront";
import Profile from "@/pages/profile";
import CreatorProfile from "@/pages/creator-profile";
import Affiliate from "@/pages/affiliate";
import Withdrawals from "@/pages/withdrawals";
import Themes from "@/pages/themes";
import Testing from "@/pages/testing";
import TestLogin from "@/pages/test-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";
import AdminTest from "@/pages/admin-test";
import AdminRegister from "@/pages/admin-register";
import AdminUsers from "@/pages/admin-users";
import AdminSocialProof from "@/pages/admin/social-proof";
import PaymentTest from "@/pages/payment-test";
import PaymentSuccess from "@/pages/payment-success";
import PaymentFailed from "@/pages/payment-failed";
import PaymentDemo from "@/pages/payment-demo";
import CustomerOrdersPage from "@/pages/customer-orders";
import VerifyEmail from "@/pages/verify-email";
import EmailVerification from "@/pages/email-verification";
import VerificationHelp from "@/pages/verification-help";
import GetVerificationCode from "@/pages/get-verification-code";
import Contact from "@/pages/contact";
import Recommendations from "@/pages/recommendations";
import DropshippingMarketplace from "@/pages/dropshipping-marketplace";
import SupplierRegistration from "@/pages/supplier-registration";
import SupplierDashboard from "@/pages/supplier-dashboard";
import NotFound from "@/pages/not-found";
import SocialProofNotification from "@/components/UpgradeNotification";

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
              <Route path="/verify-email" component={VerifyEmail} />
              <Route path="/email-verification" component={EmailVerification} />
              <Route path="/verification-help" component={VerificationHelp} />
              <Route path="/get-verification-code" component={GetVerificationCode} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/products" component={Products} />
              <Route path="/orders" component={Orders} />
              <Route path="/settings" component={Settings} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/checkout/:productId" component={CheckoutPage} />
              <Route path="/checkout" component={CheckoutPage} />
              <Route path="/storefront/:handle" component={Storefront} />
              <Route path="/profile" component={Profile} />
              <Route path="/creator/:handle" component={CreatorProfile} />
              <Route path="/affiliate" component={Affiliate} />
              <Route path="/withdrawals" component={Withdrawals} />
              <Route path="/themes" component={Themes} />
              <Route path="/testing" component={Testing} />
              <Route path="/test-login" component={TestLogin} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin-dashboard" component={AdminDashboard} />
              <Route path="/admin-users" component={AdminUsers} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/social-proof" component={AdminSocialProof} />
              <Route path="/admin/register" component={AdminRegister} />
              <Route path="/payment-test" component={PaymentTest} />
              <Route path="/payment/success" component={PaymentSuccess} />
              <Route path="/payment/failed" component={PaymentFailed} />
              <Route path="/payment-demo" component={PaymentDemo} />
              <Route path="/track-orders" component={CustomerOrdersPage} />
              <Route path="/contact" component={Contact} />
              <Route path="/recommendations" component={Recommendations} />
              <Route path="/dropshipping" component={DropshippingMarketplace} />
              <Route path="/marketplace" component={DropshippingMarketplace} />
              <Route path="/supplier-registration" component={SupplierRegistration} />
              <Route path="/become-supplier" component={SupplierRegistration} />
              <Route path="/supplier-dashboard" component={SupplierDashboard} />
              <Route component={NotFound} />
            </Switch>
          </div>
          <Toaster />
          <SocialProofNotification />
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
