"use client";

import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream">Settings</h1>
        <p className="text-sm text-cream-muted">Manage system settings and preferences</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/50 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
          <SettingsIcon className="h-8 w-8 text-gold" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-cream">Settings</h3>
        <p className="mt-2 max-w-md text-sm text-cream-muted">
          System configuration options including branding, notification templates, and storage settings will be available here.
        </p>
      </div>
    </div>
  );
}
