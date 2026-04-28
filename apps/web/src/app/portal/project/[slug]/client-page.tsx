"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Image,
  Film,
  Share2,
  Clock,
} from "lucide-react";
import api from "@/lib/api";

interface Gallery {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  mediaCount: number;
  status: string;
  sortOrder: number;
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
  galleries: Gallery[];
  weddingTimelineEvents?: Array<{
    id: string;
    title: string;
    description?: string;
    eventTime: string;
    location?: string;
    icon?: string;
    galleryId?: string;
  }>;
}

const eventIcons: Record<string, string> = {
  ring: "💍",
  cake: "🎂",
  camera: "📷",
  flower: "🌸",
  music: "🎵",
  dance: "💃",
  food: "🍽️",
  pray: "🙏",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) loadProject();
  }, [slug]);

  const loadProject = async () => {
    try {
      const { data } = await api.get(`/portal/projects/${slug}`);
      setProject(data.data || data);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-2xl bg-surface" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-cream-muted">Project not found</p>
        <Link href="/portal" className="mt-4 text-sm text-gold hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border"
      >
        <div className="relative h-48 bg-gradient-to-br from-charcoal to-dark md:h-64">
          {project.coverImageUrl && (
            <img
              src={project.coverImageUrl}
              alt={project.title}
              className="h-full w-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <Link
            href="/portal"
            className="mb-3 inline-flex items-center gap-1 text-xs text-gold hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Dashboard
          </Link>
          <h1 className="font-serif text-3xl font-bold text-cream md:text-4xl">
            {project.title}
          </h1>
          {project.description && (
            <p className="mt-2 max-w-xl text-sm text-cream-muted">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-cream-muted">
            {project.eventDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold" />
                {new Date(project.eventDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {project.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gold" />
                {project.venue}
                {project.city ? `, ${project.city}` : ""}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Wedding Timeline */}
      {project.weddingTimelineEvents &&
        project.weddingTimelineEvents.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-cream">
              <Clock className="h-5 w-5 text-gold" />
              Wedding Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/30 to-transparent md:left-1/2" />
              <div className="space-y-6">
                {project.weddingTimelineEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative flex items-start gap-4 md:w-1/2 ${
                      i % 2 === 0 ? "md:pr-8" : "md:ml-auto md:pl-8"
                    }`}
                  >
                    <div className="absolute left-2.5 top-2 z-10 flex h-3 w-3 items-center justify-center rounded-full bg-gold md:left-auto md:right-auto md:-translate-x-1/2" />
                    <div className="ml-8 flex-1 rounded-xl border border-border bg-surface p-4 md:ml-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {eventIcons[event.icon || "camera"] || "📸"}
                        </span>
                        <h3 className="font-serif text-base font-semibold text-cream">
                          {event.title}
                        </h3>
                      </div>
                      {event.description && (
                        <p className="mt-1 text-xs text-cream-muted">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-cream-muted">
                        <span>
                          {new Date(event.eventTime).toLocaleTimeString(
                            "en-IN",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                      {event.galleryId && (
                        <Link
                          href={`/portal/gallery/${event.galleryId}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-gold hover:underline"
                        >
                          <Image className="h-3 w-3" />
                          View Photos
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Galleries */}
      <div>
        <h2 className="mb-4 font-serif text-xl font-semibold text-cream">
          Galleries
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {project.galleries.map((gallery, i) => (
            <motion.div
              key={gallery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={`/portal/gallery/${gallery.id}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
              >
                <div className="relative h-40 bg-gradient-to-br from-charcoal to-dark">
                  {gallery.coverImageUrl ? (
                    <img
                      src={gallery.coverImageUrl}
                      alt={gallery.title}
                      className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-10 w-10 text-border-light" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
                  <span className="absolute bottom-3 right-3 rounded-full bg-dark/60 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm">
                    {gallery.mediaCount} items
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-cream transition-colors group-hover:text-gold">
                    {gallery.title}
                  </h3>
                  {gallery.description && (
                    <p className="mt-1 text-xs text-cream-muted line-clamp-2">
                      {gallery.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
