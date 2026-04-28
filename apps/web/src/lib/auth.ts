import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  fullName: string;
  type: "admin" | "client";
  role?: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setUser: (user: User | null) => void;
  setStatus: (status: AuthState["status"]) => void;
  clear: () => void;
}

// Tokens are NOT stored client-side — the server sets httpOnly cookies for
// access and refresh tokens. This store only mirrors the current user
// profile so the UI can render without an extra round-trip.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  setUser: (user) =>
    set({ user, status: user ? "authenticated" : "unauthenticated" }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, status: "unauthenticated" }),
}));
