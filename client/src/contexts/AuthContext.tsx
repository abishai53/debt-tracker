import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { fetchData, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  login: () => Promise<void>;
  logout: () => void;
  handleOktaTokens: (tokens: any) => Promise<void>;
  useDevelopmentLogin: () => Promise<void>;
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
  const { toast } = useToast();

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

  // Function to use development login
  const useDevelopmentLogin = async () => {
    try {
      window.location.href = '/auth/dev-login';
    } catch (error) {
      console.error('Error with development login:', error);
      toast({
        title: 'Login Failed',
        description: 'Failed to use development login. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Fetch user info on mount
  useEffect(() => {
    console.log('AuthContext: Initializing and fetching user info');
    fetchUserInfo();
  }, []);

  // Handle Okta tokens from the Sign-In Widget
  const handleOktaTokens = async (tokens: any) => {
    console.log('AuthContext: Processing Okta tokens from widget');
    
    try {
      // Send the tokens to our backend for validation and session creation
      const response = await apiRequest('POST', '/auth/handle-tokens', { tokens });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate with server');
      }
      
      // Fetch the user info after successful token processing
      await fetchUserInfo();
      
      toast({
        title: 'Authentication Successful',
        description: 'You have been signed in successfully.',
      });
    } catch (error) {
      console.error('Error processing Okta tokens:', error);
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Login function - opens Okta authentication in a new window
  const login = async () => {
    console.log('AuthContext: Opening Okta login in a new window');
    
    try {
      // First get the login URL from our backend (which generates a valid state parameter)
      const loginInfoResponse = await fetch('/auth/login-info');
      if (!loginInfoResponse.ok) {
        throw new Error('Failed to get login URL');
      }
      
      const { authUrl } = await loginInfoResponse.json();
      console.log('Got auth URL:', authUrl);
      
      // Open the auth endpoint in a popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Login',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (!popup) {
        console.error('Popup blocked! Please allow popups for this site.');
        toast({
          title: 'Popup Blocked',
          description: 'Please allow popups for this site and try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Poll for changes to auth status every 1 second
      const checkInterval = setInterval(async () => {
        try {
          // Check if user is authenticated
          const userData = await fetchData<User>('/api/userinfo');
          
          if (userData) {
            // User is authenticated
            setUser(userData);
            setIsAuthenticated(true);
            clearInterval(checkInterval);
            
            if (!popup.closed) {
              popup.close();
            }
            
            toast({
              title: 'Authentication Successful',
              description: 'You have been signed in successfully.',
            });
          }
        } catch (error) {
          console.log('Still waiting for authentication...');
        }
        
        // Also check if popup is still open
        if (popup.closed) {
          console.log('Authentication popup was closed');
          clearInterval(checkInterval);
          // Refresh user info in case the authentication was successful
          fetchUserInfo();
        }
      }, 1000);
    } catch (error) {
      console.error('Error initiating login:', error);
      toast({
        title: 'Login Failed',
        description: 'Failed to start the login process. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Logout function - redirects to Okta logout endpoint
  const logout = () => {
    console.log('AuthContext: Logging out');
    window.location.href = '/auth/logout';
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    handleOktaTokens,
    useDevelopmentLogin
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