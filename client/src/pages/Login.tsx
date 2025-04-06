import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    console.log('Login: Checking authentication status:', { isLoading, isAuthenticated });
    if (!isLoading && isAuthenticated) {
      console.log('Login: Already authenticated, redirecting to dashboard');
      setLocation('/');
    } else if (!isLoading) {
      // Redirect directly to Okta login
      window.location.href = '/auth/login';
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Redirecting to Okta sign-in...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>Secure authentication powered by Okta</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}