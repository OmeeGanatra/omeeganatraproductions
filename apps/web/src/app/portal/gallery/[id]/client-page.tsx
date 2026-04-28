"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Download,
  Share2,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface MediaItem {
  id: string;
  type: "PHOTO" | "VIDEO";
  filenameOriginal: string;
  storageKeyThumbnail: string;
  storageKeyMedium: string;
  storageKeyOriginal: string;
  storageKeyWatermarked?: string;
  width?: number;
  height?: number;
  videoUrl?: string;
  videoDurationSeconds?: number;
  isHighlight: boolean;
  isFavorite?: boolean;
  blurhash?: string;
}

interface GalleryData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  mediaCount: number;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
  project: {
    title: string;
    slug: string;
  };
}

export default function GalleryViewPage() {
  const params = useParams();
  const galleryId = params?.id as string;
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [lightboxControlsVisible, setLightboxControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (galleryId) loadGallery();
  }, [galleryId]);

  // Slideshow auto-advance
  useEffect(() => {
    if (!slideshowActive || selectedIndex === null) return;
    const photos = media.filter((m) => m.type === "PHOTO");
    const timer = setTimeout(() => {
      const currentPhotoIndex = photos.findIndex(
        (p) => p.id === media[selectedIndex]?.id
      );
      const nextPhotoIndex = (currentPhotoIndex + 1) % photos.length;
      const nextMediaIndex = media.findIndex(
        (m) => m.id === photos[nextPhotoIndex]?.id
      );
      setSelectedIndex(nextMediaIndex);
    }, 4000);
    return () => clearTimeout(timer);
  }, [slideshowActive, selectedIndex, media]);

  // Auto-hide lightbox controls
  useEffect(() => {
    if (selectedIndex === null) return;
    const resetTimer = () => {
      setLightboxControlsVisible(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(
        () => setLightboxControlsVisible(false),
        3000
      );
    };
    resetTimer();
    window.addEventListener("mousemove", resetTimer);
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [selectedIndex]);

  const loadGallery = async () => {
    try {
      const [galleryRes, mediaRes, favRes] = await Promise.all([
        api.get(`/portal/galleries/${galleryId}/media`),
        api.get(`/portal/galleries/${galleryId}/media?page=1&limit=200`),
        api.get("/portal/favorites").catch(() => ({ data: { data: [] } })),
      ]);

      const galleryData = galleryRes.data.gallery || galleryRes.data;
      const mediaData =
        mediaRes.data.data || mediaRes.data.media || mediaRes.data || [];
      const favData = favRes.data.data || favRes.data || [];

      setGallery(galleryData);
      setMedia(Array.isArray(mediaData) ? mediaData : []);
      setFavoriteIds(
        new Set(favData.map((f: any) => f.mediaItemId || f.id))
      );
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (mediaItemId: string) => {
    try {
      if (favoriteIds.has(mediaItemId)) {
        await api.delete(`/portal/favorites/${mediaItemId}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(mediaItemId);
          return next;
        });
      } else {
        await api.post("/portal/favorites", { mediaItemId });
        setFavoriteIds((prev) => new Set(prev).add(mediaItemId));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const downloadMedia = async (mediaItemId: string) => {
    try {
      const { data } = await api.get(
        `/portal/media/${mediaItemId}/download-url`
      );
      window.open(data.url || data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev !== null ? Math.min(prev + 1, media.length - 1) : 0
        );
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev !== null ? Math.max(prev - 1, 0) : 0
        );
      } else if (e.key === "Escape") {
        setSelectedIndex(null);
        setSlideshowActive(false);
      } else if (e.key === "f" || e.key === "F") {
        const item = media[selectedIndex];
        if (item) toggleFavorite(item.id);
      }
    },
    [selectedIndex, media.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  const getMediaUrl = (
    item: MediaItem,
    size: "thumbnail" | "medium" | "original"
  ) => {
    const key =
      size === "thumbnail"
        ? item.storageKeyThumbnail
        : size === "medium"
          ? item.storageKeyMedium
          : item.storageKeyOriginal;
    return `/api/media/${key}`;
  };

  const photos = media.filter((m) => m.type === "PHOTO");
  const videos = media.filter((m) => m.type === "VIDEO");

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0]?.clientX ?? 0,
      y: e.touches[0]?.clientY ?? 0,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || selectedIndex === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartRef.current.x;
    const dy = (e.changedTouches[0]?.clientY ?? 0) - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && selectedIndex < media.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      } else if (dx > 0 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    }
    touchStartRef.current = null;
  };

  const handleShareGallery = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: gallery?.title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-12 bg-gold/40" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-ivory-muted">
            Loading gallery
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* --- Header --- */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-8 pt-8 md:px-16 lg:px-24">
        <div>
          {gallery?.project && (
            <Link
              href={`/portal/project/${gallery.project.slug}`}
              className="group mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ivory-muted transition-colors hover:text-gold"
            >
              <ArrowLeft
                className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
                strokeWidth={1.5}
              />
              {gallery.project.title}
            </Link>
          )}
          <h1 className="font-serif text-3xl font-light text-ivory md:text-4xl">
            {gallery?.title || "Gallery"}
          </h1>
          <p className="mt-2 text-[11px] tracking-wide text-ivory-muted">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
            {videos.length > 0 && (
              <>
                <span className="mx-2 text-border-light">/</span>
                {videos.length} film{videos.length !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setSelectedIndex(0);
              setSlideshowActive(true);
            }}
            className="link-underline text-[11px] uppercase tracking-[0.15em] text-ivory-muted transition-colors hover:text-ivory"
          >
            Slideshow
          </button>
          {gallery?.downloadEnabled && (
            <button
              onClick={() => {
                api
                  .post(`/portal/galleries/${galleryId}/download-zip`)
                  .then(({ data }) => {
                    if (data.url) window.open(data.url, "_blank");
                  })
                  .catch(console.error);
              }}
              className="link-underline text-[11px] uppercase tracking-[0.15em] text-ivory-muted transition-colors hover:text-ivory"
            >
              Download All
            </button>
          )}
          <button
            onClick={handleShareGallery}
            className="link-underline text-[11px] uppercase tracking-[0.15em] text-ivory-muted transition-colors hover:text-ivory"
          >
            Share
          </button>
        </div>
      </div>

      {/* --- Photo Grid (Masonry) - all photos visible immediately, no stagger --- */}
      <div className="columns-2 gap-1 px-1 md:columns-3 lg:columns-4">
        {media.map((item, index) => (
          <div
            key={item.id}
            className="group relative mb-1 cursor-pointer break-inside-avoid"
            onClick={() => {
              setSelectedIndex(index);
              setSlideshowActive(false);
            }}
          >
            {item.type === "PHOTO" ? (
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio:
                    item.width && item.height
                      ? `${item.width}/${item.height}`
                      : "3/4",
                  backgroundColor: "#181818",
                }}
              >
                <img
                  src={getMediaUrl(item, "thumbnail")}
                  alt={item.filenameOriginal}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  loading="lazy"
                />
                {/* Hover overlay - icons only */}
                <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20">
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      className="transition-transform hover:scale-110"
                    >
                      <Heart
                        className={`h-4 w-4 drop-shadow-lg ${
                          favoriteIds.has(item.id)
                            ? "fill-white text-white"
                            : "text-white/80"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                    {gallery?.downloadEnabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadMedia(item.id);
                        }}
                        className="transition-transform hover:scale-110"
                      >
                        <Download
                          className="h-4 w-4 text-white/80 drop-shadow-lg"
                          strokeWidth={1.5}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden" style={{ backgroundColor: "#181818" }}>
                <div
                  className="flex items-center justify-center"
                  style={{ aspectRatio: "16/9", backgroundColor: "#181818" }}
                >
                  {/* White triangle play indicator */}
                  <div className="relative">
                    <svg
                      width="36"
                      height="42"
                      viewBox="0 0 36 42"
                      fill="none"
                      className="text-white/70 transition-all duration-300 group-hover:text-white"
                    >
                      <path
                        d="M36 21L0 42V0L36 21Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
                {item.videoDurationSeconds && (
                  <span className="absolute bottom-2 right-2 text-[10px] tracking-wide text-ivory-muted">
                    {Math.floor(item.videoDurationSeconds / 60)}:
                    {String(
                      Math.floor(item.videoDurationSeconds % 60)
                    ).padStart(2, "0")}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- Lightbox --- */}
      <AnimatePresence>
        {selectedIndex !== null &&
          (() => {
            const selectedItem = media[selectedIndex];
            if (!selectedItem) return null;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseMove={() => setLightboxControlsVisible(true)}
              >
                {/* Close button (top-right) */}
                <motion.button
                  animate={{ opacity: lightboxControlsVisible ? 0.5 : 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setSelectedIndex(null);
                    setSlideshowActive(false);
                  }}
                  className="absolute right-5 top-5 z-20 p-2"
                >
                  <X className="h-5 w-5 text-white" strokeWidth={1.5} />
                </motion.button>

                {/* Slideshow indicator */}
                {slideshowActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: lightboxControlsVisible ? 1 : 0 }}
                    className="absolute right-16 top-6 z-20 text-[10px] uppercase tracking-[0.2em] text-gold"
                  >
                    Slideshow
                  </motion.span>
                )}

                {/* Navigation click zones */}
                {selectedIndex > 0 && (
                  <button
                    onClick={() => setSelectedIndex(selectedIndex - 1)}
                    className="absolute left-0 top-0 z-10 flex h-full w-1/4 cursor-w-resize items-center justify-start pl-4"
                  >
                    <motion.div
                      animate={{
                        opacity: lightboxControlsVisible ? 0.4 : 0,
                      }}
                      whileHover={{ opacity: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronLeft
                        className="h-6 w-6 text-white"
                        strokeWidth={1}
                      />
                    </motion.div>
                  </button>
                )}
                {selectedIndex < media.length - 1 && (
                  <button
                    onClick={() => setSelectedIndex(selectedIndex + 1)}
                    className="absolute right-0 top-0 z-10 flex h-full w-1/4 cursor-e-resize items-center justify-end pr-4"
                  >
                    <motion.div
                      animate={{
                        opacity: lightboxControlsVisible ? 0.4 : 0,
                      }}
                      whileHover={{ opacity: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight
                        className="h-6 w-6 text-white"
                        strokeWidth={1}
                      />
                    </motion.div>
                  </button>
                )}

                {/* Image / Video */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedItem.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-0 flex max-h-[100vh] max-w-[100vw] items-center justify-center px-4 py-16"
                  >
                    {selectedItem.type === "PHOTO" ? (
                      <img
                        src={getMediaUrl(selectedItem, "original")}
                        alt={selectedItem.filenameOriginal}
                        className="max-h-[92vh] max-w-[94vw] object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex aspect-video w-[85vw] max-w-5xl items-center justify-center bg-black">
                        {selectedItem.videoUrl ? (
                          <video
                            src={selectedItem.videoUrl}
                            controls
                            autoPlay
                            className="h-full w-full"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <svg
                              width="48"
                              height="56"
                              viewBox="0 0 36 42"
                              fill="none"
                              className="text-white/30"
                            >
                              <path
                                d="M36 21L0 42V0L36 21Z"
                                fill="currentColor"
                              />
                            </svg>
                            <p className="text-[11px] tracking-wide text-ivory-muted">
                              Video player
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Counter (bottom-center) */}
                <motion.div
                  animate={{ opacity: lightboxControlsVisible ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-[11px] tracking-widest text-white/50"
                >
                  {selectedIndex + 1}
                  <span className="mx-2 text-white/20">/</span>
                  {media.length}
                </motion.div>

                {/* Bottom action bar (appears on hover) */}
                <motion.div
                  animate={{ opacity: lightboxControlsVisible ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="glass absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-5 rounded-full px-5 py-2.5"
                >
                  <button
                    onClick={() => toggleFavorite(selectedItem.id)}
                    className="transition-transform hover:scale-110"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favoriteIds.has(selectedItem.id)
                          ? "fill-white text-white"
                          : "text-white/60"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                  {gallery?.downloadEnabled && (
                    <button
                      onClick={() => downloadMedia(selectedItem.id)}
                      className="transition-transform hover:scale-110"
                    >
                      <Download
                        className="h-4 w-4 text-white/60"
                        strokeWidth={1.5}
                      />
                    </button>
                  )}
                  <button
                    onClick={handleShareGallery}
                    className="transition-transform hover:scale-110"
                  >
                    <Share2
                      className="h-4 w-4 text-white/60"
                      strokeWidth={1.5}
                    />
                  </button>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </div>
  );
}
