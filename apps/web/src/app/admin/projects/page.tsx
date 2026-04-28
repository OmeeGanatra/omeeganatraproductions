"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  MapPin,
  Image,
  Users,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import api from "@/lib/api";

interface ProjectItem {
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
  _count?: { galleries: number; mediaItems: number; projectClients: number };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-500/10 text-yellow-400",
  ACTIVE: "bg-emerald-500/10 text-emerald-400",
  DELIVERED: "bg-blue-500/10 text-blue-400",
  ARCHIVED: "bg-gray-500/10 text-gray-400",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    eventType: "WEDDING",
    eventDate: "",
    venue: "",
    city: "",
    description: "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/admin/projects");
      setProjects(data.data || data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/projects", form);
      setShowModal(false);
      setForm({ title: "", eventType: "WEDDING", eventDate: "", venue: "", city: "", description: "" });
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Projects</h1>
          <p className="text-sm text-cream-muted">{projects.length} total projects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {["ALL", "DRAFT", "ACTIVE", "DELIVERED", "ARCHIVED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                statusFilter === status
                  ? "bg-gold/15 text-gold"
                  : "text-cream-muted hover:text-cream"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/admin/projects/${project.id}`}
                className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-gold/30 hover:shadow-lg"
              >
                <div className="relative h-32 bg-gradient-to-br from-charcoal to-dark">
                  {project.coverImageUrl && (
                    <img src={project.coverImageUrl} alt="" className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-cream group-hover:text-gold transition-colors">
                    {project.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-cream-muted">
                    {project.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.eventDate).toLocaleDateString()}
                      </span>
                    )}
                    {project.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.venue}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-3 text-xs text-cream-muted">
                    <span className="flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      {project._count?.galleries || 0} galleries
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project._count?.projectClients || 0} clients
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-serif text-lg font-semibold text-cream">Create New Project</h3>
                <button onClick={() => setShowModal(false)} className="text-cream-muted hover:text-cream">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={createProject} className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Event Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="e.g. Riya & Arjun Wedding"
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Event Type</label>
                    <select
                      value={form.eventType}
                      onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none focus:border-gold/50"
                    >
                      <option value="WEDDING">Wedding</option>
                      <option value="ENGAGEMENT">Engagement</option>
                      <option value="PORTRAIT">Portrait</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Event Date</label>
                    <input
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Venue</label>
                    <input
                      type="text"
                      value={form.venue}
                      onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                      placeholder="e.g. Taj Palace"
                      className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={2}
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3 text-sm font-semibold text-dark shadow-lg shadow-gold/20"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Creating..." : "Create Project"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
