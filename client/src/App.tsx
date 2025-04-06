import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import People from "@/pages/People";
import Transactions from "@/pages/Transactions";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import OktaTest from "@/pages/OktaTest";
import NotFound from "@/pages/not-found";

function Router() {
  // Explicitly add routes for authentication flow
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/authorization-code/callback">
        {() => (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-background">
            <div className="text-center bg-card p-8 rounded-lg shadow-lg max-w-md w-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
              <h2 className="mt-4 text-xl font-semibold">Authentication Successful!</h2>
              <p className="mt-2 text-muted-foreground">You can close this window and return to the application.</p>
              
              <div className="mt-6 border-t pt-4">
                <p className="text-sm text-muted-foreground">If you're not automatically redirected or using a popup, click below:</p>
                <button 
                  onClick={() => window.close()}
                  className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  Close this window
                </button>
              </div>
            </div>
          </div>
        )}
      </Route>
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/people/:id">
        {({ id }) => (
          <ProtectedRoute>
            <People params={{ id }} />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/people">
        {() => (
          <ProtectedRoute>
            <People />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/transactions">
        {() => (
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/okta-test" component={OktaTest} />
      <Route>
        {() => (
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell>
          <Router />
        </AppShell>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
