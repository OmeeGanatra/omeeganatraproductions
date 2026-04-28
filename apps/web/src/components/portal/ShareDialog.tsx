"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  X,
  Lock,
  Download,
  Calendar,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
  MessageCircle,
  Mail,
} from "lucide-react";
import api from "@/lib/api";

interface ShareDialogProps {
  galleryId: string;
  galleryTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareDialog({
  galleryId,
  galleryTitle,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState("");
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [expiryDate, setExpiryDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/portal/share", {
        galleryId,
        passwordProtected: passwordProtect,
        password: passwordProtect ? password : undefined,
        allowDownload: allowDownloads,
        expiryDate: expiryDate || undefined,
      });

      const token = data.data?.token || data.token;
      setShareLink(`${window.location.origin}/share/${token}`);
    } catch {
      // silently handle
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Check out this gallery: ${galleryTitle}\n\n${shareLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Gallery: ${galleryTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to share this photo gallery with you:\n\n${galleryTitle}\n${shareLink}\n\nEnjoy!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleClose = () => {
    setShareLink("");
    setPasswordProtect(false);
    setPassword("");
    setAllowDownloads(true);
    setExpiryDate("");
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-8 shadow-2xl"
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-cream-muted hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                <Share2 className="h-7 w-7 text-gold" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-cream">
                Share Gallery
              </h2>
              <p className="mt-1 text-sm text-cream-muted">{galleryTitle}</p>
            </div>

            {!shareLink ? (
              <div className="space-y-4">
                {/* Password Protect */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-dark/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-cream-muted" />
                    <span className="text-sm text-cream">
                      Password Protect
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordProtect(!passwordProtect)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      passwordProtect ? "bg-gold" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        passwordProtect ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {passwordProtect && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set a password"
                      className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                    />
                  </motion.div>
                )}

                {/* Allow Downloads */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-dark/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-cream-muted" />
                    <span className="text-sm text-cream">Allow Downloads</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowDownloads(!allowDownloads)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      allowDownloads ? "bg-gold" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        allowDownloads ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Expiry Date */}
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-cream-muted">
                    <Calendar className="h-3 w-3" />
                    Expiry Date (optional)
                  </div>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || (passwordProtect && !password)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {generating ? "Generating..." : "Generate Link"}
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Link display */}
                <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-dark p-3">
                  <LinkIcon className="h-4 w-4 flex-shrink-0 text-gold" />
                  <p className="min-w-0 flex-1 truncate font-mono text-xs text-cream-muted">
                    {shareLink}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 rounded-lg bg-gold/10 p-2 text-gold transition-colors hover:bg-gold/20"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Share options */}
                <div className="flex gap-3">
                  <button
                    onClick={handleWhatsApp}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleEmail}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 py-3 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
