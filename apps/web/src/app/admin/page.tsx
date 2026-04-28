"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  Image,
  HardDrive,
  Plus,
  ArrowRight,
  Circle,
  Download,
  Eye,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface DashboardStats {
  totalClients: number;
  totalProjects: number;
  totalMedia: number;
  totalDownloads: number;
  storageUsed: string;
  storagePercent: number;
  downloadsThisMonth: number;
  galleriesThisWeek: number;
  recentProjects: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    eventDate?: string;
    eventType: string;
    _count?: { galleries: number; projectClients: number };
  }>;
  recentActivity: Array<{
    id: string;
    text: string;
    time: string;
    type: "project" | "client" | "media" | "gallery";
  }>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "IN_PROGRESS":
      return "bg-emerald-400";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-blue-400";
    case "DRAFT":
    case "PLANNING":
      return "bg-ivory-muted/50";
    default:
      return "bg-ivory-muted/30";
  }
}

function getStatusTextColor(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "IN_PROGRESS":
      return "text-emerald-400";
    case "DELIVERED":
    case "COMPLETED":
      return "text-blue-400";
    case "DRAFT":
    case "PLANNING":
      return "text-ivory-muted";
    default:
      return "text-ivory-muted";
  }
}

function getActivityDotColor(type: string): string {
  switch (type) {
    case "project":
      return "bg-gold";
    case "client":
      return "bg-blue-400";
    case "media":
      return "bg-purple-400";
    case "gallery":
      return "bg-emerald-400";
    default:
      return "bg-ivory-muted";
  }
}

