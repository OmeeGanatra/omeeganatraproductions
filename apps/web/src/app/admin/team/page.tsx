"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import api from "@/lib/api";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLES = ["admin", "editor", "viewer"];

const roleBadge: Record<string, string> = {
  admin: "border-gold/30 bg-gold/10 text-gold",
  editor: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  viewer: "border-cream-muted/30 bg-cream-muted/10 text-cream-muted",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);

  // Edit modal
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // Delete modal
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const { data } = await api.get("/admin/team");
      setMembers(data.data || data || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post("/admin/team/invite", {
        fullName: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteName("");
      setInviteEmail("");
      setInviteRole("editor");
      fetchTeam();
    } catch {
      // silently handle
    } finally {
      setInviting(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!editingMember) return;
    setUpdatingRole(true);
    try {
      await api.patch(`/admin/team/${editingMember.id}`, { role: editRole });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id ? { ...m, role: editRole } : m
        )
      );
      setEditingMember(null);
    } catch {
      // silently handle
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRemove = async () => {
    if (!deletingMember) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/team/${deletingMember.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      setDeletingMember(null);
    } catch {
      // silently handle
    } finally {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-cream">
          Team Management
        </h1>
        <p className="mt-1 text-sm text-cream-muted">
          Manage admin and editor access
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Invite Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm lg:col-span-1"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
              <UserPlus className="h-5 w-5 text-gold" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-cream">
              Invite Member
            </h2>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Full Name
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Smith"
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
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {inviting ? "Inviting..." : "Send Invite"}
            </button>
          </form>
        </motion.div>

        {/* Team List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm lg:col-span-2"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-cream">
              Team Members
            </h2>
            <span className="rounded-full border border-border bg-dark px-3 py-1 text-xs text-cream-muted">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="mb-3 h-10 w-10 text-cream-muted/30" />
              <p className="text-sm text-cream-muted">No team members yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-dark/50 px-5 py-4 transition-all hover:border-gold/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 font-serif text-sm font-bold text-gold">
                    {member.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cream">
                      {member.fullName}
                    </p>
                    <p className="text-xs text-cream-muted">{member.email}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      roleBadge[member.role] || roleBadge.viewer
                    }`}
                  >
                    <Shield className="mr-1 inline h-2.5 w-2.5" />
                    {member.role}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingMember(member);
                        setEditRole(member.role);
                      }}
                      className="rounded-lg p-2 text-cream-muted transition-colors hover:bg-surface-light hover:text-cream"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingMember(member)}
                      className="rounded-lg p-2 text-cream-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setEditingMember(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-8 shadow-2xl"
            >
              <button
                onClick={() => setEditingMember(null)}
                className="absolute right-4 top-4 text-cream-muted hover:text-cream"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="mb-1 font-serif text-xl font-semibold text-cream">
                Edit Role
              </h2>
              <p className="mb-6 text-sm text-cream-muted">
                Update role for {editingMember.fullName}
              </p>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="mb-6 w-full appearance-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingMember(null)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-cream-muted transition-all hover:bg-surface-light hover:text-cream"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  disabled={updatingRole}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3 text-sm font-semibold text-dark transition-all disabled:opacity-60"
                >
                  {updatingRole && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setDeletingMember(null)}
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
                  Remove Member
                </h2>
                <p className="mt-2 text-sm text-cream-muted">
                  Remove{" "}
                  <strong className="text-cream">
                    {deletingMember.fullName}
                  </strong>{" "}
                  from the team? They will lose all access.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingMember(null)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-cream-muted transition-all hover:bg-surface-light hover:text-cream"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemove}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remove
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
