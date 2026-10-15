import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearStoredSession, REFRESH_TOKEN_KEY, SIGNED_OUT_EVENT } from "./api";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "EXPERIENCED";

export interface AuthUser {
  id: string;
  phone: string;
  firstName?: string | null;
  experienceLevel: ExperienceLevel | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  setSession: (session: { token: string; refreshToken: string; user: AuthUser }) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // lib/api.ts fires this when the session can't be renewed.
    const onSignedOut = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("member_token");
    const u = localStorage.getItem("member_user");
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch {
        // Corrupt storage — clear it so the user signs in again.
        clearStoredSession();
      }
    }
    setReady(true);
  }, []);

  const setSession = ({ token: t, refreshToken, user: u }: { token: string; refreshToken: string; user: AuthUser }) => {
    localStorage.setItem("member_token", t);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem("member_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("member_user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    // Ends this device's session on the server too (best effort).
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) api.post("/app/auth/logout", { refreshToken }).catch(() => {});
    clearStoredSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, ready, setSession, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}