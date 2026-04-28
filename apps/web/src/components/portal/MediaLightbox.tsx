"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, Info } from "lucide-react";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import VideoPlayer from "./VideoPlayer";

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

interface MediaLightboxProps {
  items: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onFavoriteToggle?: (id: string, favorited: boolean) => void;
}

export default function MediaLightbox({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onFavoriteToggle,
}: MediaLightboxProps) {
  const current = items[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrev();
          break;
        case "ArrowRight":
          onNext();
          break;
      }
    },
    [onClose, onNext, onPrev]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const handleDownload = async () => {
    if (!current) return;
    const link = document.createElement("a");
    link.href = current.url;
    link.download = current.filename || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-cream-muted">
                {currentIndex + 1} / {items.length}
              </span>
              {current.filename && (
                <span className="text-sm text-cream-muted/60">{current.filename}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton
                mediaId={current.id}
                initialFavorited={current.isFavorited}
                onToggle={(fav) => onFavoriteToggle?.(current.id, fav)}
              />
              <button
                onClick={handleDownload}
                className="rounded-full p-2 text-cream-muted transition-colors hover:bg-white/10 hover:text-cream"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-cream-muted transition-colors hover:bg-white/10 hover:text-cream"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-cream-muted backdrop-blur-sm transition-all hover:bg-black/60 hover:text-cream"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {currentIndex < items.length - 1 && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-cream-muted backdrop-blur-sm transition-all hover:bg-black/60 hover:text-cream"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Main content */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[85vh] max-w-[90vw]"
          >
            {current.type === "video" ? (
              <VideoPlayer
                videoUrl={current.url}
                posterUrl={current.thumbnailUrl}
                className="max-h-[85vh] max-w-[90vw]"
              />
            ) : (
              <Image
                src={current.url}
                alt={current.filename || "Photo"}
                width={current.width || 1200}
                height={current.height || 800}
                className="max-h-[85vh] max-w-[90vw] object-contain"
                quality={95}
                priority
              />
            )}
          </motion.div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4">
            <div className="flex items-center gap-4 text-xs text-cream-muted/60">
              {current.createdAt && <span>{formatDate(current.createdAt)}</span>}
              {current.size && <span>{formatFileSize(current.size)}</span>}
              {current.width && current.height && (
                <span>{current.width} x {current.height}</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
