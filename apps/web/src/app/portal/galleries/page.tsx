"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  mediaCount: number;
  status: string;
  project: {
    title: string;
    slug: string;
  };
}

export default function GalleriesListPage() {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      const { data } = await api.get("/portal/projects");
      const projects = data.data || data || [];
      const allGalleries: GalleryItem[] = [];
      for (const project of projects) {
        for (const gallery of project.galleries || []) {
          allGalleries.push({ ...gallery, project: { title: project.title, slug: project.slug } });
        }
      }
      setGalleries(allGalleries);
    } catch (err) {
      console.error("Failed to load galleries:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream md:text-3xl">Photo Gallery</h1>
        <p className="mt-1 text-sm text-cream-muted">Browse all your photo galleries</p>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : galleries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/50 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
            <Image className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-cream">No Galleries Yet</h3>
          <p className="mt-2 text-sm text-cream-muted">Your galleries will appear here once ready.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery, i) => (
            <motion.div
              key={gallery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={`/portal/gallery/${gallery.id}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
              >
                <div className="relative h-40 bg-gradient-to-br from-charcoal to-dark">
                  {gallery.coverImageUrl ? (
                    <img src={gallery.coverImageUrl} alt={gallery.title} className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-10 w-10 text-border-light" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
                  <span className="absolute bottom-3 right-3 rounded-full bg-dark/60 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm">{gallery.mediaCount} photos</span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-cream transition-colors group-hover:text-gold">{gallery.title}</h3>
                  <p className="mt-0.5 text-xs text-cream-muted">{gallery.project.title}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
