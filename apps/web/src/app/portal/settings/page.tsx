"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Bell,
  User,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function PortalSettingsPage() {
  const { user } = useAuthStore();

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Account info
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data } = await api.get("/portal/settings/preferences");
      const prefs = data.data || data;
      setEmailNotifs(prefs.email ?? true);
      setPushNotifs(prefs.push ?? true);
      setSmsNotifs(prefs.sms ?? false);
    } catch {
      // use defaults
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post("/portal/settings/password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.error || "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setPrefsLoading(true);
    try {
      await api.put("/portal/settings/preferences", {
        email: emailNotifs,
        push: pushNotifs,
        sms: smsNotifs,
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch {
      // silently handle
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountLoading(true);
    try {
      await api.put("/portal/settings/profile", { fullName, phone });
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 3000);
    } catch {
      // silently handle
    } finally {
      setAccountLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-cream">Settings</h1>
        <p className="mt-1 text-sm text-cream-muted">
          Manage your account and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
              <Lock className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-cream">
                Change Password
              </h2>
              <p className="text-xs text-cream-muted">
                Update your account password
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <Check className="h-4 w-4" />
              Password changed successfully
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-dark px-4 py-3 pr-12 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-cream"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-border bg-dark px-4 py-3 pr-12 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-cream"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
              <Bell className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-cream">
                Notification Preferences
              </h2>
              <p className="text-xs text-cream-muted">
                Choose how you want to be notified
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-dark/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-cream-muted" />
                <div>
                  <p className="text-sm font-medium text-cream">
                    Email Notifications
                  </p>
                  <p className="text-xs text-cream-muted">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  emailNotifs ? "bg-gold" : "bg-border"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    emailNotifs ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Push */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-dark/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-cream-muted" />
                <div>
                  <p className="text-sm font-medium text-cream">
                    Push Notifications
                  </p>
                  <p className="text-xs text-cream-muted">
                    Browser push notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPushNotifs(!pushNotifs)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  pushNotifs ? "bg-gold" : "bg-border"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    pushNotifs ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-dark/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-cream-muted" />
                <div>
                  <p className="text-sm font-medium text-cream">
                    SMS Notifications
                  </p>
                  <p className="text-xs text-cream-muted">
                    Receive text messages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmsNotifs(!smsNotifs)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  smsNotifs ? "bg-gold" : "bg-border"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    smsNotifs ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={prefsLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {prefsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : prefsSaved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {prefsSaved
                ? "Saved!"
                : prefsLoading
                  ? "Saving..."
                  : "Save Preferences"}
            </button>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
              <User className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-cream">
                Account Information
              </h2>
              <p className="text-xs text-cream-muted">Update your profile</p>
            </div>
          </div>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-xl border border-border bg-dark/50 px-4 py-3 text-sm text-cream-muted outline-none"
              />
              <p className="mt-1 text-[10px] text-cream-muted/50">
                Contact admin to change your email
              </p>
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

            <button
              type="submit"
              disabled={accountLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accountLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : accountSaved ? (
                <Check className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {accountSaved
                ? "Saved!"
                : accountLoading
                  ? "Saving..."
                  : "Save Changes"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
