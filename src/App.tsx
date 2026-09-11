import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OrgProvider, useOrg } from "./contexts/OrgContext";

import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Goals } from "./pages/Goals";
import { Analytics } from "./pages/Analytics";
import { Wishlist } from "./pages/Wishlist";
import { ImportData } from "./pages/ImportData";
import { CalendarView } from "./pages/CalendarView";
import { Layout } from "./components/Layout";
import { Settings } from "./pages/Settings";
import { Loader2 } from "lucide-react";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const { organization, loadingOrg } = useOrg();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário está logado mas não tem perfil ou não completou o onboarding, mande-o para criar a org.
  if (!userProfile || !userProfile.currentOrganizationId) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
  } else if (location.pathname === "/onboarding") {
    // Se já tem org e está no onboarding, manda pro app
    return <Navigate to="/" replace />;
  }

  if (loadingOrg && location.pathname !== "/onboarding") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              }
            />

            {/* Protected App Routes */}
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/import" element={<ImportData />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </OrgProvider>
    </AuthProvider>
  );
}
