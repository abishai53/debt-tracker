import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Only redirect to Okta if in production environment
  // In development, show a message about configuring Okta correctly
  const isDevelopment = import.meta.env.MODE === 'development';
  const replitDomain = window.location.hostname;
  const callbackUrl = `https://${replitDomain}/authorization-code/callback`;
  
  useEffect(() => {
    console.log('Login: Checking authentication status:', { isLoading, isAuthenticated });
    if (!isLoading && isAuthenticated) {
      console.log('Login: Already authenticated, redirecting to dashboard');
      setLocation('/');
    } else if (!isLoading && !isDevelopment) {
      // Redirect directly to Okta login in production
      window.location.href = '/auth/login';
    }
  }, [isAuthenticated, isLoading, setLocation, isDevelopment]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Authentication Setup</CardTitle>
            <CardDescription className="text-muted-foreground">
              {isDevelopment ? 'Okta Configuration Required' : 'Redirecting to Okta sign-in...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {isDevelopment ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To complete the Okta setup, please add the following URL to your Okta application's
                  <strong> Login redirect URIs</strong> in the Okta Developer Console:
                </p>
                <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
                  {callbackUrl}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Steps to configure:</p>
                  <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                    <li>Log in to your Okta Developer Console</li>
                    <li>Navigate to Applications → Applications</li>
                    <li>Select your application</li>
                    <li>Under "General Settings" go to "Login" section</li>
                    <li>Add the above URL to the "Login redirect URIs" list</li>
                    <li>Click "Save" to apply changes</li>
                  </ol>
                </div>
                <Button 
                  onClick={() => window.location.href = '/auth/login'} 
                  className="w-full mt-2"
                >
                  Continue to Login
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>Secure authentication powered by Okta</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}