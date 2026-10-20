import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput } from "@restfit/shared";
import { api, tokenStore } from "./api";
import type { Staff } from "./types";

interface AuthState {
  staff: Staff | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>; // <-- Simplified
  completeSetup: (input: { token: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get<Staff>("/auth/me")
      .then((r) => {
        if (r.data.isPlatformAdmin) {
          tokenStore.clear();
          setStaff(null);
        } else {
          setStaff(r.data);
        }
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((data: { token: string; staff: Staff }) => {
    if (data.staff.isPlatformAdmin) {
      throw new Error("Platform admins must use the platform admin dashboard (admin.myrestfit.com).");
    }
    tokenStore.set(data.token);
    setStaff(data.staff);
  }, []);

  const value: AuthState = {
    staff,
    loading,
    login: async (input) => {
      const { data } = await api.post("/auth/login", input);
      
      // If the API demands MFA, it's a platform admin. Throw an error so the UI catches it.
      if (data.mfaRequired) {
        throw new Error("Platform admins must use the platform admin dashboard.");
      }
      
      signIn(data);
    },
    completeSetup: async (input) => {
      const { data } = await api.post("/auth/setup", input);
      if (data.signInRequired) {
        throw new Error("Your account requires a standard sign-in. Please log in.");
      }
      signIn(data);
    },
    logout: () => {
      tokenStore.clear();
      setStaff(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};