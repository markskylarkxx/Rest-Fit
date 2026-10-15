import axios, { AxiosError } from "axios";

const TOKEN_KEY = "restfit.platform.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, (err: AxiosError) => {
  if (err.response?.status === 401 && tokenStore.get()) {
    tokenStore.clear();
    window.location.assign("/login");
  }
  return Promise.reject(err);
});

export const errorMessage = (err: unknown) =>
  (err as AxiosError<{ error?: string }>)?.response?.data?.error ??
  "Something went wrong";