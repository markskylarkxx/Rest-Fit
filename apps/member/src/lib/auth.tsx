import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "EXPERIENCED";

export interface AuthUser {
  id: string;
  phone: string;
  experienceLevel: ExperienceLevel | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  setSession: (token: string, user: AuthUser) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("member_token");
    const u = localStorage.getItem("member_user");
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch {
        // Corrupt storage — clear it so the user signs in again.
        localStorage.removeItem("member_token");
        localStorage.removeItem("member_user");
      }
    }
    setReady(true);
  }, []);

  const setSession = (t: string, u: AuthUser) => {
    localStorage.setItem("member_token", t);
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
    localStorage.removeItem("member_token");
    localStorage.removeItem("member_user");
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