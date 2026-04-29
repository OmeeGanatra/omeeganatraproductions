"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface Project {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate?: string;
  eventType: string;
  venue?: string;
  city?: string;
  coverImageUrl?: string;
  status: string;
  galleries: Array<{
    id: string;
    title: string;
    slug: string;
    mediaCount: number;
    status: string;
    coverImageUrl?: string;
  }>;
}

type StatusKey = "delivered" | "edit" | "color" | "shoot" | "pre";

const STATUS_META: Record<StatusKey, { label: string; color: string }> = {
  delivered: { label: "DELIVERED", color: "var(--ok)" },
  edit: { label: "IN EDIT", color: "oklch(0.65 0.15 240)" },
  color: { label: "COLOR", color: "var(--accent)" },
  shoot: { label: "SHOOT", color: "var(--fg-3)" },
  pre: { label: "PRE-PROD", color: "var(--line)" },
};

function mapStatus(status: string): StatusKey {
  switch (status.toUpperCase()) {
    case "DELIVERED":
    case "COMPLETED":
      return "delivered";
    case "IN_PROGRESS":
    case "ACTIVE":
      return "edit";
    case "COLOR":
      return "color";
    case "SHOOT":
      return "shoot";
    case "PLANNING":
    case "DRAFT":
    default:
      return "pre";
  }
}

function ProjectCard({ project }: { project: Project }) {
  const statusKey = mapStatus(project.status);
  const meta = STATUS_META[statusKey];
  // Simulated progress value: delivered = 100, edit = 65, color = 40, shoot = 20, pre = 5
  const progressMap: Record<StatusKey, number> = {
    delivered: 100,
    edit: 65,
    color: 40,
    shoot: 20,
    pre: 5,
  };
  const progress = progressMap[statusKey];

  return (
    <Link
      href={`/portal/project/${project.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="ogp-frame ogp-view-in"
        style={{
          borderRadius: 10,
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
      >
        {/* Cover thumbnail */}
        <div
          className="ogp-ph"
          data-tone="2"
          style={{
            position: "relative",
            height: 180,
            background: "var(--bg-3)",
            overflow: "hidden",
          }}
        >
          {project.coverImageUrl && (
            <img
              src={project.coverImageUrl}
              alt={project.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.7,
              }}
              loading="lazy"
            />
          )}
          {/* Status chip */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              border: "1px solid var(--line-soft)",
              borderRadius: 99,
              padding: "3px 8px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: meta.color,
                flexShrink: 0,
              }}
            />
            <span
              className="label-mono"
              style={{ fontSize: 9, color: "var(--fg-2)", letterSpacing: "0.1em" }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: "12px 14px 14px" }}>
          {/* Progress bar */}
          <div
            style={{
              height: 2,
              background: "var(--bg-3)",
              borderRadius: 99,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: progress === 100 ? "var(--ok)" : "var(--accent)",
                borderRadius: 99,
                transition: "width 0.6s ease",
              }}
            />
          </div>

          <h3
            className="ogp-serif"
            style={{
              fontSize: 16,
              color: "var(--fg)",
              marginBottom: 4,
              lineHeight: 1.3,
            }}
          >
            {project.title}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {project.eventType && (
              <span
                className="label-mono"
                style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.08em" }}
              >
                {project.eventType}
              </span>
            )}
            {project.city && (
              <>
                <span style={{ color: "var(--line)", fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{project.city}</span>
              </>
            )}
            {project.eventDate && (
              <>
                <span style={{ color: "var(--line)", fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
                  {new Date(project.eventDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PortalDashboard() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/portal/projects");
      setProjects(data.data || data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Could not load projects.");
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.fullName?.split(" ")[0] || "Guest";
  const heroProject = projects[0];
  const gridProjects = projects.slice(1);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 1,
            background: "var(--accent)",
            opacity: 0.4,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <p
          className="label-mono"
          style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.25em" }}
        >
          LOADING YOUR PROJECTS
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <p
            className="label-mono"
            style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.15em", marginBottom: 4 }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).toUpperCase()}
          </p>
          <h1
            className="ogp-serif"
            style={{ fontSize: 28, color: "var(--fg)", fontWeight: 400 }}
          >
            Welcome back, {firstName}.
          </h1>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-2)",
            border: "1px solid var(--line-soft)",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Search projects…"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "var(--fg)",
              width: 160,
            }}
          />
        </div>
      </div>

      {/* Hero project card */}
      {heroProject && (
        <div
          className="ogp-frame"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 32,
            minHeight: 320,
          }}
        >
          {/* Left: cover + play overlay */}
          <div
            className="ogp-ph"
            data-tone="1"
            style={{
              position: "relative",
              background: "var(--bg-3)",
              overflow: "hidden",
            }}
          >
            {heroProject.coverImageUrl && (
              <img
                src={heroProject.coverImageUrl}
                alt={heroProject.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.6,
                }}
                loading="eager"
              />
            )}

            {/* Play button */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(4px)",
                  background: "rgba(0,0,0,0.3)",
                  cursor: "pointer",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>

            {/* "READY · 4K MASTER" label */}
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(6px)",
                border: "1px solid var(--line-soft)",
                borderRadius: 99,
                padding: "4px 10px",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--ok)",
                  flexShrink: 0,
                }}
              />
              <span
                className="label-mono"
                style={{ fontSize: 9, color: "var(--fg-2)", letterSpacing: "0.12em" }}
              >
                READY · 4K MASTER
              </span>
            </div>
          </div>

          {/* Right: project details */}
          <div
            style={{
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background: "var(--bg-2)",
            }}
          >
            <p
              className="label-mono"
              style={{
                fontSize: 9,
                color: "var(--accent)",
                letterSpacing: "0.18em",
                marginBottom: 12,
              }}
            >
              YOUR LATEST DELIVERY
            </p>
            <h2
              className="ogp-serif"
              style={{ fontSize: 28, color: "var(--fg)", lineHeight: 1.2, marginBottom: 12 }}
            >
              {heroProject.title}
            </h2>
            {heroProject.description && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--fg-2)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {heroProject.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {heroProject.galleries.length > 0 && (
                <span
                  className="label-mono"
                  style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.08em" }}
                >
                  {heroProject.galleries.reduce((s, g) => s + g.mediaCount, 0)} PHOTOS
                </span>
              )}
              {heroProject.eventDate && (
                <>
                  <span style={{ color: "var(--line-soft)", fontSize: 10 }}>·</span>
                  <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    {new Date(heroProject.eventDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>

            <Link
              href={`/portal/project/${heroProject.slug}`}
              className="ogp-btn ogp-btn-accent"
              style={{ alignSelf: "flex-start", textDecoration: "none" }}
            >
              Open project →
            </Link>
          </div>
        </div>
      )}

      {/* No projects state */}
      {!heroProject && (
        <div
          className="ogp-frame"
          style={{
            padding: "64px 32px",
            textAlign: "center",
            borderRadius: 12,
            marginBottom: 32,
          }}
        >
          <h2
            className="ogp-serif"
            style={{ fontSize: 24, color: "var(--fg)", marginBottom: 12 }}
          >
            Your project gallery is being prepared.
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6 }}>
            You'll receive a notification when your deliverables are ready.
          </p>
        </div>
      )}

      {/* Project grid */}
      {gridProjects.length > 0 && (
        <div>
          <p
            className="label-mono"
            style={{
              fontSize: 9,
              color: "var(--fg-3)",
              letterSpacing: "0.15em",
              marginBottom: 16,
            }}
          >
            ALL PROJECTS
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {gridProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
