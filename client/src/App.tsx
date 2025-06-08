import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Storefront from "@/pages/storefront";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import Settings from "@/pages/settings";
import CreatorProfile from "@/pages/creator-profile";
import Checkout from "@/pages/checkout";
import Pricing from "@/pages/pricing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/storefront/:handle" component={Storefront} />
      <Route path="/products" component={Products} />
      <Route path="/orders" component={Orders} />
      <Route path="/settings" component={Settings} />
      <Route path="/creator-profile" component={CreatorProfile} />
      <Route path="/checkout/:creatorId" component={Checkout} />
      <Route path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;