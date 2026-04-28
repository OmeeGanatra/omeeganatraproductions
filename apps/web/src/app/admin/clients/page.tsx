"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  X,
  Loader2,
  Send,
} from "lucide-react";
import api from "@/lib/api";

interface ClientItem {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
  _count?: { projectClients: number };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data } = await api.get("/admin/clients");
      setClients(data.data || data || []);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/clients", form);
      setShowModal(false);
      setForm({ fullName: "", email: "", phone: "", password: "" });
      loadClients();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Clients</h1>
          <p className="text-sm text-cream-muted">{clients.length} total clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50"
        />
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="hidden items-center gap-4 border-b border-border bg-surface-light px-5 py-3 text-xs font-medium uppercase tracking-wider text-cream-muted md:flex">
            <span className="flex-1">Client</span>
            <span className="w-32">Phone</span>
            <span className="w-32">Projects</span>
            <span className="w-32">Last Login</span>
            <span className="w-20">Actions</span>
          </div>
          <div className="divide-y divide-border">
            {filteredClients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-surface-light md:flex-row md:items-center md:gap-4"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
                    {client.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cream">{client.fullName}</p>
                    <p className="text-xs text-cream-muted">{client.email}</p>
                  </div>
                </div>
                <span className="w-32 text-sm text-cream-muted">{client.phone || "—"}</span>
                <span className="w-32 text-sm text-cream-muted">
                  {client._count?.projectClients || 0} projects
                </span>
                <span className="w-32 text-xs text-cream-muted">
                  {client.lastLoginAt
                    ? new Date(client.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </span>
                <div className="w-20 flex gap-1">
                  <button className="rounded-lg p-2 text-cream-muted hover:bg-gold/10 hover:text-gold">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button className="rounded-lg p-2 text-cream-muted hover:bg-surface-light hover:text-cream">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create Client Modal */}
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
              className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-serif text-lg font-semibold text-cream">Add New Client</h3>
                <button onClick={() => setShowModal(false)} className="text-cream-muted hover:text-cream">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={createClient} className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Full Name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    required
                    placeholder="Riya & Arjun"
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    placeholder="client@example.com"
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">Password</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    placeholder="Generate or enter password"
                    className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none focus:border-gold/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3 text-sm font-semibold text-dark shadow-lg shadow-gold/20"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Creating..." : "Create Client"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
