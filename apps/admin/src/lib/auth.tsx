import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput, RegisterGymInput } from "@restfit/shared";
import { api, tokenStore } from "./api";
import type { Staff } from "./types";

interface AuthState {
  staff: Staff | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterGymInput) => Promise<void>;
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
      .then((r) => setStaff(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((data: { token: string; staff: Staff }) => {
    tokenStore.set(data.token);
    setStaff(data.staff);
  }, []);

  const value: AuthState = {
    staff,
    loading,
    login: async (input) => signIn((await api.post("/auth/login", input)).data),
    register: async (input) => signIn((await api.post("/auth/register", input)).data),
    logout: () => {
      tokenStore.clear();
      setStaff(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
