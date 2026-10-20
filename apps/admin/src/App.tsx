import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Loading } from "./components/ui";
import { useAuth } from "./lib/auth";
import { CheckInPage } from "./pages/CheckInPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AtRiskPage } from "./pages/AtRiskPage";

import { ForgotPasswordPage, LoginPage } from "./pages/AuthPages";
import { BillingPage } from "./pages/BillingPage";
import { BillingReturnPage } from "./pages/BillingReturnPage";
import { SetupPasswordPage } from "./pages/SetupPasswordPage";
import { MemberDetailPage } from "./pages/MemberDetailPage";
import { MembersPage } from "./pages/MembersPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PayReturnPage } from "./pages/PayReturnPage";
import { PlansPage } from "./pages/PlansPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StaffPage } from "./pages/StaffPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { staff, loading } = useAuth();
  if (loading) return <Loading />;
  return staff ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { staff, loading } = useAuth();
  if (loading) return <Loading />;
  return staff ? <Navigate to="/" replace /> : children;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route path="/setup-password" element={<SetupPasswordPage />} />
      <Route
        path="/forgot-password"
        element={
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        }
      />
      <Route path="/pay/return" element={<PayReturnPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="at-risk" element={<AtRiskPage />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/:id" element={<MemberDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="billing/return" element={<BillingReturnPage />} />
        
        {/* Phase 7.5 routes */}
        <Route path="staff" element={<StaffPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}