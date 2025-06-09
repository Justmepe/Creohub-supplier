
import { createContext, useContext, useState } from "react";
import type { User, Creator } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  creator: Creator | null;
  setUser: (user: User | null) => void;
  setCreator: (creator: Creator | null) => void;
  logout: () => void;
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

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [creator, setCreator] = useState<Creator | null>(() => {
    const savedCreator = localStorage.getItem('creator');
    return savedCreator ? JSON.parse(savedCreator) : null;
  });

  const handleSetUser = (user: User | null) => {
    setUser(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  };

  const handleSetCreator = (creator: Creator | null) => {
    setCreator(creator);
    if (creator) {
      localStorage.setItem('creator', JSON.stringify(creator));
    } else {
      localStorage.removeItem('creator');
    }
  };

  const logout = () => {
    setUser(null);
    setCreator(null);
    localStorage.removeItem('user');
    localStorage.removeItem('creator');
  };

  const authValue: AuthContextType = {
    user,
    creator,
    setUser: handleSetUser,
    setCreator: handleSetCreator,
    logout,
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
