
import { createContext, useContext, useState } from "react";
import type { User, Creator } from "@shared/schema";

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

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
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
      {children}
    </AuthContext.Provider>
  );
}
