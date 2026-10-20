import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput } from "@restfit/shared";
import { api, tokenStore } from "./api";
import type { Staff } from "./types";

interface AuthState {
  staff: Staff | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  completeSetup: (input: { token: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get<Staff>("/auth/me")
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

  const signIn = useCallback((data: any) => {
    if (data.staff?.isPlatformAdmin) {
      throw new Error("Platform admins must use the platform admin dashboard.");
    }
    if (data.token) tokenStore.set(data.token);
    if (data.staff) setStaff(data.staff);
  }, []);

  const value: AuthState = {
    staff,
    loading,
    login: async (input) => {
      const { data } = await api.post("/auth/login", input);
      if (data.mfaRequired) {
        throw new Error("Platform admins must use the platform admin dashboard.");
      }
      signIn(data);
    },
    completeSetup: async (input) => {
      try {
        const { data } = await api.post("/auth/setup", input);
        if (data.signInRequired) {
          throw new Error("Your account requires a standard sign-in. Please log in.");
        }
        signIn(data);
      } catch (err: any) {
        // If the API returned an error status, extract the message
        const message = err.response?.data?.error || err.message || "Setup failed";
        throw new Error(message);
      }
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