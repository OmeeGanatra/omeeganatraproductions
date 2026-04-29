"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function LoginPageInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const nextPath = params.get("next") ?? "/portal";
  const { login } = useAuth();

  const [email,    setEmail]    = useState("riya.arjun@example.com");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requiresOtp && result?.challengeId) {
        router.push(`/verify-otp?challengeId=${result.challengeId}&next=${encodeURIComponent(nextPath)}`);
      } else {
        router.push(nextPath);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ogp-view-in" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", color: "var(--fg)" }}>

      {/* ═══ LEFT: brand panel ═══ */}
      <div style={{
        position: "relative", background: "var(--bg-2)",
        borderRight: "1px solid var(--line-soft)", padding: 48,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--fg)" }}>
          <Image src="/og-logo-white.png" alt="OGP" width={28} height={28} style={{ objectFit: "contain" }} />
          <span className="ogp-serif" style={{ fontSize: 18 }}>Omee Ganatra</span>
        </Link>

        {/* Film strip mosaic */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
          width: "68%", aspectRatio: "1", opacity: 0.5,
        }}>
          {([1,2,3,4,5,6,1,2,3] as number[]).map((t, i) => (
            <div key={i} className="ogp-ph" data-tone={String(t)} style={{ borderRadius: 4, minHeight: 80 }} />
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <h1 className="ogp-serif" style={{ fontSize: 56, lineHeight: 1, letterSpacing: "-0.02em" }}>
            Your private<br />
            <em style={{ color: "var(--accent)" }}>vault.</em>
          </h1>
          <p style={{ marginTop: 24, color: "var(--fg-2)", maxWidth: 380, lineHeight: 1.6, fontSize: 15 }}>
            Stream final cuts, review selects, and download masters — from anywhere, on any device.
            Encrypted, signed, and yours.
          </p>
          <div className="ogp-mono" style={{ marginTop: 48, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)" }}>
            ACCESS · CTRL — TLS 1.3 · AES-256
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: form ═══ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, position: "relative", background: "var(--bg)" }}>
        <Link href="/" className="ogp-mono" style={{
          position: "absolute", top: 32, right: 32,
          fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--fg-3)", textDecoration: "none",
        }}>← back to site</Link>

        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 380 }}>
          <div className="label-mono" style={{ marginBottom: 12 }}>SIGN IN</div>
          <h2 className="ogp-serif" style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 32 }}>
            Welcome back.
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="label-mono">EMAIL</label>
              <input
                type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                style={{ padding: "12px 14px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, color: "var(--fg)", outline: "none", fontFamily: "var(--sans)" }}
              />
            </div>
            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="label-mono">PASSWORD</label>
              <input
                type="password" value={password} placeholder="••••••••••" required
                onChange={e => setPassword(e.target.value)}
                style={{ padding: "12px 14px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, color: "var(--fg)", outline: "none", fontFamily: "var(--sans)" }}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "oklch(0.65 0.18 25 / 0.12)", border: "1px solid var(--danger)", borderRadius: 8, fontSize: 12, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-2)", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)" }} /> Remember device
              </label>
              <Link href="/forgot-password" className="ogp-mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-2)", textDecoration: "none" }}>Forgot?</Link>
            </div>

            <button
              type="submit" disabled={loading}
              className="ogp-btn ogp-btn-primary"
              style={{ width: "100%", padding: "14px", justifyContent: "center", marginTop: 8, fontSize: 13, opacity: loading ? 0.7 : 1, borderRadius: 8 }}
            >
              {loading ? <span className="ogp-mono">AUTHENTICATING…</span> : "Enter the vault →"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
              <div className="ogp-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--fg-3)" }}>OR</div>
              <div style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
            </div>

            <Link href="/admin" className="ogp-btn" style={{ width: "100%", padding: "12px", justifyContent: "center", borderRadius: 8, textDecoration: "none", display: "flex" }}>
              Sign in as Studio Admin →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginPageInner /></Suspense>;
}
