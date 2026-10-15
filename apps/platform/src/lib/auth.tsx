import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, tokenStore } from "./api";

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  isPlatformAdmin: boolean;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  recoveryCodesLeft: number | null;
}

type Session = { token: string; staff: Staff };
type LoginResponse = Session | { mfaRequired: true; mfaToken: string };

interface AuthContextValue {
  staff: Staff | null;
  loading: boolean;
  // Resolves to "mfa" when a code from the authenticator app is needed next.
  login: (input: { email: string; password: string }) => Promise<"mfa" | "done">;
  verifyMfa: (code: string) => Promise<void>;
  // Called after first-time two-step setup, which returns an upgraded session.
  startSession: (session: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api
      .get<Staff>("/auth/me")
      .then((res) => {
        // A session that skipped the code step is only good for setting it up.
        const s = res.data;
        if (!s.isPlatformAdmin || (s.mfaEnabled && !s.mfaVerified)) {
          tokenStore.clear();
          setStaff(null);
        } else {
          setStaff(s);
        }
      })
      .catch(() => {
        tokenStore.clear();
        setStaff(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const startSession = ({ token, staff }: Session) => {
    if (!staff.isPlatformAdmin) throw new Error("This account is not a platform admin");
    tokenStore.set(token);
    setStaff(staff);
  };

  const login = async (input: { email: string; password: string }) => {
    const { data } = await api.post<LoginResponse>("/auth/login", input);
    if ("mfaRequired" in data) {
      setMfaToken(data.mfaToken);
      return "mfa" as const;
    }
    startSession(data);
    return "done" as const;
  };

  const verifyMfa = async (code: string) => {
    const { data } = await api.post<Session>("/auth/mfa/verify", { mfaToken, code });
    setMfaToken(null);
    startSession(data);
  };

  const logout = () => {
    tokenStore.clear();
    setMfaToken(null);
    setStaff(null);
  };

  return (
    <AuthContext.Provider value={{ staff, loading, login, verifyMfa, startSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
