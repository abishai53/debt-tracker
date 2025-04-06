import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

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
  
  const handleDevLogin = () => {
    window.location.href = '/auth/dev-login';
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold mb-2">Okta Sign-In</h2>
          <Alert className="mb-4 border-green-500 bg-green-50 text-green-900">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Development Mode Available</AlertTitle>
            <AlertDescription>
              This application has development mode enabled. You can bypass Okta authentication
              by using the Development Login button below.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="w-full space-y-2">
          <Button
            className="w-full"
            onClick={handleDirectLogin}
          >
            Try Okta Login Again
          </Button>
          
          <Alert className="mt-4">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Development Mode</AlertTitle>
            <AlertDescription className="text-xs">
              Use development mode to bypass Okta authentication during development.
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="outline"
            className="w-full mt-2"
            onClick={handleDevLogin}
          >
            Use Development Login
          </Button>
          
          {onClose && (
            <Button 
              variant="ghost"
              className="w-full mt-2"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OktaSignInWidget;