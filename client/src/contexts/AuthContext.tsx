
import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { User, Creator } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  creator: Creator | null;
  setUser: (user: User | null) => void;
  setCreator: (creator: Creator | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

  const resetTimeout = () => {
    if (!user) return;

    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    warningShownRef.current = false;

    // Set warning timeout
    warningRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        toast({
          title: "Session Expiring",
          description: "Your session will expire in 5 minutes due to inactivity.",
          variant: "destructive",
        });
      }
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      logout();
    }, SESSION_TIMEOUT);
  };

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => resetTimeout();
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user]);

  // Check for existing token and hydrate from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        try {
          const token = localStorage.getItem('auth_token');
          
          if (token) {
            // Check if token is valid
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            } else {
              // Token is invalid, remove it
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
            }
          } else {
            // No token, try localStorage user as fallback
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              try {
                setUser(JSON.parse(savedUser));
              } catch (error) {
                console.error('Failed to parse saved user:', error);
                localStorage.removeItem('user');
              }
            }
          }
          
          // Load creator profile from localStorage
          const savedCreator = localStorage.getItem('creator');
          if (savedCreator) {
            try {
              setCreator(JSON.parse(savedCreator));
            } catch (error) {
              console.error('Failed to parse saved creator:', error);
              localStorage.removeItem('creator');
            }
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
        } finally {
          setIsHydrated(true);
        }
      }
    };

    checkAuth();
  }, []);

  const handleSetUser = (user: User | null) => {
    setUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    }
  };

  const handleSetCreator = (creator: Creator | null) => {
    setCreator(creator);
    if (typeof window !== 'undefined') {
      if (creator) {
        localStorage.setItem('creator', JSON.stringify(creator));
      } else {
        localStorage.removeItem('creator');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setCreator(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('creator');
      localStorage.removeItem('pendingVerificationUserId');
      localStorage.removeItem('pendingVerificationEmail');
    }
  };

  const authValue: AuthContextType = {
    user,
    creator,
    setUser: handleSetUser,
    setCreator: handleSetCreator,
    logout,
    isAuthenticated: user !== null,
    isHydrated,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
