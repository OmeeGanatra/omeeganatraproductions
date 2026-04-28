"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Clock,
  MapPin,
  Image,
  Sun,
  Flower2,
  Heart,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  galleryId?: string;
  type: string;
  icon?: string;
}

const eventAccents: Record<string, { border: string; bg: string; dot: string; icon: typeof Heart }> = {
  haldi: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
    dot: "bg-yellow-500",
    icon: Sun,
  },
  mehendi: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-500",
    icon: Flower2,
  },
  wedding: {
    border: "border-gold/30",
    bg: "bg-gold/10",
    dot: "bg-gold",
    icon: Heart,
  },
  reception: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    dot: "bg-rose-500",
    icon: PartyPopper,
  },
};

const defaultAccent = {
  border: "border-gold/30",
  bg: "bg-gold/10",
  dot: "bg-gold",
  icon: Heart,
};

export default function TimelinePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [slug]);

  const fetchTimeline = async () => {
    try {
      const { data } = await api.get(`/portal/timeline/${slug}`);
      const result = data.data || data;
      setEvents(result.events || []);
      setProjectTitle(result.title || "");
    } catch {
      // silently handle
    } finally {
      setLoading(false);
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
      <div className="mb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl font-bold text-cream md:text-4xl"
        >
          {projectTitle || "Wedding Timeline"}
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
        />
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Clock className="mb-4 h-12 w-12 text-cream-muted/30" />
          <p className="font-serif text-lg text-cream-muted">
            Timeline coming soon
          </p>
        </div>
      ) : (
        <div className="relative mx-auto max-w-4xl">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-gold/40 via-gold/20 to-transparent md:block" />
          {/* Mobile left line */}
          <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent md:hidden" />

          <div className="space-y-12 md:space-y-16">
            {events.map((event, i) => {
              const accent =
                eventAccents[event.type?.toLowerCase()] || defaultAccent;
              const AccentIcon = accent.icon;
              const isLeft = i % 2 === 0;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Dot on timeline */}
                  <div
                    className={`absolute left-6 top-6 z-10 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-dark md:left-1/2 md:block ${accent.dot}`}
                  />
                  <div
                    className={`absolute left-6 top-6 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-dark md:hidden ${accent.dot}`}
                  />

                  {/* Card */}
                  <div
                    className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                      isLeft ? "md:mr-auto md:pr-0" : "md:ml-auto md:pl-0"
                    }`}
                  >
                    <div
                      className={`overflow-hidden rounded-2xl border ${accent.border} ${accent.bg} p-6 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-black/20`}
                    >
                      {/* Time badge */}
                      <div className="mb-3 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-cream-muted" />
                        <span className="text-xs font-medium uppercase tracking-wider text-cream-muted">
                          {event.time}
                        </span>
                      </div>

                      {/* Icon + Title */}
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent.border} bg-dark/50`}
                        >
                          <AccentIcon className="h-5 w-5 text-cream" />
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-cream">
                          {event.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="mb-3 text-sm leading-relaxed text-cream-muted">
                        {event.description}
                      </p>

                      {/* Location */}
                      {event.location && (
                        <div className="mb-3 flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-cream-muted/60" />
                          <span className="text-xs text-cream-muted/80">
                            {event.location}
                          </span>
                        </div>
                      )}

                      {/* Gallery link */}
                      {event.galleryId && (
                        <Link
                          href={`/portal/gallery/${event.galleryId}`}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition-all hover:bg-gold/20"
                        >
                          <Image className="h-3 w-3" />
                          View Gallery
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
