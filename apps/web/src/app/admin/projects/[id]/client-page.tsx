"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Image,
  Users,
  Plus,
  Settings,
  Upload,
  Trash2,
  Eye,
  X,
  Loader2,
  FolderKanban,
  UserPlus,
  Send,
} from "lucide-react";
import api from "@/lib/api";

interface GalleryDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  sortOrder: number;
  status: string;
  mediaCount: number;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
}

interface ClientAssignment {
  id: string;
  role: string;
  client: { id: string; fullName: string; email: string };
}

interface ProjectFullDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate?: string;
  eventType: string;
  venue?: string;
  city?: string;
  status: string;
  coverImageUrl?: string;
  galleries: GalleryDetail[];
  projectClients: ClientAssignment[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  DELIVERED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function ProjectDetailAdminPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const [project, setProject] = useState<ProjectFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title: "", description: "" });
  const [clientEmail, setClientEmail] = useState("");
  const [allClients, setAllClients] = useState<Array<{ id: string; fullName: string; email: string }>>([]);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadClients();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const { data } = await api.get(`/admin/projects/${projectId}`);
      setProject(data.data || data);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data } = await api.get("/admin/clients");
      setAllClients(data.data || data || []);
    } catch (_) {}
  };

  const createGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/admin/projects/${projectId}/galleries`, galleryForm);
      setShowGalleryModal(false);
      setGalleryForm({ title: "", description: "" });
      loadProject();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create gallery");
    } finally {
      setSaving(false);
    }
  };

  const assignClient = async (clientId: string) => {
    try {
      await api.post(`/admin/projects/${projectId}/assign-client`, { clientId });
      setShowClientModal(false);
      setClientEmail("");
      loadProject();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to assign client");
    }
  };

  const publishGallery = async (galleryId: string) => {
    try {
      await api.post(`/admin/galleries/${galleryId}/publish`);
      loadProject();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to publish gallery");
    }
  };

  const deleteGallery = async (galleryId: string) => {
    if (!confirm("Are you sure you want to delete this gallery?")) return;
    try {
      await api.delete(`/admin/galleries/${galleryId}`);
      loadProject();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete gallery");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-2xl bg-surface" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="text-cream-muted">Project not found</p>
      </div>
    );
  }

  // Filter out already assigned clients
  const assignedClientIds = new Set(project.projectClients.map((pc) => pc.client.id));
  const availableClients = allClients.filter(
    (c) => !assignedClientIds.has(c.id) && c.fullName.toLowerCase().includes(clientEmail.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/projects" className="mb-1 flex items-center gap-1 text-xs text-gold hover:underline">
            <ArrowLeft className="h-3 w-3" />
            All Projects
          </Link>
          <h1 className="font-serif text-2xl font-bold text-cream md:text-3xl">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-cream-muted">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>
              {project.status}
            </span>
            {project.eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(project.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            {project.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.venue}{project.city ? `, ${project.city}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClientModal(true)}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-cream-muted hover:border-gold/30 hover:text-cream"
          >
            <UserPlus className="h-4 w-4" />
            Assign Client
          </button>
          <button
            onClick={() => setShowGalleryModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20"
          >
            <Plus className="h-4 w-4" />
            Add Gallery
          </button>
        </div>
      </div>

      {/* Assigned Clients */}
      {project.projectClients.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-cream">
            <Users className="h-4 w-4 text-gold" /> Assigned Clients
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.projectClients.map((pc) => (
              <div key={pc.id} className="flex items-center gap-2 rounded-lg bg-surface-light px-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                  {pc.client.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium text-cream">{pc.client.fullName}</p>
                  <p className="text-[10px] text-cream-muted">{pc.client.email}</p>
                </div>
                <span className="ml-1 text-[10px] text-gold">{pc.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Galleries */}
      <div>
        <h2 className="mb-4 font-serif text-lg font-semibold text-cream">Galleries</h2>
        {project.galleries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 py-12 text-center">
            <Image className="mx-auto mb-3 h-10 w-10 text-cream-muted/50" />
            <p className="text-sm text-cream-muted">No galleries yet. Create one to start uploading media.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.galleries.map((gallery) => (
              <motion.div
                key={gallery.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-gold/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-cream">{gallery.title}</h3>
                    <p className="mt-0.5 text-xs text-cream-muted">{gallery.mediaCount} media items</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[gallery.status]}`}>
                    {gallery.status}
                  </span>
                </div>
                {gallery.description && (
                  <p className="mt-2 text-xs text-cream-muted line-clamp-2">{gallery.description}</p>
                )}
                <div className="mt-3 flex gap-1.5 text-xs">
                  {gallery.downloadEnabled && (
                    <span className="rounded bg-surface-light px-2 py-0.5 text-cream-muted">Downloads On</span>
                  )}
                  {gallery.watermarkEnabled && (
                    <span className="rounded bg-surface-light px-2 py-0.5 text-cream-muted">Watermarked</span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/admin/galleries/${gallery.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold/10 py-2 text-xs font-medium text-gold transition-all hover:bg-gold/20"
                  >
                    <Upload className="h-3 w-3" />
                    Manage Media
                  </Link>
                  {gallery.status === "DRAFT" && (
                    <button
                      onClick={() => publishGallery(gallery.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Eye className="h-3 w-3" />
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => deleteGallery(gallery.id)}
                    className="rounded-lg p-2 text-cream-muted hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGalleryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-serif text-lg font-semibold text-cream">Create Gallery</h3>
                <button onClick={() => setShowGalleryModal(false)} className="text-cream-muted hover:text-cream"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={createGallery} className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Gallery Title</label>
                  <input type="text" value={galleryForm.title} onChange={(e) => setGalleryForm((f) => ({ ...f, title: e.target.value }))} required placeholder="e.g. Ceremony, Reception" className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Description</label>
                  <textarea value={galleryForm.description} onChange={(e) => setGalleryForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50 resize-none" />
                </div>
                <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3 text-sm font-semibold text-dark shadow-lg shadow-gold/20">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Creating..." : "Create Gallery"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Assignment Modal */}
      <AnimatePresence>
        {showClientModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-serif text-lg font-semibold text-cream">Assign Client</h3>
                <button onClick={() => setShowClientModal(false)} className="text-cream-muted hover:text-cream"><X className="h-5 w-5" /></button>
              </div>
              <div className="px-6 py-5">
                <input type="text" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Search clients..." className="mb-4 w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50" />
                <div className="max-h-60 space-y-1.5 overflow-y-auto">
                  {availableClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => assignClient(client.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-gold/10"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">{client.fullName.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-cream">{client.fullName}</p>
                        <p className="text-xs text-cream-muted">{client.email}</p>
                      </div>
                    </button>
                  ))}
                  {availableClients.length === 0 && (
                    <p className="py-4 text-center text-sm text-cream-muted">No matching clients found</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
