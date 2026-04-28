"use client";

import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  heading: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  heading,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 opacity-30">{icon}</div>
      <h3 className="font-serif text-xl font-semibold text-cream">{heading}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-cream-muted/70">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-6 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold/20 hover:shadow-lg hover:shadow-gold/10"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
