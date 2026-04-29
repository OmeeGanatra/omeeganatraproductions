"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
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

// Gantt schedule data (static placeholder matching design)
const SCHEDULE_ITEMS = [
  { label: "Priya & Arjun", phase: "Color Grade", start: 0, width: 30, color: "var(--accent)" },
  { label: "Shah Wedding", phase: "Edit", start: 20, width: 45, color: "oklch(0.65 0.15 240)" },
  { label: "Meera Portraits", phase: "Delivered", start: 50, width: 50, color: "var(--ok)" },
  { label: "Kapoor Engagement", phase: "Shoot", start: 65, width: 25, color: "var(--fg-3)" },
];

function getActivityDotColor(type: string): string {
  switch (type) {
    case "project": return "var(--accent)";
    case "client": return "oklch(0.65 0.15 240)";
    case "media": return "oklch(0.65 0.15 300)";
    case "gallery": return "var(--ok)";
    default: return "var(--fg-3)";
  }
}

function getStatusDot(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "IN_PROGRESS": return "var(--ok)";
    case "DELIVERED":
    case "COMPLETED": return "oklch(0.65 0.15 240)";
    case "DRAFT":
    case "PLANNING": return "var(--fg-3)";
    default: return "var(--line)";
  }
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).toUpperCase();
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

const METRIC_TILES = [
  { key: "totalProjects" as const, label: "TOTAL PROJECTS" },
  { key: "totalClients" as const, label: "ACTIVE CLIENTS" },
  { key: "totalMedia" as const, label: "PHOTOS DELIVERED" },
  { key: "storageUsed" as const, label: "STORAGE USED" },
];

