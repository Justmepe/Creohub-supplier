import { useState } from "react";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/Logo_1749474304178.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { 
  Menu, 
  Home, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut,
  User,
  ExternalLink,
  Eye,
  Users,
  Palette,
  Wallet,
  Store,
  Lightbulb
} from "lucide-react";

export default function Navbar() {
  const { user, creator, setUser, setCreator } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    setCreator(null);
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Dropshipping", href: "/dropshipping", icon: Store },
    { name: "AI Recommendations", href: "/recommendations", icon: Lightbulb },
    { name: "Affiliate", href: "/affiliate", icon: Users },
    { name: "Withdrawals", href: "/withdrawals", icon: Wallet },
    { name: "Themes", href: "/themes", icon: Palette },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => location === href;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center min-w-0 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src={logoPath} 
                alt="Creohub" 
                className="h-8 w-8 flex-shrink-0"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-primary cursor-pointer whitespace-nowrap">Creohub</h1>
            </Link>
            {creator && (
              <Badge variant="outline" className="ml-2 sm:ml-3 hidden sm:inline-flex">
                {creator.storeName}
              </Badge>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {user && creator && (
              <>
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.name}</span>
                    </Button>
                  </Link>
                ))}

                <Button variant="outline" size="sm" asChild>
                  <Link href={`/storefront/${creator.storeHandle}`}>
                    <Eye className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">View Store</span>
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Right side - Currency and User */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Currency Selector */}
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} alt={user.username} />
                      <AvatarFallback>
                        {user.fullName?.charAt(0) || user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {creator && (
                    <DropdownMenuItem asChild>
                      <Link href={`/storefront/${creator.storeHandle}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Store
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex items-center space-x-2 p-4 border-b">
                    <img 
                      src={logoPath} 
                      alt="Creohub" 
                      className="h-6 w-6"
                    />
                    <h2 className="text-lg font-bold text-primary">Creohub</h2>
                  </div>
                  <div className="flex flex-col space-y-4 mt-4">
                    {user && creator && (
                      <>
                        <div className="flex items-center space-x-3 p-4 border-b">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} alt={user.username} />
                            <AvatarFallback>
                              {user.fullName?.charAt(0) || user.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.fullName || user.username}</p>
                            <p className="text-sm text-gray-500">{creator.storeName}</p>
                          </div>
                        </div>

                        {navigation.map((item) => (
                          <Link key={item.name} href={item.href}>
                            <Button
                              variant={isActive(item.href) ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <item.icon className="mr-2 h-4 w-4" />
                              {item.name}
                            </Button>
                          </Link>
                        ))}

                        <Button variant="outline" asChild className="w-full justify-start">
                          <Link href={`/storefront/${creator.storeHandle}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Store
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>

                        <div className="border-t pt-4">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={handleLogout}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                          </Button>
                        </div>
                      </>
                    )}

                    {!user && (
                      <div className="space-y-2">
                        <Button variant="ghost" asChild className="w-full">
                          <Link href="/auth">Sign In</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/auth">Get Started</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}