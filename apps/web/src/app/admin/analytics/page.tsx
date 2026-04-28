"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Download, Eye, Users } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream">Analytics</h1>
        <p className="text-sm text-cream-muted">Track downloads, views, and client engagement</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Views", value: "—", icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Downloads", value: "—", icon: Download, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Active Clients", value: "—", icon: Users, color: "text-gold", bg: "bg-gold/10" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-cream">{stat.value}</p>
            <p className="text-xs text-cream-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/50 py-20 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
          <BarChart3 className="h-8 w-8 text-gold" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-cream">Analytics Coming Soon</h3>
        <p className="mt-2 max-w-md text-sm text-cream-muted">
          Detailed charts and insights about gallery views, downloads, and client engagement will appear here.
        </p>
      </motion.div>
    </div>
  );
}
