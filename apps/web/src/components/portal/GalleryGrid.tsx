"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import MediaLightbox from "./MediaLightbox";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: "photo" | "video";
  filename?: string;
  size?: number;
  createdAt?: string;
  isFavorited?: boolean;
  width?: number;
  height?: number;
}

interface GalleryGridProps {
  items: MediaItem[];
  onFavoriteToggle?: (id: string, favorited: boolean) => void;
  readonly?: boolean;
  className?: string;
}

export default function GalleryGrid({
  items,
  onFavoriteToggle,
  readonly = false,
  className,
}: GalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleDownload = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.filename || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create a pseudo-masonry effect with varying aspect ratios
  const getAspectClass = (index: number) => {
    const patterns = [
      "aspect-[3/4]",
      "aspect-square",
      "aspect-[4/5]",
      "aspect-[3/4]",
      "aspect-[4/3]",
      "aspect-[3/4]",
      "aspect-square",
      "aspect-[4/5]",
    ];
    return patterns[index % patterns.length];
  };

  return (
    <>
      <div
        className={cn(
          "columns-2 gap-3 space-y-3 md:columns-3 lg:columns-4",
          className
        )}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
            className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-sm"
            onClick={() => openLightbox(index)}
          >
            <div className={cn("relative w-full overflow-hidden bg-surface", getAspectClass(index))}>
              <Image
                src={item.thumbnailUrl || item.url}
                alt={item.filename || `Photo ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Video play icon */}
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                    <Play className="h-5 w-5 ml-0.5" />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {!readonly && (
                  <FavoriteButton
                    mediaId={item.id}
                    initialFavorited={item.isFavorited}
                    size="sm"
                    onToggle={(fav) => onFavoriteToggle?.(item.id, fav)}
                    className="bg-black/40 backdrop-blur-sm"
                  />
                )}
                <button
                  onClick={(e) => handleDownload(e, item)}
                  className="rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <MediaLightbox
        items={items}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={() => setCurrentIndex((i) => Math.min(i + 1, items.length - 1))}
        onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
        onFavoriteToggle={onFavoriteToggle}
      />
    </>
  );
}
