"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Camera,
  Download,
  Image,
  CheckCheck,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  gallery_ready: Bell,
  new_photos: Camera,
  download_ready: Download,
  reminder: Bell,
  announcement: Bell,
};

function groupByDate(notifications: Notification[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Today", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    if (date >= today) {
      groups[0]!.items.push(n);
    } else if (date >= weekAgo) {
      groups[1]!.items.push(n);
    } else {
      groups[2]!.items.push(n);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PortalNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/portal/notifications");
      setNotifications(data.data || data || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post("/portal/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently handle
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/portal/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silently handle
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const grouped = groupByDate(notifications);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-cream-muted">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold/20"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/80 py-24 backdrop-blur-sm">
          <Bell className="mb-4 h-12 w-12 text-cream-muted/30" />
          <p className="font-serif text-lg text-cream-muted">No notifications yet</p>
          <p className="mt-1 text-sm text-cream-muted/60">
            We'll notify you when your gallery is ready
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-cream-muted">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((notification, i) => {
                  const Icon =
                    typeIcons[notification.type] || Bell;
                  return (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        if (!notification.read) handleMarkRead(notification.id);
                      }}
                      className={`relative flex w-full items-start gap-4 rounded-xl border bg-surface/80 px-5 py-4 text-left backdrop-blur-sm transition-all hover:bg-surface-light ${
                        notification.read
                          ? "border-border"
                          : "border-gold/20"
                      }`}
                    >
                      {/* Gold left border for unread */}
                      {!notification.read && (
                        <div className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-gold" />
                      )}

                      <div
                        className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          notification.read
                            ? "border border-border bg-dark"
                            : "border border-gold/20 bg-gold/10"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            notification.read ? "text-cream-muted" : "text-gold"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            notification.read ? "text-cream-muted" : "text-cream"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-cream-muted/70">
                          {notification.body}
                        </p>
                        <p className="mt-2 text-[10px] text-cream-muted/50">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gold" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
