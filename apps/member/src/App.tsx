import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Protected } from "./components/Protected";
import { BottomNav } from "./components/BottomNav";
import { useAuth } from "./lib/auth";
import { flush as flushWorkoutQueue } from "./lib/workoutQueue";
import {
  fetchExperience,
  getCachedExperience,
} from "./lib/experience";
import { LoginPage } from "./pages/LoginPage";
import { VerifyPage } from "./pages/VerifyPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { HomePage } from "./pages/HomePage";
import { PlanPickerPage } from "./pages/PlanPickerPage";
import { PlanDetailPage } from "./pages/PlanDetailPage";
import { GeneratePlanPage } from "./pages/GeneratePlanPage";
import { JoinGymPage } from "./pages/JoinGymPage";
import { MembershipPage } from "./pages/MembershipPage";
import { QrCodePage } from "./pages/QrCodePage";
import { RenewPage } from "./pages/RenewPage";
import { ProfilePage } from "./pages/ProfilePage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { WorkoutDetailPage } from "./pages/WorkoutDetailPage";
import { LogWorkoutPage } from "./pages/LogWorkoutPage";
import { ProgressPage } from "./pages/ProgressPage";
import { FindGymsPage } from "./pages/FindGymsPage";

function NavLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

function RootRedirect() {
  const { token, ready } = useAuth();
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!ready || !token) {
      setChecked(true);
      return;
    }
    const cached = getCachedExperience();
    if (cached) {
      setChecked(true);
      return;
    }
    fetchExperience()
      .then((level) => {
        setNeedsOnboarding(!level);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [ready, token]);

  if (!ready || !checked) return null;
  if (!token) return <Navigate to="/" replace />;
  return <Navigate to={needsOnboarding ? "/onboarding" : "/home"} replace />;
}

export function App() {
  useEffect(() => {
    flushWorkoutQueue().catch(() => {});
    let remove: (() => void) | undefined;
    CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) flushWorkoutQueue().catch(() => {});
    }).then((sub) => {
      remove = () => sub.remove();
    });
    return () => {
      remove?.();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />

      <Route element={<NavLayout />}>
        <Route
          path="/home"
          element={
            <Protected>
              <HomePage />
            </Protected>
          }
        />
        <Route
          path="/workout"
          element={
            <Protected>
              <WorkoutPage />
            </Protected>
          }
        />
        <Route
          path="/progress"
          element={
            <Protected>
              <ProgressPage />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <ProfilePage />
            </Protected>
          }
        />
      </Route>

      <Route
        path="/onboarding"
        element={
          <Protected>
            <OnboardingPage />
          </Protected>
        }
      />
      <Route
        path="/plans"
        element={
          <Protected>
            <PlanPickerPage />
          </Protected>
        }
      />
      <Route
        path="/plans/generate"
        element={
          <Protected>
            <GeneratePlanPage />
          </Protected>
        }
      />
      <Route
        path="/plans/:slug"
        element={
          <Protected>
            <PlanDetailPage />
          </Protected>
        }
      />
      <Route
        path="/workout/log"
        element={
          <Protected>
            <LogWorkoutPage />
          </Protected>
        }
      />
      <Route
        path="/workouts/:id"
        element={
          <Protected>
            <WorkoutDetailPage />
          </Protected>
        }
      />
      <Route
        path="/qr"
        element={
          <Protected>
            <QrCodePage />
          </Protected>
        }
      />
      <Route
        path="/qr/:id"
        element={
          <Protected>
            <QrCodePage />
          </Protected>
        }
      />
      <Route
        path="/find-gyms"
        element={
          <Protected>
            <FindGymsPage />
          </Protected>
        }
      />
      <Route
        path="/join"
        element={
          <Protected>
            <JoinGymPage />
          </Protected>
        }
      />
      <Route
        path="/memberships/:id"
        element={
          <Protected>
            <MembershipPage />
          </Protected>
        }
      />
      <Route
        path="/memberships/:id/qr"
        element={
          <Protected>
            <QrCodePage />
          </Protected>
        }
      />
      <Route
        path="/memberships/:id/renew"
        element={
          <Protected>
            <RenewPage />
          </Protected>
        }
      />

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}