"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-gradient-to-r from-surface via-surface-light to-surface bg-[length:200%_100%]",
        "[animation:shimmer_2s_ease-in-out_infinite]",
        className
      )}
      style={{
        animation: "shimmer 2s ease-in-out infinite",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-sm border border-border bg-surface p-4 space-y-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
