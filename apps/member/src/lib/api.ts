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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("member_token");
      localStorage.removeItem("member_user");
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message ?? "Something went wrong";
  }
  return err instanceof Error ? err.message : "Something went wrong";
}