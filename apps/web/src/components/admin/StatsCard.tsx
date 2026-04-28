"use client";

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
}

const changeStyles: Record<string, { color: string; Icon: typeof TrendingUp }> = {
  up: { color: "text-emerald-400", Icon: TrendingUp },
  down: { color: "text-red-400", Icon: TrendingDown },
  neutral: { color: "text-cream-muted", Icon: Minus },
};

export default function StatsCard({
  icon,
  label,
  value,
  change,
  changeType = "neutral",
}: StatsCardProps) {
  const { color, Icon } = changeStyles[changeType] ?? changeStyles["neutral"]!;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm transition-all hover:border-gold/20 hover:bg-surface-light">
      {/* Subtle hover glow */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative">
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
          <div className="text-gold">{icon}</div>
        </div>

        {/* Value */}
        <p className="font-serif text-3xl font-bold tracking-tight text-cream">
          {value}
        </p>

        {/* Label + Change */}
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-cream-muted">
            {label}
          </p>
          {change && (
            <div className={`flex items-center gap-1 ${color}`}>
              <Icon className="h-3 w-3" />
              <span className="text-xs font-medium">{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
