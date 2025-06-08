import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, createContext, useContext } from "react";
import type { User, Creator } from "@shared/schema";

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

interface AuthContextType {
  user: User | null;
  creator: Creator | null;
  setUser: (user: User | null) => void;
  setCreator: (creator: Creator | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);

  const authValue: AuthContextType = {
    user,
    creator,
    setUser,
    setCreator,
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

export default App;
