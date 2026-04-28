"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Film, Play, Clock, Star } from "lucide-react";
import api from "@/lib/api";

interface VideoItem {
  id: string;
  filenameOriginal: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
  isHighlight: boolean;
  storageKeyThumbnail: string;
  gallery: {
    id: string;
    title: string;
    project: {
      title: string;
    };
  };
}

export default function FilmsPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data } = await api.get("/portal/projects");
      const projects = data.data || data || [];
      const allVideos: VideoItem[] = [];

      for (const project of projects) {
        for (const gallery of project.galleries || []) {
          try {
            const mediaRes = await api.get(
              `/portal/galleries/${gallery.id}/media?type=VIDEO`
            );
            const mediaData = mediaRes.data.data || mediaRes.data || [];
            allVideos.push(
              ...mediaData
                .filter((m: any) => m.type === "VIDEO")
                .map((m: any) => ({
                  ...m,
                  gallery: { ...gallery, project },
                }))
            );
          } catch {}
        }
      }
      setVideos(allVideos);
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const highlights = videos.filter((v) => v.isHighlight);
  const others = videos.filter((v) => !v.isHighlight);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream md:text-3xl">
          Cinematic Films
        </h1>
        <p className="mt-1 text-sm text-cream-muted">
          Watch your wedding films and highlight reels
        </p>
      </div>

      {/* Active Video Player */}
      {activeVideo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div className="aspect-video bg-black">
            {activeVideo.videoUrl ? (
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-cream-muted">
                <div className="text-center">
                  <Film className="mx-auto mb-2 h-12 w-12" />
                  <p>Video will be available soon</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-serif text-lg font-semibold text-cream">
              {activeVideo.filenameOriginal.replace(/\.[^/.]+$/, "")}
            </h3>
            <p className="text-sm text-cream-muted">
              {activeVideo.gallery.project.title} • {activeVideo.gallery.title}
            </p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="aspect-video animate-pulse rounded-2xl bg-surface"
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/50 py-20 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
            <Film className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-cream">
            Films Coming Soon
          </h3>
          <p className="mt-2 max-w-md text-sm text-cream-muted">
            Your cinematic wedding films are being edited. You'll receive a
            notification when they're ready.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Highlight Reels */}
          {highlights.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-cream">
                <Star className="h-4 w-4 text-gold" />
                Highlight Reels
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {highlights.map((video, i) => (
                  <motion.button
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setActiveVideo(video)}
                    className="group relative aspect-video overflow-hidden rounded-2xl border border-border bg-surface text-left transition-all hover:border-gold/30"
                  >
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-charcoal to-dark">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 transition-all group-hover:scale-110 group-hover:bg-gold/30">
                        <Play className="h-7 w-7 text-gold" />
                      </div>
                    </div>
                    {video.videoDurationSeconds && (
                      <span className="absolute bottom-4 right-4 rounded-full bg-dark/70 px-3 py-1 text-xs font-medium text-cream backdrop-blur-sm">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatDuration(video.videoDurationSeconds)}
                      </span>
                    )}
                    <div className="absolute bottom-4 left-4">
                      <p className="font-serif text-base font-semibold text-cream">
                        {video.filenameOriginal.replace(/\.[^/.]+$/, "")}
                      </p>
                      <p className="text-xs text-cream-muted">
                        {video.gallery.project.title}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* All Videos */}
          {others.length > 0 && (
            <div>
              <h2 className="mb-4 font-serif text-lg font-semibold text-cream">
                {highlights.length > 0 ? "All Films" : "Your Films"}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {others.map((video, i) => (
                  <motion.button
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setActiveVideo(video)}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-surface text-left transition-all hover:border-gold/30"
                  >
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-charcoal to-dark">
                      <Play className="h-10 w-10 text-gold/60 transition-all group-hover:scale-110 group-hover:text-gold" />
                    </div>
                    {video.videoDurationSeconds && (
                      <span className="absolute bottom-3 right-3 rounded bg-dark/70 px-2 py-0.5 text-xs text-cream backdrop-blur-sm">
                        {formatDuration(video.videoDurationSeconds)}
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <p className="text-sm font-medium text-cream">
                        {video.filenameOriginal.replace(/\.[^/.]+$/, "")}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
