import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { fetchData } from '@/lib/queryClient';

// Define the user type
interface User {
  id: string;
  displayName: string;
  email?: string;
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the auth provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Function to fetch user info
  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const userData = await fetchData<User>('/api/userinfo');
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user info on mount
  useEffect(() => {
    console.log('AuthContext: Initializing and fetching user info');
    fetchUserInfo();
  }, []);

  // Login function
  const login = () => {
    console.log('AuthContext: Redirecting to Okta login');
    window.location.href = '/auth/login';
  };

  // Logout function
  const logout = () => {
    console.log('AuthContext: Logging out');
    window.location.href = '/auth/logout';
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};