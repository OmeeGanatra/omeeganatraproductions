"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Send,
  Loader2,
  FolderKanban,
  Clock,
  X,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";

interface Client {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  status: string;
}

interface Project {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  status: string;
}

interface LoginRecord {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

const statusBadge: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  inactive: "border-cream-muted/30 bg-cream-muted/10 text-cream-muted",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  completed: "border-gold/30 bg-gold/10 text-gold",
  in_progress: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const [clientRes, projectsRes, loginsRes] = await Promise.all([
        api.get(`/admin/clients/${clientId}`),
        api.get(`/admin/clients/${clientId}/projects`),
        api.get(`/admin/clients/${clientId}/logins`),
      ]);
      setClient(clientRes.data.data || clientRes.data);
      setProjects(projectsRes.data.data || projectsRes.data || []);
      setLoginHistory(loginsRes.data.data || loginsRes.data || []);
    } catch {
      // Individual endpoints may not exist yet
      try {
        const clientRes = await api.get(`/admin/clients/${clientId}`);
        setClient(clientRes.data.data || clientRes.data);
      } catch {
        router.push("/admin/clients");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async () => {
    setResending(true);
    try {
      await api.post(`/admin/clients/${clientId}/resend-invite`);
    } catch {
      // silently handle
    } finally {
      setResending(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/clients/${clientId}`);
      router.push("/admin/clients");
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/clients"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-cream-muted transition-all hover:border-gold/30 hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-cream">
              {client.fullName}
            </h1>
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                statusBadge[client.status] || statusBadge.active
              }`}
            >
              {client.status || "active"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResendInvite}
            disabled={resending}
            className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold/20"
          >
            {resending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Resend Invite
          </button>
          <Link
            href={`/admin/clients/${clientId}/edit`}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-cream-muted transition-all hover:border-gold/30 hover:text-cream"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm lg:col-span-1"
        >
          <h2 className="mb-4 font-serif text-lg font-semibold text-cream">
            Client Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                <Mail className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-cream-muted">
                  Email
                </p>
                <p className="text-sm text-cream">{client.email}</p>
              </div>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                  <Phone className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream-muted">
                    Phone
                  </p>
                  <p className="text-sm text-cream">{client.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                <Calendar className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-cream-muted">
                  Member Since
                </p>
                <p className="text-sm text-cream">
                  {new Date(client.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {client.lastLogin && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                  <Clock className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream-muted">
                    Last Login
                  </p>
                  <p className="text-sm text-cream">
                    {new Date(client.lastLogin).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-cream">
              Assigned Projects
            </h2>
            <span className="rounded-full border border-border bg-dark px-3 py-1 text-xs text-cream-muted">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          </div>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FolderKanban className="mb-3 h-10 w-10 text-cream-muted/30" />
              <p className="text-sm text-cream-muted">No projects assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-dark/50 px-5 py-4 transition-all hover:border-gold/20 hover:bg-dark"
                >
                  <div>
                    <p className="text-sm font-medium text-cream">
                      {project.title}
                    </p>
                    <p className="mt-0.5 text-xs text-cream-muted">
                      {project.eventType} &middot;{" "}
                      {new Date(project.eventDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      statusBadge[project.status] || statusBadge.draft
                    }`}
                  >
                    {project.status?.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Login History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm lg:col-span-3"
        >
          <h2 className="mb-4 font-serif text-lg font-semibold text-cream">
            Login History
          </h2>
          {loginHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-cream-muted">
              No login records found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                      Date &amp; Time
                    </th>
                    <th className="pb-3 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                      IP Address
                    </th>
                    <th className="pb-3 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                      Device
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loginHistory.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3 text-sm text-cream">
                        {new Date(record.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 font-mono text-xs text-cream-muted">
                        {record.ip}
                      </td>
                      <td className="max-w-[300px] truncate py-3 text-xs text-cream-muted">
                        {record.userAgent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-500/30 bg-surface p-8 shadow-2xl"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                  <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <h2 className="font-serif text-xl font-semibold text-cream">
                  Delete Client
                </h2>
                <p className="mt-2 text-sm text-cream-muted">
                  Are you sure you want to delete{" "}
                  <strong className="text-cream">{client.fullName}</strong>? This
                  action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-cream-muted transition-all hover:bg-surface-light hover:text-cream"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
