"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpPageInner />
    </Suspense>
  );
}

function VerifyOtpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp } = useAuth();
  const challengeId = searchParams.get("challengeId");
  const next = searchParams.get("next");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!challengeId) {
      setError("Missing challenge. Please sign in again.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(challengeId, code);
      if (next) router.push(next);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(
        e.response?.data?.error ||
          "That code is not valid. Try again or request a new one."
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

        <h2 className="font-serif text-3xl font-normal text-ivory md:text-4xl">
          Check your email
        </h2>
        <p className="mt-3 text-sm font-light text-ivory-muted/60">
          We sent a 6-digit verification code to your email. It expires in 10 minutes.
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
          <div>
            <label
              htmlFor="code"
              className="mb-3 block text-[10px] font-light tracking-[0.2em] text-ivory-muted/50"
            >
              VERIFICATION CODE
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              className="input-luxury text-center tracking-[0.4em]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-gold mt-4 w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Verifying..." : "Verify"}
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
      </div>
    </div>
  );
}
