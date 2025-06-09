
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Hydrate from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      const savedCreator = localStorage.getItem('creator');
      
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('user');
        }
      }
      
      if (savedCreator) {
        try {
          setCreator(JSON.parse(savedCreator));
        } catch (error) {
          console.error('Failed to parse saved creator:', error);
          localStorage.removeItem('creator');
        }
      }
      
      setIsHydrated(true);
    }
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
