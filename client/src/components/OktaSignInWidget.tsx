import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import directly from Okta causes issues, so using a different approach
// Creating a simple placeholder implementation

interface OktaSignInWidgetProps {
  onSuccess: (tokens: any) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
}

const OktaSignInWidget = ({ onSuccess, onError, onClose }: OktaSignInWidgetProps) => {
  const { toast } = useToast();
  
  useEffect(() => {
    // In a real implementation, we would initialize the Okta widget here
    console.log('OktaSignInWidget: Initializing direct Okta integration...');
    
    // Load necessary CSS dynamically
    // const link = document.createElement('link');
    // link.href = 'https://global.oktacdn.com/okta-signin-widget/7.2.0/css/okta-sign-in.min.css';
    // link.rel = 'stylesheet';
    // document.head.appendChild(link);
    
    return () => {
      // Cleanup when component unmounts
    };
  }, []);

  const handleDirectLogin = async () => {
    try {
      // Get the login URL from our backend
      const loginInfoResponse = await fetch('/auth/login-info');
      if (!loginInfoResponse.ok) {
        throw new Error('Failed to get login URL');
      }
      
      const { authUrl } = await loginInfoResponse.json();
      console.log('Got auth URL:', authUrl);
      
      // Redirect to Okta login
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating direct login:', error);
      toast({
        title: 'Login Error',
        description: 'Failed to start the login process. Please try again.',
        variant: 'destructive',
      });
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold mb-2">Okta Sign-In</h2>
          <p className="text-sm text-muted-foreground">
            The Okta Sign-In Widget requires additional setup. For now, you can use:
          </p>
        </div>
        
        <Button
          className="w-full"
          onClick={handleDirectLogin}
        >
          Sign in with Okta
        </Button>
        
        {onClose && (
          <Button 
            variant="outline"
            className="w-full mt-2"
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
};

export default OktaSignInWidget;