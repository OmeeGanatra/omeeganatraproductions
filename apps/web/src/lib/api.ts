import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// All authentication is via httpOnly cookies set by the server. We don't
// inject Authorization headers from the browser; that would defeat the
// purpose of httpOnly storage.

// Response interceptor — on 401, attempt refresh once, then redirect to login.
let isRefreshing = false;
let waiters: Array<() => void> = [];

function flushWaiters(): void {
  for (const w of waiters) w();
  waiters = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    // Don't try to refresh on auth endpoints themselves — that creates a loop.
    const url = original?.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/admin/login") ||
      url.includes("/auth/client/login");

    if (
      error.response?.status === 401 &&
      !original?._retried &&
      !isAuthEndpoint
    ) {
      original._retried = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => waiters.push(resolve));
        return api(original);
      }

      isRefreshing = true;
      try {
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        flushWaiters();
        return api(original);
      } catch (refreshError) {
        flushWaiters();
        useAuthStore.getState().clear();
        if (typeof window !== "undefined") {
          const next = encodeURIComponent(
            window.location.pathname + window.location.search
          );
          window.location.href = `/login?next=${next}`;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
