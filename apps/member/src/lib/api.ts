import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// Skip ngrok's free-tier browser warning page (harmless if not using ngrok)
api.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("member_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const REFRESH_TOKEN_KEY = "member_refresh_token";
export const SIGNED_OUT_EVENT = "restfit:signed-out";

export function clearStoredSession() {
  localStorage.removeItem("member_token");
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("member_user");
}

// Access tokens last an hour. When one expires, swap the refresh token for a
// new pair and retry, so members stay signed in without another code or PIN.
// Concurrent 401s share one refresh: each refresh token works only once.
let refreshing: Promise<string | null> | null = null;

function renewSession(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return Promise.resolve(null);
  refreshing ??= axios
    .post<{ accessToken: string; refreshToken: string }>(`${API_BASE}/app/auth/refresh`, { refreshToken }, { timeout: 20000 })
    .then(({ data }) => {
      localStorage.setItem("member_token", data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      return data.accessToken;
    })
    .catch((err) => {
      // Only a definite "no" signs the member out; offline keeps the session.
      if (err.response?.status === 401) return null;
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthCall = String(original?.url ?? "").startsWith("/app/auth/");
    if (err.response?.status !== 401 || isAuthCall || original?._retried) {
      return Promise.reject(err);
    }

    const newToken = await renewSession().catch(() => undefined);
    if (newToken === undefined) return Promise.reject(err); // network trouble
    if (newToken === null) {
      clearStoredSession();
      window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
      return Promise.reject(err);
    }
    original._retried = true;
    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
);

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message ?? "Something went wrong";
  }
  return err instanceof Error ? err.message : "Something went wrong";
}