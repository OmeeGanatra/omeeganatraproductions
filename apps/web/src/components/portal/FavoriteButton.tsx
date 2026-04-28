"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface FavoriteButtonProps {
  mediaId: string;
  initialFavorited?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onToggle?: (favorited: boolean) => void;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function FavoriteButton({
  mediaId,
  initialFavorited = false,
  size = "md",
  className,
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const newState = !isFavorited;
    setIsFavorited(newState); // Optimistic

    try {
      setIsLoading(true);
      if (newState) {
        await api.post(`/media/${mediaId}/favorite`);
      } else {
        await api.delete(`/media/${mediaId}/favorite`);
      }
      onToggle?.(newState);
    } catch {
      setIsFavorited(!newState); // Revert
      toast.error("Could not update favorite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isLoading}
      whileTap={{ scale: 0.85 }}
      className={cn(
        "flex items-center justify-center rounded-full p-2 transition-all duration-200",
        isFavorited
          ? "text-gold"
          : "text-white/60 hover:text-white",
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <motion.div
        animate={isFavorited ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(sizeClasses[size], isFavorited && "fill-gold")}
        />
      </motion.div>
    </motion.button>
  );
}
