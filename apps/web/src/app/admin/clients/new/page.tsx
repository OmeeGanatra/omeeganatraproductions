"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Copy,
  Check,
  Key,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

function generatePassword(length = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i]! % chars.length];
  }
  return result;
}

interface CreatedCredentials {
  email: string;
  password: string;
  portalLink: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [autoPassword, setAutoPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const finalPassword = autoPassword ? generatePassword() : password;

    try {
      await api.post("/admin/clients", {
        fullName,
        email,
        phone,
        password: finalPassword,
      });

      setCredentials({
        email,
        password: finalPassword,
        portalLink: `${window.location.origin}/login`,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to create client. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!credentials) return;
    const text = `Login Credentials\n\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nPortal: ${credentials.portalLink}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/clients"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-cream-muted transition-all hover:border-gold/30 hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">
            Create New Client
          </h1>
          <p className="mt-1 text-sm text-cream-muted">
            Add a new client and generate their portal credentials
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-sm"
      >
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John & Jane Doe"
              required
              className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
              className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          {/* Password Section */}
          <div className="rounded-xl border border-border bg-dark/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-cream-muted">
                Password
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoPassword}
                  onChange={(e) => setAutoPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-dark text-gold accent-gold"
                />
                <span className="text-xs text-cream-muted">
                  Auto-generate password
                </span>
              </label>
            </div>
            {!autoPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password"
                  required={!autoPassword}
                  minLength={8}
                  className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </motion.div>
            )}
            {autoPassword && (
              <p className="text-xs text-cream-muted/60">
                A secure 12-character password will be generated automatically
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Creating Client..." : "Create Client"}
          </button>
        </form>
      </motion.div>

      {/* Credentials Modal */}
      <AnimatePresence>
        {credentials && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setCredentials(null);
                router.push("/admin/clients");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gold/30 bg-surface p-8 shadow-2xl"
            >
              <button
                onClick={() => {
                  setCredentials(null);
                  router.push("/admin/clients");
                }}
                className="absolute right-4 top-4 text-cream-muted hover:text-cream"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10">
                  <Key className="h-7 w-7 text-gold" />
                </div>
                <h2 className="font-serif text-xl font-semibold text-cream">
                  Client Created Successfully
                </h2>
                <p className="mt-1 text-sm text-cream-muted">
                  Share these credentials with the client
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-dark p-5">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Email
                  </span>
                  <p className="mt-0.5 font-mono text-sm text-cream">
                    {credentials.email}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Password
                  </span>
                  <p className="mt-0.5 font-mono text-sm text-gold">
                    {credentials.password}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Portal Link
                  </span>
                  <p className="mt-0.5 font-mono text-xs text-cream-muted">
                    {credentials.portalLink}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyCredentials}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Credentials
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
