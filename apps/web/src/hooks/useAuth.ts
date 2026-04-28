"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type User } from "@/lib/auth";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface LoginResult {
  requiresOtp: boolean;
  challengeId?: string;
}

interface AdminLoginResponse {
  requiresOtp?: true;
  challengeId?: string;
  accessToken?: string;
  user?: User;
}

export function useAuth() {
  const router = useRouter();
  const { user, status, setUser, setStatus, clear } = useAuthStore();

  const isAdmin = user?.type === "admin";

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
      return data;
    } catch {
      clear();
      return null;
    }
  }, [setUser, clear]);

  // On first mount, hydrate the user state from the server using the cookie.
  useEffect(() => {
    if (status === "idle") {
      setStatus("loading");
      refreshUser().finally(() => {
        // setUser already updates status; if no cookie, status becomes
        // "unauthenticated" via clear().
      });
    }
  }, [status, setStatus, refreshUser]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      isAdminLogin = false
    ): Promise<LoginResult> => {
      const endpoint = isAdminLogin
        ? "/auth/admin/login"
        : "/auth/client/login";
      const { data } = await api.post<AdminLoginResponse>(endpoint, {
        email,
        password,
      });

      if (data.requiresOtp) {
        return { requiresOtp: true, challengeId: data.challengeId };
      }

      if (data.user) setUser(data.user);
      toast.success("Welcome back!");
      router.push(isAdminLogin ? "/admin" : "/portal");
      return { requiresOtp: false };
    },
    [setUser, router]
  );

  const verifyOtp = useCallback(
    async (challengeId: string, code: string): Promise<void> => {
      const { data } = await api.post<{ accessToken: string; user: User }>(
        "/auth/verify-otp",
        { challengeId, code }
      );
      if (data.user) setUser(data.user);
      toast.success("Welcome back!");
      router.push(data.user?.type === "admin" ? "/admin" : "/portal");
    },
    [setUser, router]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the network call fails, clear local state.
    }
    clear();
    router.push("/login");
  }, [clear, router]);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isAdmin,
    login,
    verifyOtp,
    logout,
    refreshUser,
  };
}
