"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Lock,
  Loader2,
  Download,
  Eye,
  Grid3X3,
} from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface SharedGallery {
  id: string;
  title: string;
  description?: string;
  sharedBy: string;
  allowDownload: boolean;
  images: SharedImage[];
}

interface SharedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [gallery, setGallery] = useState<SharedGallery | null>(null);
  const [selectedImage, setSelectedImage] = useState<SharedImage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    resolveToken();
  }, [token]);

  const resolveToken = async () => {
    try {
      const { data } = await api.get(`/share/${token}`);
      const result = data.data || data;

      if (result.passwordProtected && !result.images) {
        setNeedsPassword(true);
      } else {
        setGallery(result);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setNeedsPassword(true);
      } else {
        setError("This link is invalid or has expired.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setVerifying(true);

    try {
      const { data } = await api.post(`/share/${token}/verify`, { password });
      setGallery(data.data || data);
      setNeedsPassword(false);
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.error || "Incorrect password. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async (image: SharedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `photo-${image.id}.jpg`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently handle
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-charcoal to-dark" />
        </div>
        <div className="relative z-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
          <p className="mt-4 text-sm text-cream-muted">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-charcoal to-dark" />
        </div>
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <Eye className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-cream">
            Link Unavailable
          </h1>
          <p className="mt-2 text-sm text-cream-muted">{error}</p>
        </div>
      </div>
    );
  }

  // Password gate
  if (needsPassword) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-charcoal to-dark" />
          <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gold/5 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                  <Lock className="h-7 w-7 text-gold" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-cream">
                  Enter Gallery Password
                </h2>
                <p className="mt-1 text-sm text-cream-muted">
                  This gallery is password protected
                </p>
              </div>

              {passwordError && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {verifying ? "Verifying..." : "View Gallery"}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!gallery) return null;

  // Gallery view
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-charcoal to-dark" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-border px-6 py-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <Camera className="h-4 w-4 text-gold" />
            </div>
          </div>
          <p className="mb-2 text-xs uppercase tracking-wider text-cream-muted">
            Shared by {gallery.sharedBy}
          </p>
          <h1 className="font-serif text-3xl font-bold text-cream">
            {gallery.title}
          </h1>
          {gallery.description && (
            <p className="mx-auto mt-2 max-w-lg text-sm text-cream-muted">
              {gallery.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-cream-muted/60">
            <Grid3X3 className="h-3 w-3" />
            {gallery.images.length} photo
            {gallery.images.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:gap-4">
            {gallery.images.map((image, i) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border border-border lg:mb-4"
              >
                <img
                  src={image.thumbnailUrl || image.url}
                  alt={image.caption || `Photo ${i + 1}`}
                  className="w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
                  onClick={() => setSelectedImage(image)}
                  loading="lazy"
                />
                {gallery.allowDownload && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                    className="absolute bottom-2 right-2 rounded-lg bg-dark/80 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                  >
                    <Download className="h-4 w-4 text-cream" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={selectedImage.url}
              alt={selectedImage.caption || "Photo"}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {gallery.allowDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedImage);
                }}
                className="absolute bottom-6 right-6 flex items-center gap-2 rounded-xl bg-gold/20 px-4 py-2.5 text-sm font-medium text-gold backdrop-blur-sm transition-all hover:bg-gold/30"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <footer className="border-t border-border px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
              <Camera className="h-3 w-3 text-gold" />
            </div>
            <span className="text-xs text-cream-muted/60">
              Powered by Omee Ganatra Productions
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
