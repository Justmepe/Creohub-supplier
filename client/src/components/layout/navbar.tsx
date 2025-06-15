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
import { useAuth } from "@/contexts/AuthContext";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { 
  LogOut,
  User,
  Settings
} from "lucide-react";

export default function Navbar() {
  const { user, creator, setUser, setCreator } = useAuth();

  const handleLogout = () => {
    setUser(null);
    setCreator(null);
  };

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
                      {creator && (
                        <p className="text-xs leading-none text-muted-foreground">
                          Store: {creator.storeName}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
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
                  <Link href="/supplier-registration">Become a Supplier</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}