import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput } from "@restfit/shared";
import { api, tokenStore } from "./api";
import type { Staff } from "./types";

interface AuthState {
  staff: Staff | null;
  loading: boolean;
  // Resolves to "mfa" when the account needs a code from its authenticator app.
  login: (input: LoginInput) => Promise<"mfa" | "done">;
  verifyMfa: (code: string) => Promise<void>;
  // "sign-in" when the account has two-step login and must sign in normally.
  completeSetup: (input: { token: string; password: string }) => Promise<"done" | "sign-in">;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [mfaToken, setMfaToken] = useState<string | null>(null);

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
    login: async (input) => {
      const { data } = await api.post("/auth/login", input);
      if (data.mfaRequired) {
        setMfaToken(data.mfaToken);
        return "mfa";
      }
      signIn(data);
      return "done";
    },
    verifyMfa: async (code) => {
      signIn((await api.post("/auth/mfa/verify", { mfaToken, code })).data);
      setMfaToken(null);
    },
    completeSetup: async (input) => {
      const { data } = await api.post("/auth/setup", input);
      if (data.signInRequired) return "sign-in";
      signIn(data);
      return "done";
    },
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
