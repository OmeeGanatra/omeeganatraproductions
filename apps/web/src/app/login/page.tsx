"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState<"client" | "admin">("client");

  const next = searchParams.get("next");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password, loginType === "admin");

      if (result.requiresOtp && result.challengeId) {
        const params = new URLSearchParams({
          challengeId: result.challengeId,
          type: loginType,
        });
        if (next) params.set("next", next);
        router.push(`/verify-otp?${params.toString()}`);
        return;
      }

      if (next) {
        router.push(next);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(
        e.response?.data?.error ||
          "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* --- Left Panel: Cinematic Visual with real photo --- */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* Real wedding photo background */}
        <img
          src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80"
          alt="Bride preparation"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Warm golden tint */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(201,169,110,0.25) 0%, transparent 60%)",
          }}
        />

        {/* Content overlay */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12 lg:p-16">
          <div>
            <Link href="/" className="group block">
              <span className="block font-serif text-base font-normal tracking-[0.3em] text-ivory">
                OMEE GANATRA
              </span>
              <span className="block text-[9px] font-light tracking-[0.4em] text-ivory-muted">
                PRODUCTIONS
              </span>
            </Link>
          </div>

          <div>
            <div className="mb-4 h-px w-12 bg-gold/40" />
            <p className="text-[10px] font-light tracking-[0.35em] text-ivory-muted/60">
              YOUR MOMENTS, PRESERVED FOREVER
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 top-0 w-px bg-border/50" />
      </div>

      {/* --- Right Panel: Login Form --- */}
      <div className="flex w-full items-center justify-center bg-[#050505] px-6 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-12 text-center lg:hidden">
            <Link href="/" className="inline-block">
              <span className="block font-serif text-base font-normal tracking-[0.3em] text-ivory">
                OMEE GANATRA
              </span>
              <span className="block text-[9px] font-light tracking-[0.4em] text-ivory-muted">
                PRODUCTIONS
              </span>
            </Link>
          </div>

          <div className="mb-10 flex gap-8">
            <button
              type="button"
              onClick={() => setLoginType("client")}
              className={`relative pb-2 text-[11px] tracking-[0.2em] transition-all duration-300 ${
                loginType === "client"
                  ? "text-ivory"
                  : "text-ivory-muted/40 hover:text-ivory-muted"
              }`}
            >
              CLIENT
              {loginType === "client" && (
                <motion.div
                  layoutId="loginTab"
                  className="absolute bottom-0 left-0 right-0 h-px bg-gold"
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setLoginType("admin")}
              className={`relative pb-2 text-[11px] tracking-[0.2em] transition-all duration-300 ${
                loginType === "admin"
                  ? "text-ivory"
                  : "text-ivory-muted/40 hover:text-ivory-muted"
              }`}
            >
              ADMIN
              {loginType === "admin" && (
                <motion.div
                  layoutId="loginTab"
                  className="absolute bottom-0 left-0 right-0 h-px bg-gold"
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          </div>

          <h2 className="font-serif text-4xl font-normal text-ivory md:text-5xl">
            Welcome Back
          </h2>
          <p className="mt-3 text-sm font-light text-ivory-muted/60">
            Sign in to access your private gallery
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

            <div>
              <label
                htmlFor="password"
                className="mb-3 block text-[10px] font-light tracking-[0.2em] text-ivory-muted/50"
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="input-luxury"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.15em] text-ivory-muted/30 transition-colors hover:text-ivory-muted"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold mt-4 w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/forgot-password"
              className="text-[10px] font-light tracking-[0.15em] text-ivory-muted/30 transition-colors duration-300 hover:text-gold"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-16 text-center">
            <p className="text-[9px] tracking-[0.2em] text-ivory-muted/20">
              SECURED &amp; ENCRYPTED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
