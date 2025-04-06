import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function OktaTest() {
  const [log, setLog] = useState<string[]>([]);
  const [authStatus, setAuthStatus] = useState<any>(null);
  
  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  const checkAuthStatus = async () => {
    addLog('Checking auth status...');
    try {
      const response = await fetch('/debug/auth-status');
      const data = await response.json();
      addLog('Auth status received');
      setAuthStatus(data);
    } catch (error) {
      addLog(`Error checking auth status: ${error}`);
    }
  };
  
  const fetchUserInfo = async () => {
    addLog('Fetching user info from /api/userinfo...');
    try {
      const response = await fetch('/api/userinfo');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status: ${response.status}, Message: ${errorText}`);
      }
      const data = await response.json();
      addLog('User info received');
      setAuthStatus({ ...authStatus, userInfoTest: data });
    } catch (error) {
      addLog(`Error fetching user info: ${error}`);
    }
  };
  
  const loginWithOkta = async () => {
    addLog('Starting Okta login flow directly...');
    try {
      // Get the auth URL first
      const checkResponse = await fetch('/auth/login-info');
      if (!checkResponse.ok) {
        throw new Error(`Failed to get login URL: ${checkResponse.status}`);
      }
      const { authUrl } = await checkResponse.json();
      
      addLog(`Got auth URL: ${authUrl}`);
      
      // Open the auth URL in a new window
      const width = 800;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Login',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (!popup) {
        addLog('Popup was blocked. Please allow popups for this site.');
        return;
      }
      
      addLog('Login window opened. Waiting for authentication...');
      
      // Poll for changes to auth status every 2 seconds
      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch('/debug/auth-status');
          const statusData = await statusResponse.json();
          
          if (statusData.isAuthenticated) {
            addLog('Authentication successful!');
            setAuthStatus(statusData);
            clearInterval(checkInterval);
            
            if (!popup.closed) {
              popup.close();
            }
          }
        } catch (error) {
          console.log('Still waiting for authentication...');
        }
      }, 2000);
      
      // Clean up the interval if the popup is closed
      const closedCheck = setInterval(() => {
        if (popup.closed) {
          addLog('Login window was closed');
          clearInterval(checkInterval);
          clearInterval(closedCheck);
          checkAuthStatus();
        }
      }, 500);
      
    } catch (error) {
      addLog(`Error during login: ${error}`);
    }
  };
  
  const regularLogin = () => {
    addLog('Redirecting to /auth/login...');
    window.location.href = '/auth/login';
  };
  
  useEffect(() => {
    addLog('OktaTest page loaded');
    checkAuthStatus();
  }, []);
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Okta Authentication Test</CardTitle>
          <CardDescription>
            This page helps diagnose issues with Okta authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button onClick={regularLogin}>
              Standard Login Redirect
            </Button>
            <Button onClick={loginWithOkta} variant="outline">
              Test Direct Okta Auth
            </Button>
            <Button onClick={checkAuthStatus} variant="secondary">
              Check Auth Status
            </Button>
            <Button onClick={fetchUserInfo} variant="secondary">
              Fetch User Info
            </Button>
          </div>
          
          {authStatus && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Authentication Status:</h3>
              <div className="bg-muted p-4 rounded-md overflow-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(authStatus, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-md h-64 overflow-auto font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i}>{entry}</div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="ghost" size="sm" onClick={() => setLog([])}>
            Clear Log
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}