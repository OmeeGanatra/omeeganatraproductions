"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Download, Trash2, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";

interface FavoriteItem {
  id: string;
  mediaItemId: string;
  note?: string;
  createdAt: string;
  mediaItem: {
    id: string;
    type: string;
    filenameOriginal: string;
    storageKeyThumbnail: string;
    storageKeyMedium: string;
    width?: number;
    height?: number;
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data } = await api.get("/portal/favorites");
      setFavorites(data.data || data || []);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (mediaItemId: string) => {
    try {
      await api.delete(`/portal/favorites/${mediaItemId}`);
      setFavorites((prev) =>
        prev.filter((f) => f.mediaItemId !== mediaItemId)
      );
    } catch (err) {
      console.error("Failed to remove favorite:", err);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream md:text-3xl">
          Your Favorites
        </h1>
        <p className="mt-1 text-sm text-cream-muted">
          {favorites.length} photo{favorites.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {loading ? (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="mb-3 aspect-[3/4] animate-pulse rounded-xl bg-surface break-inside-avoid"
            />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/50 py-20 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
            <Heart className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-cream">
            No Favorites Yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-cream-muted">
            Browse your galleries and tap the heart icon on photos you love.
            They'll appear here for easy access.
          </p>
        </motion.div>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
          {favorites.map((fav, i) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="group relative mb-3 overflow-hidden rounded-xl break-inside-avoid"
            >
              <div
                className="bg-surface"
                style={{
                  aspectRatio:
                    fav.mediaItem.width && fav.mediaItem.height
                      ? `${fav.mediaItem.width}/${fav.mediaItem.height}`
                      : "3/4",
                }}
              >
                <img
                  src={`/api/media/${fav.mediaItem.storageKeyThumbnail}`}
                  alt={fav.mediaItem.filenameOriginal}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex w-full items-center justify-between">
                  <button
                    onClick={() => removeFavorite(fav.mediaItemId)}
                    className="rounded-full bg-dark/60 p-2 text-red-400 backdrop-blur-sm transition hover:bg-dark/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => downloadMedia(fav.mediaItemId)}
                    className="rounded-full bg-dark/60 p-2 text-white backdrop-blur-sm transition hover:bg-dark/80"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Favorite badge */}
              <div className="absolute right-2 top-2">
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
