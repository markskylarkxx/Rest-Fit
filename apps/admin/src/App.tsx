import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Loading } from "./components/ui";
import { useAuth } from "./lib/auth";
import { CheckInPage } from "./pages/CheckInPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AtRiskPage } from "./pages/AtRiskPage";

import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { MemberDetailPage } from "./pages/MemberDetailPage";
import { MembersPage } from "./pages/MembersPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PayReturnPage } from "./pages/PayReturnPage";
import { PlansPage } from "./pages/PlansPage";

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
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      {/* Members land here after paying online; no sign-in needed. */}
      <Route path="/pay/return" element={<PayReturnPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="/at-risk" element={<AtRiskPage />} />

        <Route path="members/:id" element={<MemberDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="plans" element={<PlansPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