// Awaiting sign-off mock items (static until API provides them)
const SIGNOFF_ITEMS = [
  { title: "Priya & Arjun — Final Cut", due: "Due today" },
  { title: "Shah Wedding Album", due: "Due in 2 days" },
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
        api.get("/admin/clients?limit=5").catch(() => ({ data: { data: [], total: 0 } })),
        api.get("/admin/projects?limit=5").catch(() => ({ data: { data: [], total: 0 } })),
      ]);

      const clients = clientsRes.data.data || clientsRes.data || [];
      const projects = projectsRes.data.data || projectsRes.data || [];

      const activity: DashboardStats["recentActivity"] = [];
      projects.slice(0, 3).forEach((p: any) => {
        activity.push({
          id: `proj-${p.id}`,
          text: `${p.title} project ${p.status?.toLowerCase() === "active" ? "is active" : p.status?.toLowerCase() || "created"}`,
          time: p.eventDate ? formatRelativeTime(p.eventDate) : "Recently",
          type: "project",
        });
      });
      clients.slice(0, 3).forEach((c: any) => {
        activity.push({
          id: `client-${c.id}`,
          text: `New client added: ${c.fullName}`,
          time: c.createdAt ? formatRelativeTime(c.createdAt) : "Recently",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <p
            className="label-mono"
            style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.18em", marginBottom: 6 }}
          >
            {formatDate()}
          </p>
          <h1
            className="ogp-serif"
            style={{ fontSize: 32, color: "var(--fg)", fontWeight: 400 }}
          >
            Studio overview.
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/admin/projects?new=true"
            className="ogp-btn ogp-btn-accent"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
            }}
          >
            <Plus size={13} />
            New Project
          </Link>
          <Link
            href="/admin/clients?new=true"
            className="ogp-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
            }}
          >
            <Plus size={13} />
            New Client
          </Link>
        </div>
      </div>

      {/* Metric tiles — 4 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {METRIC_TILES.map((tile) => (
          <div
            key={tile.key}
            className="ogp-frame"
            style={{
              borderRadius: 10,
              padding: "20px 22px",
            }}
          >
            <p
              className="ogp-serif"
              style={{ fontSize: 44, color: "var(--fg)", lineHeight: 1, marginBottom: 8 }}
            >
              {loading
                ? "—"
                : tile.key === "storageUsed"
                  ? stats.storageUsed
                  : (stats as any)[tile.key]}
            </p>
            <p
              className="label-mono"
              style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.15em" }}
            >
              {tile.label}
            </p>
          </div>
        ))}
      </div>

      {/* Production schedule Gantt strip */}
      <div
        className="ogp-frame"
        style={{ borderRadius: 10, padding: "20px 22px" }}
      >
        <p
          className="label-mono"
          style={{
            fontSize: 9,
            color: "var(--fg-3)",
            letterSpacing: "0.15em",
            marginBottom: 16,
          }}
        >
          PRODUCTION SCHEDULE
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SCHEDULE_ITEMS.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 140,
                  flexShrink: 0,
                }}
              >
                <p style={{ fontSize: 12, color: "var(--fg-2)" }}>{item.label}</p>
                <p
                  className="label-mono"
                  style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.08em" }}
                >
                  {item.phase}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "var(--bg-3)",
                  borderRadius: 99,
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${item.start}%`,
                    width: `${item.width}%`,
                    height: "100%",
                    background: item.color,
                    borderRadius: 99,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-col: Inbox + Awaiting sign-off */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Inbox — Recent Projects */}
        <div
          className="ogp-frame"
          style={{ borderRadius: 10, overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: "1px solid var(--line-soft)",
            }}
          >
            <p
              className="label-mono"
              style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.15em" }}
            >
              INBOX
            </p>
            <Link
              href="/admin/projects"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--fg-3)",
                textDecoration: "none",
              }}
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          <div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 18px",
                    borderBottom: "1px solid var(--line-soft)",
                  }}
                >
                  <div
                    style={{
                      width: 120,
                      height: 10,
                      background: "var(--bg-3)",
                      borderRadius: 4,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
              ))
            ) : stats.recentProjects.length === 0 ? (
              <p
                style={{
                  padding: "24px 18px",
                  fontSize: 12,
                  color: "var(--fg-3)",
                  textAlign: "center",
                }}
              >
                No projects yet.
              </p>
            ) : (
              stats.recentProjects.map((project, i) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 18px",
                    borderBottom:
                      i < stats.recentProjects.length - 1
                        ? "1px solid var(--line-soft)"
                        : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: getStatusDot(project.status),
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 13, color: "var(--fg-2)", flex: 1, minWidth: 0 }}
                  >
                    {project.title}
                  </span>
                  <span
                    className="label-mono"
                    style={{
                      fontSize: 9,
                      color: "var(--fg-3)",
                      letterSpacing: "0.08em",
                      flexShrink: 0,
                    }}
                  >
                    {project.eventType}
                  </span>
                  {project.eventDate && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--fg-3)",
                        flexShrink: 0,
                        marginLeft: 4,
                      }}
                    >
                      {new Date(project.eventDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Awaiting sign-off */}
        <div
          className="ogp-frame"
          style={{ borderRadius: 10, overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: "1px solid var(--line-soft)",
            }}
          >
            <p
              className="label-mono"
              style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.15em" }}
            >
              AWAITING SIGN-OFF
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--danger)",
                fontSize: 9,
                color: "#fff",
                fontWeight: 600,
              }}
            >
              {SIGNOFF_ITEMS.length}
            </span>
          </div>

          <div>
            {SIGNOFF_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom:
                    i < SIGNOFF_ITEMS.length - 1 ? "1px solid var(--line-soft)" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 3 }}>
                    {item.title}
                  </p>
                  <p
                    className="label-mono"
                    style={{ fontSize: 9, color: "var(--danger)", letterSpacing: "0.08em" }}
                  >
                    {item.due}
                  </p>
                </div>
                <button
                  className="ogp-btn"
                  style={{ fontSize: 11, padding: "5px 12px" }}
                >
                  Review
                </button>
              </div>
            ))}

            {/* Recent Activity section within this card */}
            {stats.recentActivity.length > 0 && (
              <>
                <div
                  style={{
                    padding: "12px 18px 6px",
                    borderTop: "1px solid var(--line-soft)",
                  }}
                >
                  <p
                    className="label-mono"
                    style={{
                      fontSize: 9,
                      color: "var(--fg-3)",
                      letterSpacing: "0.15em",
                      marginBottom: 8,
                    }}
                  >
                    RECENT ACTIVITY
                  </p>
                </div>
                {stats.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 18px",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: getActivityDotColor(item.type),
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.4 }}>
                        {item.text}
                      </p>
                      <p style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