const statCards = [
  {
    key: "totalProjects" as const,
    label: "Total Projects",
    icon: FolderKanban,
  },
  {
    key: "totalClients" as const,
    label: "Active Clients",
    icon: Users,
  },
  {
    key: "totalMedia" as const,
    label: "Photos Delivered",
    icon: Image,
  },
  {
    key: "storageUsed" as const,
    label: "Storage Used",
    icon: HardDrive,
  },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProjects: 0,
    totalMedia: 0,
    totalDownloads: 0,
    storageUsed: "0 GB",
    storagePercent: 0,
    downloadsThisMonth: 0,
    galleriesThisWeek: 0,
    recentProjects: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [clientsRes, projectsRes] = await Promise.all([
        api
          .get("/admin/clients?limit=5")
          .catch(() => ({ data: { data: [], total: 0 } })),
        api
          .get("/admin/projects?limit=5")
          .catch(() => ({ data: { data: [], total: 0 } })),
      ]);

      const clients = clientsRes.data.data || clientsRes.data || [];
      const projects = projectsRes.data.data || projectsRes.data || [];

      // Build activity feed from recent data
      const activity: DashboardStats["recentActivity"] = [];
      projects.slice(0, 3).forEach((p: any) => {
        activity.push({
          id: `proj-${p.id}`,
          text: `${p.title} project ${p.status?.toLowerCase() === "active" ? "is active" : p.status?.toLowerCase() || "created"}`,
          time: p.eventDate
            ? formatRelativeTime(p.eventDate)
            : "Recently",
          type: "project",
        });
      });
      clients.slice(0, 3).forEach((c: any) => {
        activity.push({
          id: `client-${c.id}`,
          text: `New client added: ${c.fullName}`,
          time: c.createdAt
            ? formatRelativeTime(c.createdAt)
            : "Recently",
          type: "client",
        });
      });

      setStats({
        totalClients: clientsRes.data.total || clients.length,
        totalProjects: projectsRes.data.total || projects.length,
        totalMedia: 0,
        totalDownloads: 0,
        storageUsed: "0 GB",
        storagePercent: 0,
        downloadsThisMonth: 0,
        galleriesThisWeek: 0,
        recentProjects: projects.slice(0, 5),
        recentActivity: activity.slice(0, 6),
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-normal text-ivory">
            {getGreeting()},{" "}
            <span className="text-gold">
              {user?.fullName?.split(" ")[0] || "Omee"}
            </span>
          </h1>
          <p className="mt-1 text-sm text-ivory-muted">{formatDate()}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/projects?new=true"
            className="flex items-center gap-1.5 rounded-md border border-gold/30 px-3.5 py-2 text-xs font-medium text-gold transition-all hover:border-gold/50 hover:bg-gold/5"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Link>
          <Link
            href="/admin/clients?new=true"
            className="flex items-center gap-1.5 rounded-md border border-border-light px-3.5 py-2 text-xs font-medium text-ivory-muted transition-all hover:border-ivory-muted/30 hover:text-ivory"
          >
            <Plus className="h-3.5 w-3.5" />
            New Client
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="relative overflow-hidden rounded-lg bg-surface px-5 py-4"
          >
            {/* Gold top accent */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-gold/60 via-gold/20 to-transparent" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[32px] font-bold leading-none text-ivory">
                  {loading
                    ? "--"
                    : card.key === "storageUsed"
                      ? stats.storageUsed
                      : (stats as any)[card.key]}
                </p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-ivory-muted">
                  {card.label}
                </p>
              </div>
              <card.icon className="h-5 w-5 text-ivory-muted/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="rounded-lg bg-surface">
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-sm font-semibold text-ivory">
              Recent Projects
            </h2>
            <Link
              href="/admin/projects"
              className="flex items-center gap-1 text-xs text-ivory-muted transition-colors hover:text-gold"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="border-t border-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border/50 px-5 py-3"
                >
                  <div className="h-3 w-36 animate-pulse rounded bg-surface-light" />
                  <div className="ml-auto h-3 w-16 animate-pulse rounded bg-surface-light" />
                </div>
              ))
            ) : stats.recentProjects.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-ivory-muted">
                No projects yet. Create your first project to get started.
              </div>
            ) : (
              stats.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="group flex items-center gap-3 border-b border-border/50 px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-light"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-ivory group-hover:text-gold">
                      {project.title}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border border-border-light px-2 py-0.5 text-[10px] font-medium text-ivory-muted">
                    {project.eventType}
                  </span>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${getStatusColor(project.status)}`}
                    title={project.status}
                  />
                  <span className="w-20 shrink-0 text-right text-[11px] text-ivory-muted">
                    {project.eventDate
                      ? new Date(project.eventDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )
                      : "--"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-surface">
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-sm font-semibold text-ivory">
              Recent Activity
            </h2>
          </div>
          <div className="border-t border-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="h-2 w-2 animate-pulse rounded-full bg-surface-light" />
                  <div className="h-3 w-48 animate-pulse rounded bg-surface-light" />
                </div>
              ))
            ) : stats.recentActivity.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-ivory-muted">
                No recent activity to show.
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute bottom-0 left-[27px] top-0 w-px bg-border" />
                {stats.recentActivity.map((item, i) => (
                  <div
                    key={item.id}
                    className="relative flex items-start gap-3 px-5 py-3"
                  >
                    <div
                      className={`relative z-10 mt-1 h-2 w-2 shrink-0 rounded-full ${getActivityDotColor(item.type)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-ivory">
                        {item.text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ivory-muted">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom quick stats bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Storage usage */}
        <div className="rounded-lg bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-ivory-muted">
              Storage Usage
            </p>
            <HardDrive className="h-3.5 w-3.5 text-ivory-muted/40" />
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{
                  width: `${Math.min(stats.storagePercent, 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-ivory-muted">
              {stats.storageUsed} used
            </p>
          </div>
        </div>

        {/* Downloads this month */}
        <div className="rounded-lg bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-ivory-muted">
              Downloads This Month
            </p>
            <Download className="h-3.5 w-3.5 text-ivory-muted/40" />
          </div>
          <p className="mt-3 text-2xl font-bold text-ivory">
            {loading ? "--" : stats.downloadsThisMonth}
          </p>
        </div>

        {/* Galleries this week */}
        <div className="rounded-lg bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-ivory-muted">
              Galleries Published
            </p>
            <Eye className="h-3.5 w-3.5 text-ivory-muted/40" />
          </div>
          <p className="mt-3 text-2xl font-bold text-ivory">
            {loading ? "--" : stats.galleriesThisWeek}
          </p>
          <p className="mt-0.5 text-[11px] text-ivory-muted">this week</p>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
