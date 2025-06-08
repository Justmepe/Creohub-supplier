import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/App";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  User,
  BarChart3,
  Store,
  ExternalLink,
  Menu,
  Home,
  Eye,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & stats"
  },
  {
    name: "Products",
    href: "/products", 
    icon: Package,
    description: "Manage inventory"
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingBag,
    description: "Track sales"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance insights"
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Store & profile"
  }
];

const quickActions = [
  {
    name: "Add Product",
    href: "/products",
    icon: PlusCircle,
    color: "text-blue-600"
  },
  {
    name: "View Store",
    href: "/storefront",
    icon: Eye,
    color: "text-green-600"
  },
  {
    name: "Sales Report",
    href: "/analytics",
    icon: TrendingUp,
    color: "text-purple-600"
  }
];

export default function Sidebar({ className }: SidebarProps) {
  const { user, creator, setUser, setCreator } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    setUser(null);
    setCreator(null);
  };

  const isActive = (href: string) => location === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link href="/">
          <h1 className="text-2xl font-bold text-primary cursor-pointer mb-2">Creohub</h1>
        </Link>
        {creator && (
          <div className="space-y-1">
            <p className="font-medium text-sm">{creator.storeName}</p>
            <Badge variant="outline" className="text-xs">
              {creator.planType === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Main Menu
            </h3>
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-60">{item.description}</div>
                    </div>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <Button variant="ghost" className="w-full justify-start">
                    <action.icon className={`mr-2 h-4 w-4 ${action.color}`} />
                    {action.name}
                  </Button>
                </Link>
              ))}
              {creator && (
                <Link href={`/storefront/${creator.storeHandle}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <ExternalLink className="mr-2 h-4 w-4 text-orange-600" />
                    Public Store
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <Separator />

          {/* User Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Account
            </h3>
            <div className="space-y-1">
              <Link href="/creator-profile">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {user.fullName?.charAt(0) || user.username.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block w-64 bg-white border-r ${className}`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
