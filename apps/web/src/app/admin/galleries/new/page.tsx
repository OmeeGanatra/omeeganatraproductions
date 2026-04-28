"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Image, Loader2, Lock, Hash, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface ProjectOption {
  id: string;
  title: string;
}

export default function NewGalleryPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [downloadPin, setDownloadPin] = useState(false);
  const [pin, setPin] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/admin/projects");
      setProjects(data.data || data || []);
    } catch {
      // silently handle
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/admin/galleries", {
        projectId,
        title,
        description,
        downloadEnabled,
        watermarkEnabled,
        passwordProtected,
        password: passwordProtected ? password : undefined,
        downloadPin: downloadPin ? pin : undefined,
        expiryDate: expiryDate || undefined,
      });

      router.push("/admin/projects/" + projectId);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to create gallery. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/projects"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-cream-muted transition-all hover:border-gold/30 hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">
            Create New Gallery
          </h1>
          <p className="mt-1 text-sm text-cream-muted">
            Add a gallery to a project
          </p>
        </div>
      </div>

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
          {/* Parent Project */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Parent Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full appearance-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Gallery Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wedding Ceremony"
              required
              className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this gallery..."
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 rounded-xl border border-border bg-dark/50 p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-cream-muted">
              Gallery Settings
            </h3>

            {/* Download Enabled */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cream">
                  Downloads Enabled
                </p>
                <p className="text-xs text-cream-muted">
                  Allow clients to download photos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDownloadEnabled(!downloadEnabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  downloadEnabled ? "bg-gold" : "bg-border"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    downloadEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Watermark Enabled */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cream">
                  Watermark Enabled
                </p>
                <p className="text-xs text-cream-muted">
                  Add watermark to gallery images
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  watermarkEnabled ? "bg-gold" : "bg-border"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    watermarkEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Password Protected */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cream">
                    Password Protected
                  </p>
                  <p className="text-xs text-cream-muted">
                    Require a password to view
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordProtected(!passwordProtected)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    passwordProtected ? "bg-gold" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      passwordProtected ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {passwordProtected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-dark px-4 py-3">
                    <Lock className="h-4 w-4 text-cream-muted/50" />
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Gallery password"
                      required={passwordProtected}
                      className="w-full bg-transparent text-sm text-cream placeholder-cream-muted/50 outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Download PIN */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cream">Download PIN</p>
                  <p className="text-xs text-cream-muted">
                    Require PIN for downloads
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDownloadPin(!downloadPin)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    downloadPin ? "bg-gold" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      downloadPin ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {downloadPin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-dark px-4 py-3">
                    <Hash className="h-4 w-4 text-cream-muted/50" />
                    <input
                      type="text"
                      value={pin}
                      onChange={(e) =>
                        setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="6-digit PIN"
                      required={downloadPin}
                      maxLength={6}
                      className="w-full bg-transparent text-sm text-cream placeholder-cream-muted/50 outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cream">Expiry Date</p>
                  <p className="text-xs text-cream-muted">
                    Auto-expire gallery access
                  </p>
                </div>
                <Calendar className="h-4 w-4 text-cream-muted/50" />
              </div>
              <div className="mt-3">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            {loading ? "Creating Gallery..." : "Create Gallery"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
