"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Gauge,
} from "lucide-react";

interface SlideshowImage {
  id: string;
  url: string;
  caption?: string;
}

interface SlideshowPlayerProps {
  images: SlideshowImage[];
  autoPlay?: boolean;
  interval?: number;
  onClose?: () => void;
}

const SPEED_OPTIONS = [
  { label: "3s", value: 3000 },
  { label: "5s", value: 5000 },
  { label: "8s", value: 8000 },
];

export default function SlideshowPlayer({
  images,
  autoPlay = true,
  interval = 5000,
  onClose,
}: SlideshowPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(interval);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [direction, setDirection] = useState(1);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);

  const totalImages = images.length;

  // Preload next images
  useEffect(() => {
    const preloadCount = 2;
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = (currentIndex + i) % totalImages;
      const img = new Image();
      img.src = images[nextIndex]?.url || "";
    }
  }, [currentIndex, images, totalImages]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || totalImages <= 1) return;
    const timer = setInterval(goNext, speed);
    return () => clearInterval(timer);
  }, [isPlaying, speed, goNext, totalImages]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [resetControlsTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          goNext();
          resetControlsTimer();
          break;
        case "ArrowLeft":
          goPrev();
          resetControlsTimer();
          break;
        case " ":
          e.preventDefault();
          setIsPlaying((p) => !p);
          resetControlsTimer();
          break;
        case "Escape":
          onClose?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose, resetControlsTimer]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - (e.changedTouches[0]?.clientX ?? 0);
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
      resetControlsTimer();
    }
  };

  if (totalImages === 0) return null;

  const currentImage = images[currentIndex]!;

  return (
    <div
      className="relative flex h-screen w-screen items-center justify-center bg-black"
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={resetControlsTimer}
    >
      {/* Image with crossfade */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img
            src={currentImage.url}
            alt={currentImage.caption || `Photo ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="pointer-events-auto absolute right-6 top-6 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Side navigation arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Bottom controls */}
            <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-8 pt-16">
              {/* Caption */}
              {currentImage.caption && (
                <p className="mb-4 text-center text-sm text-white/80">
                  {currentImage.caption}
                </p>
              )}

              <div className="flex items-center justify-center gap-6">
                {/* Play/Pause */}
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className="rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </button>

                {/* Counter */}
                <span className="min-w-[80px] text-center font-mono text-sm text-white/70">
                  {currentIndex + 1} / {totalImages}
                </span>

                {/* Speed selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu((p) => !p)}
                    className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    <Gauge className="h-4 w-4" />
                    {SPEED_OPTIONS.find((s) => s.value === speed)?.label || "5s"}
                  </button>

                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl"
                      >
                        {SPEED_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSpeed(option.value);
                              setShowSpeedMenu(false);
                            }}
                            className={`block w-full px-6 py-2.5 text-center text-sm transition-colors ${
                              speed === option.value
                                ? "bg-gold/20 text-gold"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
