import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import OktaSignInWidget from '@/components/OktaSignInWidget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Login() {
  const { login, isAuthenticated, isLoading, handleOktaTokens, useDevelopmentLogin } = useAuth();
  const [, setLocation] = useLocation();
  const [loginClicked, setLoginClicked] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showWidget, setShowWidget] = useState(false);
  const [authTab, setAuthTab] = useState<'widget' | 'redirect'>('widget');

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    console.log('Login: Checking authentication status:', { isLoading, isAuthenticated });
    if (!isLoading && isAuthenticated) {
      console.log('Login: Already authenticated, redirecting to dashboard');
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handlePopupLogin = async () => {
    console.log('Login: Popup login button clicked');
    setLoginClicked(true);
    
    // Add a timeout to prevent indefinite spinning if the authentication doesn't complete
    setTimeout(() => {
      setLoginClicked(false);
    }, 30000); // Reset after 30 seconds to allow for popup flow
    
    try {
      // Call the login function from AuthContext
      await login();
    } catch (error: unknown) {
      console.error('Login failed:', error);
      setLoginClicked(false);
    }
  };
  
  const handleWidgetLogin = () => {
    console.log('Login: Widget login button clicked');
    setShowWidget(true);
  };

  const handleWidgetSuccess = (tokens: any) => {
    console.log('Login: Widget authentication successful');
    handleOktaTokens(tokens);
  };

  const handleWidgetError = (error: Error) => {
    console.error('Login widget error:', error);
    setShowWidget(false);
  };
  
  // For debugging authentication issues
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/debug/auth-status');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: String(error) });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to manage your financial relationships
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : showWidget ? (
              <OktaSignInWidget 
                onSuccess={handleWidgetSuccess} 
                onError={handleWidgetError}
                onClose={() => setShowWidget(false)}
              />
            ) : (
              <Tabs defaultValue={authTab} onValueChange={(v) => setAuthTab(v as 'widget' | 'redirect')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="widget">Sign-In Widget</TabsTrigger>
                  <TabsTrigger value="redirect">Redirect Method</TabsTrigger>
                </TabsList>
                <TabsContent value="widget" className="mt-4">
                  <Button
                    className="w-full h-12 text-base"
                    size="lg"
                    onClick={handleWidgetLogin}
                  >
                    Sign in with Okta Widget
                  </Button>
                </TabsContent>
                <TabsContent value="redirect" className="mt-4">
                  <Button
                    className="w-full h-12 text-base"
                    size="lg"
                    onClick={handlePopupLogin}
                    disabled={loginClicked}
                  >
                    {loginClicked ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign in with Redirect'
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>Secure authentication powered by Okta</p>
          </CardFooter>
        </Card>
        
        {/* Developer and debug options */}
        <div className="mt-4">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex-1 text-xs" 
              onClick={() => setShowDebugPanel(!showDebugPanel)}
            >
              {showDebugPanel ? 'Hide' : 'Show'} Debug Options
            </Button>
            
            <Button 
              variant="secondary" 
              size="sm"
              className="text-xs"
              onClick={useDevelopmentLogin}
            >
              Development Login
            </Button>
          </div>
          
          {showDebugPanel && (
            <Card className="mt-2 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Debug Tools</h3>
                <div className="space-y-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = '/auth/login'}
                  >
                    Direct Okta Login
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const response = await fetch('/auth/login-info');
                        const data = await response.json();
                        setDebugInfo({ authUrl: data.authUrl });
                      } catch (error) {
                        setDebugInfo({ error: String(error) });
                      }
                    }}
                  >
                    Get Login URL
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={checkAuthStatus}
                  >
                    Check Auth Status
                  </Button>
                  {debugInfo && (
                    <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                      <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}