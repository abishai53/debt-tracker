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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
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
