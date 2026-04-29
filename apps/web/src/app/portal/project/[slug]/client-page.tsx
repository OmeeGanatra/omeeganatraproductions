"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Gallery {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  mediaCount: number;
  sortOrder: number;
  hasPassword?: boolean;
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  eventTime: string;
  endTime?: string;
  location?: string;
  icon?: string;
  galleryId?: string;
}

interface ProjectDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate?: string;
  eventType: string;
  venue?: string;
  city?: string;
  coverImageUrl?: string;
  clientRole?: string;
  galleries: Gallery[];
  weddingTimelineEvents?: TimelineEvent[];
  status: string;
}

function statusKey(s: string) {
  switch ((s || "").toUpperCase()) {
    case "DELIVERED": return "delivered";
    case "IN_PROGRESS": case "ACTIVE": return "edit";
    case "COLOR": return "color";
    case "SHOOTING": return "shoot";
    default: return "pre";
  }
}

export default function ProjectDetailPage() {
  const params  = useParams();
  const slug    = params?.slug as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]     = useState<"film" | "gallery" | "timeline" | "notes">("film");
  const [playing, setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress(x => (x + 0.5) % 100), 150);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => { if (slug) load(); }, [slug]);

  const load = async () => {
    try {
      const { data } = await api.get(`/portal/projects/${slug}`);
      setProject(data.data || data);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  const tc = (pct: number) => {
    const total = 14 * 60 + 32;
    const s = Math.floor(total * pct / 100);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 1, background: "var(--accent)", margin: "0 auto 16px" }} />
          <div className="ogp-mono" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)" }}>
            LOADING PROJECT
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <div className="ogp-serif" style={{ fontSize: 24, color: "var(--fg-2)" }}>Project not found</div>
        <Link href="/portal" className="ogp-btn" style={{ marginTop: 24, textDecoration: "none" }}>← Back to dashboard</Link>
      </div>
    );
  }

  const sk = statusKey(project.status);
  const eventDate = project.eventDate
    ? new Date(project.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".")
    : "—";

  return (
    <div className="ogp-view-in" style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ═══ TOP BAR ═══ */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 40px", borderBottom: "1px solid var(--line-soft)",
        position: "sticky", top: 0, zIndex: 30,
        background: "oklch(0.14 0.005 270 / 0.9)", backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/portal" className="ogp-mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-2)", textDecoration: "none" }}>
            ← All projects
          </Link>
          <div style={{ width: 1, height: 16, background: "var(--line)" }} />
          <div className="ogp-mono" style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.1em" }}>
            VAULT / {project.clientRole?.toUpperCase() ?? "CLIENT"} / {project.title.toUpperCase()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ogp-btn" style={{ fontSize: 11 }}>↗ Share</button>
          <button className="ogp-btn ogp-btn-primary" style={{ fontSize: 11 }}>Download all</button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px" }}>

        {/* ═══ MAIN ═══ */}
        <div style={{ padding: "32px 40px 80px", borderRight: "1px solid var(--line-soft)", minWidth: 0 }}>

          {/* Title block */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span className="ogp-chip" data-status={sk}>
                <span className="ogp-chip-dot" />
                {project.status}
              </span>
              <span className="ogp-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--fg-3)", textTransform: "uppercase" }}>
                {project.eventType} · {project.city || project.venue || "—"} · {eventDate}
              </span>
            </div>
            <h1 className="ogp-serif" style={{ fontSize: 64, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--fg)" }}>
              {project.title}
            </h1>
            {project.description && (
              <div style={{ marginTop: 16, color: "var(--fg-2)", fontSize: 14 }}>
                {project.description}
              </div>
            )}
          </div>

          {/* ─── Video Player ─── */}
          <div style={{
            position: "relative", aspectRatio: "16 / 9", borderRadius: 14,
            overflow: "hidden", background: "black", border: "1px solid var(--line-soft)",
          }}
            className="ogp-ph"
            data-tone="1"
          >
            {/* Play overlay */}
            {!playing && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button
                  onClick={() => setPlaying(true)}
                  style={{
                    width: 88, height: 88, borderRadius: 44,
                    background: "oklch(1 0 0 / 0.1)", border: "1px solid oklch(1 0 0 / 0.4)",
                    color: "white", fontSize: 26, backdropFilter: "blur(14px)", cursor: "pointer",
                  }}
                >▶</button>
              </div>
            )}

            {/* Corner labels */}
            <div className="ogp-mono" style={{ position: "absolute", top: 16, left: 16, fontSize: 10, color: "oklch(1 0 0 / 0.75)", letterSpacing: "0.14em" }}>
              4K · DCI-P3 · ATMOS
            </div>
            <div className="ogp-mono" style={{ position: "absolute", top: 16, right: 16, fontSize: 10, color: "oklch(1 0 0 / 0.75)", letterSpacing: "0.14em" }}>
              {tc(progress)} / 14:32
            </div>

            {/* Controls bar */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: 16, background: "linear-gradient(180deg, transparent, oklch(0 0 0 / 0.7))",
            }}>
              {/* Scrubber */}
              <div style={{ height: 2, background: "oklch(1 0 0 / 0.2)", borderRadius: 1, position: "relative", marginBottom: 12 }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)" }} />
                <div style={{ position: "absolute", left: `${progress}%`, top: -4, width: 10, height: 10, borderRadius: 5, background: "var(--accent)", transform: "translateX(-50%)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <button onClick={() => setPlaying(!playing)} style={{ color: "white", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
                    {playing ? "❚❚" : "▶"}
                  </button>
                  <span className="ogp-mono" style={{ fontSize: 10, color: "oklch(1 0 0 / 0.8)", letterSpacing: "0.14em" }}>
                    {tc(progress)} · 14:32
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["1080p ▾","CC","⤢"].map(l => (
                    <button key={l} className="ogp-mono" style={{ fontSize: 10, padding: "4px 8px", border: "1px solid oklch(1 0 0 / 0.2)", borderRadius: 4, color: "white", letterSpacing: "0.14em", background: "none", cursor: "pointer" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div style={{ display: "flex", gap: 0, marginTop: 32, borderBottom: "1px solid var(--line-soft)" }}>
            {([["film","Film"],["gallery","Galleries"],["timeline","Timeline"],["notes","Notes"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  padding: "14px 0", marginRight: 32, fontSize: 13, background: "none", border: "none",
                  color: tab === k ? "var(--fg)" : "var(--fg-3)",
                  borderBottom: tab === k ? "1px solid var(--accent)" : "1px solid transparent",
                  marginBottom: -1, cursor: "pointer", fontFamily: "var(--sans)",
                }}
              >{l}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ marginTop: 32 }}>
            {tab === "film" && (
              <div>
                <div className="label-mono" style={{ marginBottom: 12 }}>SYNOPSIS</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fg-2)", maxWidth: 600 }}>
                  {project.description || "A film captured across extraordinary days and quiet moments. Edited with care, color-graded for cinema and delivered in full resolution."}
                </p>
              </div>
            )}

            {tab === "gallery" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                  {project.galleries.map((g, i) => (
                    <Link key={g.id} href={`/portal/gallery/${g.id}`} style={{ textDecoration: "none" }}>
                      <div
                        className="ogp-ph"
                        data-tone={String((i % 6) + 1)}
                        style={{ aspectRatio: "4/3", borderRadius: 8, position: "relative", cursor: "pointer" }}
                      >
                        <div style={{
                          position: "absolute", inset: 0, padding: 12,
                          display: "flex", flexDirection: "column", justifyContent: "flex-end",
                          background: "linear-gradient(180deg, transparent 50%, oklch(0 0 0 / 0.7) 100%)",
                          borderRadius: 8,
                        }}>
                          <div className="ogp-serif" style={{ fontSize: 14, color: "white" }}>{g.title}</div>
                          <div className="ogp-mono" style={{ fontSize: 9, color: "oklch(1 0 0 / 0.6)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>{g.mediaCount} items</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {tab === "timeline" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {(project.weddingTimelineEvents || []).length === 0 ? (
                  <div className="ogp-serif" style={{ fontSize: 20, color: "var(--fg-3)" }}>No timeline events yet.</div>
                ) : (
                  (project.weddingTimelineEvents || []).map((ev, i) => (
                    <div key={ev.id} style={{ display: "flex", gap: 16, paddingBottom: 24 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 4, background: i === 0 ? "var(--accent)" : "var(--fg-3)", marginTop: 4 }} />
                        <div style={{ width: 1, flex: 1, background: "var(--line-soft)", marginTop: 6 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{ev.title}</span>
                          <span className="ogp-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                            {new Date(ev.eventTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {ev.description && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4, lineHeight: 1.5 }}>{ev.description}</div>}
                        {ev.location && <div className="ogp-mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 4 }}>📍 {ev.location}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "notes" && (
              <div style={{ color: "var(--fg-2)", fontSize: 14, lineHeight: 1.7 }}>
                <div className="label-mono" style={{ marginBottom: 12 }}>NOTES & APPROVALS</div>
                <div className="ogp-serif" style={{ fontSize: 20, color: "var(--fg-3)" }}>
                  Your director responds within a day.
                </div>
                <button className="ogp-btn" style={{ marginTop: 20 }}>Message Omee →</button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <aside style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 28, position: "sticky", top: 64, alignSelf: "flex-start", maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}>

          {/* Details */}
          <div>
            <div className="label-mono" style={{ marginBottom: 12 }}>DETAILS</div>
            <dl style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", rowGap: 10, columnGap: 12, fontSize: 12 }}>
              {[
                ["Type", project.eventType],
                ["Date", eventDate],
                ["Venue", project.venue || "—"],
                ["City", project.city || "—"],
                ["Galleries", String(project.galleries.length)],
              ].map(([k, v]) => (
                <>
                  <dt key={`dt-${k}`} style={{ color: "var(--fg-3)" }}>{k}</dt>
                  <dd key={`dd-${k}`} className="ogp-mono" style={{ fontSize: 11 }}>{v}</dd>
                </>
              ))}
            </dl>
          </div>

          {/* Galleries quick-links */}
          <div>
            <div className="label-mono" style={{ marginBottom: 12 }}>GALLERIES · {project.galleries.length}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {project.galleries.map(g => (
                <Link key={g.id} href={`/portal/gallery/${g.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: "1px solid var(--line-soft)",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--fg)" }}>{g.title}</span>
                    <span className="ogp-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{g.mediaCount} items →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact card */}
          <div style={{ padding: 16, border: "1px solid var(--line-soft)", borderRadius: 10, background: "var(--bg-2)" }}>
            <div className="label-mono" style={{ marginBottom: 8 }}>NEED ANYTHING?</div>
            <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 12 }}>
              Your director responds within a day. For urgent edits, mention "RUSH".
            </div>
            <button className="ogp-btn" style={{ width: "100%", justifyContent: "center" }}>Message Omee</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
