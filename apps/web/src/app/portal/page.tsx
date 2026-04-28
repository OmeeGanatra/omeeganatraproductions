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

const eventTypeLabels: Record<string, string> = {
  WEDDING: "Wedding",
  ENGAGEMENT: "Engagement",
  PORTRAIT: "Portrait Session",
  COMMERCIAL: "Commercial Shoot",
  OTHER: "Photography",
};

/* Default Unsplash images for gallery cards based on title keywords */
function getDefaultGalleryImage(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("haldi")) return "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=800&q=80";
  if (lower.includes("mehendi") || lower.includes("mehndi")) return "https://images.unsplash.com/photo-1604604557938-1b3e3f7e2f68?w=800&q=80";
  if (lower.includes("wedding") || lower.includes("ceremony") || lower.includes("shaadi")) return "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80";
  if (lower.includes("reception") || lower.includes("sangeet") || lower.includes("party")) return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80";
  return "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80";
}

export default function PortalDashboard() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/portal/projects");
      setProjects(data.data || data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPhotos = projects.reduce(
    (sum, p) => sum + p.galleries.reduce((gs, g) => gs + g.mediaCount, 0),
    0
  );

  const firstName = user?.fullName?.split(" ")[0] || "Guest";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-12 animate-pulse bg-gold/40" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-ivory-muted">
            Loading your gallery
          </p>
        </div>
      </div>
    );
  }

  // Get the primary project (first one) for the hero
  const primaryProject = projects[0];
  const additionalProjects = projects.slice(1);

  return (
    <div>
      {/* --- Hero Greeting --- */}
      {primaryProject ? (
        <section className="relative flex min-h-[70vh] items-end overflow-hidden">
          {/* Background */}
          {primaryProject.coverImageUrl ? (
            <>
              <img
                src={primaryProject.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-bg/50 to-transparent" />
            </>
          ) : (
            <>
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-bg/50 to-transparent" />
            </>
          )}

          {/* Content (visible immediately) */}
          <div className="relative w-full px-6 pb-16 pt-32 md:px-16 lg:px-24">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-ivory-muted">
                Welcome back
              </p>
              <h1 className="mt-3 font-serif text-5xl font-light italic text-ivory md:text-6xl lg:text-7xl">
                {firstName}
              </h1>
            </div>

            <div>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px w-8 bg-gold/60" />
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
                  {primaryProject.title}
                </p>
              </div>

              {(primaryProject.eventDate || primaryProject.venue) && (
                <p className="mt-3 text-[11px] tracking-wide text-ivory-muted">
                  {primaryProject.eventDate &&
                    formatDate(primaryProject.eventDate)}
                  {primaryProject.eventDate && primaryProject.venue && (
                    <span className="mx-3 text-border-light">|</span>
                  )}
                  {primaryProject.venue}
                  {primaryProject.city ? `, ${primaryProject.city}` : ""}
                </p>
              )}
            </div>
          </div>
        </section>
      ) : (
        /* No projects state */
        <section className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-light italic text-ivory md:text-5xl">
              Welcome, {firstName}
            </h1>
            <div className="mx-auto mt-6 h-px w-12 bg-gold/40" />
            <p className="mx-auto mt-6 max-w-md text-[13px] leading-relaxed text-ivory-muted">
              Your gallery is being carefully curated. You will receive a
              notification when your photos and films are ready.
            </p>
          </div>
        </section>
      )}

      {/* --- Gallery Preview Grid --- */}
      {primaryProject && primaryProject.galleries.length > 0 && (
        <section className="px-6 pb-24 pt-16 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {primaryProject.galleries.map((gallery) => (
              <div key={gallery.id}>
                <Link
                  href={`/portal/gallery/${gallery.id}`}
                  className="img-zoom group relative block overflow-hidden"
                  style={{ minHeight: "340px" }}
                >
                  {/* Gallery Image - always show an image */}
                  <img
                    src={gallery.coverImageUrl || getDefaultGalleryImage(gallery.title)}
                    alt={gallery.title}
                    className="h-full min-h-[340px] w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />

                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="font-serif text-xl font-light text-ivory md:text-2xl">
                      {gallery.title}
                    </h3>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ivory-muted">
                      {gallery.mediaCount}{" "}
                      {gallery.mediaCount === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* --- Quick Actions (visible immediately) --- */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <Link
              href={`/portal/project/${primaryProject.slug}`}
              className="link-underline text-[11px] uppercase tracking-[0.2em] text-ivory-muted transition-colors hover:text-ivory"
            >
              View All Photos
            </Link>
            <Link
              href="/portal/films"
              className="link-underline text-[11px] uppercase tracking-[0.2em] text-ivory-muted transition-colors hover:text-ivory"
            >
              Watch Film
            </Link>
            <Link
              href="/portal/downloads"
              className="link-underline text-[11px] uppercase tracking-[0.2em] text-ivory-muted transition-colors hover:text-ivory"
            >
              Download Album
            </Link>
          </div>
        </section>
      )}

      {/* --- Additional Projects --- */}
      {additionalProjects.map((project) => (
        <section key={project.id} className="px-6 pb-24 md:px-16 lg:px-24">
          {/* Divider */}
          <div className="mb-16 flex items-center justify-center">
            <hr className="hr-gold w-full max-w-xs" />
          </div>

          {/* Project Header (visible immediately) */}
          <div className="mb-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
              {project.title}
            </p>
            {(project.eventDate || project.venue) && (
              <p className="mt-2 text-[11px] tracking-wide text-ivory-muted">
                {project.eventDate && formatDate(project.eventDate)}
                {project.eventDate && project.venue && (
                  <span className="mx-3 text-border-light">|</span>
                )}
                {project.venue}
                {project.city ? `, ${project.city}` : ""}
              </p>
            )}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {project.galleries.map((gallery) => (
              <div key={gallery.id}>
                <Link
                  href={`/portal/gallery/${gallery.id}`}
                  className="img-zoom group relative block overflow-hidden"
                  style={{ minHeight: "340px" }}
                >
                  <img
                    src={gallery.coverImageUrl || getDefaultGalleryImage(gallery.title)}
                    alt={gallery.title}
                    className="h-full min-h-[340px] w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="font-serif text-xl font-light text-ivory md:text-2xl">
                      {gallery.title}
                    </h3>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ivory-muted">
                      {gallery.mediaCount}{" "}
                      {gallery.mediaCount === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
