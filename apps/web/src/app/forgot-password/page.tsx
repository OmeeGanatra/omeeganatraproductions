"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"client" | "admin">("client");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email, type });
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(
        e.response?.data?.error ||
          "Something went wrong. Please try again in a moment."
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

        {submitted ? (
          <>
            <h2 className="font-serif text-3xl font-normal text-ivory md:text-4xl">
              Check your inbox
            </h2>
            <p className="mt-3 text-sm font-light text-ivory-muted/60">
              If an account with that email exists, we&apos;ve sent a link to
              reset your password. The link is valid for one hour.
            </p>
            <div className="mt-10 text-center">
              <Link href="/login" className="btn-gold inline-block">
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif text-3xl font-normal text-ivory md:text-4xl">
              Reset your password
            </h2>
            <p className="mt-3 text-sm font-light text-ivory-muted/60">
              Enter your email and we&apos;ll send you a link to choose a new
              password.
            </p>

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
              <div className="flex gap-8">
                <button
                  type="button"
                  onClick={() => setType("client")}
                  className={`pb-2 text-[11px] tracking-[0.2em] transition-all ${
                    type === "client"
                      ? "border-b border-gold text-ivory"
                      : "text-ivory-muted/40 hover:text-ivory-muted"
                  }`}
                >
                  CLIENT
                </button>
                <button
                  type="button"
                  onClick={() => setType("admin")}
                  className={`pb-2 text-[11px] tracking-[0.2em] transition-all ${
                    type === "admin"
                      ? "border-b border-gold text-ivory"
                      : "text-ivory-muted/40 hover:text-ivory-muted"
                  }`}
                >
                  ADMIN
                </button>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-3 block text-[10px] font-light tracking-[0.2em] text-ivory-muted/50"
                >
                  EMAIL ADDRESS
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="input-luxury"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold mt-4 w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/login"
                className="text-[10px] font-light tracking-[0.15em] text-ivory-muted/30 transition-colors duration-300 hover:text-gold"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
