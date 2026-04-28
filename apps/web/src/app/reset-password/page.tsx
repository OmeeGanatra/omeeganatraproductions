"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const type =
    (searchParams.get("type") as "admin" | "client" | null) ?? "client";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password, type });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(
        e.response?.data?.error ||
          "We couldn't reset your password. Request a new link and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <Link href="/" className="inline-block">
            <span className="block font-serif text-base font-normal tracking-[0.3em] text-ivory">
              OMEE GANATRA
            </span>
            <span className="block text-[9px] font-light tracking-[0.4em] text-ivory-muted">
              PRODUCTIONS
            </span>
          </Link>
        </div>

        {done ? (
          <>
            <h2 className="font-serif text-3xl font-normal text-ivory md:text-4xl">
              Password updated
            </h2>
            <p className="mt-3 text-sm font-light text-ivory-muted/60">
              Redirecting you to sign in…
            </p>
          </>
        ) : (
          <>
            <h2 className="font-serif text-3xl font-normal text-ivory md:text-4xl">
              Choose a new password
            </h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 border-l-2 border-red-400/40 py-2 pl-4 text-sm font-light text-red-400/80"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="mt-10 space-y-8">
              <div>
                <label
                  htmlFor="password"
                  className="mb-3 block text-[10px] font-light tracking-[0.2em] text-ivory-muted/50"
                >
                  NEW PASSWORD
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-luxury"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="mb-3 block text-[10px] font-light tracking-[0.2em] text-ivory-muted/50"
                >
                  CONFIRM PASSWORD
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-luxury"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold mt-4 w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
