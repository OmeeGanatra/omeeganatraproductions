"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FolderPlus,
  Loader2,
  Upload,
  X,
  Search,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const EVENT_TYPES = ["Wedding", "Engagement", "Portrait", "Commercial", "Other"];

interface ClientOption {
  id: string;
  fullName: string;
  email: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Client multi-select
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClients, setSelectedClients] = useState<ClientOption[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get("/admin/clients");
      setClients(data.data || data || []);
    } catch {
      // silently handle
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      !selectedClients.some((s) => s.id === c.id) &&
      (c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("eventType", eventType);
      formData.append("eventDate", eventDate);
      formData.append("venue", venue);
      formData.append("city", city);
      formData.append("description", description);
      formData.append(
        "clientIds",
        JSON.stringify(selectedClients.map((c) => c.id))
      );
      if (coverFile) {
        formData.append("coverImage", coverFile);
      }

      await api.post("/admin/projects", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.push("/admin/projects");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to create project. Please try again."
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
            Create New Project
          </h1>
          <p className="mt-1 text-sm text-cream-muted">
            Set up a new photography project
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-sm"
      >
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Grand Wedding of Raj & Priya"
              required
              className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Event Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              >
                <option value="">Select type...</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Venue */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Taj Palace Hotel"
                className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            {/* City */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project..."
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          {/* Assign Clients */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Assign Clients
            </label>

            {/* Selected chips */}
            {selectedClients.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedClients.map((client) => (
                  <span
                    key={client.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold"
                  >
                    {client.fullName}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedClients((prev) =>
                          prev.filter((c) => c.id !== client.id)
                        )
                      }
                      className="ml-0.5 hover:text-gold-light"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="flex items-center rounded-xl border border-border bg-dark px-4 py-3">
                <Search className="mr-2 h-4 w-4 text-cream-muted/50" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setClientDropdownOpen(true);
                  }}
                  onFocus={() => setClientDropdownOpen(true)}
                  placeholder="Search clients..."
                  className="w-full bg-transparent text-sm text-cream placeholder-cream-muted/50 outline-none"
                />
              </div>

              {clientDropdownOpen && filteredClients.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-xl">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClients((prev) => [...prev, client]);
                        setClientSearch("");
                        setClientDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-light"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                        {client.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-cream">{client.fullName}</p>
                        <p className="text-[10px] text-cream-muted">
                          {client.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
              Cover Image
            </label>
            {coverPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverPreview(null);
                    setCoverFile(null);
                  }}
                  className="absolute right-3 top-3 rounded-full bg-dark/80 p-1.5 text-cream-muted hover:text-cream"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gold/30 bg-dark/50 py-12 transition-all hover:border-gold/50 hover:bg-dark"
              >
                <Upload className="mb-3 h-8 w-8 text-gold/60" />
                <p className="text-sm text-cream-muted">
                  Click to upload cover image
                </p>
                <p className="mt-1 text-[10px] text-cream-muted/50">
                  JPG, PNG, WebP up to 10MB
                </p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4" />
            )}
            {loading ? "Creating Project..." : "Create Project"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
