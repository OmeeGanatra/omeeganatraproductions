"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  Search,
  Bell,
  Mail,
  Smartphone,
  Eye,
  Clock,
  Users,
  Check,
  X,
} from "lucide-react";
import api from "@/lib/api";

const NOTIFICATION_TYPES = [
  { value: "gallery_ready", label: "Gallery Ready" },
  { value: "new_photos", label: "New Photos Added" },
  { value: "download_ready", label: "Download Ready" },
  { value: "reminder", label: "Reminder" },
  { value: "announcement", label: "Announcement" },
  { value: "custom", label: "Custom" },
];

interface Client {
  id: string;
  fullName: string;
  email: string;
}

interface SentNotification {
  id: string;
  recipientName: string;
  type: string;
  title: string;
  channels: string[];
  sentAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Composer state
  const [recipientMode, setRecipientMode] = useState<"individual" | "broadcast">(
    "individual"
  );
  const [selectedRecipient, setSelectedRecipient] = useState<Client | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false);
  const [notificationType, setNotificationType] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channels, setChannels] = useState({
    inApp: true,
    email: false,
    push: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, notificationsRes] = await Promise.all([
        api.get("/admin/clients"),
        api.get("/admin/notifications"),
      ]);
      setClients(clientsRes.data.data || clientsRes.data || []);
      setSentNotifications(
        notificationsRes.data.data || notificationsRes.data || []
      );
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const toggleChannel = (channel: "inApp" | "email" | "push") => {
    setChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const selectedChannels = Object.entries(channels)
        .filter(([, v]) => v)
        .map(([k]) => k);

      await api.post("/admin/notifications", {
        recipientMode,
        recipientId: selectedRecipient?.id,
        type: notificationType,
        title,
        body,
        channels: selectedChannels,
      });

      // Reset form
      setTitle("");
      setBody("");
      setSelectedRecipient(null);
      setNotificationType("");
      fetchData();
    } catch {
      // silently handle
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-cream">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-cream-muted">
          Compose and manage client notifications
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Composer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm lg:col-span-3"
        >
          <h2 className="mb-6 font-serif text-lg font-semibold text-cream">
            Compose Notification
          </h2>

          <form onSubmit={handleSend} className="space-y-5">
            {/* Recipient Mode */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Recipients
              </label>
              <div className="mb-3 flex rounded-xl bg-dark p-1">
                <button
                  type="button"
                  onClick={() => setRecipientMode("individual")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                    recipientMode === "individual"
                      ? "bg-gold/15 text-gold shadow-sm"
                      : "text-cream-muted hover:text-cream"
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode("broadcast")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                    recipientMode === "broadcast"
                      ? "bg-gold/15 text-gold shadow-sm"
                      : "text-cream-muted hover:text-cream"
                  }`}
                >
                  <Users className="mr-1 inline h-3.5 w-3.5" />
                  Broadcast
                </button>
              </div>

              {recipientMode === "individual" && (
                <div className="relative">
                  {selectedRecipient ? (
                    <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                          {selectedRecipient.fullName.charAt(0)}
                        </div>
                        <span className="text-sm text-cream">
                          {selectedRecipient.fullName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipient(null)}
                        className="text-cream-muted hover:text-cream"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center rounded-xl border border-border bg-dark px-4 py-3">
                        <Search className="mr-2 h-4 w-4 text-cream-muted/50" />
                        <input
                          type="text"
                          value={recipientSearch}
                          onChange={(e) => {
                            setRecipientSearch(e.target.value);
                            setRecipientDropdownOpen(true);
                          }}
                          onFocus={() => setRecipientDropdownOpen(true)}
                          placeholder="Search client..."
                          className="w-full bg-transparent text-sm text-cream placeholder-cream-muted/50 outline-none"
                        />
                      </div>
                      {recipientDropdownOpen && filteredClients.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-xl">
                          {filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                setSelectedRecipient(client);
                                setRecipientSearch("");
                                setRecipientDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-light"
                            >
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                                {client.fullName.charAt(0)}
                              </div>
                              <span className="text-sm text-cream">
                                {client.fullName}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Notification Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Notification Type
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              >
                <option value="">Select type...</option>
                {NOTIFICATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your gallery is ready!"
                required
                className="w-full rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Message Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your notification message..."
                rows={4}
                required
                className="w-full resize-none rounded-xl border border-border bg-dark px-4 py-3 text-sm text-cream placeholder-cream-muted/50 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            {/* Channels */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-cream-muted">
                Channels
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => toggleChannel("inApp")}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    channels.inApp
                      ? "border-gold/30 bg-gold/10 text-gold"
                      : "border-border text-cream-muted hover:border-gold/20"
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  In-App
                  {channels.inApp && <Check className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleChannel("email")}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    channels.email
                      ? "border-gold/30 bg-gold/10 text-gold"
                      : "border-border text-cream-muted hover:border-gold/20"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                  {channels.email && <Check className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleChannel("push")}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    channels.push
                      ? "border-gold/30 bg-gold/10 text-gold"
                      : "border-border text-cream-muted hover:border-gold/20"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Push
                  {channels.push && <Check className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-semibold text-dark shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="sticky top-6 rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-cream-muted">
              Preview
            </h3>
            <div className="rounded-xl border border-gold/20 bg-dark p-5">
              <div className="mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4 text-gold" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-gold">
                  {NOTIFICATION_TYPES.find((t) => t.value === notificationType)
                    ?.label || "Notification"}
                </span>
              </div>
              <h4 className="font-serif text-base font-semibold text-cream">
                {title || "Notification Title"}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-cream-muted">
                {body || "Your notification message will appear here..."}
              </p>
              <p className="mt-3 text-[10px] text-cream-muted/50">Just now</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sent Notifications Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm"
      >
        <h2 className="mb-4 font-serif text-lg font-semibold text-cream">
          Sent Notifications
        </h2>

        {sentNotifications.length === 0 ? (
          <p className="py-12 text-center text-sm text-cream-muted">
            No notifications sent yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Recipient
                  </th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Type
                  </th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Title
                  </th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Channels
                  </th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Sent
                  </th>
                  <th className="pb-3 text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sentNotifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="py-3 pr-4 text-sm text-cream">
                      {notification.recipientName}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-[10px] font-medium text-gold">
                        {notification.type}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate py-3 pr-4 text-sm text-cream-muted">
                      {notification.title}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1">
                        {notification.channels?.map((ch) => (
                          <span
                            key={ch}
                            className="rounded bg-surface-light px-1.5 py-0.5 text-[10px] text-cream-muted"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-cream-muted">
                      {new Date(notification.sentAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3">
                      {notification.read ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <Eye className="h-3 w-3" /> Read
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-cream-muted">
                          <Clock className="h-3 w-3" /> Unread
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
