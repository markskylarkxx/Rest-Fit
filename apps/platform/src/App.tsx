import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { MfaSetupPage } from "./pages/MfaSetupPage";
import { OverviewPage } from "./pages/OverviewPage";
import { GymsPage } from "./pages/GymsPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { LeadsPage } from "./pages/LeadsPage";
import { WaitlistPage } from "./pages/WaitlistPage";
import { GymDetailPage } from "./pages/GymDetailPage";
import { BillingPage } from "./pages/BillingPage";
import { AtRiskGymsPage } from "./pages/AtRiskGymsPage";


function RequireAuth({ children }: { children: ReactNode }) {
  const { staff, loading } = useAuth();
  if (loading) return null;
  if (!staff) return <Navigate to="/login" replace />;
  // The platform API refuses everything until two-step login is on.
  if (!staff.mfaEnabled) return <MfaSetupPage />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { staff, loading } = useAuth();
  if (loading) return null;
  return staff ? <Navigate to="/" replace /> : children;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="gyms" element={<GymsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="gyms/:id" element={<GymDetailPage />} />
          <Route path="at-risk" element={<AtRiskGymsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="waitlist" element={<WaitlistPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}