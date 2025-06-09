
import { createContext, useContext, useState, useEffect } from "react";
import type { User, Creator } from "@shared/schema";

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
